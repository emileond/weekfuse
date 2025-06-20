import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, RadioGroup, Radio, Switch } from '@heroui/react';
import { supabaseClient } from '../../lib/supabase';
import { useUser } from '../../hooks/react-query/user/useUser';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import ky from 'ky';

function PlanningStep({ goToNextStep }) {
    const { data: user } = useUser();
    const queryClient = useQueryClient();
    const [isPending, setIsPending] = useState(false);

    // Initialize react-hook-form with default values
    const {
        control,
        handleSubmit,
        formState: { isSubmitSuccessful },
    } = useForm({
        defaultValues: {
            planningDay: 'sunday',
            planningTime: 'morning',
            enableReminders: true,
        },
    });

    // Function to handle saving the planning routine
    const handleSaveRoutine = async (formData) => {
        setIsPending(true);
        try {
            const { data: sessionData } = await supabaseClient.auth.getSession();
            if (!sessionData.session) {
                throw new Error('You must be logged in to save settings.');
            }

            // Prepare the data for your API
            const updateData = {
                planning_day: formData.planningDay,
                planning_time: formData.planningTime,
                reminders_enabled: formData.enableReminders,
            };

            // Example API call - adjust the endpoint as needed
            await ky.post('/api/update-planning-routine', {
                json: {
                    updateData,
                    session: sessionData.session,
                },
            });

            toast.success('Your planning routine has been saved!');

            // Invalidate any queries that fetch user settings or preferences
            await queryClient.invalidateQueries({ queryKey: ['user', user?.id, 'preferences'] });

            goToNextStep();
        } catch (error) {
            console.error(error);
            const errorMessage = error.response
                ? (await error.response.json()).error
                : error.message;
            toast.error(errorMessage || 'Failed to save your routine. Please try again.');
        } finally {
            setIsPending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(handleSaveRoutine)} className="flex flex-col gap-8">
            {/* Day Selection */}
            <Controller
                name="planningDay"
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        {...field}
                        label="When do you prefer to plan your week?"
                        className="gap-2"
                    >
                        <Radio value="friday">Fridays</Radio>
                        <Radio value="saturday">Saturdays</Radio>
                        <Radio value="sunday">Sundays</Radio>
                        <Radio value="monday">Mondays</Radio>
                    </RadioGroup>
                )}
            />

            {/* Reminder Toggle */}
            <Controller
                name="enableReminders"
                control={control}
                render={({ field: { onChange, value } }) => (
                    <Switch size="sm" isSelected={value} onValueChange={onChange}>
                        Send me a gentle reminder
                    </Switch>
                )}
            />

            {/* Submission Button */}
            <Button
                color="primary"
                type="submit"
                isLoading={isPending}
                disabled={isSubmitSuccessful}
                fullWidth
            >
                {isSubmitSuccessful ? 'Routine Saved!' : 'Continue'}
            </Button>
        </form>
    );
}

export default PlanningStep;

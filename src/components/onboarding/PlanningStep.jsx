import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, RadioGroup, Radio, Switch } from '@heroui/react';
import { supabaseClient } from '../../lib/supabase';
import { useUser } from '../../hooks/react-query/user/useUser';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import ky from 'ky';

// Helper objects to map UI-friendly selections to backend-friendly data
const dayStringToNumber = {
    friday: 5,
    saturday: 6,
    sunday: 0,
    monday: 1,
};

function PlanningStep({ goToNextStep, currentWorkspace }) {
    const { data: user } = useUser();
    const queryClient = useQueryClient();
    const [isPending, setIsPending] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { isSubmitSuccessful },
    } = useForm({
        defaultValues: {
            planningDay: 'friday',
            enableReminders: true,
        },
    });

    const handleSaveRoutine = async (formData) => {
        setIsPending(true);
        try {
            const { data: sessionData } = await supabaseClient.auth.getSession();
            if (!sessionData.session) throw new Error('You must be logged in to save settings.');

            // 1. Get the user's timezone from their browser
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // 2. Prepare the robust data payload for your backend
            const updateData = {
                planning_reminder: formData.enableReminders,
                planning_day_of_week: dayStringToNumber[formData.planningDay],
                planning_timezone: timezone,
            };

            // 3. Send to your API
            await ky
                .post('/api/update-workspace', {
                    json: {
                        updateData,
                        workspaceId: currentWorkspace.workspace_id,
                        session: sessionData.session,
                    },
                })
                .json();

            toast.success('Your planning routine has been saved!');
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
                        Send me planning reminders
                    </Switch>
                )}
            />

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

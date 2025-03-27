import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@heroui/react';
import { PiWarningBold } from 'react-icons/pi';
import { supabaseClient } from '../../lib/supabase.js';
import { useUser } from '../../hooks/react-query/user/useUser';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import ky from 'ky';

function WorkspaceNameStep({ currentWorkspace, setCurrentWorkspace, goToNextStep }) {
    const { data: user } = useUser();
    const [isPending, setIsPending] = useState(false);
    const queryClient = useQueryClient();

    // Initialize react-hook-form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitSuccessful },
    } = useForm();

    // Function to handle workspace name update
    const handleUpdateWorkspace = async (formData) => {
        const { workspaceName } = formData;
        setIsPending(true);
        try {
            // Get the current session
            const { data: sessionData } = await supabaseClient.auth.getSession();

            // Make a request to the API endpoint using ky
            const result = await ky
                .post('/api/update-workspace', {
                    json: {
                        updateData: {
                            name: workspaceName,
                        },
                        workspaceId: currentWorkspace.workspace_id,
                        session: sessionData.session,
                    },
                })
                .json();

            toast.success('Workspace name updated successfully');
            await queryClient.invalidateQueries(['workspaces', user?.id]);

            // Update the current workspace with the new name
            setCurrentWorkspace({
                ...currentWorkspace,
                name: workspaceName,
            });

            // Move to the next step
            goToNextStep();
        } catch (error) {
            console.error(error);
            if (error.response) {
                try {
                    const errorData = await error.response.json();
                    toast.error(errorData.error || 'Failed to update workspace');
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                    toast.error('Failed to update workspace, try again');
                }
            } else {
                toast.error(error?.message || 'Failed to update workspace, try again');
            }
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="mb-6">
            <p className="my-3">Update your workspace name to get started</p>
            <form onSubmit={handleSubmit(handleUpdateWorkspace)} className="flex flex-col gap-6">
                <Input
                    label="Workspace Name"
                    type="text"
                    fullWidth
                    aria-label="Workspace Name"
                    isInvalid={!!errors?.workspaceName}
                    errorMessage={errors?.workspaceName?.message}
                    defaultValue={currentWorkspace?.name || ''}
                    {...register('workspaceName', {
                        required: 'Workspace Name is required',
                    })}
                />
                <Button
                    color="primary"
                    type="submit"
                    isLoading={isPending}
                    disabled={isSubmitSuccessful}
                >
                    {isSubmitSuccessful ? 'Workspace Name Updated' : 'Update Workspace Name'}
                </Button>
            </form>
        </div>
    );
}

export default WorkspaceNameStep;

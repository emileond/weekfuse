import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useUser } from '../hooks/react-query/user/useUser';
import { useWorkspaces } from '../hooks/react-query/teams/useWorkspaces';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { PiWarningBold } from 'react-icons/pi';
import { validateEmail } from '../utils/validateEmail.js';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import { useAddWorkspaceMember } from '../hooks/react-query/teams/useWorkspaceMembers';
import toast from 'react-hot-toast';
import ky from 'ky';
import { supabaseClient } from '../lib/supabase.js';
import { useQueryClient } from '@tanstack/react-query';

function OnboardingPage() {
    const { data: user } = useUser();
    const { data: workspaces } = useWorkspaces(user);
    const navigate = useNavigate();
    const [isWorkspaceCreated, setIsWorkspaceCreated] = useState(false);
    const [currentWorkspace, setCurrentWorkspace] = useCurrentWorkspace();
    const [isPending, setIsPending] = useState(false);
    const queryClient = useQueryClient();
    const { mutateAsync: addWorkspaceMember, isPending: isAddPending } =
        useAddWorkspaceMember(currentWorkspace);

    // Initialize react-hook-form for both forms
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const { register: registerInvite, handleSubmit: handleInviteSubmit } = useForm();

    // Function to handle workspace creation
    const handleCreateWorkspace = async (formData) => {
        const { workspaceName } = formData;
        setIsPending(true);
        try {
            // Get the current session
            const { data: sessionData } = await supabaseClient.auth.getSession();

            // Make a request to the API endpoint using ky
            const result = await ky
                .post('/api/create-workspace', {
                    json: {
                        name: workspaceName,
                        user_id: user.id,
                        session: sessionData.session,
                    },
                })
                .json();

            toast.success('Workspace created successfully');
            await queryClient.invalidateQueries(['workspaces', user?.id]);
        } catch (error) {
            console.error(error);
            if (error.response) {
                try {
                    const errorData = await error.response.json();
                    toast.error(errorData.error || 'Failed to create workspace');
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                    toast.error('Failed to create workspace, try again');
                }
            } else {
                toast.error(error?.message || 'Failed to create workspace, try again');
            }
        } finally {
            setIsPending(false);
        }
    };

    // Function to handle sending invites
    const handleSendInvites = async (inviteData) => {
        const invites = Object.values(inviteData);
        const results = { success: 0, failed: 0 };
        const errors = [];

        for (const invite of invites.filter((inv) => inv.email && inv.role)) {
            const result = await validateEmail(invite.email);
            if (!result.syntax_error) {
                await addWorkspaceMember(
                    {
                        invite_email: invite.email,
                        role: invite.role,
                        workspace_id: currentWorkspace.workspace_id,
                        invited_by: user.email,
                    },
                    {
                        onSuccess: () => {
                            results.success++;
                        },
                        onError: (error) => {
                            results.failed++;
                            errors.push(`${invite.email}: ${error?.message}`);
                        },
                    },
                );
            }
        }
        // Show summary toast
        if (results.success > 0) {
            toast.success(`Successfully invited ${results.success} team member(s)`);
        }
        if (results.failed > 0) {
            toast.error(`Failed to invite ${results.failed} team member(s)`);
            console.error('Invite errors:', errors);
        }

        // Navigate after all invites are processed
        navigate('/dashboard');
    };

    // Function to skip inviting team members
    const handleSkip = () => {
        navigate('/dashboard');
    };

    useEffect(() => {
        if (workspaces && workspaces.length > 0) {
            workspaces.find((workspace) => {
                if (workspace.role === 'owner') {
                    setIsWorkspaceCreated(true);
                    setCurrentWorkspace(workspace);
                }
            });
        }
    }, [workspaces, user]);

    return (
        <div className="w-screen h-screen bg-content1 flex justify-center items-center">
            <PageLayout
                maxW="xl"
                title={isWorkspaceCreated ? 'Invite your team' : "Let's set up your workspace"}
            >
                {!isWorkspaceCreated ? (
                    <>
                        <p className="my-3">Create a workspace to collaborate with your team</p>
                        {errors.workspaceName && (
                            <div className="flex items-center gap-2 bg-danger-50 p-3 rounded-xl border border-danger-100 font-bold text-default-900 text-sm">
                                <PiWarningBold className="text-danger-300 text-2xl" />
                                <p>{errors.workspaceName.message}</p>
                            </div>
                        )}
                        <form
                            onSubmit={handleSubmit(handleCreateWorkspace)}
                            className="flex flex-col gap-6"
                        >
                            <Input
                                label="Workspace Name"
                                type="text"
                                fullWidth
                                placeholder="My workspace"
                                aria-label="Workspace Name"
                                {...register('workspaceName', {
                                    required: 'Workspace Name is required',
                                })}
                            />
                            <Button color="primary" type="submit" isLoading={isPending}>
                                Create Workspace
                            </Button>
                        </form>
                    </>
                ) : (
                    <>
                        <p className="mb-3">
                            Add email addresses to send invitations, you can add more members later.
                        </p>
                        <form
                            onSubmit={handleInviteSubmit(handleSendInvites)}
                            className="flex flex-col gap-3 py-12"
                        >
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div className="flex gap-3" key={index}>
                                    <Input
                                        label="Email"
                                        type="email"
                                        fullWidth
                                        {...registerInvite(`${index}.email`, {
                                            validate: {
                                                format: async (value) => {
                                                    if (!value) return true; // Allow empty fields
                                                    const result = await validateEmail(value);
                                                    return !result.syntax_error || 'Invalid email format';
                                                },
                                                duplicate: (value, formValues) => {
                                                    if (!value) return true;
                                                    const emails = Object.values(formValues)
                                                        .filter(v => v?.email)
                                                        .map(v => v.email);
                                                    return emails.filter(e => e === value).length === 1 || 
                                                        'Duplicate email address';
                                                }
                                            }
                                        })}
                                        className="basis-4/3"
                                    />
                                    <Select
                                        variant="bordered"
                                        label="Role"
                                        placeholder="Select a role"
                                        className="basis-1/3"
                                        defaultSelectedKeys={['member']}
                                        {...registerInvite(`${index}.role`, {})}
                                    >
                                        <SelectItem key="admin">Admin</SelectItem>
                                        <SelectItem key="member">Member</SelectItem>
                                    </Select>
                                </div>
                            ))}
                            <div className="flex justify-end gap-3 mt-9">
                                <Button variant="light" color="primary" onPress={handleSkip}>
                                    Skip for now
                                </Button>
                                <Button color="primary" type="submit" isLoading={isAddPending}>
                                    Send Invites
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </PageLayout>
        </div>
    );
}

export default OnboardingPage;

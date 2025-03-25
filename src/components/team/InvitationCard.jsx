import { Button, Card, CardBody } from '@heroui/react';
import toast from 'react-hot-toast';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import { useUpdateUserInvitation } from '../../hooks/react-query/user/useUserInvitations.js';

function InvitationCard({ invitation }) {
    const { data: user } = useUser();
    const { mutateAsync: updateUserInvitation, isPending: isUpdating } =
        useUpdateUserInvitation(user);

    const handleUpdate = async (status) => {
        await updateUserInvitation(
            { id: invitation.id, status, user_id: user.id },
            {
                onSuccess: () => {
                    toast.success(`Invitation ${status}`);
                },
                onError: (error) => {
                    toast.error(error.message);
                },
            },
        );
        // close modal
    };

    return (
        <Card shadow="sm">
            <CardBody>
                <div className="flex gap-1 items-center justify-between">
                    <p className="text-default-500">
                        <span className="font-semibold">{invitation.invited_by}</span> has invited
                        you to join their workspace
                    </p>
                    <div className="flex gap-3 items-center">
                        <Button
                            color="default"
                            variant="solid"
                            size="md"
                            onPress={() => handleUpdate('declined')}
                            isLoading={isUpdating}
                        >
                            Decline
                        </Button>
                        <Button
                            color="primary"
                            variant="solid"
                            size="md"
                            onPress={() => handleUpdate('active')}
                            isLoading={isUpdating}
                        >
                            Accept
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}

export default InvitationCard;

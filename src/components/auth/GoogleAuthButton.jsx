import { Button, Avatar } from '@heroui/react';
import { useSignInWithOAuth } from '../../hooks/react-query/user/useUser';
import toast from 'react-hot-toast';

const GoogleAuthButton = () => {
    const { mutateAsync: signInWithOAuth, isPending } = useSignInWithOAuth();

    const handleSignIn = async () => {
        try {
            await signInWithOAuth({ provider: 'google' });
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong, try again.');
        }
    };
    return (
        <Button
            isLoading={isPending}
            onPress={handleSignIn}
            variant="bordered"
            startContent={
                <Avatar src="/google-icon-logo.svg" size="sm" className="w-6 h-6 bg-transparent" />
            }
        >
            Continue with Google
        </Button>
    );
};

export default GoogleAuthButton;

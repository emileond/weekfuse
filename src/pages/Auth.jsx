import AuthForm from '../components/auth/AuthForm';
import { useEffect } from 'react';
import { useUser } from '../hooks/react-query/user/useUser';
import { useWorkspaces } from '../hooks/react-query/teams/useWorkspaces';
import { useNavigate } from 'react-router-dom';

function AuthPage({ authMode = 'login' }) {
    const { data: user } = useUser();
    const { data: workspaces } = useWorkspaces(user);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && workspaces) {
            if (workspaces.length > 0) {
                navigate('/dashboard');
            } else {
                navigate('/onboarding');
            }
        }
    }, [user, workspaces, navigate]);

    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <AuthForm viewMode={authMode} />
        </div>
    );
}

export default AuthPage;

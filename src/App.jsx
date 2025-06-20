import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DashboardPage from './pages/Dashboard.jsx';
import ProtectedRoute from './components/nav/ProtectedRoute.jsx';
import LandingPage from './pages/Landing.jsx';
import AuthPage from './pages/Auth.jsx';
import NotFoundPage from './pages/404.jsx';
import { Toaster } from 'react-hot-toast';
import { Progress } from '@heroui/react';
import { useUser } from './hooks/react-query/user/useUser.js';
import ListDetailsPage from './pages/ListDetailsPage.jsx';
import OnboardingPage from './pages/Onboarding.jsx';
import { useState } from 'react';
import CurrentWorkspaceContext from './context/currentWorkspace.js';
import BlogPage from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import ApiPage from './pages/ApiKeys.jsx';
import TeamPage from './pages/Team.jsx';
import IntegrationsPage from './pages/Integrations.jsx';
import SettingsPage from './pages/Settings.jsx';
import ProfilePage from './pages/Profile.jsx';
import AppsumoPage from './pages/Appsumo.jsx';
import TakuWidget from './components/marketing/TakuWidget.js';
import PrivacyPolicyPage from './pages/PrivacyPolicy.jsx';
import TOSPage from './pages/TOS.jsx';
import AUPolicyPage from './pages/AUPolicyPage.jsx';
import RoadmapPage from './pages/Roadmap.jsx';
import FeatureRequestsPage from './pages/FeatureRequests.jsx';
import FeatureRequestDetails from './pages/FeatureRequestDetails.jsx';
import UpcomingPage from './pages/Upcoming.jsx';
import ProjectsPage from './pages/Projects.jsx';
import ProjectTasksPage from './pages/ProjectTasks.jsx';
import NotesPage from './pages/Notes.jsx';
import OauthCallback from './pages/integrations/OauthCallback.jsx';
import ReflectPage from './pages/reflect/Reflect.jsx';
import ReflectSessionPage from './pages/reflect/ReflectSession.jsx';
import AcceptInvitePage from './pages/team/AcceptInvite.jsx';
import PaywallPage from './pages/marketing/Paywall.jsx';

function App() {
    const { isLoading } = useUser();
    const [currentWorkspace, setCurrentWorkspace] = useState(null);
    const router = createBrowserRouter([
        {
            path: '/',
            element: <LandingPage />,
        },
        {
            path: '/blog',
            element: <BlogPage />,
        },
        {
            path: '/blog/:slug', // Dynamic route for individual blog posts
            element: <BlogPost />,
        },
        {
            path: '/login',
            element: <AuthPage authMode="login" />,
        },
        {
            path: '/signup',
            element: <AuthPage authMode="signup" />,
        },
        {
            path: '/accept-invite',
            element: <AcceptInvitePage />,
        },
        {
            path: '/dashboard',
            element: (
                <ProtectedRoute>
                    <DashboardPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/upcoming',
            element: (
                <ProtectedRoute>
                    <UpcomingPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/reflect',
            element: (
                <ProtectedRoute>
                    <ReflectPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/reflect/session/:id', // Dynamic route with "id" as the parameter
            element: (
                <ProtectedRoute>
                    <ReflectSessionPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/onboarding',
            element: (
                <ProtectedRoute>
                    <OnboardingPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/paywall',
            element: (
                <ProtectedRoute>
                    <PaywallPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/account/:tab',
            element: (
                <ProtectedRoute>
                    <ProfilePage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/lists/:id', // Dynamic route with "id" as the parameter
            element: (
                <ProtectedRoute>
                    <ListDetailsPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/keys',
            element: (
                <ProtectedRoute>
                    <ApiPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/roadmap',
            element: <RoadmapPage />,
        },
        {
            path: '/feature-requests',
            element: <FeatureRequestsPage />,
        },
        {
            path: '/feature-requests/:id',
            element: <FeatureRequestDetails />,
        },
        {
            path: '/team',
            element: (
                <ProtectedRoute>
                    <TeamPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/integrations',
            element: (
                <ProtectedRoute>
                    <IntegrationsPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/integrations/oauth/callback/:provider',
            element: (
                <ProtectedRoute>
                    <OauthCallback />
                </ProtectedRoute>
            ),
        },
        {
            path: '/settings',
            element: (
                <ProtectedRoute>
                    <SettingsPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/projects',
            element: (
                <ProtectedRoute>
                    <ProjectsPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/projects/:projectId/tasks',
            element: (
                <ProtectedRoute>
                    <ProjectTasksPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/milestones/:milestoneId/tasks',
            element: (
                <ProtectedRoute>
                    <ProjectTasksPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/notes',
            element: (
                <ProtectedRoute>
                    <NotesPage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/appsumo',
            element: <AppsumoPage />,
        },
        {
            path: '/privacy-policy',
            element: <PrivacyPolicyPage />,
        },
        {
            path: '/tos',
            element: <TOSPage />,
        },
        {
            path: '/acceptable-use-policy',
            element: <AUPolicyPage />,
        },
        {
            path: '*',
            element: <NotFoundPage />,
        },
    ]);

    return (
        <main className={`text-foreground bg-background`}>
            <CurrentWorkspaceContext.Provider value={[currentWorkspace, setCurrentWorkspace]}>
                {isLoading && <Progress aria-label="loading" size="sm" isIndeterminate />}
                <RouterProvider router={router} />
                <Toaster position="top-center" />
            </CurrentWorkspaceContext.Provider>
        </main>
    );
}

export default App;

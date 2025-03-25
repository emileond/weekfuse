import {
    Avatar,
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownSection,
    DropdownTrigger,
    User,
} from '@heroui/react';
import {
    RiSunLine,
    RiMoonClearLine,
    RiExpandUpDownLine,
    RiLogoutBoxRLine,
    RiQuestionLine,
    RiMegaphoneLine,
    RiUserLine,
    RiInbox2Line,
} from 'react-icons/ri';
import { useDarkMode } from '../../hooks/theme/useDarkMode';
import { useUser } from '../../hooks/react-query/user/useUser';
import { useLogout } from '../../hooks/react-query/user/useUser';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile } from '../../hooks/react-query/user/useUserProfile.js';
import { useCallback, useEffect, useState } from 'react';

function UserMenu({ avatarOnly }) {
    const queryClient = useQueryClient();
    const [darkMode, setDarkMode] = useDarkMode();
    const { data: user } = useUser();
    const { data: userProfile, isPending: isUserProfilePending } = useUserProfile(user);
    const { mutateAsync: logoutUser } = useLogout();
    const [isReady, setIsReady] = useState(false);
    const [chatOpened, setChatOpened] = useState(false);

    const USER_ICON_SIZE = 20;
    const ICON_SIZE = 22;

    const handleLogout = useCallback(async () => {
        await logoutUser();
        await queryClient.invalidateQueries();
    }, [logoutUser, queryClient]);

    const avatarUrl = userProfile?.avatar;

    useEffect(() => {
        if (isReady && user && !chatOpened) {
            try {
                const addUserProfile = new CustomEvent('charla:updateVisitorAttributes', {
                    detail: {
                        email: user.email,
                        user_id: user.id,
                    },
                });
                document.dispatchEvent(addUserProfile);

                const charlaOpenWidgetEvent = new Event('charla:openWidget');
                document.dispatchEvent(charlaOpenWidgetEvent);

                setChatOpened(true);
            } catch (error) {
                console.error('Failed to initialize chat widget:', error);
            }
        }
    }, [isReady, user, chatOpened]);

    const handleHelpClick = () => {
        let widgetElement = document.createElement('charla-widget');
        widgetElement.setAttribute('p', '7fb0b19a-18a6-41e2-8209-a022a6d4c4d9');
        document.body.appendChild(widgetElement);

        let widgetCode = document.createElement('script');
        widgetCode.src = 'https://app.getcharla.com/widget/widget.js';
        document.body.appendChild(widgetCode);

        document.addEventListener('charla:widgetLoaded', () => {
            setIsReady(true);
        });
    };

    if (!user || isUserProfilePending) return null;

    return (
        <Dropdown>
            <DropdownTrigger>
                {avatarOnly ? (
                    <Avatar
                        showFallback
                        name={user?.data?.name || 'User'}
                        src={avatarUrl}
                        size="sm"
                        className="cursor-pointer"
                    />
                ) : (
                    <User
                        as={Button}
                        variant="bordered"
                        size="lg"
                        className="justify-between px-3 border"
                        endContent={<RiExpandUpDownLine fontSize={ICON_SIZE - 6} />}
                        name={userProfile?.name || 'User'}
                        description={user?.email || 'email'}
                        avatarProps={{
                            size: 'sm',
                            src: avatarUrl,
                        }}
                    />
                )}
            </DropdownTrigger>
            <DropdownMenu>
                <DropdownSection showDivider>
                    <DropdownItem textValue="user">
                        <User
                            name={userProfile?.name || 'User'}
                            description={user?.email || 'email'}
                            avatarProps={{
                                className: 'hidden',
                                src: avatarUrl,
                            }}
                        />
                    </DropdownItem>
                </DropdownSection>
                <DropdownSection showDivider>
                    <DropdownItem
                        // className="taku-launcher"
                        onPress={() => window.Taku('news:show')}
                        startContent={<RiMegaphoneLine fontSize={USER_ICON_SIZE} />}
                    >
                        {`What's new`}
                    </DropdownItem>
                    <DropdownItem
                        startContent={<RiQuestionLine fontSize={USER_ICON_SIZE} />}
                        onPress={handleHelpClick}
                    >
                        Help
                    </DropdownItem>
                </DropdownSection>
                <DropdownSection>
                    <DropdownItem
                        textValue="theme"
                        onPress={() => setDarkMode(!darkMode)}
                        startContent={
                            darkMode ? (
                                <RiSunLine fontSize={USER_ICON_SIZE} />
                            ) : (
                                <RiMoonClearLine fontSize={USER_ICON_SIZE} />
                            )
                        }
                    >
                        {darkMode ? 'Light' : 'Dark'} theme
                    </DropdownItem>
                    {[
                        {
                            name: 'Profile',
                            path: '/account/profile',
                            startContent: <RiUserLine fontSize={USER_ICON_SIZE} />,
                        },
                        {
                            name: 'Invitations',
                            path: '/account/invitations',
                            startContent: <RiInbox2Line fontSize={USER_ICON_SIZE} />,
                        },
                        {
                            name: 'Log Out',
                            action: handleLogout,
                            startContent: <RiLogoutBoxRLine fontSize={USER_ICON_SIZE} />,
                        },
                    ].map((route, index) => (
                        <DropdownItem
                            as={route.path && Link}
                            key={index}
                            to={route.path}
                            onPress={route.action}
                            startContent={route?.startContent}
                            className={`items-center justify-start ${route.name === 'Log Out' && 'text-danger'}`}
                            color={route.name === 'Log Out' ? 'danger' : 'default'}
                        >
                            {route.name}
                        </DropdownItem>
                    ))}
                </DropdownSection>
            </DropdownMenu>
        </Dropdown>
    );
}

export default UserMenu;

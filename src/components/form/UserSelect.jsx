import { useEffect, useMemo } from 'react';
import CreatableSelect from './CreatableSelect';
import { useWorkspaceMembers } from '../../hooks/react-query/teams/useWorkspaceMembers';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { RiUserLine } from 'react-icons/ri';
import { Avatar, Spinner } from '@heroui/react';
import { useUser } from '../../hooks/react-query/user/useUser';

const UserSelect = ({
    label = 'Assignee',
    placeholder = 'Search users...',
    defaultValue = null,
    onChange,
    placement = 'bottom',
    className = '',
    triggerClassName = '',
    disabled = false,
    multiSelect = false,
    defaultToCurrentUser = false,
}) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { data: members, isLoading } = useWorkspaceMembers(currentWorkspace);
    const { data: currentUser } = useUser();

    // Filter members by role and status, then map to options
    const userOptions = useMemo(() => {
        if (!members) return [];
        return members
            .filter(
                (member) =>
                    // Only include members with roles "owner", "admin", or "member"
                    ['owner', 'admin', 'member'].includes(member.role) &&
                    // Only include members with status "active"
                    member.status === 'active',
            )
            .map((member) => ({
                label: member.name || member.email,
                value: member.user_id,
                avatar: member.avatar,
                startContent: (
                    <Avatar
                        src={`${member.avatar}/w=60?t=${userProfile?.updated_at}`}
                        className="w-6 h-6"
                    />
                ),
            }));
    }, [members]);

    // 2. MODIFY THE useEffect to respect the new prop
    useEffect(() => {
        // This logic now ONLY runs if the prop is explicitly true
        if (
            defaultToCurrentUser &&
            userOptions.length > 0 &&
            currentUser &&
            defaultValue === null
        ) {
            const currentUserOption = userOptions.find((opt) => opt.value === currentUser.id);
            if (currentUserOption) {
                // We don't need internal state. Just call the parent's onChange.
                onChange(currentUserOption);
            }
        }
    }, [userOptions, currentUser, defaultValue, onChange, defaultToCurrentUser]);

    // DERIVE the option object to display from the defaultValue prop
    const selectedOptionObject = useMemo(() => {
        if (defaultValue === null) return null;
        return userOptions.find((opt) => opt.value === defaultValue);
    }, [defaultValue, userOptions]);

    if (members?.length < 2) {
        return null;
    }

    return isLoading ? (
        <Spinner color="default" variant="wave" size="sm" />
    ) : (
        <CreatableSelect
            label={label}
            placeholder={placeholder}
            options={userOptions}
            // 3. MODIFY THE defaultValue prop to respect the new prop
            defaultValue={
                defaultValue
                    ? selectedOptionObject
                    : defaultToCurrentUser
                      ? userOptions?.find((opt) => opt.value === currentUser?.id)
                      : null // If no defaultValue and not defaulting to current user, it's null.
            }
            onChange={(value) => {
                // 'value' from CreatableSelect is just the user ID
                if (multiSelect) {
                    // Multi-select logic here...
                } else {
                    const option = userOptions.find((opt) => opt.value === value) || null;
                    onChange(option); // Pass the full option object or null to the parent
                }
            }}
            placement={placement}
            className={className}
            triggerClassName={triggerClassName}
            disabled={disabled}
            icon={
                // The icon is now correctly based on the derived selectedOptionObject
                selectedOptionObject ? (
                    <Avatar
                        src={`${selectedOptionObject.avatar}/w=60?t=${userProfile?.updated_at}`}
                        className="w-6 h-6"
                    />
                ) : (
                    <RiUserLine fontSize="1rem" />
                )
            }
            multiple={multiSelect}
            allSelectedLabel={multiSelect ? 'All users' : null}
        />
    );
};

export default UserSelect;

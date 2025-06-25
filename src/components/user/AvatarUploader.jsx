import { useState, useCallback } from 'react';
import { Avatar, Button, Spinner } from '@heroui/react';
import toast from 'react-hot-toast';
import ky from 'ky';
import { useUser } from '../../hooks/react-query/user/useUser.js';
import { useUserProfile } from '../../hooks/react-query/user/useUserProfile.js';
import { useUpdateUserProfile } from '../../hooks/react-query/user/useUserProfile.js';

const AvatarUploader = () => {
    const { data: user } = useUser();
    const { data: userProfile } = useUserProfile(user);
    const { mutateAsync: updateUserProfile } = useUpdateUserProfile(user);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = useCallback(
        async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // Validate file type
            if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
                return toast.error('Invalid file type. Please upload PNG or JPG.');
            }

            // Validate file size (1MB max)
            if (file.size > 1024 * 1024) {
                return toast.error('File size exceeds 1MB. Please choose a smaller image.');
            }

            setUploading(true);

            try {
                // Create form data for the API request
                const formData = new FormData();
                formData.append('file', file);
                formData.append('userId', user.id);

                // Upload to Cloudflare Images via our API route
                const response = await ky.post('/api/avatar', {
                    body: formData,
                    timeout: 30000, // 30 seconds timeout
                }).json();

                if (!response.success) throw new Error(response.error || 'Failed to upload avatar.');

                // Update user profile with the new avatar URL
                await updateUserProfile({ avatar: response.imageUrl });
                toast.success('Avatar updated successfully!');
            } catch (error) {
                console.error(error);
                toast.error(error.message);
            } finally {
                setUploading(false);
            }
        },
        [user, updateUserProfile],
    );

    if (!userProfile) return null; // Prevents rendering when data isn't ready

    return (
        <div className="flex flex-col items-center gap-6">
            <Avatar
                alt="User avatar"
                showFallback
                className="w-32 h-32"
                src={`/cdn-cgi/image/width=140,quality=80/${userProfile?.avatar}`}
            />
            <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                hidden
                id="avatar-upload"
                onChange={handleFileChange}
            />
            <label htmlFor="avatar-upload">
                <Button size="sm" as="span" variant="bordered" color="primary" disabled={uploading}>
                    {uploading ? <Spinner size="sm" /> : 'Change avatar'}
                </Button>
            </label>
        </div>
    );
};

export default AvatarUploader;

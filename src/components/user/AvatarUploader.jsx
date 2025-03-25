import { useState, useCallback } from 'react';
import { Avatar, Button, Spinner } from '@heroui/react';
import { supabaseClient } from '../../lib/supabase.js';
import toast from 'react-hot-toast';
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
            const filePath = `${user.id}/avatar.png`;

            try {
                // Upload to Supabase Storage
                const { error: uploadError } = await supabaseClient.storage
                    .from('avatars')
                    .upload(filePath, file, { upsert: true });

                if (uploadError) throw new Error('Failed to upload avatar.');

                // Get public URL with cache busting
                const { data } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
                if (!data.publicUrl) throw new Error('Failed to retrieve avatar URL.');

                await updateUserProfile({ avatar: `${data.publicUrl}?t=${Date.now()}` });
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
        <div className="flex items-center gap-3">
            <Avatar showFallback className="w-16 h-16" src={userProfile.avatar} />
            <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                hidden
                id="avatar-upload"
                onChange={handleFileChange}
            />
            <label htmlFor="avatar-upload">
                <Button size="sm" as="span" variant="bordered" disabled={uploading}>
                    {uploading ? <Spinner size="sm" /> : 'Upload new'}
                </Button>
            </label>
        </div>
    );
};

export default AvatarUploader;

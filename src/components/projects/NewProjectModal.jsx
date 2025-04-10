import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Divider,
    Avatar,
} from '@heroui/react';
import { useForm } from 'react-hook-form';
import { useCreateProject } from '../../hooks/react-query/projects/useProjects.js';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { supabaseClient } from '../../lib/supabase.js';
import { RiUpload2Line } from 'react-icons/ri';

const NewProjectModal = ({ isOpen, onOpenChange }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const { mutateAsync: createProject, isPending } = useCreateProject(currentWorkspace);
    const [uploading, setUploading] = useState(false);
    const [iconPreview, setIconPreview] = useState(null);
    const [iconFile, setIconFile] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!['image/png'].includes(file.type)) {
            return toast.error('Invalid file type. Please upload PNG only.');
        }

        // Validate file size (500KB max)
        if (file.size > 500 * 1024) {
            return toast.error('File size exceeds 500KB. Please choose a smaller image.');
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setIconPreview(e.target.result);
        };
        reader.readAsDataURL(file);
        setIconFile(file);
    };

    const uploadIcon = async (projectId) => {
        if (!iconFile) return null;

        setUploading(true);
        const filePath = `${currentWorkspace.workspace_id}/${projectId}/icon.png`;

        try {
            // Upload to Supabase Storage
            const { error: uploadError } = await supabaseClient.storage
                .from('project-icons')
                .upload(filePath, iconFile, { upsert: true });

            if (uploadError) throw new Error('Failed to upload project icon.');

            // Get public URL
            const { data } = supabaseClient.storage.from('project-icons').getPublicUrl(filePath);
            if (!data.publicUrl) throw new Error('Failed to retrieve icon URL.');

            return data.publicUrl;
        } catch (error) {
            console.error(error);
            toast.error(error.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            // First create the project
            const newProject = await createProject({
                project: {
                    name: data.name,
                    workspace_id: currentWorkspace.workspace_id,
                },
            });

            // If we have an icon, upload it and update the project
            if (iconFile) {
                const iconUrl = await uploadIcon(newProject.id);
                if (iconUrl) {
                    // Update the project with the icon URL
                    const { error } = await supabaseClient
                        .from('projects')
                        .update({ icon_url: iconUrl })
                        .eq('id', newProject.id);

                    if (error) {
                        console.error('Error updating project with icon:', error);
                        toast.error('Project created but failed to attach icon.');
                    }
                }
            }

            toast.success('Project created successfully');
            onOpenChange(false);
            reset();
            setIconPreview(null);
            setIconFile(null);
        } catch (error) {
            toast.error(error.message || 'Failed to create project');
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
        reset();
        setIconPreview(null);
        setIconFile(null);
    };

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
            <ModalContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ModalHeader className="flex flex-col gap-1">New Project</ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-6">
                            <Input
                                size="lg"
                                {...register('name', { required: true })}
                                label="Project Name"
                                placeholder="Enter project name"
                                isInvalid={!!errors.name}
                                errorMessage="Project name is required"
                            />
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Project Icon (Optional)</label>
                                <div className="flex items-center gap-4">
                                    <Avatar 
                                        showFallback 
                                        className="w-16 h-16" 
                                        src={iconPreview} 
                                        fallback={<RiUpload2Line size={24} />}
                                    />
                                    <div>
                                        <input
                                            type="file"
                                            accept="image/png"
                                            hidden
                                            id="project-icon-upload"
                                            onChange={handleFileChange}
                                        />
                                        <label htmlFor="project-icon-upload">
                                            <Button size="sm" as="span" variant="bordered" disabled={uploading}>
                                                Upload Icon
                                            </Button>
                                        </label>
                                        <p className="text-xs text-default-500 mt-1">
                                            PNG only, max 500KB
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <Divider />
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={handleCancel}
                            isDisabled={isPending || uploading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            color="primary" 
                            type="submit" 
                            isLoading={isPending || uploading}
                        >
                            Create Project
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default NewProjectModal;
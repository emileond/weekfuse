import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

// Fetch notes for a specific workspace
const fetchNotes = async ({ id, workspace_id }) => {
    let query = supabaseClient.from('notes').select('*').eq('workspace_id', workspace_id);

    if (id) {
        query = query.eq('id', id).single(); // Fetch single item
    } else {
        query = query.order('created_at', { ascending: false }); // Order by created_at descending
    }

    const { data, error } = await query;

    if (error) {
        throw new Error('Failed to fetch notes');
    }

    return data;
};

// Hook to fetch notes with optional filters
export const useNotes = (currentWorkspace, filters = {}) => {
    return useQuery({
        queryKey: ['notes', currentWorkspace?.workspace_id, filters],
        queryFn: () =>
            fetchNotes({
                workspace_id: currentWorkspace?.workspace_id,
                id: filters.id,
            }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!currentWorkspace?.workspace_id, // Only fetch if workspace_id is provided
    });
};

// Function to create a new note
const createNote = async ({ note }) => {
    const { data, error } = await supabaseClient.from('notes').insert(note).select();

    if (error) {
        throw new Error('Failed to create note');
    }

    return data[0];
};

// Hook to create a new note
export const useCreateNote = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createNote,
        onSuccess: () => {
            // Invalidate all note-related queries for the workspace
            queryClient.invalidateQueries({
                queryKey: ['notes', currentWorkspace?.workspace_id],
                refetchType: 'all',
            });
        },
    });
};

// Function to update a note
const updateNote = async ({ noteId, updates }) => {
    const { error } = await supabaseClient.from('notes').update(updates).eq('id', noteId);

    if (error) {
        throw new Error('Failed to update note');
    }
};

// Hook to update a note
export const useUpdateNote = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateNote,
        onError: (error) => {
            console.error('Error updating note:', error);
        },
        onSuccess: () => {
            // Invalidate all note-related queries for the workspace
            queryClient.invalidateQueries({
                queryKey: ['notes', currentWorkspace?.workspace_id],
                refetchType: 'all',
            });
        },
    });
};

// Function to delete a note
const deleteNote = async ({ noteId }) => {
    const { error } = await supabaseClient.from('notes').delete().eq('id', noteId);

    if (error) {
        throw new Error('Failed to delete note');
    }
};

// Hook to delete a note
export const useDeleteNote = (currentWorkspace) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ noteId }) => deleteNote({ noteId }),
        onError: (error) => {
            console.error('Error deleting note:', error);
        },
        onSuccess: () => {
            // Invalidate all note-related queries for the workspace
            queryClient.invalidateQueries({
                queryKey: ['notes', currentWorkspace?.workspace_id],
                refetchType: 'all',
            });
        },
    });
};
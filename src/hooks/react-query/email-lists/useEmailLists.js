import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseClient } from '../../../lib/supabase'

// Fetch email lists for a specific team
const fetchEmailLists = async (workspace_id) => {
  const { data, error } = await supabaseClient
    .from('lists')
    .select('*')
    .eq('workspace_id', workspace_id)

  if (error) {
    throw new Error('Failed to fetch email lists')
  }

  return data
}

// Hook to fetch all email lists for a given team
export const useEmailLists = (currentWorkspace) => {
  return useQuery({
    queryKey: ['emailLists', currentWorkspace?.workspace_id],
    queryFn: () => fetchEmailLists(currentWorkspace?.workspace_id),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!currentWorkspace?.workspace_id, // Only fetch if teamId is provided
  })
}

// Function to create a new email list
const createEmailList = async ({ fileName, workspace_id }) => {
  const { error } = await supabaseClient.from('lists').insert([
    {
      name: fileName,
      status: 'pending',
      workspace_id: workspace_id,
    },
  ])

  if (error) {
    throw new Error('Failed to create email list')
  }

  return
}

// Hook to create a new email list
export const useCreateEmailList = (currentWorkspace) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEmailList,
    onSuccess: () => {
      // Invalidate and refetch the email lists query for the team
      queryClient.invalidateQueries([
        'emailLists',
        currentWorkspace?.workspace_id,
      ])
    },
  })
}

// Function to delete an email list
const deleteEmailList = async ({ listId }) => {
  const { error } = await supabaseClient.from('lists').delete().eq('id', listId)

  if (error) {
    throw new Error('Failed to delete email list')
  }

  return
}

// Hook to delete an email list
export const useDeleteEmailList = (currentWorkspace) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listId }) => deleteEmailList({ listId }),
    onError: (error) => {
      console.error('Error deleting email list:', error)
    },
    onSuccess: () => {
      // Invalidate and refetch the email lists query for the team
      queryClient.invalidateQueries([
        'emailLists',
        currentWorkspace?.workspace_id,
      ])
    },
  })
}

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabaseClient } from '../../../lib/supabase'

// Fetch email lists for a specific team
const fetchApiKeys = async (workspace_id) => {
  const { data, error } = await supabaseClient
    .from('api_keys')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('is_revoked', false)

  if (error) {
    throw new Error('Failed to fetch email lists')
  }

  return data
}

// Hook to fetch all email lists for a given team
export const useApiKeys = (currentWorkspace) => {
  return useQuery({
    queryKey: ['apiKeys', currentWorkspace?.workspace_id],
    queryFn: () => fetchApiKeys(currentWorkspace?.workspace_id),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!currentWorkspace?.workspace_id, // Only fetch if teamId is provided
  })
}

// Function to create a new api key
const createApiKey = async ({ name, workspace_id }) => {
  const { error } = await supabaseClient.from('api_keys').insert([
    {
      name: name,
      workspace_id: workspace_id,
    },
  ])

  if (error) {
    console.error('Error creating api key:', error)
    throw new Error('Failed to create email list')
  }

  return
}

// Hook to create a new api key
export const useCreateApiKey = (currentWorkspace) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      // Invalidate and refetch the email lists query for the team
      queryClient.invalidateQueries(['apiKeys', currentWorkspace?.workspace_id])
    },
  })
}

// Function to delete an api key
const deleteApiKey = async ({ id }) => {
  console.log('Deleting api key with id:', id)
  const { error } = await supabaseClient.from('api_keys').delete().eq('id', id)

  if (error) {
    console.error('Error deleting api key:', error)
    throw new Error('Failed to create email list')
  }

  return
}

// Hook to delete an api key
export const useDeleteApiKey = (currentWorkspace) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      // Invalidate and refetch the email lists query for the team
      queryClient.invalidateQueries(['apiKeys', currentWorkspace?.workspace_id])
    },
  })
}

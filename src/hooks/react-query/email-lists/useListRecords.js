import { useQuery } from '@tanstack/react-query'
import { supabaseClient } from '../../../lib/supabase'

// Function to fetch paginated list records for a specific list
const fetchListRecords = async ({ listId, page = 1, pageSize = 10 }) => {
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  const { data, error, count } = await supabaseClient
    .from('list_records')
    .select('*', { count: 'exact' })
    .eq('list_id', listId)
    .range(start, end)

  if (error) {
    throw new Error(`Failed to fetch list records: ${error.message}`)
  }

  return { data, count }
}

// Hook to fetch paginated list records for a specific list
export const useListRecords = ({ listId, page = 1, pageSize = 10 }) => {
  return useQuery({
    queryKey: ['listRecords', listId, page, pageSize],
    queryFn: () => fetchListRecords({ listId, page, pageSize }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!listId, // Only fetch if listId is provided
  })
}
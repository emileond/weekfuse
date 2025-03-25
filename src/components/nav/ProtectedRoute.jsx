import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../hooks/react-query/user/useUser'

function ProtectedRoute({ children }) {
  const { data: user, isPending } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user && !isPending) {
      navigate('/login')
    }
  }, [user, isPending, navigate])

  if (!user) {
    // You can also render a loading indicator or null while checking user status
    return null
  }

  return children
}

export default ProtectedRoute

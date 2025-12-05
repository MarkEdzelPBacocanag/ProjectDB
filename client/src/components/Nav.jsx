import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Nav() {
  const { token, user, logout } = useAuth()
  if (!token) return null
  return (
    <div style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #ddd' }}>
      <Link to="/">Dashboard</Link>
      <Link to="/residents">Residents</Link>
      <Link to="/services">Services</Link>
      <Link to="/requests">Requests</Link>
      <Link to="/assignments">Assignments</Link>
      {user?.role === 'admin' && <Link to="/staff">Staff</Link>}
      <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        {user?.role === 'admin' && (
          <Link to="/staff?changePassword=1">
            <button>Change Password</button>
          </Link>
        )}
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  )
}

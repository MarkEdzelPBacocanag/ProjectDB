import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Nav() {
  const { token, user, logout } = useAuth()
  if (!token) return null
  return (
    <div style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #ddd' }}>
      <Link to="/">Home</Link>
      <Link to="/residents">Residents</Link>
      <Link to="/services">Services</Link>
      <Link to="/requests">Requests</Link>
      <Link to="/assignments">Assignments</Link>
      {user?.role === 'admin' && <Link to="/staff">Staff</Link>}
      <span style={{ marginLeft: 'auto' }}>
        <button onClick={logout}>Logout</button>
      </span>
    </div>
  )
}

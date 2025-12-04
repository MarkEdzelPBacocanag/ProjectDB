import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="app-shell">
      <header className="topbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: 10 }}>
        <div className="brand">BarangayLink</div>
        <div className="topbar-right" style={{ position: 'relative' }}>
          <input className="search" placeholder="Search" />
          <button className="user-chip" onClick={() => setMenuOpen((v) => !v)}>{user ? user.username : 'Guest'}</button>
          {menuOpen && user && (
            <div style={{ position: 'absolute', right: 0, top: 48, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 160 }}>
              <button style={{ display: 'block', color: 'black',background: 'transparent' ,width: '100%', padding: 10, border: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => { setMenuOpen(false); logout() }}>Logout</button>
            </div>
          )}
        </div>
      </header>
      <aside style={{ marginTop: 60}} className="sidebar">
          <nav>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Home</NavLink>
            <NavLink to="/residents" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Residents</NavLink>
            <NavLink to="/services" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Services</NavLink>
            <NavLink to="/requests" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Requests</NavLink>
            <NavLink to="/assignments" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Assignments</NavLink>
            <NavLink to="/reports" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Reports</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/staff" className={({ isActive }) => isActive ? 'navlink active' : 'navlink'}>Staff</NavLink>
            )}
          </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

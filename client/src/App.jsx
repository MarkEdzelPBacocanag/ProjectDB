import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Protected from './components/Protected'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Residents from './pages/Residents'
import Services from './pages/Services'
import Requests from './pages/Requests'
import Assignments from './pages/Assignments'
import Staff from './pages/Staff'
import Reports from './pages/Reports'

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/residents" element={<Residents />} />
            <Route path="/services" element={<Services />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/staff" element={<Staff />} />
          </Route>
        </Route>
      </Routes>
    </div>
  )
}

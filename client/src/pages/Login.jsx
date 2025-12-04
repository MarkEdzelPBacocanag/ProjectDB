import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { useToast } from '../components/Toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()
  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      toast.push('Please enter username and password', 'error')
      return
    }
    try {
      await login(username, password)
      toast.push('Logged in', 'success')
      navigate('/dashboard')
    } catch (e) {
      if (e.response?.status === 404 || e.message?.includes('not found')) {
        toast.push('Account does not exist', 'error')
      } else {
        toast.push('Invalid credentials', 'error')
      }
    }

  }
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ textAlign: 'center' }}>Welcome to BarangayLink</h2>
      <div style={{ display: 'grid', justifyContent: 'center' }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, width: 360 }}>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  )
}

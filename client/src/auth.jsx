import { createContext, useContext, useEffect, useState } from 'react'
import { API } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [token])
  useEffect(() => {
    let mounted = true
    async function restore() {
      if (!token || user) return
      setLoading(true)
      try {
        const me = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4100/api') + '/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json())
        if (mounted) setUser(me)
      } catch (e) {
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    restore()
    return () => {
      mounted = false
    }
  }, [token])
  const login = async (username, password) => {
    const res = await API.login(username, password)
    setToken(res.token)
    setUser(res.user)
  }
  const logout = () => {
    setToken('')
    setUser(null)
  }
  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

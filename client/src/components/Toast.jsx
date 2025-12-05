import { createContext, useContext, useEffect, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== t.id)), t.duration || 1000))
    return () => timers.forEach(clearTimeout)
  }, [toasts])
  const push = (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((arr) => [...arr, { id, message, type }])
  }
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}


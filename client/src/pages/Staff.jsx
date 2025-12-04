import { useEffect, useState } from 'react'
import { API } from '../api'
import { useAuth } from '../auth'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeleton'

export default function StaffPage() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { token, user } = useAuth()
  const isAdmin = !!user && user.role === 'admin'
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState({ name: '', role: '' })
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openUser, setOpenUser] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [openPassword, setOpenPassword] = useState(false)
  const [passwordStaffId, setPasswordStaffId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const toast = useToast()
  useEffect(() => {
    API.staff.list().then((data) => { setItems(data); setLoading(false) })
  }, [])
  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !role.trim()) {
      toast.push('Name and role are required', 'error')
      return
    }
    try {
      const item = await API.staff.create(token, { name, role })
      setItems([item, ...items])
      setName('')
      setRole('')
      setOpenCreate(false)
      toast.push('Staff created', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const startEdit = (i) => {
    setEditingId(i._id)
    setEditForm({ name: i.name, role: i.role })
    setOpenEdit(true)
  }
  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.role.trim()) {
      toast.push('Name and role are required', 'error')
      return
    }
    try {
      const updated = await API.staff.update(token, editingId, editForm)
      setItems(items.map((it) => (it._id === editingId ? updated : it)))
      setEditingId('')
      setOpenEdit(false)
      toast.push('Staff updated', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const removeItem = async (id) => {
    try {
      await API.staff.remove(token, id)
      setItems(items.filter((i) => i._id !== id))
      toast.push('Staff deleted', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const startCreateLogin = (staff) => {
    setSelectedStaffId(staff._id)
    setUsername('')
    setPassword('')
    setOpenUser(true)
  }
  const createLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.push('Username and password are required', 'error')
      return
    }
    try {
      await API.users.registerStaff(token, { username, password, staffId: selectedStaffId })
      setOpenUser(false)
      toast.push('Staff login created', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const startEditPassword = (staff) => {
    setPasswordStaffId(staff._id)
    setNewPassword('')
    setOpenPassword(true)
  }
  const savePassword = async () => {
    if (!newPassword.trim()) {
      toast.push('Password is required', 'error')
      return
    }
    try {
      await API.users.updateStaffPassword(token, passwordStaffId, newPassword)
      setOpenPassword(false)
      toast.push('Password updated', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  return (
    <div style={{ margin: 50 }}>
      <h2>Staff</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setOpenCreate(true)} disabled={!token}>New Staff</button>
      </div>
      {loading ? (
        <TableSkeleton rows={6} cols={3} />
      ) : items.length === 0 ? (
        <div style={{ marginTop: 24, padding: 16, border: '1px dashed #e5e7eb', borderRadius: 8, color: '#6b7280' }}>
          No staff found. Use "New Staff" to add the first record.
        </div>
      ) : (
      <table border="1" cellPadding="8" style={{ marginTop: 12, width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i._id}>
              <td>{i.name}</td>
              <td>{i.role}</td>
              <td>
                {isAdmin && <button style={{margin:5, padding:5}} onClick={() => startEdit(i)}>Edit</button>}
                {isAdmin && <button style={{margin:5, padding:5}} onClick={() => removeItem(i._id)}>Delete</button>}
                {isAdmin && <button style={{margin:5, padding:5}} onClick={() => startCreateLogin(i)}>Create Login</button>}
                {isAdmin && <button style={{margin:5, padding:5}} onClick={() => startEditPassword(i)}>Edit Password</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      <Modal open={openCreate} title="New Staff" onClose={() => setOpenCreate(false)} footer={<>
        <button onClick={() => setOpenCreate(false)}>Cancel</button>
        <button onClick={(e) => onCreate(e)} disabled={!token}>Create</button>
      </>}>
        <form onSubmit={onCreate} style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        </form>
      </Modal>
      <Modal open={openPassword} title="Edit Staff Password" onClose={() => setOpenPassword(false)} footer={<>
        <button onClick={() => setOpenPassword(false)}>Cancel</button>
        <button onClick={savePassword} disabled={!token}>Save</button>
      </>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div>For: {items.find((s) => s._id === passwordStaffId)?.name || ''}</div>
          <input placeholder="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
      </Modal>
      <Modal open={openUser} title="Create Staff Login" onClose={() => setOpenUser(false)} footer={<>
        <button onClick={() => setOpenUser(false)}>Cancel</button>
        <button onClick={createLogin} disabled={!token}>Create</button>
      </>}>
        <form onSubmit={createLogin} style={{ display: 'grid', gap: 8 }}>
          <div>For: {items.find((s) => s._id === selectedStaffId)?.name || ''}</div>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </form>
      </Modal>
      <Modal open={openEdit} title="Edit Staff" onClose={() => { setOpenEdit(false); setEditingId('') }} footer={<>
        <button onClick={() => { setOpenEdit(false); setEditingId('') }}>Cancel</button>
        <button onClick={saveEdit} disabled={!token}>Save</button>
      </>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <input value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [openAdminPassword, setOpenAdminPassword] = useState(false)
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('')
  const [adminNewPassword, setAdminNewPassword] = useState('')
  const toast = useToast()
  const location = useLocation()
  useEffect(() => {
    API.staff.list().then((data) => { setItems(data); setLoading(false) })
  }, [])
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('changePassword') && isAdmin && token) {
      setOpenAdminPassword(true)
    }
  }, [location.search, isAdmin, token])
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
  const createLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.push('Username and password are required', 'error')
      return
    }
    try {
      await API.users.registerStaff(token, { username, password, staffId: editingId })
      toast.push('Staff login created', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const savePassword = async () => {
    if (!newPassword.trim()) {
      toast.push('Password is required', 'error')
      return
    }
    try {
      await API.users.updateStaffPassword(token, editingId, newPassword)
      toast.push('Password updated', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const deleteLogin = async () => {
    try {
      await API.users.deleteStaffLogin(token, editingId)
      toast.push('Staff login deleted', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const saveAdminPassword = async () => {
    if (!adminCurrentPassword.trim() || !adminNewPassword.trim()) {
      toast.push('Current and new password are required', 'error')
      return
    }
    try {
      await API.users.updateAdminPassword(token, adminCurrentPassword, adminNewPassword)
      setAdminCurrentPassword('')
      setAdminNewPassword('')
      setOpenAdminPassword(false)
      toast.push('Admin password updated', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  return (
    <div style={{ margin: 50 }}>
      <h1 style={{margin:0, padding:0, textAlign:'start'}}>Staff</h1>
      <div style={{ marginTop: 8, display:'flex', flexDirection:'row', justifyContent:'end'}}>
        {isAdmin && <button onClick={() => setOpenAdminPassword(true)} disabled={!token} style={{marginRight:8}}>Change Password</button>}
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

      <Modal open={openAdminPassword} title="Change Admin Password" onClose={() => setOpenAdminPassword(false)} footer={<>
        <button onClick={() => setOpenAdminPassword(false)}>Cancel</button>
        <button onClick={saveAdminPassword} disabled={!token || !isAdmin || !adminCurrentPassword.trim() || !adminNewPassword.trim()}>Save</button>
      </>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Current Password" type="password" value={adminCurrentPassword} onChange={(e) => setAdminCurrentPassword(e.target.value)} />
          <input placeholder="New Password" type="password" value={adminNewPassword} onChange={(e) => setAdminNewPassword(e.target.value)} />
        </div>
      </Modal>

      <Modal open={openEdit} title="Edit Staff" onClose={() => { setOpenEdit(false); setEditingId('') }} footer={<>
        <button onClick={() => { setOpenEdit(false); setEditingId('') }}>Cancel</button>
        <button onClick={saveEdit} disabled={!token}>Save</button>
      </>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <input value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} />
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button onClick={createLogin} disabled={!token || !editingId || !username.trim() || !password.trim()}>Create Login</button>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <input placeholder="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button onClick={savePassword} disabled={!token || !editingId || !newPassword.trim()}>Save Password</button>
            </div>
            <div>
              <button onClick={deleteLogin} disabled={!token || !editingId}>Delete Login</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

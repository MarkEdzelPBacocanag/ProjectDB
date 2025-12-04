import { useEffect, useState } from 'react'
import { API } from '../api'
import { useAuth } from '../auth'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeleton'

export default function Residents() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const toast = useToast()
  const { token, user } = useAuth()
  const canEdit = !!user && (user.role === 'admin' || user.role === 'staff')
  const canDelete = !!user && user.role === 'admin'
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState({ name: '', address: '', birthDate: '', contactNumber: '' })
  useEffect(() => {
    setLoading(true)
    API.residents.list().then((data) => { setItems(data); setLoading(false) })
  }, [])
  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !address.trim() || !birthDate || !contactNumber.trim()) {
      toast.push('All resident fields are required', 'error')
      return
    }
    if (!/^\d[\d\s\-]{6,}$/.test(contactNumber.trim())) {
      toast.push('Contact number is invalid', 'error')
      return
    }
    try {
      const item = await API.residents.create(token, { name, address, birthDate, contactNumber })
      setItems([item, ...items])
      setName('')
      setAddress('')
      setBirthDate('')
      setContactNumber('')
      setOpenCreate(false)
      toast.push('Resident created', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const startEdit = (i) => {
    setEditingId(i._id)
    setEditForm({ name: i.name, address: i.address, birthDate: i.birthDate?.slice(0, 10), contactNumber: i.contactNumber })
    setOpenEdit(true)
  }
  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.address.trim() || !editForm.birthDate || !editForm.contactNumber.trim()) {
      toast.push('All resident fields are required', 'error')
      return
    }
    if (!/^\d[\d\s\-]{6,}$/.test(editForm.contactNumber.trim())) {
      toast.push('Contact number is invalid', 'error')
      return
    }
    try {
      const updated = await API.residents.update(token, editingId, editForm)
      setItems(items.map((it) => (it._id === editingId ? updated : it)))
      setEditingId('')
      setOpenEdit(false)
      toast.push('Resident updated', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const removeItem = async (id) => {
    try {
      await API.residents.remove(token, id)
      setItems(items.filter((i) => i._id !== id))
      toast.push('Resident deleted', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  return (
    <div style={{ margin: 50 }}>
      <h2>Residents</h2>
      <input placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setOpenCreate(true)} disabled={!token}>New Resident</button>
      </div>
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())).length === 0 ? (
        <div style={{ marginTop: 24, padding: 16, border: '1px dashed #e5e7eb', borderRadius: 8, color: '#6b7280' }}>
          No residents found. Use "New Resident" to add the first record.
        </div>
      ) : (
      <table cellPadding="8" style={{marginBottom: 15,marginTop: 15, width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Birth Date</th>
            <th>Contact Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items
            .filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))
            .slice((page - 1) * pageSize, page * pageSize)
            .map((i) => (
              <tr key={i._id}>
                <td>{i.name}</td>
                <td>{i.address}</td>
                <td>{new Date(i.birthDate).toLocaleDateString()}</td>
                <td>{i.contactNumber}</td>
                <td>
                  <div>
                  <tr>
                    <td class="doublebutton">{canEdit && <button onClick={() => startEdit(i)}>Edit</button>}</td>
                    <td class="doublebutton">{canDelete && <button onClick={() => removeItem(i._id)}>Delete</button>}</td>
                  </tr>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      )}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8, marginTop: 8 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button disabled={page * pageSize >= items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())).length} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
      <Modal open={openCreate} title="New Resident" onClose={() => setOpenCreate(false)} footer={<>
        <button onClick={() => setOpenCreate(false)}>Cancel</button>
        <button onClick={(e) => onCreate(e)} disabled={!token}>Create</button>
      </>}>
        <form onSubmit={onCreate} style={{  display: 'grid', gap: 8 }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input placeholder="Birth Date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          <input placeholder="Contact Number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
        </form>
      </Modal>
      <Modal open={openEdit} title="Edit Resident" onClose={() => { setOpenEdit(false); setEditingId('') }} footer={<>
        <button onClick={() => { setOpenEdit(false); setEditingId('') }}>Cancel</button>
        <button onClick={saveEdit} disabled={!token}>Save</button>
      </>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
          <input type="date" value={editForm.birthDate} onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })} />
          <input value={editForm.contactNumber} onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}

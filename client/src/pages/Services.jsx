import { useEffect, useState } from 'react'
import { API } from '../api'
import { useAuth } from '../auth'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeleton'

export default function Services() {
  const [items, setItems] = useState([])
  const [serviceType, setServiceType] = useState('')
  const [description, setDescription] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const toast = useToast()
  const { token, user } = useAuth()
  const isAdmin = !!user && user.role === 'admin'
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState({ serviceType: '', description: '' })
  useEffect(() => {
    API.services.list().then((data) => { setItems(data); setLoading(false) })
  }, [])
  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!serviceType.trim()) {
      toast.push('Service type is required', 'error')
      return
    }
    try {
      const item = await API.services.create(token, { serviceType, description })
      setItems([item, ...items])
      setServiceType('')
      setDescription('')
      setOpenCreate(false)
      toast.push('Service created', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const startEdit = (i) => {
    setEditingId(i._id)
    setEditForm({ serviceType: i.serviceType, description: i.description || '' })
    setOpenEdit(true)
  }
  const saveEdit = async () => {
    if (!editForm.serviceType.trim()) {
      toast.push('Service type is required', 'error')
      return
    }
    try {
      const updated = await API.services.update(token, editingId, editForm)
      setItems(items.map((it) => (it._id === editingId ? updated : it)))
      setEditingId('')
      setOpenEdit(false)
      toast.push('Service updated', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const removeItem = async (id) => {
    try {
      await API.services.remove(token, id)
      setItems(items.filter((i) => i._id !== id))
      toast.push('Service deleted', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  return (
    <div style={{ margin: 50 }}>
      <h1 style={{margin:0, padding:0, textAlign:'start'}}>Services</h1>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent:'flex-end',gap: 8 }}>
      <input placeholder="Search by type" value={q} onChange={(e) => setQ(e.target.value)} />{error && <div style={{ color: 'red' }}>{error}</div>}
        <button onClick={() => setOpenCreate(true)} disabled={!isAdmin}>New Service</button>
      </div>
      {loading ? (
        <TableSkeleton rows={6} cols={3} />
      ) : items.filter((i) => i.serviceType.toLowerCase().includes(q.toLowerCase())).length === 0 ? (
        <div style={{ marginTop: 24, padding: 16, border: '1px dashed #e5e7eb', borderRadius: 8, color: '#6b7280' }}>
          No services found. Use "New Service" to add the first record.
        </div>
      ) : (
      <table border="1" cellPadding="8" style={{ marginTop: 12, width: '100%' }}>
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items
            .filter((i) => i.serviceType.toLowerCase().includes(q.toLowerCase()))
            .slice((page - 1) * pageSize, page * pageSize)
            .map((i) => (
              <tr key={i._id}>
                <td>{i.serviceType}</td>
                <td>{i.description}</td>
                {isAdmin && (
                  <td>
                    <div>
                      <tr>
                        <td class="doublebutton">{isAdmin && <button onClick={() => startEdit(i)}>Edit</button>}</td>
                        <td class="doublebutton"> {isAdmin && <button onClick={() => removeItem(i._id)}>Delete</button>}</td>
                      </tr>
                    </div>
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
      )}
      <div style={{ display: 'flex',  flexDirection:'row-reverse' ,gap: 8, marginTop: 8 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button disabled={page * pageSize >= items.filter((i) => i.serviceType.toLowerCase().includes(q.toLowerCase())).length} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
      <Modal open={openCreate} title="New Service" onClose={() => setOpenCreate(false)} footer={<>
        <button onClick={() => setOpenCreate(false)}>Cancel</button>
        <button onClick={(e) => onCreate(e)} disabled={!token}>Create</button>
      </>}>
        <form onSubmit={onCreate} style={{ display: 'grid', gap: 8 }}>
          <input placeholder="Service Type" value={serviceType} onChange={(e) => setServiceType(e.target.value)} />
          <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </form>
      </Modal>
      <Modal open={openEdit} title="Edit Service" onClose={() => { setOpenEdit(false); setEditingId('') }} footer={<>
        <button onClick={() => { setOpenEdit(false); setEditingId('') }}>Cancel</button>
        <button onClick={saveEdit} disabled={!token}>Save</button>
      </>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <input value={editForm.serviceType} onChange={(e) => setEditForm({ ...editForm, serviceType: e.target.value })} />
          <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}

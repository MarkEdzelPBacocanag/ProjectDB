import { useEffect, useState } from 'react'
import { API } from '../api'
import { useAuth } from '../auth'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeleton'

export default function Requests() {
  const [items, setItems] = useState([])
  const [residents, setResidents] = useState([])
  const [services, setServices] = useState([])
  const [residentId, setResidentId] = useState('')
  const [serviceIds, setServiceIds] = useState([])
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { token, user } = useAuth()
  const canEdit = !!user && (user.role === 'admin' || user.role === 'staff')
  const isAdmin = !!user && user.role === 'admin'
  const [editingId, setEditingId] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const toast = useToast()
  const STATUS_OPTIONS = ['approve', 'complete', 'cancel', 'reject']
  useEffect(() => {
    Promise.all([API.requests.list(), API.residents.list(), API.services.list()])
      .then(([rq, r, s]) => { setItems(rq); setResidents(r); setServices(s); setLoading(false) })
  }, [])
  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!residentId || serviceIds.length === 0) {
      toast.push('Select resident and at least one service', 'error')
      return
    }
    if (!residents.some((r) => r._id === residentId)) {
      toast.push('Resident not found', 'error')
      return
    }
    try {
      const created = await API.requests.create(token, { residentId, serviceIds })
      setItems([created, ...items])
      setResidentId('')
      setServiceIds([])
      setOpenCreate(false)
      toast.push('Request created', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const startEdit = (i) => {
    setEditingId(i._id)
    setEditStatus(i.status)
    setOpenEdit(true)
  }
  const saveEdit = async () => {
    if (!editStatus.trim()) {
      toast.push('Status is required', 'error')
      return
    }
    try {
      const updated = await API.requests.update(token, editingId, { status: editStatus })
      setItems(items.map((it) => (it._id === editingId ? updated : it)))
      setEditingId('')
      setOpenEdit(false)
      toast.push('Request updated', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const removeItem = async (id) => {
    try {
      await API.requests.remove(token, id)
      setItems(items.filter((i) => i._id !== id))
      toast.push('Request deleted', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const badgeClass = (val) => {
    const v = (val || '').toLowerCase()
    if (v.includes('pending')) return 'badge gray'
    if (v.includes('approve') || v.includes('complete')) return 'badge green'
    if (v.includes('cancel') || v.includes('reject')) return 'badge red'
    return 'badge yellow'
  }
  return (
    <div style={{ margin: 50 }}>
      <h2>Requests</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setOpenCreate(true)} disabled={!token}>New Request</button>
      </div>
      <input placeholder="Search by resident/service" value={q} onChange={(e) => setQ(e.target.value)} />
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : items.filter((i) => {
          const r = (i.resident?.name || '').toLowerCase()
          const s1 = (i.service?.serviceType || '').toLowerCase()
          const s2 = Array.isArray(i.services) ? i.services.map((x) => (x?.serviceType || '').toLowerCase()).join(' ') : ''
          const qq = q.toLowerCase()
          return r.includes(qq) || s1.includes(qq) || s2.includes(qq)
        }).length === 0 ? (
        <div style={{ marginTop: 24, padding: 16, border: '1px dashed #e5e7eb', borderRadius: 8, color: '#6b7280' }}>
          No requests found. Use "New Request" to add the first record.
        </div>
      ) : (
      <table border="1" cellPadding="8" style={{ marginTop: 12, width: '100%' }}>
        <thead>
          <tr>
            <th>Resident</th>
            <th>Service</th>
            <th>Date Requested</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items
            .filter((i) => {
              const r = (i.resident?.name || '').toLowerCase()
              const s1 = (i.service?.serviceType || '').toLowerCase()
              const s2 = Array.isArray(i.services) ? i.services.map((x) => (x?.serviceType || '').toLowerCase()).join(' ') : ''
              const qq = q.toLowerCase()
              return r.includes(qq) || s1.includes(qq) || s2.includes(qq)
            })
            .slice((page - 1) * pageSize, page * pageSize)
            .map((i) => (
              <tr key={i._id}>
                <td>{i.resident?.name}</td>
                <td>{Array.isArray(i.services) && i.services.length > 0 ? i.services.map((s) => s.serviceType).join(', ') : i.service?.serviceType}</td>
                <td>{new Date(i.dateRequested).toLocaleString()}</td>
                <td><span className={badgeClass(i.status)}>{i.status}</span></td>
                <td>
                  <tr>
                    <td class="doublebutton">{canEdit && <button onClick={()=> startEdit(i)}>Edit</button>}</td>
                    <td class="doublebutton">{isAdmin && <button onClick={()=> removeItem(i._id)}>Delete</button>}</td>
                  </tr>
                  </td>
              </tr>
            ))}
        </tbody>
      </table>
      )}
      <div style={{ display: 'flex', flexDirection: 'row-reverse',gap: 8, marginTop: 8 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button disabled={page * pageSize >= items.filter((i) => {
          const r = (i.resident?.name || '').toLowerCase()
          const s = (i.service?.serviceType || '').toLowerCase()
          const qq = q.toLowerCase()
          return r.includes(qq) || s.includes(qq)
        }).length} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
      <Modal open={openCreate} title="New Request" onClose={() => setOpenCreate(false)} footer={<>
        <button onClick={() => setOpenCreate(false)}>Cancel</button>
        <button onClick={(e) => onCreate(e)} disabled={!token || !residentId || serviceIds.length === 0}>Create</button>
      </>}>
        <form onSubmit={onCreate} style={{ display: 'grid', gap: 8 }}>
          <select value={residentId} onChange={(e) => setResidentId(e.target.value)}>
            <option value="">Select Resident</option>
            {residents.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
          <div style={{ display: 'grid', gap: 6 }}>
            {services.map((s) => (
              <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={serviceIds.includes(s._id)} onChange={(e) => {
                  const checked = e.target.checked
                  setServiceIds((prev) => checked ? [...prev, s._id] : prev.filter((id) => id !== s._id))
                }} />
                <span>{s.serviceType}</span>
              </label>
            ))}
          </div>
          
        </form>
      </Modal>
      <Modal open={openEdit} title="Edit Request" onClose={() => { setOpenEdit(false); setEditingId('') }} footer={<>
        <button onClick={() => { setOpenEdit(false); setEditingId('') }}>Cancel</button>
        <button onClick={saveEdit} disabled={!token}>Save</button>
      </>}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={editStatus === opt} onChange={() => setEditStatus(opt)} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { API } from '../api'
import { useAuth } from '../auth'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/Skeleton'

export default function Assignments() {
  const [items, setItems] = useState([])
  const [requests, setRequests] = useState([])
  const [staff, setStaff] = useState([])
  const [requestId, setRequestId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [dateAssigned, setDateAssigned] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { token, user } = useAuth()
  const isAdmin = !!user && user.role === 'admin'
  const [openCreate, setOpenCreate] = useState(false)
  const toast = useToast()
  useEffect(() => {
    Promise.all([API.assignments.list(), API.requests.list(), API.staff.list()])
      .then(([a, rq, st]) => { setItems(a); setRequests(rq); setStaff(st); setLoading(false) })
  }, [])
  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!requestId || !staffId) {
      toast.push('Select request and staff', 'error')
      return
    }
    try {
      const item = await API.assignments.create(token, { requestId, staffId, dateAssigned })
      setItems([item, ...items])
      setRequestId('')
      setStaffId('')
      setDateAssigned('')
      setOpenCreate(false)
      toast.push('Assignment created', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  const removeItem = async (id) => {
    try {
      await API.assignments.remove(token, id)
      setItems(items.filter((i) => i._id !== id))
      toast.push('Assignment deleted', 'success')
    } catch (e) {
      setError(e.message)
      toast.push(e.message, 'error')
    }
  }
  return (
    <div style={{ margin: 50}}>
      <h2>Assignments</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ marginBottom: 8 }}>
        {isAdmin && <button onClick={() => setOpenCreate(true)} disabled={!token}>New Assignment</button>}
      </div>
      <input placeholder="Search by resident/service/staff" value={q} onChange={(e) => setQ(e.target.value)} />
      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : items.filter((i) => {
          const r = (i.request?.resident?.name || '').toLowerCase()
          const s = (i.request?.service?.serviceType || '').toLowerCase()
          const st = (i.staff?.name || '').toLowerCase()
          const qq = q.toLowerCase()
          return r.includes(qq) || s.includes(qq) || st.includes(qq)
        }).length === 0 ? (
        <div style={{ marginTop: 24, padding: 16, border: '1px dashed #e5e7eb', borderRadius: 8, color: '#6b7280' }}>
          No assignments found. Use "New Assignment" to add the first record.
        </div>
      ) : (
      <table border="1" cellPadding="8" style={{ marginTop: 12, width: '100%' }}>
        <thead>
          <tr>
            <th>Resident</th>
            <th>Staff</th>
            <th>Date Assigned</th>
            <th>{isAdmin && 'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {items
            .filter((i) => {
              const r = (i.request?.resident?.name || '').toLowerCase()
              const s = (i.request?.service?.serviceType || '').toLowerCase()
              const st = (i.staff?.name || '').toLowerCase()
              const qq = q.toLowerCase()
              return r.includes(qq) || s.includes(qq) || st.includes(qq)
            })
            .slice((page - 1) * pageSize, page * pageSize)
            .map((i) => (
              <tr key={i._id}>
                <td>{i.request?.resident?.name}</td>
                <td>{i.staff?.name}</td>
                <td>{new Date(i.dateAssigned).toLocaleDateString()}</td>
                <td>{isAdmin && <button onClick={() => removeItem(i._id)}>{isAdmin && 'Delete'}</button>}</td>
              </tr>
            ))}
        </tbody>
      </table>
      )}
      <div style={{ display: 'flex', flexDirection:'row-reverse' ,gap: 8, marginTop: 8 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button disabled={page * pageSize >= items.filter((i) => {
          const r = (i.request?.resident?.name || '').toLowerCase()
          const s = (i.request?.service?.serviceType || '').toLowerCase()
          const st = (i.staff?.name || '').toLowerCase()
          const qq = q.toLowerCase()
          return r.includes(qq) || s.includes(qq) || st.includes(qq)
        }).length} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
      <Modal open={openCreate} title="New Assignment" onClose={() => setOpenCreate(false)} footer={<>
        <button onClick={() => setOpenCreate(false)}>Cancel</button>
        <button onClick={(e) => onCreate(e)} disabled={!token || !requestId || !staffId}>Create</button>
      </>}>
        <form onSubmit={onCreate} style={{ display: 'grid', gap: 8 }}>
          <select value={requestId} onChange={(e) => setRequestId(e.target.value)}>
            <option value="">Select Request</option>
            {requests.map((r) => (
              <option key={r._id} value={r._id}>{r.resident?.name} • {r.service?.serviceType}</option>
            ))}
          </select>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            <option value="">Select Staff</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>{s.name} • {s.role}</option>
            ))}
          </select>
          <input placeholder="Date Assigned" type="date" value={dateAssigned} onChange={(e) => setDateAssigned(e.target.value)} />
        </form>
      </Modal>
    </div>
  )
}

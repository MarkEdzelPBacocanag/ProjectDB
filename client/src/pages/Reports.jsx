import { useEffect, useMemo, useState } from 'react'
import { API } from '../api'
import { useAuth } from '../auth'
import { TableSkeleton } from '../components/Skeleton'

export default function Reports() {
  const { user } = useAuth()
  const isAdmin = !!user && user.role === 'admin'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  useEffect(() => {
    setLoading(true)
    API.requests.list().then((data) => { setItems(data); setLoading(false) })
  }, [])
  const filtered = useMemo(() => {
    const qq = q.toLowerCase()
    const ss = status.toLowerCase()
    return items.filter((i) => {
      const r = (i.resident?.name || '').toLowerCase()
      const s1 = (i.service?.serviceType || '').toLowerCase()
      const s2 = Array.isArray(i.services) ? i.services.map((x) => (x?.serviceType || '').toLowerCase()).join(' ') : ''
      const st = (i.status || '').toLowerCase()
      const matchText = r.includes(qq) || s1.includes(qq) || s2.includes(qq)
      const matchStatus = ss ? st.includes(ss) : true
      return matchText && matchStatus
    })
  }, [items, q, status])
  const exportCSV = () => {
    const rows = [['Resident', 'Services', 'Status', 'Date Requested']]
    filtered.forEach((i) => {
      const services = Array.isArray(i.services) && i.services.length > 0 ? i.services.map((s) => s.serviceType).join('; ') : (i.service?.serviceType || '')
      rows.push([i.resident?.name || '', services, i.status || '', new Date(i.dateRequested).toLocaleString()])
    })
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'requests_report.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  return (
    <div style={{ margin: 25 }}>
      <h2>Reports</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input placeholder="Search by resident/service" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approve">Approved</option>
          <option value="complete">Complete</option>
          <option value="reject">Rejected</option>
        </select>
        {isAdmin && <button onClick={exportCSV} disabled={loading || filtered.length === 0}>Export CSV</button>}
      </div>
      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <div style={{ marginTop: 24, padding: 16, border: '1px dashed #e5e7eb', borderRadius: 8, color: '#6b7280' }}>
          No report data found.
        </div>
      ) : (
      <table border="1" cellPadding="8" style={{ marginTop: 12, width: '100%' }}>
        <thead>
          <tr>
            <th>Resident</th>
            <th>Service(s)</th>
            <th>Status</th>
            <th>Date Requested</th>
          </tr>
        </thead>
        <tbody>
          {filtered
            .slice((page - 1) * pageSize, page * pageSize)
            .map((i) => (
              <tr key={i._id}>
                <td>{i.resident?.name}</td>
                <td>{Array.isArray(i.services) && i.services.length > 0 ? i.services.map((s) => s.serviceType).join(', ') : i.service?.serviceType}</td>
                <td>{i.status}</td>
                <td>{new Date(i.dateRequested).toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>
      )}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8, marginTop: 8 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button disabled={page * pageSize >= filtered.length} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  )
}

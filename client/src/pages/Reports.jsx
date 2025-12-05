import { useEffect, useMemo, useState } from 'react'
import { API } from '../api'
import { useAuth } from '../auth'
import { TableSkeleton } from '../components/Skeleton'
import Modal from '../components/Modal'

export default function Reports() {
  const { user } = useAuth()
  const isAdmin = !!user && user.role === 'admin'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [openFilters, setOpenFilters] = useState(false)
  
  const [selectedStatuses, setSelectedStatuses] = useState(['pending', 'in_progress', 'completed'])
  const [appliedStatuses, setAppliedStatuses] = useState(['pending', 'in_progress', 'completed'])
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10
  useEffect(() => {
    API.requests.list().then((data) => { setItems(data); setLoading(false) })
  }, [])
  const filtered = useMemo(() => {
    const qq = q.toLowerCase()
    return items.filter((i) => {
      const r = (i.resident?.name || '').toLowerCase()
      const s1 = (i.service?.serviceType || '').toLowerCase()
      const s2 = Array.isArray(i.services) ? i.services.map((x) => (x?.serviceType || '').toLowerCase()).join(' ') : ''
      const st = (i.status || '').toLowerCase()
      const dStr = new Date(i.dateRequested).toLocaleDateString().toLowerCase()
      const matchText = qq ? (r.includes(qq) || s1.includes(qq) || s2.includes(qq) || st.includes(qq) || dStr.includes(qq)) : true
      const matchStatus = appliedStatuses.length > 0 ? appliedStatuses.includes(st) : true
      const dt = new Date(i.dateRequested)
      const fromStart = appliedFromDate ? new Date(appliedFromDate) : null
      const toEnd = appliedToDate ? new Date(appliedToDate) : null
      if (toEnd) toEnd.setHours(23, 59, 59, 999)
      const matchFrom = fromStart ? dt >= fromStart : true
      const matchTo = toEnd ? dt <= toEnd : true
      return matchText && matchStatus && matchFrom && matchTo
    })
  }, [items, q, appliedFromDate, appliedToDate, appliedStatuses])
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
    <div style={{ margin: 50 }}>
      <h1 style={{margin:0, padding:0, textAlign:'start'}}>Reports</h1>
      <div style={{ display: 'flex', flexDirection:'row', justifyContent:'end',gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <input placeholder="Search by resident/service/status/date" value={q} onChange={(e) => setQ(e.target.value)} />
        <button onClick={() => { 
          setSelectedStatuses(appliedStatuses);
          setFromDate(appliedFromDate);
          setToDate(appliedToDate);
          setOpenFilters(true);
        }}>Filters</button>
        {isAdmin && <button onClick={exportCSV} disabled={loading || filtered.length === 0}>Export CSV</button>}
      </div>
      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <div style={{ marginTop: 24, padding: 16, border: '1px dashed #e5e7eb', borderRadius: 8, color: '#6b7280' }}>
          No report data found.
        </div>
      ) : (
      <div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <span>Total Requests: {filtered.length}</span>
          <span>Completed (All): {items.filter((i) => i.status === 'completed').length}</span>
        </div>
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
      </div>
      )}
      <Modal
        open={openFilters}
        title="Filters"
        onClose={() => setOpenFilters(false)}
        footer={<>
          <button onClick={() => setOpenFilters(false)}>Cancel</button>
          <button onClick={() => { 
            setAppliedStatuses(selectedStatuses);
            setAppliedFromDate(fromDate);
            setAppliedToDate(toDate);
            setPage(1);
            setOpenFilters(false);
          }}>Apply</button>
        </>}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Status</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {['pending', 'in_progress', 'completed'].map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(opt)}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setSelectedStatuses((prev) => {
                        if (checked) return [...prev, opt]
                        return prev.filter((s) => s !== opt)
                      })
                    }}
                  />
                  <span>{opt === 'in_progress' ? 'In Progress' : opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                </label>
              ))}
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>From Date</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>To Date</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
        </div>
      </Modal>
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8, marginTop: 8 }}>
        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button disabled={page * pageSize >= filtered.length} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  )
}

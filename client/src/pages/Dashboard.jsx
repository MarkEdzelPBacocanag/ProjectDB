import { useEffect, useState } from 'react'
import { API } from '../api'
import { SkeletonLine } from '../components/Skeleton'

export default function Dashboard() {
  const [counts, setCounts] = useState({ residents: 0, services: 0, requests: 0, assignments: 0, staff: 0 })
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  useEffect(() => {
    Promise.all([
      API.residents.list(),
      API.services.list(),
      API.requests.list(),
      API.assignments.list(),
      API.staff.list(),
    ]).then(([r, s, rq, a, st]) => { setCounts({ residents: r.length, services: s.length, requests: rq.length, assignments: a.length, staff: st.length }); setRequests(rq); setLoading(false) })
  }, [])
  return (
    <div  style={{ margin: 50 }}>
      <div className="grid">
        <div className="card stat">
          <div className="card-title">Residents</div>
          <div className="stat-value">{loading ? <SkeletonLine height={28} width={60} /> : counts.residents}</div>
        </div>
        <div className="card stat">
          <div className="card-title">Services</div>
          <div className="stat-value">{loading ? <SkeletonLine height={28} width={60} /> : counts.services}</div>
        </div>
        <div className="card stat">
          <div className="card-title">Requests</div>
          <div className="stat-value">{loading ? <SkeletonLine height={28} width={60} /> : counts.requests}</div>
        </div>
        <div className="card stat">
          <div className="card-title">Assignments</div>
          <div className="stat-value">{loading ? <SkeletonLine height={28} width={60} /> : counts.assignments}</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">Active Requests</div>
        {loading ? (
          <SkeletonLine height={20} width={160} />
        ) : (
          <table border="1" cellPadding="8" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Resident</th>
                <th>Service(s)</th>
                <th>Date Requested</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests
                .filter((i) => {
                  const v = (i.status || '').toLowerCase()
                  return v.includes('pending') || v.includes('approve') || v.includes('in-progress')
                })
                .slice(0, 8)
                .map((i) => (
                  <tr key={i._id}>
                    <td>{i.resident?.name}</td>
                    <td>{Array.isArray(i.services) && i.services.length > 0 ? i.services.map((s) => s.serviceType).join(', ') : i.service?.serviceType}</td>
                    <td>{new Date(i.dateRequested).toLocaleString()}</td>
                    <td><span className="badge gray">{i.status}</span></td>
                  </tr>
                ))}
              {requests.filter((i) => {
                const v = (i.status || '').toLowerCase()
                return v.includes('pending') || v.includes('approve') || v.includes('in-progress')
              }).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: '#6b7280' }}>No active requests</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import api, { errMsg, roleLabel } from '../api'
import { Badge, Notice, btn, input } from '../components/ui'

const ROLE_OPTIONS = ['FACULTY', 'COURSE_COORDINATOR', 'ADMIN']

export default function Users() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ employeeId: '', fullName: '', email: '', password: '', role: 'FACULTY', department: '' })
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/users').then(({ data }) => setUsers(data.users)).catch((e) => setError(errMsg(e)))
  useEffect(() => { load() }, [])
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/users', { ...form, department: form.department || undefined })
      setForm({ ...form, employeeId: '', fullName: '', email: '', password: '' })
      await load()
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const act = (fn) => async () => {
    setError('')
    try { await fn(); await load() } catch (err) { setError(errMsg(err)) }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-white">Users</h1>
      <Notice>{error}</Notice>

      <form onSubmit={create} className="glass rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className={input} placeholder="Employee ID" value={form.employeeId} onChange={set('employeeId')} required />
        <input className={input} placeholder="Full name" value={form.fullName} onChange={set('fullName')} required />
        <input className={input} type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
        <input className={input} type="password" placeholder="Temporary password (min 8)" value={form.password} onChange={set('password')} minLength={8} required />
        <select className={input} value={form.role} onChange={set('role')}>{ROLE_OPTIONS.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}</select>
        <input className={input} placeholder="Department (optional)" value={form.department} onChange={set('department')} />
        <div className="md:col-span-3 flex justify-end"><button className={btn.primary} disabled={saving}>{saving ? 'Creating...' : 'Create user'}</button></div>
      </form>

      <div className="glass rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-400 text-left"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="p-3 text-white">{u.fullName}<div className="text-xs text-gray-500">{u.employeeId}</div></td>
                <td className="p-3 text-gray-300">{u.email}</td>
                <td className="p-3">
                  <select className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm" value={u.role || ''} onChange={(e) => act(() => api.patch(`/users/${u.id}/role`, { role: e.target.value }))()}>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
                  </select>
                </td>
                <td className="p-3"><Badge value={u.isActive ? 'SUBMITTED' : 'LOCKED'} label={u.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                <td className="p-3 text-right">
                  <button className={u.isActive ? btn.danger : btn.ghost} onClick={act(() => api.patch(`/users/${u.id}/active`, { isActive: !u.isActive }))}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

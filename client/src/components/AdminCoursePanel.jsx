import { useEffect, useState } from 'react'
import api, { errMsg } from '../api'
import { Notice, btn, input } from './ui'

const ASSIGNMENT_ROLES = ['PRIMARY_INSTRUCTOR', 'CO_INSTRUCTOR', 'LAB_INSTRUCTOR']

// Administrator: sections, faculty assignment, coordinator (FR-ADM-05..08) and institution text.
export default function AdminCoursePanel({ course, onChanged }) {
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [assign, setAssign] = useState({ sectionId: '', facultyId: '', assignmentRole: 'PRIMARY_INSTRUCTOR' })
  const [coordinatorId, setCoordinatorId] = useState(course.coordinator?.id ?? '')
  const [inst, setInst] = useState({ vision: '', mission: '', peos: '', posPsos: '' })

  useEffect(() => { api.get('/courses/meta').then(({ data }) => setMeta(data)).catch((e) => setError(errMsg(e))) }, [])

  const run = (fn, ok) => async (e) => {
    e?.preventDefault()
    setError(''); setInfo('')
    try { await fn(); setInfo(ok); onChanged() } catch (err) { setError(errMsg(err)) }
  }

  if (!meta) return <Notice>{error}</Notice>

  return (
    <div className="space-y-6">
      <Notice>{error}</Notice>
      <Notice kind="ok">{info}</Notice>

      <div className="glass rounded-xl p-5">
        <div className="text-white font-semibold mb-3">Sections and faculty</div>
        {course.sections.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3 mb-2 rounded bg-white/5 text-sm">
            <span className="text-white">Section {s.name}</span>
            <span className="text-gray-300">{s.faculty.map((f) => `${f.fullName} (${f.role.replace('_', ' ').toLowerCase()})`).join(', ') || 'no faculty assigned'}</span>
          </div>
        ))}
        <form className="flex gap-2 mt-3" onSubmit={run(() => api.post(`/courses/${course.id}/sections`, { name: sectionName }).then(() => setSectionName('')), 'Section added.')}>
          <input className={input} placeholder="New section name (e.g. C)" value={sectionName} onChange={(e) => setSectionName(e.target.value)} required />
          <button className={btn.primary}>Add section</button>
        </form>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3" onSubmit={run(() => api.post(`/courses/${course.id}/faculty`, { sectionId: Number(assign.sectionId), facultyId: Number(assign.facultyId), assignmentRole: assign.assignmentRole }), 'Faculty assigned.')}>
          <select className={input} value={assign.sectionId} onChange={(e) => setAssign({ ...assign, sectionId: e.target.value })} required>
            <option value="">Section...</option>{course.sections.map((s) => <option key={s.id} value={s.id}>Section {s.name}</option>)}
          </select>
          <select className={input} value={assign.facultyId} onChange={(e) => setAssign({ ...assign, facultyId: e.target.value })} required>
            <option value="">Faculty...</option>{meta.faculty.map((f) => <option key={f.id} value={f.id}>{f.fullName}</option>)}
          </select>
          <select className={input} value={assign.assignmentRole} onChange={(e) => setAssign({ ...assign, assignmentRole: e.target.value })}>
            {ASSIGNMENT_ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ').toLowerCase()}</option>)}
          </select>
          <button className={btn.primary}>Assign</button>
        </form>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="text-white font-semibold mb-3">Course Coordinator</div>
        <form className="flex gap-2" onSubmit={run(() => api.put(`/courses/${course.id}/coordinator`, { userId: Number(coordinatorId) }), 'Coordinator updated.')}>
          <select className={input} value={coordinatorId} onChange={(e) => setCoordinatorId(e.target.value)}>
            {meta.coordinators.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select>
          <button className={btn.primary}>Save</button>
        </form>
      </div>

      <div className="glass rounded-xl p-5">
        <div className="text-white font-semibold mb-1">Institution text</div>
        <p className="text-xs text-gray-500 mb-3">University vision/mission and programme outcomes used in the final Course File. Leave a field blank to keep it as is.</p>
        <form className="space-y-2" onSubmit={run(() => api.put(`/courses/${course.id}/institution`, Object.fromEntries(Object.entries(inst).filter(([, v]) => v.trim()))), 'Institution text saved.')}>
          {[['vision', 'Vision'], ['mission', 'Mission'], ['peos', 'Programme educational objectives'], ['posPsos', 'Programme outcomes / PSOs']].map(([k, label]) => (
            <textarea key={k} className={input} rows={2} placeholder={label} value={inst[k]} onChange={(e) => setInst({ ...inst, [k]: e.target.value })} />
          ))}
          <div className="flex justify-end"><button className={btn.primary}>Save</button></div>
        </form>
      </div>
    </div>
  )
}

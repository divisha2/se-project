import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Users, Calendar } from 'lucide-react'
import api, { errMsg, ROLES } from '../api'
import { Badge, Modal, Notice, btn, input } from '../components/ui'

function NewCourseModal({ onClose, onCreated }) {
  const [meta, setMeta] = useState(null)
  const [form, setForm] = useState({ programId: '', code: '', title: '', credits: 3, description: '', coordinatorId: '', semesterId: '', sections: 'A, B' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/courses/meta').then(({ data }) => {
      setMeta(data)
      setForm((f) => ({ ...f, programId: data.programs[0]?.id ?? '', semesterId: data.semesters.find((s) => s.isCurrent)?.id ?? '', coordinatorId: data.coordinators[0]?.id ?? '' }))
    }).catch((e) => setError(errMsg(e)))
  }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/courses', {
        ...form,
        credits: Number(form.credits),
        sections: form.sections.split(',').map((s) => s.trim()).filter(Boolean),
        semesterId: form.semesterId || undefined,
      })
      onCreated()
    } catch (err) {
      setError(errMsg(err))
      setSaving(false)
    }
  }

  return (
    <Modal title="New course" onClose={onClose}>
      {!meta ? <p className="text-gray-400">Loading...</p> : (
        <form onSubmit={submit} className="space-y-3">
          <Notice>{error}</Notice>
          <div className="grid grid-cols-2 gap-3">
            <input className={input} placeholder="Code (e.g. CSE304)" value={form.code} onChange={set('code')} required />
            <input className={input} type="number" step="0.5" placeholder="Credits" value={form.credits} onChange={set('credits')} />
          </div>
          <input className={input} placeholder="Title" value={form.title} onChange={set('title')} required />
          <textarea className={input} rows={2} placeholder="Description" value={form.description} onChange={set('description')} />
          <select className={input} value={form.programId} onChange={set('programId')}>{meta.programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className={input} value={form.semesterId} onChange={set('semesterId')}>{meta.semesters.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (current)' : ''}</option>)}</select>
          <select className={input} value={form.coordinatorId} onChange={set('coordinatorId')} required>
            {meta.coordinators.map((c) => <option key={c.id} value={c.id}>Coordinator: {c.fullName}</option>)}
          </select>
          <input className={input} placeholder="Sections, comma separated" value={form.sections} onChange={set('sections')} />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={btn.ghost} onClick={onClose}>Cancel</button>
            <button className={btn.primary} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default function Courses({ user }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNew, setShowNew] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/courses')
      .then(({ data }) => setCourses(data.courses || []))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) return <div className="text-center text-gray-400">Loading courses...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{user.role === ROLES.ADMIN ? 'Courses' : 'My Courses'}</h1>
          <p className="text-gray-400">Open a course to work on its Course File</p>
        </div>
        {user.role === ROLES.ADMIN && (
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium">
            <Plus size={20} /> New Course
          </button>
        )}
      </div>

      <Notice>{error}</Notice>

      {courses.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">No courses yet</h3>
          <p className="text-gray-400">{user.role === ROLES.ADMIN ? 'Create the first course.' : 'You have not been assigned to a course.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="glass rounded-xl p-6 hover:border-white/20 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center"><BookOpen className="text-white" size={24} /></div>
                <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">{c.code}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">{c.title}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{c.description || 'No description'}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Users size={14} />{c.facultyCount} faculty</span>
                <span className="flex items-center gap-1"><Calendar size={14} />{c.semester}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge value={c.courseFileStatus} />
                <span className="text-xs text-gray-400">Coordinator: {c.coordinator?.fullName}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNew && <NewCourseModal onClose={() => setShowNew(false)} onCreated={() => { setShowNew(false); load() }} />}
    </div>
  )
}

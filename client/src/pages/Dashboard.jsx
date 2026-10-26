import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FileText, Users, CheckCircle } from 'lucide-react'
import api, { errMsg, ROLES, roleLabel } from '../api'
import { Badge, Notice } from '../components/ui'

export default function Dashboard({ user }) {
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/courses')
      .then(({ data }) => setCourses(data.courses || []))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [])

  const sectionCount = courses.reduce((n, c) => n + c.sections.length, 0)
  const facultyCount = courses.reduce((n, c) => n + c.facultyCount, 0)
  const readyCount = courses.filter((c) => c.courseFileStatus === 'SUBMITTED_FOR_REVIEW' || c.courseFileStatus === 'APPROVED').length

  const cards = [
    { icon: BookOpen, label: user.role === ROLES.FACULTY ? 'My Courses' : user.role === ROLES.COORDINATOR ? 'Courses I Coordinate' : 'Courses', value: courses.length, bg: 'bg-orange-600' },
    { icon: FileText, label: user.role === ROLES.FACULTY ? 'My Sections' : 'Sections', value: sectionCount, bg: 'bg-blue-600' },
    { icon: Users, label: 'Faculty Assigned', value: facultyCount, bg: 'bg-purple-600' },
    { icon: CheckCircle, label: 'Course Files Submitted', value: readyCount, bg: 'bg-green-600' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Welcome back, <span className="text-blue-400">{user.fullName}</span>
        </h1>
        <p className="text-gray-400">{roleLabel(user.role)}</p>
      </div>

      <Notice>{error}</Notice>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="glass rounded-xl p-6">
              <div className={`w-12 h-12 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
                <Icon className="text-white" size={24} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{loading ? '-' : c.value}</div>
              <div className="text-sm text-gray-400">{c.label}</div>
            </div>
          )
        })}
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-white">Your courses</h2>
        {courses.length === 0 && !loading && <p className="text-gray-400 text-sm">Nothing assigned yet.</p>}
        <div className="space-y-2">
          {courses.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10">
              <div>
                <div className="text-white font-medium">{c.code} - {c.title}</div>
                <div className="text-xs text-gray-400">{c.semester} - {c.sections.length} section(s)</div>
              </div>
              <Badge value={c.courseFileStatus} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

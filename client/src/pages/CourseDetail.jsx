import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api, { errMsg, ROLES } from '../api'
import { Badge, Notice } from '../components/ui'
import FacultyWorkspace from '../components/FacultyWorkspace'
import CoordinatorWorkspace from '../components/CoordinatorWorkspace'
import AdminCoursePanel from '../components/AdminCoursePanel'

export default function CourseDetail({ user }) {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [error, setError] = useState('')

  const load = () => api.get(`/courses/${id}`).then(({ data }) => setCourse(data.course)).catch((e) => setError(errMsg(e)))
  useEffect(() => { load() }, [id])

  if (error) return <Notice>{error}</Notice>
  if (!course) return <div className="text-center text-gray-400">Loading course...</div>

  return (
    <div>
      <Link to="/courses" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"><ArrowLeft size={20} /> Back to Courses</Link>

      <div className="glass rounded-xl p-8 mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="text-3xl font-bold text-white">{course.title}</h1>
          <span className="px-3 py-1 rounded-full text-sm bg-orange-500/20 text-orange-400 border border-orange-500/30">{course.code}</span>
          <Badge value={course.courseFileStatus} />
        </div>
        <p className="text-gray-400">{course.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-sm">
          <div><div className="text-gray-400 mb-1">Coordinator</div><div className="text-white font-medium">{course.coordinator?.fullName || 'Not assigned'}</div></div>
          <div><div className="text-gray-400 mb-1">Faculty</div><div className="text-white font-medium">{course.facultyCount}</div></div>
          <div><div className="text-gray-400 mb-1">Sections</div><div className="text-white font-medium">{course.sections.map((s) => s.name).join(', ') || '-'}</div></div>
          <div><div className="text-gray-400 mb-1">Semester</div><div className="text-white font-medium">{course.semester}</div></div>
        </div>
      </div>

      {user.role === ROLES.FACULTY && <FacultyWorkspace courseId={id} />}
      {user.role === ROLES.COORDINATOR && <CoordinatorWorkspace courseId={id} />}
      {user.role === ROLES.ADMIN && <AdminCoursePanel course={course} onChanged={load} />}
    </div>
  )
}

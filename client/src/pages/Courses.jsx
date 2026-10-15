import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { BookOpen, Plus, Users, Calendar } from 'lucide-react'

export default function Courses({ user }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCourses(data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400">Loading courses...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Courses</h1>
          <p className="text-gray-400">Manage and access your course materials</p>
        </div>
        {user.role === 'admin' && (
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all">
            <Plus size={20} />
            New Course
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <BookOpen className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">No courses yet</h3>
          <p className="text-gray-400">Start by creating your first course</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Link 
              key={course._id} 
              to={`/courses/${course._id}`}
              className="glass rounded-xl p-6 hover:border-white/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                  <BookOpen className="text-white" size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {course.code}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                {course.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description || 'No description'}</p>
              
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{course.faculty?.length || 0} faculty</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{course.semester} {course.year}</span>
                </div>
              </div>
              <div className="mt-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  course.status === 'finalized' ? 'bg-green-500/20 text-green-400' :
                  course.status === 'collecting' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {course.status?.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Upload, FileText, Download, Calendar, User, CheckCircle, XCircle, Clock, Lock } from 'lucide-react'

export default function CourseDetail({ user }) {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourseDetails()
    fetchFiles()
  }, [id])

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get(`/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCourse(data)
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await axios.get(`/api/files/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFiles(data)
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  if (loading || !course) {
    return <div className="text-center text-gray-400">Loading course...</div>
  }

  return (
    <div>
      <Link to="/courses" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={20} />
        Back to Courses
      </Link>

      <div className="glass rounded-xl p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{course.name}</h1>
              <span className="px-3 py-1 rounded-full text-sm bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {course.code}
              </span>
            </div>
            <p className="text-gray-400">{course.description}</p>
          </div>
          {user.role === 'faculty' && (
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-all">
              <Upload size={20} />
              Upload Document
            </button>
          )}
          {user.role === 'coordinator' && (
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-600/40 rounded-lg text-blue-400 font-medium hover:bg-blue-600/30 transition-all">
                <CheckCircle size={18} />
                Check Completeness
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-600/40 rounded-lg text-green-400 font-medium hover:bg-green-600/30 transition-all">
                Generate Final File
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-gray-400 text-sm mb-1">Coordinator</div>
            <div className="text-white font-medium">{course.coordinator?.name || 'Not assigned'}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Faculty Members</div>
            <div className="text-white font-medium">{course.faculty?.length || 0}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Status</div>
            <div className="text-white font-medium capitalize">{course.status?.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Semester</div>
            <div className="text-white font-medium">{course.semester} {course.year}</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Course Files</h2>
        
        {files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-400">No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map(file => {
              const getStatusIcon = () => {
                switch(file.status) {
                  case 'valid': return <CheckCircle className="text-green-400" size={16} />;
                  case 'invalid': return <XCircle className="text-red-400" size={16} />;
                  case 'under_validation': return <Clock className="text-yellow-400" size={16} />;
                  case 'locked': return <Lock className="text-gray-400" size={16} />;
                  default: return null;
                }
              };
              
              return (
                <div key={file._id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                      <FileText className="text-white" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{file.originalName}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {file.uploadedBy?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {file.category}
                        </span>
                        {file.section && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                            Section {file.section}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon()}
                      <span className={`text-xs ${
                        file.status === 'valid' ? 'text-green-400' :
                        file.status === 'invalid' ? 'text-red-400' :
                        file.status === 'under_validation' ? 'text-yellow-400' :
                        'text-gray-400'
                      }`}>
                        {file.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {file.status !== 'locked' && user.role === 'faculty' && (
                      <button className="p-2 rounded-lg hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition-all">
                        <Upload size={18} />
                      </button>
                    )}
                    <button className="p-2 rounded-lg hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 transition-all">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

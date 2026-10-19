import { useState, useEffect } from 'react'
import axios from 'axios'
import { BookOpen, FileText, Users, TrendingUp } from 'lucide-react'

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({ courses: 0, files: 0, students: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  
const fetchStats = async () => {
  try {
    const token = localStorage.getItem('token');

    const { data } = await axios.get('/api/courses', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const courseList = Array.isArray(data)
      ? data
      : Array.isArray(data.courses)
        ? data.courses
        : [];

    setStats(prevStats => ({
      ...prevStats,
      courses: courseList.length,
    }));
  } catch (error) {
    console.error(
      'Error fetching stats:',
      error.response?.data || error.message
    );
  }
};


  const getStatCards = () => {
    if (user.role === 'coordinator') {
      return [
        { icon: BookOpen, label: 'Assigned Courses', value: stats.courses, color: 'from-orange-500 to-red-500' },
        { icon: FileText, label: 'Pending Reviews', value: stats.files, color: 'from-blue-500 to-cyan-500' },
        { icon: TrendingUp, label: 'Completed Files', value: '3', color: 'from-green-500 to-emerald-500' },
        { icon: Users, label: 'Faculty Members', value: stats.students, color: 'from-purple-500 to-pink-500' }
      ];
    } else if (user.role === 'faculty') {
      return [
        { icon: BookOpen, label: 'My Courses', value: stats.courses, color: 'from-orange-500 to-red-500' },
        { icon: FileText, label: 'Submitted Docs', value: stats.files, color: 'from-blue-500 to-cyan-500' },
        { icon: TrendingUp, label: 'Pending Submission', value: '2', color: 'from-yellow-500 to-orange-500' },
        { icon: Users, label: 'Sections', value: '4', color: 'from-purple-500 to-pink-500' }
      ];
    } else {
      return [
        { icon: BookOpen, label: 'Total Courses', value: stats.courses, color: 'from-orange-500 to-red-500' },
        { icon: Users, label: 'Faculty', value: stats.students, color: 'from-blue-500 to-cyan-500' },
        { icon: Users, label: 'Coordinators', value: '8', color: 'from-purple-500 to-pink-500' },
        { icon: TrendingUp, label: 'Active This Month', value: '45', color: 'from-green-500 to-emerald-500' }
      ];
    }
  };

  const statCards = getStatCards();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">
          Welcome back, <span className="text-blue-400">{user.name}</span>
        </h1>
        <p className="text-gray-400">Here's what's happening with your courses today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const colorMap = {
            'from-orange-500 to-red-500': 'bg-orange-600',
            'from-blue-500 to-cyan-500': 'bg-blue-600',
            'from-purple-500 to-pink-500': 'bg-purple-600',
            'from-green-500 to-emerald-500': 'bg-green-600',
            'from-yellow-500 to-orange-500': 'bg-yellow-600'
          };
          
          return (
            <div key={index} className="glass rounded-xl p-6 hover:border-white/20 transition-all">
              <div className={`w-12 h-12 rounded-lg ${colorMap[stat.color] || 'bg-gray-600'} flex items-center justify-center mb-4`}>
                <Icon className="text-white" size={24} />
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-white">Recent Activity</h2>
          <div className="space-y-4">
            {user.role === 'coordinator' && (
              <>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-white text-sm">Faculty submitted document in <span className="text-orange-400">Database Systems</span></p>
                    <p className="text-gray-400 text-xs mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                  <div className="flex-1">
                    <p className="text-white text-sm">AI validation completed for <span className="text-blue-400">Software Engineering</span></p>
                    <p className="text-gray-400 text-xs mt-1">5 hours ago</p>
                  </div>
                </div>
              </>
            )}
            {user.role === 'faculty' && (
              <>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                  <div className="flex-1">
                    <p className="text-white text-sm">Document validation successful for <span className="text-green-400">Section A</span></p>
                    <p className="text-gray-400 text-xs mt-1">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2" />
                  <div className="flex-1">
                    <p className="text-white text-sm">Submission deadline approaching for <span className="text-yellow-400">Data Structures</span></p>
                    <p className="text-gray-400 text-xs mt-1">3 hours ago</p>
                  </div>
                </div>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-white text-sm">New coordinator assigned to <span className="text-orange-400">Machine Learning</span></p>
                    <p className="text-gray-400 text-xs mt-1">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2" />
                  <div className="flex-1">
                    <p className="text-white text-sm">Faculty account activated for <span className="text-blue-400">Dr. Smith</span></p>
                    <p className="text-gray-400 text-xs mt-1">Yesterday</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
          <div className="space-y-3">
            {user.role === 'admin' && (
              <>
                <button className="w-full text-left p-4 rounded-lg bg-orange-600/20 border border-orange-600/40 hover:bg-orange-600/30 transition-all text-white">
                  Create New Course
                </button>
                <button className="w-full text-left p-4 rounded-lg bg-blue-600/20 border border-blue-600/40 hover:bg-blue-600/30 transition-all text-white">
                  Assign Coordinator
                </button>
                <button className="w-full text-left p-4 rounded-lg bg-purple-600/20 border border-purple-600/40 hover:bg-purple-600/30 transition-all text-white">
                  Manage Users
                </button>
              </>
            )}
            {user.role === 'coordinator' && (
              <>
                <button className="w-full text-left p-4 rounded-lg bg-orange-600/20 border border-orange-600/40 hover:bg-orange-600/30 transition-all text-white">
                  Check Completeness
                </button>
                <button className="w-full text-left p-4 rounded-lg bg-blue-600/20 border border-blue-600/40 hover:bg-blue-600/30 transition-all text-white">
                  Consolidate Content
                </button>
                <button className="w-full text-left p-4 rounded-lg bg-green-600/20 border border-green-600/40 hover:bg-green-600/30 transition-all text-white">
                  Generate Final File
                </button>
              </>
            )}
            {user.role === 'faculty' && (
              <>
                <button className="w-full text-left p-4 rounded-lg bg-orange-600/20 border border-orange-600/40 hover:bg-orange-600/30 transition-all text-white">
                  Upload Document
                </button>
                <button className="w-full text-left p-4 rounded-lg bg-blue-600/20 border border-blue-600/40 hover:bg-blue-600/30 transition-all text-white">
                  View My Submissions
                </button>
                <button className="w-full text-left p-4 rounded-lg bg-purple-600/20 border border-purple-600/40 hover:bg-purple-600/30 transition-all text-white">
                  Check Deadlines
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

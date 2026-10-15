import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, BookOpen, LogOut, User } from 'lucide-react'

export default function Layout({ user, onLogout }) {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/courses', icon: BookOpen, label: 'Courses' },
  ]

  return (
    <div className="min-h-screen">
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CF</span>
              </div>
              <span className="text-xl font-bold text-white">CourseFlow</span>
            </Link>

            <div className="flex items-center gap-6">
              {navItems.map(item => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              
              <div className="h-6 w-px bg-white/10" />
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-gray-400" />
                  <span className="text-gray-300">{user.name}</span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

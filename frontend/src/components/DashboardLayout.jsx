import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen, LayoutDashboard, Users, GraduationCap, FileText, Upload,
  ClipboardCheck, FolderOpen, Bell, LogOut, ChevronDown, Menu, X, Settings
} from 'lucide-react';

const NAV_ITEMS = {
  admin: [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { to: '/admin/faculty', icon: Users, label: 'Faculty & Staff' },
    { to: '/admin/assignments', icon: GraduationCap, label: 'Course Assignments' },
    { to: '/admin/status', icon: ClipboardCheck, label: 'Submission Status' },
  ],
  faculty: [
    { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/faculty/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/faculty/uploads', icon: Upload, label: 'Upload Documents' },
  ],
  coordinator: [
    { to: '/coordinator', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/coordinator/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/coordinator/common-docs', icon: FileText, label: 'Common Documents' },
    { to: '/coordinator/submissions', icon: ClipboardCheck, label: 'Faculty Submissions' },
    { to: '/coordinator/compile', icon: FolderOpen, label: 'Compile Course File' },
  ],
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navItems = NAV_ITEMS[user.role] || [];

  const roleLabel = { admin: 'Administrator', faculty: 'Faculty', coordinator: 'Course Coordinator' };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <BookOpen size={24} />
            <div>
              <span className="logo-text">BMU CFMS</span>
              <span className="logo-sub">Course File System</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{roleLabel[user.role]}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
          </div>
          <div className="topbar-right">
            <div className="topbar-context">
              <span className="context-year">AY 2026-2027</span>
              <span className="context-sep">|</span>
              <span className="context-sem">Odd Semester</span>
            </div>
            <div className="topbar-actions">
              <button
                className={`topbar-btn ${showNotifications ? 'active' : ''}`}
                onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              >
                <Bell size={20} />
                <span className="notif-badge">3</span>
              </button>
              {showNotifications && (
                <div className="dropdown-menu notif-dropdown">
                  <div className="dropdown-header">Notifications</div>
                  <div className="notif-item unread">
                    <span className="notif-dot warning"></span>
                    <div>
                      <p>CO-PO Mapping requires correction for CSE2001</p>
                      <small>Oct 20, 2026</small>
                    </div>
                  </div>
                  <div className="notif-item unread">
                    <span className="notif-dot error"></span>
                    <div>
                      <p>Weekly Timetable is missing for CSE2001</p>
                      <small>Oct 18, 2026</small>
                    </div>
                  </div>
                  <div className="notif-item unread">
                    <span className="notif-dot warning"></span>
                    <div>
                      <p>Evaluated samples need revision — CSE2001 Sec A</p>
                      <small>Oct 12, 2026</small>
                    </div>
                  </div>
                  <div className="notif-item">
                    <span className="notif-dot info"></span>
                    <div>
                      <p>Dr. Priya Sharma uploaded Mid-Semester QP</p>
                      <small>Oct 05, 2026</small>
                    </div>
                  </div>
                </div>
              )}
              <button
                className={`topbar-btn profile-btn ${showProfile ? 'active' : ''}`}
                onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              >
                <div className="avatar sm">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                <ChevronDown size={16} />
              </button>
              {showProfile && (
                <div className="dropdown-menu profile-dropdown">
                  <div className="profile-info">
                    <div className="avatar lg">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                    <div>
                      <p className="profile-name">{user.name}</p>
                      <p className="profile-email">{user.email}</p>
                      <span className="role-badge">{roleLabel[user.role]}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

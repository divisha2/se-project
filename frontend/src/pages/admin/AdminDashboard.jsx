import {
  BookOpen, Users, GraduationCap, ClipboardCheck, TrendingUp,
  AlertTriangle, CheckCircle, Clock
} from 'lucide-react';
import { StatCard, ProgressBar, StatusBadge } from '../../components/SharedComponents';
import { COURSE_OFFERINGS, COURSES, USERS as ALL_USERS } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const faculty = ALL_USERS.filter(u => u.role === 'faculty');
  const coordinators = ALL_USERS.filter(u => u.role === 'coordinator');

  const totalSubmissions = COURSE_OFFERINGS.reduce((sum, o) => {
    const totalSections = 25 * o.sections.length;
    return sum + Math.round(totalSections * o.completionPct / 100);
  }, 0);

  return (
    <div className="page-admin-dashboard">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="page-subtitle">Manage courses, faculty, and course file assignments</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={BookOpen} label="Active Courses" value={COURSES.length} accent="primary" />
        <StatCard icon={Users} label="Faculty Members" value={faculty.length} accent="info" />
        <StatCard icon={GraduationCap} label="Course Assignments" value={COURSE_OFFERINGS.length} accent="success" />
        <StatCard icon={ClipboardCheck} label="Total Submissions" value={totalSubmissions} accent="warning" />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2>Course Assignments Overview</h2>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin/assignments')}>
              View All
            </button>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Coordinator</th>
                  <th>Sections</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {COURSE_OFFERINGS.map(offering => (
                  <tr key={offering.id} className="clickable-row" onClick={() => navigate('/admin/assignments')}>
                    <td>
                      <div className="cell-main">{offering.course.code}</div>
                      <div className="cell-sub">{offering.course.title}</div>
                    </td>
                    <td>{offering.coordinator.name}</td>
                    <td>{offering.sections.length}</td>
                    <td><ProgressBar value={offering.completionPct} size="sm" /></td>
                    <td><StatusBadge status={offering.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="quick-actions">
              <button className="action-card" onClick={() => navigate('/admin/courses')}>
                <BookOpen size={24} />
                <span>Manage Courses</span>
              </button>
              <button className="action-card" onClick={() => navigate('/admin/faculty')}>
                <Users size={24} />
                <span>Manage Faculty</span>
              </button>
              <button className="action-card" onClick={() => navigate('/admin/assignments')}>
                <GraduationCap size={24} />
                <span>Course Assignments</span>
              </button>
              <button className="action-card" onClick={() => navigate('/admin/status')}>
                <ClipboardCheck size={24} />
                <span>Submission Status</span>
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Recent Activity</h2>
          </div>
          <div className="card-body">
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon warning"><AlertTriangle size={16} /></div>
                <div className="activity-content">
                  <p>CO-PO Mapping correction requested for CSE2001</p>
                  <small>2 days ago</small>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon success"><CheckCircle size={16} /></div>
                <div className="activity-content">
                  <p>Dr. Priya Sharma uploaded Mid-Semester QP</p>
                  <small>Oct 05, 2026</small>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon info"><Clock size={16} /></div>
                <div className="activity-content">
                  <p>DBMS course assignment created</p>
                  <small>Aug 16, 2026</small>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon success"><TrendingUp size={16} /></div>
                <div className="activity-content">
                  <p>CSE2001 course details approved</p>
                  <small>Aug 15, 2026</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

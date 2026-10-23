import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  COURSE_OFFERINGS, TEMPLATE_SECTIONS, FACULTY_UPLOADS
} from '../../data/mockData';
import { StatCard, ProgressBar, StatusBadge } from '../../components/SharedComponents';
import { BookOpen, Upload, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const myOfferings = COURSE_OFFERINGS.filter(o =>
    o.sections.some(s => s.facultyId === user.id)
  );

  const getStats = () => {
    let totalSections = 0, submitted = 0, approved = 0, missing = 0, corrections = 0;
    myOfferings.forEach(o => {
      const fUploads = FACULTY_UPLOADS[o.id]?.[user.id] || {};
      for (let i = 12; i <= 25; i++) {
        totalSections++;
        const s = fUploads[i]?.status || 'MISSING';
        if (s === 'APPROVED') approved++;
        else if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') submitted++;
        else if (s === 'CORRECTION_REQUIRED') corrections++;
        else missing++;
      }
    });
    return { totalSections, submitted, approved, missing, corrections };
  };

  const stats = getStats();
  const completionPct = stats.totalSections > 0
    ? ((stats.approved + stats.submitted) / stats.totalSections * 100) : 0;

  return (
    <div className="page-faculty-dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p className="page-subtitle">Faculty Dashboard — {user.department}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={BookOpen} label="Assigned Courses" value={myOfferings.length} accent="primary" />
        <StatCard icon={Upload} label="Submitted" value={stats.submitted + stats.approved} accent="success" />
        <StatCard icon={AlertTriangle} label="Missing" value={stats.missing} accent="warning" />
        <StatCard icon={CheckCircle} label="Approved" value={stats.approved} accent="info" />
      </div>

      <div className="dashboard-grid">
        <div className="card full-width">
          <div className="card-header">
            <h2>My Course Assignments</h2>
          </div>
          <div className="card-body">
            <div className="course-cards-grid">
              {myOfferings.map(offering => {
                const mySection = offering.sections.find(s => s.facultyId === user.id);
                const fUploads = FACULTY_UPLOADS[offering.id]?.[user.id] || {};
                let sSubmitted = 0, sTotal = 0;
                for (let i = 12; i <= 25; i++) {
                  sTotal++;
                  const st = fUploads[i]?.status || 'MISSING';
                  if (st === 'SUBMITTED' || st === 'APPROVED' || st === 'UNDER_REVIEW') sSubmitted++;
                }
                const pct = sTotal > 0 ? (sSubmitted / sTotal * 100) : 0;
                const hasCorrections = Object.values(fUploads).some(u => u.status === 'CORRECTION_REQUIRED');

                return (
                  <div key={offering.id} className="course-card" onClick={() => navigate('/faculty/uploads', { state: { offeringId: offering.id } })}>
                    <div className="course-card-top">
                      <span className="code-badge">{offering.course.code}</span>
                      <StatusBadge status={offering.status} />
                    </div>
                    <h3>{offering.course.title}</h3>
                    <div className="course-card-meta">
                      <span>{mySection?.name}</span>
                      <span>{offering.academicYear}</span>
                    </div>
                    <ProgressBar value={pct} />
                    <div className="course-card-footer">
                      <span>{sSubmitted} of {sTotal} sections</span>
                      {hasCorrections && (
                        <span className="correction-flag">
                          <AlertTriangle size={14} />
                          Corrections needed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {stats.corrections > 0 && (
          <div className="card">
            <div className="card-header">
              <h2>Correction Requests</h2>
            </div>
            <div className="card-body">
              <div className="activity-list">
                {myOfferings.map(o => {
                  const fUploads = FACULTY_UPLOADS[o.id]?.[user.id] || {};
                  return Object.entries(fUploads)
                    .filter(([, v]) => v.status === 'CORRECTION_REQUIRED')
                    .map(([secNum, v]) => {
                      const sec = TEMPLATE_SECTIONS.find(s => s.number === Number(secNum));
                      return (
                        <div key={`${o.id}-${secNum}`} className="activity-item">
                          <div className="activity-icon warning"><AlertTriangle size={16} /></div>
                          <div className="activity-content">
                            <p><strong>Section {secNum}:</strong> {sec?.title}</p>
                            <p className="feedback-text">{v.feedback}</p>
                            <small>{o.course.code} — {o.course.title}</small>
                          </div>
                        </div>
                      );
                    });
                })}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2>Overall Progress</h2>
          </div>
          <div className="card-body">
            <div className="progress-overview">
              <div className="progress-circle-container">
                <svg viewBox="0 0 100 100" className="progress-circle">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="var(--primary)" strokeWidth="8"
                    strokeDasharray={`${completionPct * 2.51} ${251 - completionPct * 2.51}`}
                    strokeDashoffset="62.75"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="progress-circle-label">
                  <span className="pct">{Math.round(completionPct)}%</span>
                  <span className="pct-sub">Complete</span>
                </div>
              </div>
              <div className="progress-breakdown">
                <div className="breakdown-item"><span className="dot approved"></span>Approved: {stats.approved}</div>
                <div className="breakdown-item"><span className="dot submitted"></span>Submitted: {stats.submitted}</div>
                <div className="breakdown-item"><span className="dot correction"></span>Corrections: {stats.corrections}</div>
                <div className="breakdown-item"><span className="dot missing"></span>Missing: {stats.missing}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

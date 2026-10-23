import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  COURSE_OFFERINGS, TEMPLATE_SECTIONS, COORDINATOR_UPLOADS, FACULTY_UPLOADS
} from '../../data/mockData';
import { StatCard, ProgressBar, StatusBadge } from '../../components/SharedComponents';
import {
  BookOpen, FileText, ClipboardCheck, FolderOpen, Users,
  AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const myOfferings = COURSE_OFFERINGS.filter(o => o.coordinatorId === user.id);

  const getStats = () => {
    let totalCoord = 0, coordSubmitted = 0, totalFaculty = 0, facSubmitted = 0, corrections = 0, approved = 0;
    myOfferings.forEach(o => {
      const cUploads = COORDINATOR_UPLOADS[o.id] || {};
      for (let i = 1; i <= 11; i++) {
        totalCoord++;
        const s = cUploads[i]?.status || 'MISSING';
        if (s === 'SUBMITTED' || s === 'APPROVED' || s === 'UNDER_REVIEW') coordSubmitted++;
        if (s === 'APPROVED') approved++;
        if (s === 'CORRECTION_REQUIRED') corrections++;
      }
      const fUploads = FACULTY_UPLOADS[o.id] || {};
      o.sections.forEach(sec => {
        const fu = fUploads[sec.facultyId] || {};
        for (let i = 12; i <= 25; i++) {
          totalFaculty++;
          const s = fu[i]?.status || 'MISSING';
          if (s === 'SUBMITTED' || s === 'APPROVED' || s === 'UNDER_REVIEW') facSubmitted++;
          if (s === 'APPROVED') approved++;
          if (s === 'CORRECTION_REQUIRED') corrections++;
        }
      });
    });
    return { totalCoord, coordSubmitted, totalFaculty, facSubmitted, corrections, approved };
  };

  const stats = getStats();

  return (
    <div className="page-coord-dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p className="page-subtitle">Course Coordinator Dashboard</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={BookOpen} label="Courses Assigned" value={myOfferings.length} accent="primary" />
        <StatCard icon={FileText} label="Common Docs Uploaded" value={`${stats.coordSubmitted}/${stats.totalCoord}`} accent="info" />
        <StatCard icon={ClipboardCheck} label="Faculty Submissions" value={`${stats.facSubmitted}/${stats.totalFaculty}`} accent="success" />
        <StatCard icon={AlertTriangle} label="Corrections Pending" value={stats.corrections} accent="warning" />
      </div>

      <div className="dashboard-grid">
        <div className="card full-width">
          <div className="card-header">
            <h2>My Course Offerings</h2>
          </div>
          <div className="card-body">
            <div className="course-cards-grid">
              {myOfferings.map(offering => {
                const cUploads = COORDINATOR_UPLOADS[offering.id] || {};
                let cDone = 0;
                for (let i = 1; i <= 11; i++) {
                  const s = cUploads[i]?.status || 'MISSING';
                  if (s !== 'MISSING') cDone++;
                }
                const fUploads = FACULTY_UPLOADS[offering.id] || {};
                let fDone = 0, fTotal = 0;
                offering.sections.forEach(sec => {
                  const fu = fUploads[sec.facultyId] || {};
                  for (let i = 12; i <= 25; i++) {
                    fTotal++;
                    const s = fu[i]?.status || 'MISSING';
                    if (s !== 'MISSING') fDone++;
                  }
                });

                return (
                  <div key={offering.id} className="course-card coord-card">
                    <div className="course-card-top">
                      <span className="code-badge">{offering.course.code}</span>
                      <StatusBadge status={offering.status} />
                    </div>
                    <h3>{offering.course.title}</h3>
                    <div className="course-card-meta">
                      <span>{offering.academicYear}</span>
                      <span>{offering.semester}</span>
                    </div>
                    <div className="coord-progress-rows">
                      <div className="coord-progress-row">
                        <span>Common Documents (1–11)</span>
                        <ProgressBar value={(cDone / 11) * 100} size="sm" />
                      </div>
                      <div className="coord-progress-row">
                        <span>Faculty Submissions (12–25)</span>
                        <ProgressBar value={fTotal > 0 ? (fDone / fTotal) * 100 : 0} size="sm" />
                      </div>
                    </div>
                    <div className="course-card-footer">
                      <div className="faculty-avatars">
                        {offering.sections.map(sec => (
                          <div key={sec.id} className="avatar sm" title={sec.faculty.name}>
                            {sec.faculty.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        ))}
                      </div>
                      <span>{offering.sections.length} section{offering.sections.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="course-card-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate('/coordinator/common-docs', { state: { offeringId: offering.id } })}>
                        <FileText size={14} />
                        Common Docs
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => navigate('/coordinator/submissions', { state: { offeringId: offering.id } })}>
                        <ClipboardCheck size={14} />
                        Review
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => navigate('/coordinator/compile', { state: { offeringId: offering.id } })}>
                        <FolderOpen size={14} />
                        Compile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Items Requiring Attention</h2>
          </div>
          <div className="card-body">
            <div className="activity-list">
              {myOfferings.map(o => {
                const items = [];
                const cUploads = COORDINATOR_UPLOADS[o.id] || {};
                for (let i = 1; i <= 11; i++) {
                  if (!cUploads[i] || cUploads[i].status === 'MISSING') {
                    const sec = TEMPLATE_SECTIONS.find(s => s.number === i);
                    items.push(
                      <div key={`c-${o.id}-${i}`} className="activity-item">
                        <div className="activity-icon error"><AlertTriangle size={16} /></div>
                        <div className="activity-content">
                          <p><strong>Missing:</strong> Section {i} — {sec?.title}</p>
                          <small>{o.course.code} · Common Document</small>
                        </div>
                      </div>
                    );
                  }
                }
                const fUploads = FACULTY_UPLOADS[o.id] || {};
                o.sections.forEach(sec => {
                  const fu = fUploads[sec.facultyId] || {};
                  Object.entries(fu).forEach(([sNum, v]) => {
                    if (v.status === 'SUBMITTED') {
                      const ts = TEMPLATE_SECTIONS.find(s => s.number === Number(sNum));
                      items.push(
                        <div key={`f-${o.id}-${sec.facultyId}-${sNum}`} className="activity-item">
                          <div className="activity-icon info"><Clock size={16} /></div>
                          <div className="activity-content">
                            <p><strong>Needs Review:</strong> Section {sNum} — {ts?.title}</p>
                            <small>{o.course.code} · {sec.faculty.name} · {sec.name}</small>
                          </div>
                        </div>
                      );
                    }
                  });
                });
                return items.slice(0, 6);
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

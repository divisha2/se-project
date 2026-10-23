import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { COURSE_OFFERINGS, FACULTY_UPLOADS } from '../../data/mockData';
import { ProgressBar, StatusBadge } from '../../components/SharedComponents';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function FacultyCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const myOfferings = COURSE_OFFERINGS.filter(o =>
    o.sections.some(s => s.facultyId === user.id)
  );

  return (
    <div className="page-faculty-courses">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <p className="page-subtitle">Courses assigned to you for the current academic session</p>
        </div>
      </div>

      <div className="course-list">
        {myOfferings.map(offering => {
          const mySection = offering.sections.find(s => s.facultyId === user.id);
          const fUploads = FACULTY_UPLOADS[offering.id]?.[user.id] || {};
          let submitted = 0, approved = 0, corrections = 0, missing = 0;
          for (let i = 12; i <= 25; i++) {
            const s = fUploads[i]?.status || 'MISSING';
            if (s === 'APPROVED') approved++;
            else if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') submitted++;
            else if (s === 'CORRECTION_REQUIRED') corrections++;
            else missing++;
          }
          const pct = ((approved + submitted) / 14 * 100);

          return (
            <div key={offering.id} className="course-list-item" onClick={() => navigate('/faculty/uploads', { state: { offeringId: offering.id } })}>
              <div className="course-list-left">
                <div className="course-icon-box">
                  <BookOpen size={24} />
                </div>
                <div>
                  <div className="course-list-title">
                    <span className="code-badge">{offering.course.code}</span>
                    <h3>{offering.course.title}</h3>
                  </div>
                  <div className="course-list-meta">
                    <span>{mySection?.name}</span>
                    <span className="meta-sep">·</span>
                    <span>{offering.academicYear}</span>
                    <span className="meta-sep">·</span>
                    <span>{offering.semester}</span>
                    <span className="meta-sep">·</span>
                    <span>Coordinator: {offering.coordinator.name}</span>
                  </div>
                  <div className="course-list-stats">
                    <span className="mini-stat approved">{approved} Approved</span>
                    <span className="mini-stat submitted">{submitted} Submitted</span>
                    {corrections > 0 && <span className="mini-stat correction">{corrections} Correction</span>}
                    <span className="mini-stat missing">{missing} Missing</span>
                  </div>
                </div>
              </div>
              <div className="course-list-right">
                <ProgressBar value={pct} />
                <ArrowRight size={20} className="arrow-icon" />
              </div>
            </div>
          );
        })}
        {myOfferings.length === 0 && (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>No courses assigned</h3>
            <p>You have not been assigned to any courses for this semester.</p>
          </div>
        )}
      </div>
    </div>
  );
}

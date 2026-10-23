import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { COURSE_OFFERINGS, COORDINATOR_UPLOADS } from '../../data/mockData';
import { ProgressBar, StatusBadge } from '../../components/SharedComponents';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function CoordinatorCourses() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const myOfferings = COURSE_OFFERINGS.filter(o => o.coordinatorId === user.id);

  return (
    <div className="page-coord-courses">
      <div className="page-header">
        <div>
          <h1>My Courses</h1>
          <p className="page-subtitle">Course offerings assigned to you as coordinator</p>
        </div>
      </div>

      <div className="course-list">
        {myOfferings.map(offering => {
          const cUploads = COORDINATOR_UPLOADS[offering.id] || {};
          let submitted = 0, approved = 0, corrections = 0, missing = 0;
          for (let i = 1; i <= 11; i++) {
            const s = cUploads[i]?.status || 'MISSING';
            if (s === 'APPROVED') approved++;
            else if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') submitted++;
            else if (s === 'CORRECTION_REQUIRED') corrections++;
            else missing++;
          }
          const pct = ((approved + submitted) / 11 * 100);

          return (
            <div key={offering.id} className="course-list-item" onClick={() => navigate('/coordinator/common-docs', { state: { offeringId: offering.id } })}>
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
                    <span>{offering.academicYear}</span>
                    <span className="meta-sep">·</span>
                    <span>{offering.semester}</span>
                    <span className="meta-sep">·</span>
                    <span>{offering.sections.length} section{offering.sections.length > 1 ? 's' : ''}</span>
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
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  COURSE_OFFERINGS, TEMPLATE_SECTIONS, COORDINATOR_UPLOADS, FACULTY_UPLOADS
} from '../../data/mockData';
import { StatusBadge, ProgressBar } from '../../components/SharedComponents';
import { Search, Filter } from 'lucide-react';

export default function AdminStatus() {
  const [selectedOffering, setSelectedOffering] = useState(COURSE_OFFERINGS[0]?.id || null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const offering = COURSE_OFFERINGS.find(o => o.id === selectedOffering);

  const getStatusSummary = () => {
    if (!offering) return { total: 0, submitted: 0, approved: 0, missing: 0, correction: 0 };
    const coordUploads = COORDINATOR_UPLOADS[offering.id] || {};
    const facUploads = FACULTY_UPLOADS[offering.id] || {};

    let total = 0, submitted = 0, approved = 0, missing = 0, correction = 0;

    // Coordinator sections (1-11)
    for (let i = 1; i <= 11; i++) {
      total++;
      const s = coordUploads[i]?.status || 'MISSING';
      if (s === 'APPROVED') approved++;
      else if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') submitted++;
      else if (s === 'CORRECTION_REQUIRED') correction++;
      else missing++;
    }

    // Faculty sections (12-25) per faculty
    offering.sections.forEach(sec => {
      const fUploads = facUploads[sec.facultyId] || {};
      for (let i = 12; i <= 25; i++) {
        total++;
        const s = fUploads[i]?.status || 'MISSING';
        if (s === 'APPROVED') approved++;
        else if (s === 'SUBMITTED' || s === 'UNDER_REVIEW') submitted++;
        else if (s === 'CORRECTION_REQUIRED') correction++;
        else missing++;
      }
    });

    return { total, submitted, approved, missing, correction };
  };

  const summary = getStatusSummary();
  const completionPct = summary.total > 0 ? ((summary.approved + summary.submitted) / summary.total * 100) : 0;

  const getSectionRows = () => {
    if (!offering) return [];
    const rows = [];
    const coordUploads = COORDINATOR_UPLOADS[offering.id] || {};
    const facUploads = FACULTY_UPLOADS[offering.id] || {};

    TEMPLATE_SECTIONS.forEach(sec => {
      if (sec.number <= 11) {
        const upload = coordUploads[sec.number];
        const status = upload?.status || 'MISSING';
        rows.push({
          sectionNumber: sec.number,
          sectionTitle: sec.title,
          owner: offering.coordinator.name,
          ownerRole: 'Coordinator',
          section: '—',
          status,
          fileCount: upload?.files?.length || 0,
        });
      } else {
        offering.sections.forEach(s => {
          const fUpload = facUploads[s.facultyId]?.[sec.number];
          const status = fUpload?.status || 'MISSING';
          rows.push({
            sectionNumber: sec.number,
            sectionTitle: sec.title,
            owner: s.faculty.name,
            ownerRole: 'Faculty',
            section: s.name,
            status,
            fileCount: fUpload?.files?.length || 0,
          });
        });
      }
    });

    if (filterStatus !== 'ALL') {
      return rows.filter(r => r.status === filterStatus);
    }
    return rows;
  };

  return (
    <div className="page-admin-status">
      <div className="page-header">
        <div>
          <h1>Submission Status</h1>
          <p className="page-subtitle">Track document submissions across all course offerings</p>
        </div>
      </div>

      <div className="status-controls">
        <div className="form-group">
          <label>Course Offering</label>
          <select value={selectedOffering || ''} onChange={e => setSelectedOffering(Number(e.target.value))}>
            {COURSE_OFFERINGS.map(o => (
              <option key={o.id} value={o.id}>{o.course.code} — {o.course.title} ({o.academicYear})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Filter by Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="MISSING">Missing</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="CORRECTION_REQUIRED">Correction Required</option>
          </select>
        </div>
      </div>

      {offering && (
        <>
          <div className="status-summary-bar">
            <div className="summary-item">
              <span className="summary-count">{summary.total}</span>
              <span className="summary-label">Total Items</span>
            </div>
            <div className="summary-item approved">
              <span className="summary-count">{summary.approved}</span>
              <span className="summary-label">Approved</span>
            </div>
            <div className="summary-item submitted">
              <span className="summary-count">{summary.submitted}</span>
              <span className="summary-label">Submitted</span>
            </div>
            <div className="summary-item missing">
              <span className="summary-count">{summary.missing}</span>
              <span className="summary-label">Missing</span>
            </div>
            <div className="summary-item correction">
              <span className="summary-count">{summary.correction}</span>
              <span className="summary-label">Needs Correction</span>
            </div>
            <div className="summary-item progress">
              <ProgressBar value={completionPct} />
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Section Title</th>
                    <th>Owner</th>
                    <th>Role</th>
                    <th>Section</th>
                    <th>Files</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getSectionRows().map((row, i) => (
                    <tr key={i}>
                      <td>{row.sectionNumber}</td>
                      <td className="title-cell">{row.sectionTitle}</td>
                      <td>{row.owner}</td>
                      <td><span className={`role-badge role-${row.ownerRole.toLowerCase()}`}>{row.ownerRole}</span></td>
                      <td>{row.section}</td>
                      <td>{row.fileCount}</td>
                      <td><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

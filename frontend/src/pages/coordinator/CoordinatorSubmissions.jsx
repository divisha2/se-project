import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  COURSE_OFFERINGS, TEMPLATE_SECTIONS, FACULTY_UPLOADS
} from '../../data/mockData';
import { StatusBadge, FileIcon, Modal } from '../../components/SharedComponents';
import {
  Eye, Download, MessageSquare, CheckCircle, AlertTriangle,
  FileText, ChevronDown, ChevronRight, Users, Send
} from 'lucide-react';

export default function CoordinatorSubmissions() {
  const { user } = useAuth();
  const location = useLocation();

  const myOfferings = COURSE_OFFERINGS.filter(o => o.coordinatorId === user.id);
  const [selectedOffering, setSelectedOffering] = useState(
    location.state?.offeringId || myOfferings[0]?.id || null
  );
  const [viewMode, setViewMode] = useState('byFaculty'); // 'byFaculty' or 'bySection'
  const [expandedItem, setExpandedItem] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED');
  const [reviewComment, setReviewComment] = useState('');
  const [reviews, setReviews] = useState({}); // Track review actions
  const [previewFile, setPreviewFile] = useState(null);

  const offering = COURSE_OFFERINGS.find(o => o.id === selectedOffering);
  const facultySections = TEMPLATE_SECTIONS.filter(s => s.number >= 12 && s.number <= 25);

  const getUpload = (facultyId, secNum) => {
    const stored = reviews[`${selectedOffering}-${facultyId}-${secNum}`];
    if (stored) return stored;
    return FACULTY_UPLOADS[selectedOffering]?.[facultyId]?.[secNum] || { status: 'MISSING', files: [], feedback: null };
  };

  const handleReview = () => {
    if (!reviewModal) return;
    const { facultyId, secNum } = reviewModal;
    const current = getUpload(facultyId, secNum);
    setReviews(prev => ({
      ...prev,
      [`${selectedOffering}-${facultyId}-${secNum}`]: {
        ...current,
        status: reviewAction === 'APPROVED' ? 'APPROVED' : 'CORRECTION_REQUIRED',
        feedback: reviewAction === 'CORRECTION_REQUIRED' ? reviewComment : null,
      }
    }));
    setReviewModal(null);
    setReviewComment('');
  };

  const renderByFaculty = () => {
    if (!offering) return null;
    return offering.sections.map(sec => (
      <div key={sec.id} className="faculty-submissions-group">
        <div className="faculty-group-header">
          <div className="faculty-group-info">
            <div className="avatar">{sec.faculty.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
            <div>
              <h3>{sec.faculty.name}</h3>
              <span>{sec.name} · {sec.faculty.designation}</span>
            </div>
          </div>
        </div>
        <div className="submissions-list">
          {facultySections.map(ts => {
            const upload = getUpload(sec.facultyId, ts.number);
            const key = `${sec.facultyId}-${ts.number}`;
            const isExpanded = expandedItem === key;

            return (
              <div key={ts.number} className={`submission-item status-${upload.status.toLowerCase().replace('_', '-')}`}>
                <div className="submission-header" onClick={() => setExpandedItem(isExpanded ? null : key)}>
                  <div className="submission-left">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span className="section-number">{ts.number}</span>
                    <span className="submission-title">{ts.title}</span>
                  </div>
                  <div className="submission-right">
                    {upload.files.length > 0 && <span className="file-count">{upload.files.length} file{upload.files.length > 1 ? 's' : ''}</span>}
                    <StatusBadge status={upload.status} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="submission-detail">
                    {upload.feedback && (
                      <div className="feedback-banner">
                        <MessageSquare size={16} />
                        <div>
                          <strong>Your Feedback:</strong>
                          <p>{upload.feedback}</p>
                        </div>
                      </div>
                    )}

                    {upload.files.length > 0 ? (
                      <div className="file-list">
                        {upload.files.map(file => (
                          <div key={file.id} className="file-item">
                            <FileIcon type={file.type} />
                            <div className="file-details">
                              <span className="file-name">{file.name}</span>
                              <span className="file-meta">{file.size} · {file.uploadDate}</span>
                            </div>
                            <div className="file-actions">
                              <button className="icon-btn" title="Preview" onClick={() => setPreviewFile(file)}><Eye size={16} /></button>
                              <button className="icon-btn" title="Download"><Download size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-submission">
                        <FileText size={32} />
                        <p>No documents submitted yet</p>
                      </div>
                    )}

                    {upload.files.length > 0 && upload.status !== 'APPROVED' && upload.status !== 'MISSING' && (
                      <div className="review-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => {
                            setReviewModal({ facultyId: sec.facultyId, secNum: ts.number, faculty: sec.faculty, section: ts });
                            setReviewAction('APPROVED');
                          }}
                        >
                          <CheckCircle size={16} />
                          <span>Approve</span>
                        </button>
                        <button
                          className="btn btn-warning"
                          onClick={() => {
                            setReviewModal({ facultyId: sec.facultyId, secNum: ts.number, faculty: sec.faculty, section: ts });
                            setReviewAction('CORRECTION_REQUIRED');
                          }}
                        >
                          <AlertTriangle size={16} />
                          <span>Request Correction</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  const renderBySection = () => {
    if (!offering) return null;
    return facultySections.map(ts => (
      <div key={ts.number} className="section-submissions-group">
        <div className="section-group-header">
          <span className="section-number">{ts.number}</span>
          <h3>{ts.title}</h3>
          {ts.mandatory ? <span className="tag mandatory">Mandatory</span> : <span className="tag optional">Optional</span>}
        </div>
        <div className="submissions-list">
          {offering.sections.map(sec => {
            const upload = getUpload(sec.facultyId, ts.number);
            return (
              <div key={sec.id} className={`submission-item compact status-${upload.status.toLowerCase().replace('_', '-')}`}>
                <div className="submission-left">
                  <div className="avatar sm">{sec.faculty.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                  <div>
                    <span className="submission-faculty-name">{sec.faculty.name}</span>
                    <span className="submission-section-name">{sec.name}</span>
                  </div>
                </div>
                <div className="submission-right">
                  {upload.files.length > 0 && <span className="file-count">{upload.files.length} file{upload.files.length > 1 ? 's' : ''}</span>}
                  <StatusBadge status={upload.status} />
                  {upload.files.length > 0 && upload.status !== 'APPROVED' && upload.status !== 'MISSING' && (
                    <div className="inline-review-actions">
                      <button className="icon-btn success" title="Approve" onClick={() => {
                        setReviewModal({ facultyId: sec.facultyId, secNum: ts.number, faculty: sec.faculty, section: ts });
                        setReviewAction('APPROVED');
                      }}><CheckCircle size={16} /></button>
                      <button className="icon-btn warning" title="Request Correction" onClick={() => {
                        setReviewModal({ facultyId: sec.facultyId, secNum: ts.number, faculty: sec.faculty, section: ts });
                        setReviewAction('CORRECTION_REQUIRED');
                      }}><AlertTriangle size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div className="page-coord-submissions">
      <div className="page-header">
        <div>
          <h1>Faculty Submissions</h1>
          <p className="page-subtitle">Review faculty document submissions for points 12–25</p>
        </div>
      </div>

      <div className="card submissions-controls">
        <div className="card-body">
          <div className="controls-row">
            {myOfferings.length > 1 && (
              <div className="form-group">
                <label>Course</label>
                <select value={selectedOffering || ''} onChange={e => setSelectedOffering(Number(e.target.value))}>
                  {myOfferings.map(o => (
                    <option key={o.id} value={o.id}>{o.course.code} — {o.course.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="view-toggle">
              <button className={`toggle-btn ${viewMode === 'byFaculty' ? 'active' : ''}`} onClick={() => setViewMode('byFaculty')}>
                <Users size={16} /> By Faculty
              </button>
              <button className={`toggle-btn ${viewMode === 'bySection' ? 'active' : ''}`} onClick={() => setViewMode('bySection')}>
                <FileText size={16} /> By Section
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="submissions-content">
        {viewMode === 'byFaculty' ? renderByFaculty() : renderBySection()}
      </div>

      <Modal open={!!reviewModal} onClose={() => setReviewModal(null)} title={reviewAction === 'APPROVED' ? 'Approve Submission' : 'Request Correction'}>
        {reviewModal && (
          <div className="review-form">
            <div className="review-info">
              <p><strong>Faculty:</strong> {reviewModal.faculty.name}</p>
              <p><strong>Section {reviewModal.secNum}:</strong> {reviewModal.section.title}</p>
            </div>
            {reviewAction === 'CORRECTION_REQUIRED' && (
              <div className="form-group">
                <label>Correction Comments *</label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Describe what needs to be corrected…"
                  rows={4}
                />
              </div>
            )}
            {reviewAction === 'APPROVED' && (
              <p className="review-confirm-text">Are you sure you want to approve this submission?</p>
            )}
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
              <button
                className={`btn ${reviewAction === 'APPROVED' ? 'btn-success' : 'btn-warning'}`}
                onClick={handleReview}
                disabled={reviewAction === 'CORRECTION_REQUIRED' && !reviewComment.trim()}
              >
                <Send size={16} />
                <span>{reviewAction === 'APPROVED' ? 'Approve' : 'Send Correction Request'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!previewFile} onClose={() => setPreviewFile(null)} title="File Preview">
        {previewFile && (
          <div className="file-preview-content">
            <div className="preview-placeholder">
              <FileText size={64} />
              <h3>{previewFile.name}</h3>
              <p>File preview is not available in this demo.</p>
              <p className="preview-meta">Type: {previewFile.type} · Size: {previewFile.size}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  COURSE_OFFERINGS, TEMPLATE_SECTIONS, COORDINATOR_UPLOADS, FACULTY_UPLOADS
} from '../../data/mockData';
import { StatusBadge, ProgressBar, Modal } from '../../components/SharedComponents';
import {
  FolderOpen, Download, FileText, CheckCircle, AlertTriangle,
  Printer, ChevronDown, ChevronRight, Eye, ShieldCheck, Info,
  ExternalLink, Layers, Award
} from 'lucide-react';

export default function CoordinatorCompile() {
  const { user } = useAuth();
  const location = useLocation();

  const myOfferings = COURSE_OFFERINGS.filter(o => o.coordinatorId === user.id);
  const initialOfferingId = location.state?.offeringId || (myOfferings[0]?.id || 1);
  const [selectedOfferingId, setSelectedOfferingId] = useState(initialOfferingId);

  const [expandedSections, setExpandedSections] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [exportModal, setExportModal] = useState(null); // 'pdf' | 'word' | null
  const [exportNoticeDismissed, setExportNoticeDismissed] = useState(false);

  const offering = myOfferings.find(o => o.id === Number(selectedOfferingId)) || myOfferings[0];
  const cUploads = COORDINATOR_UPLOADS[offering?.id] || {};
  const fUploads = FACULTY_UPLOADS[offering?.id] || {};

  // Toggle section accordion
  const toggleSection = (secNum) => {
    setExpandedSections(prev => ({
      ...prev,
      [secNum]: !prev[secNum]
    }));
  };

  const expandAll = () => {
    const all = {};
    for (let i = 1; i <= 25; i++) all[i] = true;
    setExpandedSections(all);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  // Compile calculations
  let commonReadyCount = 0;
  for (let i = 1; i <= 11; i++) {
    const s = cUploads[i]?.status;
    if (s === 'APPROVED' || s === 'SUBMITTED') commonReadyCount++;
  }

  let facultySectionsReadyCount = 0;
  let totalFacultySlots = (offering?.sections.length || 1) * 13; // 12-24 mandatory = 13 points
  let facultySlotsFilled = 0;

  for (let i = 12; i <= 24; i++) {
    let allSectionsUploaded = true;
    offering?.sections.forEach(sec => {
      const fu = fUploads[sec.facultyId]?.[i];
      if (fu?.status === 'APPROVED' || fu?.status === 'SUBMITTED') {
        facultySlotsFilled++;
      } else {
        allSectionsUploaded = false;
      }
    });
    if (allSectionsUploaded) facultySectionsReadyCount++;
  }

  const overallProgress = Math.round(((commonReadyCount + (facultySlotsFilled / (offering?.sections.length || 1))) / 24) * 100);
  const isReadyForCompilation = overallProgress >= 70;

  return (
    <div className="page-coordinator-compile">
      <div className="page-header">
        <div>
          <h1>Course File Compilation & Preview</h1>
          <p className="page-subtitle">Consolidate official 25 sections into a unified BMU Course Dossier</p>
        </div>

        <div className="header-actions">
          <div className="form-group inline-select">
            <label htmlFor="course-select">Select Course:</label>
            <select
              id="course-select"
              value={selectedOfferingId}
              onChange={e => setSelectedOfferingId(Number(e.target.value))}
            >
              {myOfferings.map(o => (
                <option key={o.id} value={o.id}>
                  {o.course.code} - {o.course.title} ({o.academicYear})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Course Summary Banner */}
      {offering && (
        <div className="card compile-hero-card">
          <div className="compile-hero-header">
            <div>
              <span className="code-badge">{offering.course.code}</span>
              <h2>{offering.course.title}</h2>
              <div className="compile-meta-badges">
                <span>{offering.course.school}</span>
                <span>{offering.academicYear} · {offering.semester}</span>
                <span>Coordinator: {user.name}</span>
                <span>{offering.sections.length} Sections ({offering.sections.map(s => s.name).join(', ')})</span>
              </div>
            </div>
            <div className="compile-readiness-widget">
              <div className="readiness-score">
                <span className="readiness-pct">{overallProgress}%</span>
                <span className="readiness-label">Ready to Compile</span>
              </div>
              <div className="readiness-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setExportModal('word')}
                >
                  <FileText size={16} />
                  Export Word (.docx)
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setExportModal('pdf')}
                >
                  <Printer size={16} />
                  Export Course File (.pdf)
                </button>
              </div>
            </div>
          </div>

          <div className="compile-readiness-bar-container">
            <ProgressBar value={overallProgress} size="md" />
            <div className="compile-stat-breakdown">
              <span><strong>Common Sections (1–11):</strong> {commonReadyCount}/11 Completed</span>
              <span><strong>Faculty Sections (12–24):</strong> {facultySlotsFilled}/{totalFacultySlots} Submitted across batches</span>
              <span><strong>Optional (25):</strong> Available for additional pedagogical notes</span>
            </div>
          </div>
        </div>
      )}

      {/* Compilation Toolbar */}
      <div className="compilation-toolbar">
        <div className="toolbar-left">
          <h3>Official 25-Point Course File Structure</h3>
          <span className="badge badge-info">Strict BMU Standard Order</span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-sm btn-ghost" onClick={expandAll}>Expand All Sections</button>
          <button className="btn btn-sm btn-ghost" onClick={collapseAll}>Collapse All</button>
        </div>
      </div>

      {/* 25 Sections Accordion List */}
      <div className="compile-sections-list">
        {TEMPLATE_SECTIONS.map(sec => {
          const isCommon = sec.number <= 11;
          const isOptional = sec.number === 25;
          const isExpanded = !!expandedSections[sec.number];

          // Determine status & file counts for this point
          let sectionStatus = 'MISSING';
          let filesList = [];

          if (isCommon) {
            const up = cUploads[sec.number];
            sectionStatus = up?.status || 'MISSING';
            filesList = (up?.files || []).map(f => ({ ...f, uploader: 'Coordinator (Common)' }));
          } else {
            // Aggregated from each assigned faculty
            let allApproved = true;
            let hasSubmission = false;
            let hasCorrection = false;

            offering?.sections.forEach(s => {
              const fUp = fUploads[s.facultyId]?.[sec.number];
              if (fUp?.status === 'APPROVED') {
                hasSubmission = true;
              } else if (fUp?.status === 'SUBMITTED' || fUp?.status === 'UNDER_REVIEW') {
                hasSubmission = true;
                allApproved = false;
              } else if (fUp?.status === 'CORRECTION_REQUIRED') {
                hasCorrection = true;
                allApproved = false;
              } else {
                allApproved = false;
              }

              if (fUp?.files?.length > 0) {
                fUp.files.forEach(f => {
                  filesList.push({
                    ...f,
                    uploader: `${s.name} (${s.faculty.name})`,
                    facultyStatus: fUp.status
                  });
                });
              }
            });

            if (filesList.length > 0) {
              if (allApproved) sectionStatus = 'APPROVED';
              else if (hasCorrection) sectionStatus = 'CORRECTION_REQUIRED';
              else sectionStatus = 'SUBMITTED';
            } else {
              sectionStatus = isOptional ? 'OPTIONAL' : 'MISSING';
            }
          }

          return (
            <div key={sec.number} className={`compile-section-card ${isExpanded ? 'expanded' : ''}`}>
              <div
                className="compile-section-header"
                onClick={() => toggleSection(sec.number)}
              >
                <div className="section-header-left">
                  <span className="section-num-tag">{sec.number}</span>
                  <div className="section-title-wrap">
                    <h4>{sec.title}</h4>
                    <div className="section-meta-tags">
                      <span className={`scope-pill ${isCommon ? 'common' : 'faculty'}`}>
                        {isCommon ? 'Common (Coordinator)' : 'Faculty-Specific'}
                      </span>
                      {isOptional && <span className="scope-pill optional">Optional Section</span>}
                      <span className="file-count-pill">{filesList.length} file{filesList.length !== 1 ? 's' : ''} attached</span>
                    </div>
                  </div>
                </div>

                <div className="section-header-right">
                  <StatusBadge status={sectionStatus} />
                  <button className="expand-btn">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="compile-section-body">
                  {filesList.length === 0 ? (
                    <div className="compile-empty-section">
                      <AlertTriangle size={18} className="text-warning" />
                      <span>
                        {isOptional
                          ? 'No additional documents submitted for this optional section.'
                          : isCommon
                            ? 'No coordinator document uploaded yet for this common section.'
                            : 'No submissions received from assigned faculty members for this section.'}
                      </span>
                    </div>
                  ) : (
                    <div className="compile-files-table">
                      <div className="compile-file-header-row">
                        <span>Document Name</span>
                        <span>Source / Section</span>
                        <span>Size</span>
                        <span>Date Added</span>
                        <span>Actions</span>
                      </div>
                      {filesList.map((file, idx) => (
                        <div key={file.id || idx} className="compile-file-row">
                          <div className="compile-file-name">
                            <FileText size={16} className="text-primary" />
                            <span>{file.name}</span>
                          </div>
                          <div className="compile-file-source">
                            <span className="source-tag">{file.uploader}</span>
                          </div>
                          <div className="compile-file-size">{file.size}</div>
                          <div className="compile-file-date">{file.uploadDate}</div>
                          <div className="compile-file-actions">
                            <button
                              className="btn btn-xs btn-ghost"
                              title="Preview Document"
                              onClick={() => setPreviewFile(file)}
                            >
                              <Eye size={14} /> Preview
                            </button>
                            <a
                              href={`#download-${file.name}`}
                              className="btn btn-xs btn-ghost"
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`Downloading official dossier document: ${file.name}`);
                              }}
                            >
                              <Download size={14} /> Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Export Dialog Modal */}
      {exportModal && (
        <div className="modal-backdrop" onClick={() => setExportModal(null)}>
          <div className="modal-content export-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                {exportModal === 'pdf' ? <Printer size={22} className="text-primary" /> : <FileText size={22} className="text-primary" />}
                <h3>{exportModal === 'pdf' ? 'Export Course File as PDF' : 'Export Course File as Word Document (.docx)'}</h3>
              </div>
              <button className="modal-close" onClick={() => setExportModal(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="export-preview-summary">
                <div className="export-dossier-cover">
                  <div className="dossier-bmu-crest">BMU</div>
                  <div className="dossier-title">BML MUNJAL UNIVERSITY</div>
                  <div className="dossier-sub">{offering.course.school}</div>
                  <div className="dossier-h1">OFFICIAL COURSE DOSSIER</div>
                  <div className="dossier-course-info">
                    <strong>{offering.course.code}: {offering.course.title}</strong>
                    <p>Academic Year: {offering.academicYear} | {offering.semester}</p>
                    <p>Coordinator: {user.name}</p>
                    <p>Faculty: {offering.sections.map(s => `${s.faculty.name} (${s.name})`).join(', ')}</p>
                  </div>
                  <div className="dossier-footer">
                    <span>Standard 25-Point Academic Audit Template</span>
                  </div>
                </div>

                <div className="export-settings">
                  <h4>Compilation Scope & Options</h4>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    Include Course Dossier Cover Page & Metadata
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    Generate Section-wise Table of Contents
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    Include Coordinator Common Documents (Points 1–11)
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    Include Faculty Submissions (Points 12–25) tagged by Section
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    Include Coordinator Approval & Audit Sign-off Sheet
                  </label>

                  <div className="export-status-alert">
                    <Info size={18} />
                    <div>
                      <strong>Client-Side Compilation Notice:</strong>
                      <p>
                        In this frontend demonstration, clicking Generate initiates a structured client-side dossier manifest download ({exportModal === 'pdf' ? `${offering.course.code}_CourseFile_2026.pdf` : `${offering.course.code}_CourseFile_2026.docx`}). Full binary multi-document merging and watermarking will be executed by the backend document processing microservice.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setExportModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert(`Compilation initiated for ${offering.course.code} Course File (${exportModal.toUpperCase()}). The compiled document manifest has been prepared.`);
                  setExportModal(null);
                }}
              >
                <Download size={16} />
                Generate & Download {exportModal.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <Modal open={!!previewFile} onClose={() => setPreviewFile(null)} title="Dossier Document Preview">
        {previewFile && (
          <div className="file-preview-content">
            <div className="preview-placeholder">
              <FileText size={48} className="text-primary" />
              <h3>{previewFile.name}</h3>
              <p>Attached under official course file compilation dossier.</p>
              <p className="preview-meta">
                Source: <strong>{previewFile.uploader}</strong> · Type: {previewFile.type} · Size: {previewFile.size}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

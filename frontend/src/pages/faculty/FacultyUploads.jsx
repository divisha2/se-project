import { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  COURSE_OFFERINGS, TEMPLATE_SECTIONS, FACULTY_UPLOADS
} from '../../data/mockData';
import { StatusBadge, FileIcon, Modal } from '../../components/SharedComponents';
import {
  Upload, FileText, Download, Eye, Trash2, RefreshCw,
  CheckCircle, AlertTriangle, ChevronDown, ChevronRight, MessageSquare
} from 'lucide-react';

export default function FacultyUploads() {
  const { user } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const myOfferings = COURSE_OFFERINGS.filter(o =>
    o.sections.some(s => s.facultyId === user.id)
  );

  const [selectedOffering, setSelectedOffering] = useState(
    location.state?.offeringId || myOfferings[0]?.id || null
  );
  const [uploads, setUploads] = useState(() => {
    // Deep clone initial data
    const clone = {};
    Object.entries(FACULTY_UPLOADS).forEach(([oId, facMap]) => {
      clone[oId] = {};
      Object.entries(facMap).forEach(([fId, sections]) => {
        clone[oId][fId] = {};
        Object.entries(sections).forEach(([sNum, data]) => {
          clone[oId][fId][sNum] = { ...data, files: [...data.files] };
        });
      });
    });
    return clone;
  });
  const [expandedSection, setExpandedSection] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const offering = COURSE_OFFERINGS.find(o => o.id === selectedOffering);
  const facultySections = TEMPLATE_SECTIONS.filter(s => s.number >= 12 && s.number <= 25);

  const getUpload = (secNum) => {
    return uploads[selectedOffering]?.[user.id]?.[secNum] || { status: 'MISSING', files: [], feedback: null };
  };

  const handleFileSelect = (secNum) => {
    setUploadTarget(secNum);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !uploadTarget) return;

    setUploads(prev => {
      const next = { ...prev };
      if (!next[selectedOffering]) next[selectedOffering] = {};
      if (!next[selectedOffering][user.id]) next[selectedOffering][user.id] = {};
      const current = next[selectedOffering][user.id][uploadTarget] || { status: 'MISSING', files: [], feedback: null };

      const newFiles = files.map(f => ({
        id: Math.random().toString(36).substring(2, 9),
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
        uploadDate: new Date().toISOString().split('T')[0],
      }));

      next[selectedOffering][user.id] = {
        ...next[selectedOffering][user.id],
        [uploadTarget]: {
          ...current,
          status: 'SUBMITTED',
          files: [...current.files, ...newFiles],
        }
      };
      return next;
    });

    e.target.value = '';
    setUploadTarget(null);
  };

  const handleRemoveFile = (secNum, fileId) => {
    setUploads(prev => {
      const next = { ...prev };
      const current = next[selectedOffering]?.[user.id]?.[secNum];
      if (!current) return prev;
      const newFiles = current.files.filter(f => f.id !== fileId);
      next[selectedOffering][user.id][secNum] = {
        ...current,
        files: newFiles,
        status: newFiles.length === 0 ? 'MISSING' : current.status,
      };
      return next;
    });
  };

  const handleReplaceFile = (secNum) => {
    setUploads(prev => {
      const next = { ...prev };
      if (next[selectedOffering]?.[user.id]?.[secNum]) {
        next[selectedOffering][user.id][secNum] = {
          ...next[selectedOffering][user.id][secNum],
          files: [],
          status: 'MISSING',
        };
      }
      return next;
    });
    setTimeout(() => handleFileSelect(secNum), 100);
  };

  return (
    <div className="page-faculty-uploads">
      <div className="page-header">
        <div>
          <h1>Upload Documents</h1>
          <p className="page-subtitle">Submit course file documents for your assigned sections (Points 12–25)</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png"
      />

      {myOfferings.length > 1 && (
        <div className="card course-selector-card">
          <div className="card-body">
            <div className="form-group">
              <label>Select Course</label>
              <select value={selectedOffering || ''} onChange={e => { setSelectedOffering(Number(e.target.value)); setExpandedSection(null); }}>
                {myOfferings.map(o => {
                  const sec = o.sections.find(s => s.facultyId === user.id);
                  return <option key={o.id} value={o.id}>{o.course.code} — {o.course.title} ({sec?.name})</option>;
                })}
              </select>
            </div>
          </div>
        </div>
      )}

      {offering && (
        <div className="upload-sections">
          {facultySections.map(sec => {
            const upload = getUpload(sec.number);
            const isExpanded = expandedSection === sec.number;
            const isMandatory = sec.mandatory;

            return (
              <div key={sec.number} className={`upload-section-card ${isExpanded ? 'expanded' : ''} status-${upload.status.toLowerCase().replace('_', '-')}`}>
                <div
                  className="upload-section-header"
                  onClick={() => setExpandedSection(isExpanded ? null : sec.number)}
                >
                  <div className="section-header-left">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <span className="section-number">{sec.number}</span>
                    <div className="section-info">
                      <span className="section-title-text">{sec.title}</span>
                      <div className="section-tags">
                        {isMandatory ? <span className="tag mandatory">Mandatory</span> : <span className="tag optional">Optional</span>}
                        {upload.files.length > 0 && <span className="tag files">{upload.files.length} file{upload.files.length > 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={upload.status} />
                </div>

                {isExpanded && (
                  <div className="upload-section-body">
                    {upload.feedback && (
                      <div className="feedback-banner">
                        <MessageSquare size={16} />
                        <div>
                          <strong>Coordinator Feedback:</strong>
                          <p>{upload.feedback}</p>
                        </div>
                      </div>
                    )}

                    {upload.files.length > 0 && (
                      <div className="file-list">
                        {upload.files.map(file => (
                          <div key={file.id} className="file-item">
                            <FileIcon type={file.type} />
                            <div className="file-details">
                              <span className="file-name">{file.name}</span>
                              <span className="file-meta">{file.size} · Uploaded {file.uploadDate}</span>
                            </div>
                            <div className="file-actions">
                              <button className="icon-btn" title="Preview" onClick={() => setPreviewFile(file)}>
                                <Eye size={16} />
                              </button>
                              <button className="icon-btn" title="Download">
                                <Download size={16} />
                              </button>
                              <button
                                className="icon-btn danger"
                                title="Remove"
                                onClick={() => handleRemoveFile(sec.number, file.id)}
                                disabled={upload.status === 'APPROVED'}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="upload-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleFileSelect(sec.number)}
                        disabled={upload.status === 'APPROVED'}
                      >
                        <Upload size={16} />
                        <span>{upload.files.length > 0 ? 'Add More Files' : 'Upload Files'}</span>
                      </button>
                      {upload.files.length > 0 && upload.status !== 'APPROVED' && (
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleReplaceFile(sec.number)}
                        >
                          <RefreshCw size={16} />
                          <span>Replace All</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!previewFile} onClose={() => setPreviewFile(null)} title="File Preview">
        {previewFile && (
          <div className="file-preview-content">
            <div className="preview-placeholder">
              <FileText size={64} />
              <h3>{previewFile.name}</h3>
              <p>File preview is not available in this demo.</p>
              <p className="preview-meta">Type: {previewFile.type} · Size: {previewFile.size}</p>
              <button className="btn btn-primary" onClick={() => setPreviewFile(null)}>
                <Download size={16} />
                <span>Download Instead</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

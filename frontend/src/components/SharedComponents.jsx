export function StatusBadge({ status }) {
  const config = {
    MISSING: { label: 'Missing', className: 'badge-missing' },
    SUBMITTED: { label: 'Submitted', className: 'badge-submitted' },
    UNDER_REVIEW: { label: 'Under Review', className: 'badge-review' },
    APPROVED: { label: 'Approved', className: 'badge-approved' },
    CORRECTION_REQUIRED: { label: 'Correction Required', className: 'badge-correction' },
    ACTIVE: { label: 'Active', className: 'badge-approved' },
    PLANNED: { label: 'Planned', className: 'badge-review' },
    COMPLETED: { label: 'Completed', className: 'badge-submitted' },
    PENDING: { label: 'Pending', className: 'badge-review' },
  };
  const c = config[status] || { label: status, className: 'badge-default' };
  return <span className={`status-badge ${c.className}`}>{c.label}</span>;
}

export function ProgressBar({ value, size = 'md', showLabel = true }) {
  const pct = Math.min(100, Math.max(0, value));
  let color = 'var(--progress-low)';
  if (pct >= 75) color = 'var(--progress-high)';
  else if (pct >= 40) color = 'var(--progress-mid)';

  return (
    <div className={`progress-container progress-${size}`}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }}></div>
      </div>
      {showLabel && <span className="progress-label">{Math.round(pct)}%</span>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, accent = 'primary' }) {
  return (
    <div className={`stat-card stat-${accent}`}>
      <div className="stat-icon">
        <Icon size={22} />
      </div>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={48} />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}

export function FileIcon({ type }) {
  const ext = type || '';
  if (ext.includes('pdf')) return <span className="file-icon pdf">PDF</span>;
  if (ext.includes('word') || ext.includes('docx')) return <span className="file-icon doc">DOC</span>;
  if (ext.includes('sheet') || ext.includes('xlsx') || ext.includes('excel')) return <span className="file-icon xls">XLS</span>;
  if (ext.includes('image') || ext.includes('png') || ext.includes('jpg')) return <span className="file-icon img">IMG</span>;
  return <span className="file-icon other">FILE</span>;
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal-${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

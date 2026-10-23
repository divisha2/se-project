import { useState } from 'react';
import {
  COURSE_OFFERINGS, COURSES, USERS as ALL_USERS, ACADEMIC_YEARS, SEMESTERS
} from '../../data/mockData';
import { Modal, StatusBadge, ProgressBar } from '../../components/SharedComponents';
import { Plus, Search, Eye, Edit2, Trash2, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';

export default function AdminAssignments() {
  const [offerings, setOfferings] = useState([...COURSE_OFFERINGS]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(null);
  const [form, setForm] = useState({
    courseId: '', academicYear: '2026-2027', semester: 'Odd Semester (Fall)',
    coordinatorId: '', sections: [{ name: 'Section A', facultyId: '' }]
  });

  const faculty = ALL_USERS.filter(u => u.role === 'faculty');
  const coordinators = ALL_USERS.filter(u => u.role === 'coordinator');

  const filtered = offerings.filter(o =>
    o.course.code.toLowerCase().includes(search.toLowerCase()) ||
    o.course.title.toLowerCase().includes(search.toLowerCase()) ||
    o.coordinator.name.toLowerCase().includes(search.toLowerCase())
  );

  const addSection = () => {
    const letters = 'ABCDEFGH';
    const nextLetter = letters[form.sections.length] || `${form.sections.length + 1}`;
    setForm({ ...form, sections: [...form.sections, { name: `Section ${nextLetter}`, facultyId: '' }] });
  };

  const removeSection = (idx) => {
    setForm({ ...form, sections: form.sections.filter((_, i) => i !== idx) });
  };

  const handleCreate = () => {
    const course = COURSES.find(c => c.id === Number(form.courseId));
    const coordinator = ALL_USERS.find(u => u.id === Number(form.coordinatorId));
    if (!course || !coordinator) return;

    const newOffering = {
      id: Date.now(),
      courseId: course.id,
      course,
      academicYear: form.academicYear,
      semester: form.semester,
      coordinatorId: coordinator.id,
      coordinator,
      status: 'ACTIVE',
      sections: form.sections.map((s, i) => {
        const fac = ALL_USERS.find(u => u.id === Number(s.facultyId));
        return { id: Date.now() + i, name: s.name, facultyId: fac?.id, faculty: fac };
      }).filter(s => s.faculty),
      completionPct: 0,
    };
    setOfferings(prev => [...prev, newOffering]);
    setModalOpen(false);
  };

  return (
    <div className="page-admin-assignments">
      <div className="page-header">
        <div>
          <h1>Course Assignments</h1>
          <p className="page-subtitle">Assign coordinators and faculty to course offerings</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({ courseId: '', academicYear: '2026-2027', semester: 'Odd Semester (Fall)', coordinatorId: '', sections: [{ name: 'Section A', facultyId: '' }] });
          setModalOpen(true);
        }}>
          <Plus size={18} />
          <span>New Assignment</span>
        </button>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input placeholder="Search assignments…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="card-body">
          {filtered.map(offering => (
            <div key={offering.id} className="assignment-card">
              <div
                className="assignment-header"
                onClick={() => setDetailOpen(detailOpen === offering.id ? null : offering.id)}
              >
                <div className="assignment-left">
                  {detailOpen === offering.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <div>
                    <div className="assignment-title">
                      <span className="code-badge">{offering.course.code}</span>
                      <span>{offering.course.title}</span>
                    </div>
                    <div className="assignment-meta">
                      {offering.academicYear} · {offering.semester}
                    </div>
                  </div>
                </div>
                <div className="assignment-right">
                  <ProgressBar value={offering.completionPct} size="sm" />
                  <StatusBadge status={offering.status} />
                </div>
              </div>
              {detailOpen === offering.id && (
                <div className="assignment-detail">
                  <div className="detail-grid">
                    <div className="detail-section">
                      <h4>Course Coordinator</h4>
                      <div className="detail-user">
                        <div className="avatar sm">{offering.coordinator.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <div>
                          <p>{offering.coordinator.name}</p>
                          <small>{offering.coordinator.email}</small>
                        </div>
                      </div>
                    </div>
                    <div className="detail-section">
                      <h4>Assigned Faculty</h4>
                      {offering.sections.map(sec => (
                        <div key={sec.id} className="detail-faculty-row">
                          <span className="section-tag">{sec.name}</span>
                          <div className="detail-user">
                            <div className="avatar sm">{sec.faculty.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                            <div>
                              <p>{sec.faculty.name}</p>
                              <small>{sec.faculty.designation}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="detail-section">
                      <h4>Details</h4>
                      <div className="detail-info-grid">
                        <div><span className="detail-label">Academic Year</span><span>{offering.academicYear}</span></div>
                        <div><span className="detail-label">Semester</span><span>{offering.semester}</span></div>
                        <div><span className="detail-label">Program</span><span>{offering.course.programName}</span></div>
                        <div><span className="detail-label">Credits</span><span>{offering.course.credits}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-cell" style={{padding: '2rem', textAlign: 'center'}}>No assignments found</div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Course Assignment" size="lg">
        <div className="form-stack">
          <div className="form-group">
            <label>Course</label>
            <select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select a course</option>
              {COURSES.map(c => <option key={c.id} value={c.id}>{c.code} — {c.title}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Academic Year</label>
              <select value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })}>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Semester</label>
              <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Course Coordinator</label>
            <select value={form.coordinatorId} onChange={e => setForm({ ...form, coordinatorId: e.target.value })}>
              <option value="">Select coordinator</option>
              {coordinators.map(c => <option key={c.id} value={c.id}>{c.name} ({c.employeeId})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Sections & Faculty</label>
            {form.sections.map((sec, i) => (
              <div key={i} className="section-row">
                <input
                  value={sec.name}
                  onChange={e => {
                    const arr = [...form.sections];
                    arr[i] = { ...arr[i], name: e.target.value };
                    setForm({ ...form, sections: arr });
                  }}
                  placeholder="Section name"
                  className="section-name-input"
                />
                <select
                  value={sec.facultyId}
                  onChange={e => {
                    const arr = [...form.sections];
                    arr[i] = { ...arr[i], facultyId: e.target.value };
                    setForm({ ...form, sections: arr });
                  }}
                >
                  <option value="">Assign faculty</option>
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {form.sections.length > 1 && (
                  <button className="icon-btn danger" onClick={() => removeSection(i)} title="Remove">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button className="btn btn-sm btn-secondary" onClick={addSection} style={{ marginTop: '0.5rem' }}>
              <UserPlus size={16} />
              <span>Add Section</span>
            </button>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}>Create Assignment</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

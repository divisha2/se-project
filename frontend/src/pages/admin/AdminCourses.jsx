import { useState } from 'react';
import { COURSES } from '../../data/mockData';
import { Modal } from '../../components/SharedComponents';
import { Plus, Search, Edit2, Trash2, BookOpen } from 'lucide-react';

export default function AdminCourses() {
  const [courses, setCourses] = useState([...COURSES]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({ code: '', title: '', credits: 3, programName: '', school: '' });

  const filtered = courses.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditCourse(null);
    setForm({ code: '', title: '', credits: 3, programName: '', school: '' });
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setForm({ code: c.code, title: c.title, credits: c.credits, programName: c.programName, school: c.school });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editCourse) {
      setCourses(prev => prev.map(c => c.id === editCourse.id ? { ...c, ...form } : c));
    } else {
      const newCourse = { id: Date.now(), ...form, programId: 1 };
      setCourses(prev => [...prev, newCourse]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="page-admin-courses">
      <div className="page-header">
        <div>
          <h1>Courses</h1>
          <p className="page-subtitle">Manage all courses offered at BML Munjal University</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} />
          <span>Add Course</span>
        </button>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search courses by code or title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Credits</th>
                <th>Program</th>
                <th>School</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><span className="code-badge">{c.code}</span></td>
                  <td>{c.title}</td>
                  <td>{c.credits}</td>
                  <td>{c.programName}</td>
                  <td>{c.school}</td>
                  <td>
                    <div className="action-btns">
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(c)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="empty-cell">No courses found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editCourse ? 'Edit Course' : 'Add New Course'}>
        <div className="form-stack">
          <div className="form-group">
            <label>Course Code</label>
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g., CSE2001" />
          </div>
          <div className="form-group">
            <label>Course Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Data Structures and Algorithms" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Credits</label>
              <input type="number" value={form.credits} onChange={e => setForm({ ...form, credits: Number(e.target.value) })} min={1} max={6} />
            </div>
            <div className="form-group">
              <label>School</label>
              <select value={form.school} onChange={e => setForm({ ...form, school: e.target.value })}>
                <option value="">Select School</option>
                <option value="SOET">SOET</option>
                <option value="SOM">SOM</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Program</label>
            <select value={form.programName} onChange={e => setForm({ ...form, programName: e.target.value })}>
              <option value="">Select Program</option>
              <option value="B.Tech CSE">B.Tech CSE</option>
              <option value="B.Tech ECE">B.Tech ECE</option>
              <option value="BBA">BBA</option>
              <option value="MBA">MBA</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editCourse ? 'Update' : 'Add'} Course
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

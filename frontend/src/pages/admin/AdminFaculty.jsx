import { useState } from 'react';
import { USERS as ALL_USERS } from '../../data/mockData';
import { Modal } from '../../components/SharedComponents';
import { Plus, Search, Edit2, Trash2, Mail, Phone } from 'lucide-react';

export default function AdminFaculty() {
  const [users, setUsers] = useState(ALL_USERS.filter(u => u.role !== 'admin'));
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'faculty', department: '', designation: '', employeeId: '' });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: '', email: '', role: 'faculty', department: '', designation: '', employeeId: '' });
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, department: u.department, designation: u.designation, employeeId: u.employeeId });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...form } : u));
    } else {
      const newUser = { id: Date.now(), ...form, password: 'password123' };
      setUsers(prev => [...prev, newUser]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const roleLabel = { faculty: 'Faculty', coordinator: 'Coordinator' };

  return (
    <div className="page-admin-faculty">
      <div className="page-header">
        <div>
          <h1>Faculty & Staff</h1>
          <p className="page-subtitle">Manage faculty members and course coordinators</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={18} />
          <span>Add Faculty</span>
        </button>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td><span className="code-badge">{u.employeeId}</span></td>
                  <td>
                    <div className="cell-user">
                      <div className="avatar sm">{u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.department}</td>
                  <td>{u.designation}</td>
                  <td><span className={`role-badge role-${u.role}`}>{roleLabel[u.role]}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(u)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(u.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="empty-cell">No faculty found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Edit Faculty' : 'Add New Faculty'}>
        <div className="form-stack">
          <div className="form-row">
            <div className="form-group">
              <label>Employee ID</label>
              <input value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} placeholder="BMU-FAC-XXXX" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="faculty">Faculty</option>
                <option value="coordinator">Course Coordinator</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Dr. Full Name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@bmu.edu.in" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                <option value="">Select</option>
                <option value="School of Engineering and Technology">SOET</option>
                <option value="School of Management">SOM</option>
                <option value="School of Law">SOL</option>
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <select value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}>
                <option value="">Select</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editUser ? 'Update' : 'Add'} Faculty
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

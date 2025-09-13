import React, { useState, useEffect } from 'react';

const EditUserRole = ({ isVisible, onClose, user, onUpdate }) => {
  const token = localStorage.getItem('token');
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ role_id: "" });

  // Load roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch('/api/roleofuser', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setRoles(data);
      } catch (err) { console.error(err); }
    }
    fetchRoles();
  }, [token]);

  // Set initial role
  useEffect(() => {
    if (user) setForm({ role_id: user.role.id });
  }, [user]);

  const handleChange = e => setForm({ role_id: Number(e.target.value) });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('/api/updateRole', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id, role_id: form.role_id }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      const updatedUser = await res.json();
      onUpdate(updatedUser.user); // update table
      onClose();
    } catch (err) {
      console.error(err);
      alert('อัปเดต role ไม่สำเร็จ');
    }
  };

  if (!isVisible || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">แก้ไขสิทธิ์ผู้ใช้งาน</h2>
        <div className="mb-4">ชื่อผู้ใช้: {user.firstname}</div>
        <div className="mb-4">อีเมล: {user.email}</div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label>สิทธิ์</label>
            <select value={form.role_id} onChange={handleChange} className="w-full border p-2 rounded" required>
              <option value="">-- เลือก role --</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-purple-700 text-white py-2 rounded">บันทึก</button>
        </form>
      </div>
    </div>
  );
};

export default EditUserRole;

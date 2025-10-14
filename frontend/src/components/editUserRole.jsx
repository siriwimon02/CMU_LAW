import React, { useState, useEffect } from 'react';

const EditUserRole = ({ isVisible, onClose, user, onUpdate }) => {
  const token = localStorage.getItem('token');
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ role_id: "" });

  useEffect(() => {
    if (user) setForm({ role_id: user.rId });
  }, [user]); 

  // fetch roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch('/api/roleofuser', {
          headers: { Authorization: token } // ตรงกับ backend
        });
        const data = await res.json();
        setRoles(data);
      } catch (err) { console.error(err); }
    }
    fetchRoles();
  }, [token]);

  const handleChange = e => setForm({ role_id: Number(e.target.value) });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`/petitionAdmin/updateRole/${user.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `${token}`
        },
        body: JSON.stringify({ role_id: form.role_id }),
      });
      if (!res.ok) throw new Error('Failed to update role');

      await onUpdate();   // parent ควรทำ refreshUser() ข้างใน
      onClose();
    } catch (err) {
      console.error(err);
      alert('อัปเดต role ไม่สำเร็จ');
    }
  };

  if (!isVisible || !user) return null;

  return (
    <div className="fixed font-kanit inset-0 bg-black/40 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">แก้ไขสิทธิ์ผู้ใช้งาน</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
          <div className="mb-3">
            <label className="block text-[#808080]">ชื่อผู้ใช้</label>
            <label className="block">{user.firstname}</label>
          </div>

          <div className="mb-3">
            <label className="block text-[#808080]">อีเมล</label>
            <label className="block">{user.email}</label>
          </div>

        <form onSubmit={handleSubmit}>
          <div className="mt-3 mb-3">
            <label className='text-[#808080]'>สิทธิ์</label>
            <select value={form.role_id} onChange={handleChange} className="w-full mt-3 border p-2 rounded" required>
              <option value="">-- เลือก role --</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-[#66009F] text-white py-2 rounded-md border border-[#A6A6A6] shadow-md hover:bg-white hover:text-[#66009F] transition-colors">บันทึก</button>
        </form>
      </div>
    </div>
  );
};

export default EditUserRole;

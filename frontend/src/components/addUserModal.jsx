import React, { useState, useEffect } from 'react';

const AddUserModal = ({ isVisible, onClose, onAddUser }) => {
  const token = localStorage.getItem('token');
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ firstname: '', email: '', role_id: '' });

  // ดึง roles จาก backend
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch('/api/roleofuser', {
          headers: { Authorization: `${token}` } // <-- Bearer token
        });
        if (!res.ok) throw new Error('Failed to fetch roles');
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error(err);
        alert('ไม่สามารถดึงรายชื่อสิทธิ์ได้');
      }
    }
    fetchRoles();
  }, [token]);

  // update form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'role_id' ? Number(value) : value  // role_id เป็น number
    }));
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/user', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `${token}`
          },
          body: JSON.stringify({
            firstname: form.firstname,
            email: form.email,
            role_id: form.role_id
          })
        });

        if (!res.ok) throw new Error('Failed to add user');

        const newUser = await res.json();
        onAddUser(newUser);
        onClose();
      } catch (err) {
        console.error(err);
        alert('สร้างผู้ใช้ไม่สำเร็จ');
      }
  };


  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center font-kanit z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">เพิ่มผู้ใช้งานใหม่</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">ชื่อผู้ใช้</label>
            <input
              name="firstname"
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="ระบุชื่อผู้ใช้"
              value={form.firstname}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">อีเมล</label>
            <input
              name="email"
              type="email"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="ระบุอีเมล"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">สิทธิ์</label>
            <select
              name="role_id"
              value={form.role_id}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">-- เลือก role --</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-[#66009F] text-white py-2 rounded-md border border-[#A6A6A6] shadow-md hover:bg-white hover:text-[#66009F] transition-colors"
          >
            บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;

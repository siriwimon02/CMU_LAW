import React, { useState, useEffect } from 'react';

const API_BASE = import.meta?.env?.VITE_API_BASE || 'http://localhost:3001';

const AddUserModal = ({ isVisible, onClose, onAddUser }) => {
  const token = localStorage.getItem('token');
  const [roles, setRoles] = useState([]);
  const [dep, setDep] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',      
    email: '',
    depName: '',       
    role_id: ''
  });

  useEffect(() => {
    if (!isVisible) return; // เปิด modal ค่อยโหลด roles เพื่อลด call เกินจำเป็น
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/petitionAdmin/api/roleAuditor`, {
          headers: { Authorization: `Bearer ${token}` } // ✅ Bearer
        });
        if (!res.ok) throw new Error('Failed to fetch roles');

        const res2 = await fetch('/api/destination', {
          headers: { Authorization: `Bearer ${token}` } 
        }) 

        if (!res2.ok) throw new Error('Failed to fetch department');

        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);

        const dep = await res2.json();
        setDep(dep);

      } catch (err) {
        console.error(err);
        alert('ไม่สามารถดึงรายชื่อสิทธิ์ได้');
      }
    })();
  }, [isVisible, token]);


  console.log(dep);



  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'role_id' ? Number(value) : value  // ✅ role_id เป็น number
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/petitionAdmin/add_role_staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` // ✅ Bearer
        },
        body: JSON.stringify({
          fname: form.firstname,
          lname: form.lastname,
          depName: form.depName,   // ✅ ตรงชื่อคีย์ที่ backend รอ
          role_id: form.role_id,
          email: form.email
        })
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        console.error('Add user failed:', res.status, t);
        throw new Error('Failed to add user');
      }

      await res.json();
      await onAddUser();

      // รีเซ็ตฟอร์มแล้วปิด
      setForm({ firstname: '', lastname: '', email: '', depName: '', role_id: '' });
      onClose();
    } catch (err) {
      console.error(err);
      alert('สร้างผู้ใช้ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center font-kanit z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">เพิ่มผู้ใช้งานใหม่</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors" type="button">
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
            <label className="block text-gray-700 mb-2">นามสกุลผู้ใช้</label>
            <input
              name="lastname"            // ✅ ชื่อถูก
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="ระบุนามสกุลผู้ใช้"
              value={form.lastname}
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
            <label className="block text-gray-700 mb-2">หน่วยงานของเจ้าหน้าที่</label>
            <select
              name="depName"
              value={form.depName}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">-- เลือกหน่วยงาน --</option>
              {(dep || []).map(d => (
                <option key={d.id} value={d.des_name}>{d.des_name}</option>
              ))}
            </select>
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
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.role_name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#66009F] text-white py-2 rounded-md border border-[#A6A6A6] shadow-md hover:bg-white hover:text-[#66009F] transition-colors disabled:opacity-60"
          >
            {submitting ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;

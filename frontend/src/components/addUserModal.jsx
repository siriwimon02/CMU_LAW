import React from 'react';

const AddUserModal = ({ isVisible, onClose}) => {
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

        {/* Modal Content */}
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">ชื่อผู้ใช้</label>
            <input type="text" className="w-full px-3 py-2 border rounded-md" placeholder="ระบุชื่อผู้ใช้" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">อีเมล</label>
            <input type="email" className="w-full px-3 py-2 border rounded-md" placeholder="ระบุอีเมล" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">สิทธิ์</label>
            <select className="w-full px-3 py-2 border rounded-md">
              <option>User ทั่วไป</option>
              <option>ผู้ตรวจสอบเอกสาร</option>
              <option>ผู้อำนวยการกอง</option>
              <option>อธิการบดี</option>
              <option>Admin ผู้ดูแลระบบ</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-[#66009F] text-white py-2 rounded-md hover:bg-[#4d007a] transition-colors">
            บันทึกการเปลี่ยนแปลง
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
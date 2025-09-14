import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

function Seendorser() {
  const [userInfo, setUserInfo] = useState(null);
  const [status, setStatus] = useState('pending');

  // ข้อมูลที่จะแสดงบนการ์ดจะเปลี่ยนตามสถานะ
  const cardData = {
    pending: {
      id: 'POA-2025-0818-1631',
      name: 'Siriwimon Y.',
      date: '18 ส.ค. 2025',
      label: 'รอคัดกรอง',
      color: '#f59e0b',
    },
    forwarded: {
      id: 'POA-2025-0819-1122',
      name: 'Somchai T.',
      date: '19 ส.ค. 2025',
      label: 'ส่งไปหน่วยงานอื่นแล้ว',
      color: '#0078E2', 
    },
    reviewer: {
      id: 'POA-2025-0820-1455',
      name: 'Pranee K.',
      date: '20 ส.ค. 2025',
      label: 'ส่งต่อไปที่ผู้ตรวจสอบแล้ว',
      color: '#05A967',
    },
  };

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handleBack = () => navigate(-1);

  // ปุ่มด้านบน
  const handleBackToPending = () => setStatus('pending');
  const handleSendToOtherDept = () => setStatus('forwarded');
  const handleSendToReviewer = () => setStatus('reviewer');

  if (!token) {
    alert('Please Login or SignIn First!!!');
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetch('http://localhost:3001/auth/user', {
      headers: { Authorization: `${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUserInfo(data))
      .catch((err) => console.error(err));
  }, [token]);

  if (!userInfo) return <div>Loading...</div>;

  const { id, name, date, label, color } = cardData[status];

  return (
    <div className="min-h-screen font-kanit bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white text-gray-800 px-5 py-4">
        <div className="mx-auto flex items-center justify-between">
          <img src="/images/Logo.svg" alt="Logo" className="w-[150px] h-[50px] object-contain" />
          <button
            onClick={handleBack}
            className="bg-[#66009F] w-10 h-10 flex items-center justify-center rounded-xl shadow hover:bg-[#4A0073] transition"
            title="ย้อนกลับ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 className="w-5 h-5" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Banner */}
      <div className="bg-[#66009F] w-full h-64 mt-2 flex flex-col items-center justify-center text-center px-4">
        <p className="text-white font-bold text-3xl">ระบบบริหารจัดการหนังสือมอบอำนาจออนไลน์</p>
        <p className="text-white text-lg mt-4">จัดการคำขอมอบอำนาจ ติดตามสถานะ และอนุมัติเอกสารได้อย่างมีประสิทธิภาพ</p>
      </div>

      {/* ปุ่มสถานะเอาชิดซ้ายเด้อ */}
      <div className="w-full px-6 mt-6 flex gap-4">
        {/* รอคัดกรอง */}
        <button
          onClick={handleBackToPending}
          className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow hover:bg-gray-50 flex items-center gap-2"
        >
        
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#66009F]">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          รอคัดกรอง
        </button>

        {/* ส่งไปยังหน่วยงานอื่น */}
        <button
          onClick={handleSendToOtherDept}
          className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow hover:bg-gray-50 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#66009F]">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          ส่งไปยังหน่วยงานอื่น
        </button>

        {/* ส่งต่อไปที่ผู้ตรวจสอบ */}
        <button
          onClick={handleSendToReviewer}
          className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow hover:bg-gray-50 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
               strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#66009F]">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          ส่งต่อไปที่ผู้ตรวจสอบ
        </button>
      </div>

      {/* การ์ดข้อมูลเอกสาร */}
      <div className="w-full px-6 mt-6">
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 shadow-md">
          <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4">
            {/* ซ้าย: ข้อมูล */}
            <div className="leading-6">
              <p className="font-semibold text-lg text-gray-900">เลขที่คำขอ: {id}</p>
              <p className="text-gray-800">ผู้ยื่นคำขอ: {name}</p>
              <p className="text-gray-800">วันที่ยื่นคำขอ: {date}</p>
              <p className="font-regular mt-1" style={{ color }}>{label}</p>
            </div>

            {/* ขวา: ปุ่มกด */}
            <div className="flex items-center gap-4">
              {/* ดูรายละเอียด(อยู่ทุกสถานะ) */}
              <button className="bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 shadow-md hover:bg-gray-50 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-3.6-3.6" strokeLinecap="round" />
                </svg>
                ดูรายละเอียด
              </button>

              {/* ปุ่มต่อการทำงานนะจ๊ะ แสดงเฉพาะตอนpending */}
              {status === 'pending' && (
                <>
                  <button
                    onClick={handleSendToOtherDept}
                    className="bg-[#0078E2] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#0060b5] flex items-center gap-2"
                  >
                    {/* ไอคอนสีขาวบนปุ่มน้ำเงิน */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    ส่งไปยังหน่วยงานอื่น
                  </button>

                  <button
                    onClick={handleSendToReviewer}
                    className="bg-[#2E7D32] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#1B5E20] flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                         strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    ส่งต่อไปที่ผู้ตรวจสอบ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}

export default Seendorser;


import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function History() {
  const [userInfo, setUserInfo] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  //ถ้าไม่ได้ Login เข้าไม่ได้

  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetch('http://localhost:3001/auth/user', {
      headers: {
        'Authorization': `${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUserInfo(data);
      })
      .catch(err => {
        console.error(err);
      });
  }, [token]);

  console.log(userInfo);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href='/login';
  }

  const ClicktoPetition = () => {
    navigate('/formpetition');
  }

  const ClickToTracking = () => {
    navigate('/tracking');
  }

  const ClicktoWatchPetition = () =>{
    navigate('/petition');
  }

  const ClicktoAdminedit = () => {
    navigate('/admin_panel');
  }


  if (!userInfo) {
    return <div>Loading...</div>;  // หรือ แสดง loading ขณะรอข้อมูล
  }

    

  return (
    <div className="min-h-screen font-kanit bg-[#F8F8F8]">
        <div className="flex justify-between items-center w-full px-5 py-4">
            <img
                src="/images/Logo.svg"
                alt="Logo"
                className="w-[150px] h-[50px] object-contain"
            />

            {/* กลุ่มโปรไฟล์ + ปุ่มออกจากระบบ */}
            <div className="flex items-center gap-4">
                {/* ชื่อและอีเมล */}
                <div className="text-right">
                <p className="text-lg font-semibold">
                    {userInfo.firstname} {userInfo.lastname}
                </p>
                <p className="text-sm text-gray-500">{userInfo.email}</p>
                </div>

                {/* รูปโปรไฟล์ */}
                <svg
                xmlns="http://www.w3.org/2000/svg" 
                width={40} 
                height={40}
                viewBox="0 0 24 24"
                class="border border-[#B9B9B9] rounded-full">
                <path fill="currentColor" 
                fillRule="evenodd"
                d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
                clipRule="evenodd">
                </path></svg>

                {/* ปุ่มออกจากระบบ */}
                <div className="flex items-center px-4 py-2 hover:scale-105 border border-[#B9B9B9] rounded-lg cursor-pointer hover:bg-[#f5f5f5] transition"
                onClick={logout}
                >
                <p className="text-[#66009F] font-bold text-base">ออกจากระบบ</p>
                </div>
            </div>
        </div>

            
        <div className="bg-[#66009F] w-full h-64 mt-2 flex flex-col items-center justify-center text-center px-4">
            <p className="text-white font-bold text-3xl">
                ระบบบริหารจัดการหนังสือมอบอำนาจออนไลน์
            </p>
            <p className="text-white text-lg mt-4">
                จัดการคำขอมอบอำนาจ ติดตามสถานะ และอนุมัติเอกสารได้อย่างมีประสิทธิภาพ
            </p>
        </div>
        {/* end header */}
        <main className="max-w-5xl w-full  px-4 py-8">
        {/* หัวข้อใหญ่ */}

        {/* การ์ดขาว */}
        <div className="mt-4 rounded-2xl bg-white ring-1 ring-black/5 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.25)]">
        <h2 className="text-2xl font-bold text-gray-900 p-4">ประวัติเอกสาร</h2>
            {/* แถวหัวการ์ด */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="inline-flex items-center gap-2 text-gray-700">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-[#66009F]">
                {/* ไอคอนแฟ้ม */}
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
                </span>
                <span className="font-medium">หมวดงานของเอกสาร</span>
            </div>
            <button className="p-2 rounded-lg hover:bg-gray-50">
                {/* chevron */}
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            </div>

            {/* รายการเอกสาร */}
            <div className="p-6">
            <div className="flex items-start justify-between rounded-xl border border-gray-200 p-4">
                <div>
                <p className="font-semibold text-gray-900">คำขออนุมัติ/อนุญาตจัดกิจกรรมพิเศษ</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>ผู้ยื่นคำขอ: Siriwimon Y.</span>
                    <span>วันที่สร้าง: 15 สิงหาคม 2025</span>
                </div>
                <a href="#" className="mt-1 inline-block text-xs text-blue-600 hover:underline">
                    ส่งไปยัง กองวิจัย
                </a>
                </div>

                <button
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
                >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                </svg>
                ดูรายละเอียด
                </button>
            </div>
            </div>
        </div>
        </main>
    </div>

    
  )}

export default History
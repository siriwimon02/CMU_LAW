import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from "react-router-dom";

function Detail() {

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState(null);
  const { id } = useParams();             // <-- get id from URL

  if (!token) {
      alert("Please Login or SignIn First!!!");
      return <Navigate to="/login" replace />;
    }

  // if i need to use id just call {id} &&& waiting for database complete
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('http://localhost:3001/auth/user', {
          headers: { Authorization: `${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch user');
        const user = await res.json();
        setUserInfo(user);
      } catch (err) {
        console.error('Error fetching user:', err);
        setUserInfo(null);
      }
    }
    fetchUser();
  }, [token]);
  // 
  const ClickToTracking = () => {
    navigate("/tracking")
  }

  //  id | documentId | statusId | changeById | changedAt | note_t
  const redList = [12, 18, 21, 9, 26]
  const greenList = [2, 10, 11, 13, 15, 17, 20, 23, 25]
  const orangeList = [1, 14, 16, 19, 22, 24]
  // fake data
  const data =[
  {
    "id": 1,
    "documentId": 101,
    "statusId": 1,
    "changeById": 5,
    "changedAt": "2025-09-01T09:15:00",
    "note_t": "ผู้ใช้ยื่นคำขอ"
  },
  {
    "id": 2,
    "documentId": 101,
    "statusId": 2,
    "changeById": 7,
    "changedAt": "2025-09-02T10:30:00",
    "note_t": "เจ้าหน้าที่กองรับเอกสารเรียบร้อย"
  },
  {
    "id": 3,
    "documentId": 101,
    "statusId": 3,
    "changeById": 8,
    "changedAt": "2025-09-03T14:45:00",
    "note_t": "หัวหน้ากองตรวจสอบเบื้องต้น"
  }]
  
  
  return (
    <div className="bg-[#F8F8F8] min-h-screen flex justify-center items-center p-6">
      {/* box */}
      <div className="bg-white m-5 min-h-[90vh] w-full rounded-2xl p-6">
        
        {/* header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white shadow flex items-center justify-center border border-gray-100">
              {/* search icon */}
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-2xl font-extrabold tracking-tight">ติดตามสถานะคำขอ</h1>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 rounded-xl bg-purple-600 text-white shadow hover:bg-purple-700 transition flex items-center justify-center"
            title="ย้อนกลับ"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {/* end header */}
        {/* under header (3 box)*/}
         {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="rounded-2xl bg-[#F4F7FF] p-5 border border-purple-100 shadow-sm">
            <p className="text-purple-700 font-semibold">เลขที่คำขอ</p>
            <p className="text-gray-500 mt-2">1234567890</p>
          </div>
          <div className="rounded-2xl bg-[#F4F7FF] p-5 border border-purple-100 shadow-sm">
            <p className="text-purple-700 font-semibold">ผู้ยื่นคำขอ</p>
            <p className="text-gray-500 mt-2">{userInfo?.firstname} {userInfo?.lastname}</p>
          </div>
          <div className="rounded-2xl bg-[#F4F7FF] p-5 border border-purple-100 shadow-sm">
            <p className="text-purple-700 font-semibold">วันที่ยื่นคำขอ</p>
            <p className="text-gray-500 mt-2">12/25/25</p>
          </div>
        </div>

        {/* end under header */}
        {/* under line */}
        <hr className="border-gray-200 mb-6 md:mb-8" />

        {/* current status */}
         <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-extrabold text-purple-700">ขั้นตอนการดำเนินการ</h2>
          <p className="mt-2 text-gray-500">
            สถานะปัจจุบัน <span className="font-bold text-amber-600"> สำเร็จ</span>
          </p>
        </div>

        {/*status*/}
        {data.map((item) => {
          let bgColor = "bg-gray-100"; // default

          if (redList.includes(item.statusId)) {
            bgColor = "bg-red-300";
          } else if (greenList.includes(item.statusId)) {
            bgColor = "bg-emerald-300";
          } else if (orangeList.includes(item.statusId)) {
            bgColor = "bg-orange-300";
          }
          
        {/* กรอบสถานะ */}
          return(

          
          <div className=" my-5 pl-5" key={item.id}>
            {/* เส้นสีข้างๆ */}
            <div className="flex">
              <div className={`ml-1 mr-3 w-1 rounded-full ${bgColor}`}></div>

              {/* เนื้อหากรอบ */}
              <div className={`w-1/2 rounded-2xl p-5 shadow-sm ${bgColor}`}>
                <p className="font-semibold text-gray-800">{item.statusId}</p>
                <p className="text-gray-500 text-sm mt-1">
                  เอกสารอยู่ในระบบรอตรวจผล
                </p>
                <p className="text-sm mt-2 text-gray-500">15 ส.ค. 2025 14:00</p>
              </div>
            </div>
          </div>
          );
        })}

        
      </div> {/*กรอบมนๆ */}
      
    </div> //นอกสุด
  );
}

export default Detail;

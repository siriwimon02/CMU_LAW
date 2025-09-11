import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

function Tracking() {
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState(null);
  const [documentAll, setDocumentAll] = useState([]); // เริ่มเป็น array

  // ถ้าไม่มี token ให้เด้งไป login
  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    async function getDocandUser() {
      try {
        const res1 = await fetch("http://localhost:3001/auth/user", {
          headers: { Authorization: `${token}` },
        });
        const user = await res1.json();

        const res2 = await fetch("http://localhost:3001/petition", {
          headers: { Authorization: `${token}` },
        });
        const docs = await res2.json();

        setUserInfo(user);
        // ถ้า backend ส่งเป็น array → ใช้ตรง ๆ
        // ถ้า backend ส่งเป็น object เช่น { data: [...] } → ใช้ docs.data
        setDocumentAll(Array.isArray(docs) ? docs : docs.data || []);
      } catch (e) {
        console.error(e);
        setDocumentAll([]);
      }
    }
    getDocandUser();
  }, [token]);
  // รออีอายจัดสีให้
  const greenList = ['']
  const orangeList = ['อยู่ระหว่างการตรวจสอบโดยอธิการบดี','รอรับเข้ากอง']
  const redList = ['ปฏิเสธคำร้อง','รอรับเข้ากอง']

  const navigate = useNavigate();
  const ClicktoDashboard = () => {
    navigate('/dashboard');
  }

  // Sorted copy based on dropdown
  const [sortOrder, setSortOrder] = useState("newest"); 
  const sortedDocs = [...documentAll].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.created_at || 0);
    const dateB = new Date(b.createdAt || b.created_at || 0);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white text-gray-800 px-5 py-4">
        <div className="mx-auto  flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/Logo.svg"
              alt="Logo"
              className="w-[150px] h-[50px] object-contain"
            />
          </div>
          <button
            onClick={ClicktoDashboard}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-purple-800 transition"
            title="เมนู"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* ล่าง header*/}
      <div className="bg-[#66009F] w-full h-64 mt-2 flex flex-col items-center justify-center text-center px-4">
        <p className="text-white font-bold text-3xl">
          ระบบบริหารจัดการหนังสือมอบอำนาจออนไลน์
        </p>
        <p className="text-white text-lg mt-4">
          จัดการคำขอมอบอำนาจ ติดตามสถานะ และอนุมัติเอกสารได้อย่างมีประสิทธิภาพ
        </p>
      </div>

      {/* Main */}
      <main className="flex-1 bg-gray-100 p-4">
        {/* กล่องให้เลือก */}
        <div className="mb-4">
          <label className="sr-only">เอกสารล่าสุด</label>
          <div className="relative w-full max-w-xs">
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
              <option value="newest">เอกสารล่าสุด</option>
              <option value="oldest">เอกสารเก่าสุด</option>

            </select>
            {/* ลูกษร */}
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* แสดงรายการเอกสาร */}
        {sortedDocs.length > 0 &&
          sortedDocs.map((doc) => {
            const created = doc.createdAt
              ? new Date(doc.createdAt).toLocaleString("th-TH", {
                  timeZone: "Asia/Bangkok",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-";

            

            return (
              <article
                key={doc.id}
                className="rounded-2xl bg-white shadow p-4 mb-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 text-gray-800">
                    <p className="font-bold">
                      เลขที่คำขอ:{" "}
                      <span className="font-extrabold">{doc.request_no ?? doc.id}</span>
                    </p>
                    <p>
                      ผู้ที่ยื่นคำขอ: <span className="font-semibold">{userInfo?.firstname} {userInfo?.lastname}</span>
                    </p>
                    <p>วันที่ยื่นคำขอ: {created} </p>
                    <p className={ 
                      greenList.includes(doc.status_name) ? "text-emerald-600"
                      : orangeList.includes(doc.status_name) ? "text-orange-600"    
                      : redList.includes(doc.status_name) ? "text-red-600":"text-red-600"
                    }>
                      <span className="font-medium">
                        {doc.status_name ?? "ไม่สามารถตรวจสอบได้"}
                      </span>
                    </p>
                  </div>

                  <button className="mt-2 inline-flex items-center gap-2 self-start rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>
                    ดูรายละเอียด
                  </button>
                </div>
              </article>
            );
                      
          })}

      </main>
    </div>
  );
}

export default Tracking;

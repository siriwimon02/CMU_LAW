import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

function Employee_Paper() {
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState(null);
  const [documentAll, setDocumentAll] = useState([]); // เริ่มเป็น array

//   const logout = () => {
//     localStorage.removeItem("token");
//     window.location.href='/login';
//   }

  // ถ้าไม่มี token ให้เด้งไป login
  // ถ้าไม่มี token ให้เด้งไป login
    if (!token) {
        alert("Please Login or SignIn First!!!");
        return <Navigate to="/login" replace />;
    }

    useEffect(() => {
    if (!token) return;

    const ac = new AbortController();

    (async () => {
        try {
        const [uRes, dRes] = await Promise.all([
            fetch("http://localhost:3001/auth/user", {
            headers: { Authorization: `${token}` }, // ถ้าหลังบ้านใช้ Bearer → `Bearer ${token}`
            signal: ac.signal,
            }),
            fetch("http://localhost:3001/petitionAuditor", {
            headers: { Authorization: `${token}` },
            signal: ac.signal,
            }),
        ]);

        if (!uRes.ok) throw new Error(`GET /auth/user ${uRes.status}`);
        if (!dRes.ok) throw new Error(`GET /petitionAuditor ${dRes.status}`);

        const [user, docsRaw] = await Promise.all([uRes.json(), dRes.json()]);

        setUserInfo(user);
        setDocumentAll(Array.isArray(docsRaw) ? docsRaw : docsRaw.data || []);
        } catch (e) {
        if (e.name !== 'AbortError') {
            console.error(e);
            setDocumentAll([]); // กันหน้า error ให้แสดงว่างได้
        }
        }
    })();

    return () => ac.abort();
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

          {/* กลุ่มโปรไฟล์ + ปุ่มออกจากระบบ */}
        <div className="flex items-center gap-4">
          {/* ชื่อและอีเมล */}
          <div className="text-right">
            <p className="text-lg font-semibold">
              {userInfo?.firstname} {userInfo?.lastname}
            </p>
            <p className="text-sm text-gray-500">{userInfo?.email}</p>
          </div>

          {/* รูปโปรไฟล์ */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={40}
            height={40}
            viewBox="0 0 24 24"
            className="border border-[#B9B9B9] rounded-full"
            >
            <path
                fill="currentColor"
                fillRule="evenodd"
                d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
                clipRule="evenodd"
            />
          </svg>

          <a
            href="http://localhost:5173/dashboard"
            aria-label="ย้อนกลับไปแดชบอร์ด"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,               // ✅ จัตุรัส
              height: 40,              // ✅ จัตุรัส
              background: '#66009F',   // ✅ พื้นหลังม่วง
              color: '#FFFFFF',        // ✅ currentColor ของ SVG จะเป็นสีขาว
              borderRadius: 10,        // ✅ มนเล็กน้อย (ถ้าอยากคมสนิทใช้ 0)
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(108, 106, 108, 0.35)',
              transition: 'transform .06s ease, box-shadow .12s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(102,0,159,0.45)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,0,159,0.35)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* ไอคอนย้อนกลับสีขาว */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                viewBox="0 0 24 24">
              <g fill="none">
                <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.17-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/>
                <path fill="currentColor"
                      d="M3.283 10.94a1.5 1.5 0 0 0 0 2.12l5.656 5.658a1.5 1.5 0 1 0 2.122-2.122L7.965 13.5H19.5a1.5 1.5 0 0 0 0-3H7.965l3.096-3.096a1.5 1.5 0 1 0-2.122-2.121z"/>
              </g>
            </svg>
          </a>

          {/* ปุ่มออกจากระบบ */}
          {/* <div className="flex items-center px-4 py-2 hover:scale-105 border border-[#B9B9B9] rounded-lg cursor-pointer hover:bg-[#f5f5f5] transition"
           onClick={logout}
          >
            <p className="text-[#66009F] font-bold text-base">ออกจากระบบ</p>
          </div> */}
        </div>
          
          
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
        <div 
            style={{ 
                width: '100%',
                padding: 25, 
                border: '1px solid #ddd', 
                borderRadius: 12, 
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                background: 'white',
                fontFamily: "'Kanit', sans-serif"
            }}
        
      >
        {/* กล่องให้เลือก */}
        {/* <div className="mb-4">
          <label className="sr-only">เอกสารล่าสุด</label>
          <div className="relative w-full max-w-xs">
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
              <option value="newest">เอกสารล่าสุด</option>
              <option value="oldest">เอกสารเก่าสุด</option>

            </select> */}
            {/* ลูกษร */}
            {/* <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div> */}

        

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
                        <span className="font-extrabold text-xl">
                        {doc.request_no ?? doc.title}
                        </span>
                    </p>

                    {/* แถวเดียวกัน + เว้นระยะ */}
                    <div className="flex items-center flex-wrap gap-x-6 gap-y-1">
                        <span>
                            ผู้ยื่นคำขอ:{' '}
                            <span className="font-semibold">
                            {userInfo?.firstname} {userInfo?.lastname}
                            </span>
                        </span>

                        <span>วันที่ยื่นคำขอ: {created}</span>

                        <span
                            className={
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' +
                            (greenList.includes(doc.status_name) ? 'bg-emerald-100 text-emerald-700' :
                            orangeList.includes(doc.status_name) ? 'bg-orange-100 text-orange-700' :
                            redList.includes(doc.status_name) ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700')
                            }
                        >
                            {doc.status_name ?? 'ไม่สามารถตรวจสอบได้'}
                        </span>
                    </div>



                    {/* <span
                        className={
                        greenList.includes(doc.status_name) ? "text-emerald-600 font-medium" :
                        orangeList.includes(doc.status_name) ? "text-orange-600 font-medium" :
                        redList.includes(doc.status_name) ? "text-red-600 font-medium" : "text-red-600 font-medium"
                        }
                    >
                        {doc.status_name ?? "ไม่สามารถตรวจสอบได้"}
                    </span> */}
                  </div>

                  {/* <button className="mt-2 inline-flex items-center gap-2 self-start rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50">
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
                  </button> */}
                </div>
              </article>
            );
                      
          })}
        </div>
      </main>
    </div>
  );
}

export default Employee_Paper;

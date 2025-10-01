import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar'



function Tracking() {
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState(null);
  const [documentAll, setDocumentAll] = useState([]); // เริ่มเป็น array

// เหลือ 1 test สีดูทุกสี 2 เลขคำขอ 3 โลโก้ค้นหากับโลโก้แก้ไขปรับฟ้อนให้สวยขึ้น
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
  
  // color of status
  const redList = [
  'ส่งกลับให้ผู้ใช้แก้ไขเอกสาร',
  'ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง',
  'ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย',
  'ส่งกลับเพื่อแก้ไขก่อนเสนออธิการบดี',
  'อธิการบดีปฏิเสธคำร้อง',
  ];

  // เขียว (สำเร็จ / ผ่านขั้นตอนนั้นแล้ว)
  const greenList = [
    'รับเข้ากองเรียบร้อย',
    'ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง',
    'ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว',
    'ตรวจสอบขั้นต้นเสร็จสิ้น',
    'ตรวจสอบโดยหัวหน้ากองเสร็จสิ้น',
    'ตรวจสอบขั้นสุดท้ายเสร็จสิ้น',
    'ตรวจสอบก่อนเสนออธิการบดีเสร็จสิ้น',
    'อธิการบดีอนุมัติแล้ว',
  ];

  // ส้ม (กำลังดำเนินการ / รอพิจารณา)
  const orangeList = [
    'รอรับเข้ากอง',
    'อยู่ระหว่างการตรวจสอบขั้นต้น',
    'อยู่ระหว่างการตรวจสอบโดยหัวหน้ากอง',
    'อยู่ระหว่างการตรวจสอบขั้นสุดท้าย',
    'อยู่ระหว่างการตรวจสอบก่อนเสนออธิการบดี',
    'รอการพิจารณาอนุมัติจากอธิการบดี',
  ];

  const modifyList = [
  'ส่งกลับให้ผู้ใช้แก้ไขเอกสาร',
  // 'ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง',
  // 'ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย',
  // 'ส่งกลับเพื่อแก้ไขก่อนเสนออธิการบดี',
  // 'อธิการบดีปฏิเสธคำร้อง',
  ];
  // navigate
  const navigate = useNavigate();
  const ClicktoDashboard = () => {
    navigate('/dashboard');
  }

  const ClickForMoreDetail = (doc) => {
    navigate(`/detail/${doc.id}`);
  }

  const ClickForModify = (doc) => {
    navigate(`/modify/${doc.id}`)
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
      <Navbar/>

      {/* Main */}
      <div className="w-full px-6 mt-6 flex gap-4">
        {/* กล่องให้เลือก */}
        <div className="">
          <label className="sr-only">เอกสารล่าสุด</label>
          <div className="relative w-full max-w-xs">
            <select 
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            
            const isModifiable = modifyList.includes(doc.status_name);

            return (
              <article
                key={doc.id}
                className="rounded-lg bg-white shadow p-4 mx-6  mt-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 text-gray-800">
                    <p className="font-bold">
                      เลขที่คำขอ:{" "}
                      <span className="font-extrabold">{doc.request_no ?? doc.doc_id}</span>
                    </p>
                    <p>
                      ผู้ที่ยื่นคำขอ: <span className="font-semibold">{userInfo?.firstname} {userInfo?.lastname}</span>
                    </p>

                    <p>
                      หน่วยงานปลายทาง:{" "}
                      <span className="font-medium">{doc.destination_name ?? "-"}</span>
                    </p>

                    <p>
                      เรื่องที่ยื่น:{" "}
                      <span className="font-medium">{doc.title ?? "-"}</span>
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
                  
                    
                    <button 
                      onClick={() => isModifiable ? ClickForModify(doc) : ClickForMoreDetail(doc)}
                      className="mt-2 inline-flex items-center gap-2 self-start rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50">
                      {isModifiable ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={20}
                          height={20}
                          viewBox="0 0 24 24"
                          className="text-black"
                        >
                          <path
                            fill="currentColor"
                            fillRule="evenodd"
                            d="M14.25 2.5a.25.25 0 0 0-.25-.25H7A2.75 2.75 0 0 0 4.25 5v14A2.75 2.75 0 0 0 7 21.75h10A2.75 2.75 0 0 0 19.75 19V9.147a.25.25 0 0 0-.25-.25H15a.75.75 0 0 1-.75-.75zm.75 9.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5zm0 4a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5z"
                            clipRule="evenodd"
                          ></path>
                          <path
                            fill="currentColor"
                            d="M15.75 2.824c0-.184.193-.301.336-.186q.182.147.323.342l3.013 4.197c.068.096-.006.22-.124.22H16a.25.25 0 0 1-.25-.25z"
                          ></path>
                        </svg>
                      ):(

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
                      )}
                        {isModifiable ? "แก้ไขเอกสาร" : "ดูรายละเอียด"}
                      
                    </button>
                </div>
              </article>
            );
                      
          })}

    </div>
  );
}

export default Tracking;

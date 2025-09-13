import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Header from '../../components/trackingHeader'
function Tracking() {
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState(null);
  const [documentAll, setDocumentAll] = useState([]); // เริ่มเป็น array

    // 1.check role 2.tab bar
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
  const greenList = ['ตรวจสอบเอกสารเรียบร้อยเเล้ว']
  const orangeList = [ 'รอการอนุมัติ']
  const redList = [ 'ไม่อนุมัติ' ]

  // navigate
  const navigate = useNavigate();
  const ClicktoDashboard = () => {
    navigate('/dashboard');
  }

   const ClickForMoreDetail = (doc) => {
    navigate(`/detail/${doc.id}`);
  }

  const ClickForApprove = () =>{
    alert("Aprrove na jaaaa")
  }

  const ClickForReject = () =>{
    alert("Reject na jaaa")
  }

  const fakeData = [
    {
    id: 1,
    doc_id: undefined,
    department_name: '1',
    destination_name: 'สำนักงานบริหารงานวิจัย ',
    title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านกำแพงเพชร',
    authorize_to: 'เบล กำแพงเพชร',
    position: 'หัวหน้าชมรม',
    affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
    authorize_text: 'ขอเงิน',
    status_name: 'ตรวจสอบเอกสารเรียบร้อยเเล้ว',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    },
    {
    id: 2,
    doc_id: undefined,
    department_name: '1',
    destination_name: 'สำนักงานบริหารงานวิจัย ',
    title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านสุโขทัย',
    authorize_to: 'น้อต สุโขทัย',
    position: 'หัวหน้าชมรม',
    affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
    authorize_text: 'ขอเงิน',
    status_name: 'รอการอนุมัติ',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    },
    {
    id: 3,
    doc_id: undefined,
    department_name: '1',
    destination_name: 'สำนักงานบริหารงานวิจัย ',
    title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านจอมทอง',
    authorize_to: 'แก้ม จอมทอง',
    position: 'หัวหน้าชมรม',
    affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
    authorize_text: 'ขอเงิน',
    status_name: 'ไม่อนุมัติ',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    }
  ]

  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
      <Header/>

      {/* Main */}
      <main className="flex-1 bg-gray-100 p-4">
        {/* 3 button */}
        <div className="flex gap-4 m-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:bg-gray-100 transition">
                <span>ตรวจสอบเอกสารเรียบร้อยแล้ว</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:bg-gray-100 transition">
                <span>รอการอนุมัติ</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:bg-gray-100 transition">
                <span>ไม่อนุมัติ</span>
            </button>
        </div>
        {/* แสดงรายการเอกสาร */}
        {fakeData.map((item) => {
          const created = item.createdAt
            ? new Date(item.createdAt).toLocaleString("th-TH", { 
                timeZone: "Asia/Bangkok",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-";
            //separate color, statusClass is string of color background
          const statusClass =
            greenList.includes(item.status_name)
              ? "text-emerald-600"
              : orangeList.includes(item.status_name)
              ? "text-orange-600"
              : redList.includes(item.status_name)
              ? "text-red-600"
              : "text-gray-600";
            const check = orangeList.includes(item.status_name);
          return (
            <article key={item.id} className="rounded-2xl bg-white shadow p-4 m-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between  ">
                <div className="space-y-1 text-gray-800">
                  <p className="font-bold">
                    เลขที่คำขอ: <span className="font-extrabold">{item.request_no ?? item.id}</span>
                  </p>
                  <p>
                    ผู้ที่ยื่นคำขอ:{" "}
                    <span className="font-semibold">
                      {item.authorize_to}
                    </span>
                  </p>
                  <p>วันที่ยื่นคำขอ: {created}</p>
                  <p className={statusClass}>
                    <span className="font-medium">{item.status_name ?? "ไม่สามารถตรวจสอบได้"}</span>
                  </p>
                </div>

                
                <div className="flex flex-wrap gap-2 items-center self-start">
                <button
                  onClick={() => ClickForMoreDetail(item)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  ดูรายละเอียด
                </button>
                {/* if it's orange group */}
                {check && (
                    <>
                    <button
                        onClick={ClickForApprove}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500 text-emerald-700 bg-white px-4 py-2 hover:bg-emerald-50"
                    >
                        อนุมัติ
                    </button>

                    <button
                        onClick={ClickForReject}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500 text-red-700 bg-white px-4 py-2 hover:bg-red-50"
                    >
                        ไม่อนุมัติ
                    </button>
                    </>
                )}
                </div>


              </div>
            </article>
          );
        })}
          
          
        {/* {documentAll.length > 0 &&
          documentAll.map((doc) => {
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
                    <button 
                      onClick={() => ClickForMoreDetail(doc)}
                      className="mt-2 inline-flex items-center gap-2 self-start rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50">
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
           })} */}

      </main>
    </div>
  );
}

export default Tracking;

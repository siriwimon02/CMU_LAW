import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  // นับจำนวนเอกสารที่รอตรวจสอบ
  const [pendingAuditDocs, setPendingAuditDocs] = useState(0);
  const [pendingDocs, setPendingDocs] = useState(0);
  const [pendingSpvDocs, setPendingSpvDocs] = useState(0);
  const [pendingSpvAcceptDocs, setPendingSpvAcceptDocs] = useState(0);



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
// ด้านบนสุด


useEffect(() => {
  if (!userInfo || !token) return;

  const fetchAll = async () => {
    try {
      // auditor
      if (userInfo.role_n === "auditor") {
        const res = await fetch("http://localhost:3001/petitionAudit/wait_to_audit_byAudit", {
          headers: { Authorization: token },
        });
        const data = await res.json();
        setPendingAuditDocs(Array.isArray(data.document_json) ? data.document_json.length : 0);
      }

      // head_auditor
      if (userInfo.role_n === "head_auditor") {
        const res = await fetch("http://localhost:3001/petitionHeadAudit/wait_to_accept_byHeadaudit", {
          headers: { Authorization: token },
        });
        const data = await res.json();
        setPendingDocs(Array.isArray(data.document_json) ? data.document_json.length : 0);
      }

      // spv_auditor
      if (userInfo.role_n === "spv_auditor") {
        const res1 = await fetch("http://localhost:3001/petitionSuperAudit/wait_to_audit_bySpvAudit", {
          headers: { Authorization: token },
        });
        const data1 = await res1.json();
        setPendingSpvDocs(Array.isArray(data1.document_json) ? data1.document_json.length : 0);

        // spv_auditor
        const res2 = await fetch("http://localhost:3001/petitionSuperAudit/wait_to_accept", {
          headers: { Authorization: token },
        });
        const data2 = await res2.json();
        setPendingSpvAcceptDocs(Array.isArray(data2.document_json) ? data2.document_json.length : 0);
      }
    } catch (err) {
      console.error("Error auto-refreshing dashboard:", err);
    }
  };

  fetchAll();

  const interval = setInterval(fetchAll, 3000);

  return () => clearInterval(interval);
}, [userInfo, token]);


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

  const ClicktoActionLog = () => {
    navigate('/admin_action_log');
  }

  const ClicktoHeadAuditor = () => {
    navigate('/headAuditTracking');
  }

  const ClicktoSpvauditor = () => {
    navigate('/spvAuditTracking');
  }

  const ClickToAuditor = () => {
    navigate('/auditTracking')
  }

  const ClickToFinalAudit = () => {
    navigate('/finalaudit')
  }

  const ClickToApprove = () => {
    navigate('/pending_approval')
  }


  const handleClick = (allowedRoles, action) => {
    if (allowedRoles.includes(userInfo.role_n)) {
      action(); // ถ้ามีสิทธิ์ → เรียกฟังก์ชันจริง
    } else {
      setShowPopup(true); // ถ้าไม่มีสิทธิ์ → เปิด popup
    }
  };


  if (!userInfo) {
    return <div>Loading...</div>;  // หรือ แสดง loading ขณะรอข้อมูล
  }

  return (
    <div className="min-h-screen font-kanit bg-[#F8F8F8] pb-10">
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
          className="border border-[#B9B9B9] rounded-full">
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
      {/* user */}
      {userInfo.role_n === "user" && (
        <div className="flex flex-col items-center justify-center mt-10 gap-5 ">
          {/* block1 */}
        <div className="bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
          onClick={() => handleClick(["user"], ClicktoPetition)} 
        >
          <div className="mb-5">
             <div className="bg bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={40} 
                    height={40} 
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
             </div>
          </div>
          <p className="text-[#66009F] font-bold text-2xl">
            แบบฟอร์มคำขอรับมอบอำนาจ
          </p>
          <p className="text-[#B9B9B9] mt-2 text-base">
            กรอกแบบฟอร์มคำขอออนไลน์ พร้อมแนบเอกสารประกอบ
          </p>
        </div>
        {/* block2 */}
        <div className="bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
          onClick={() => handleClick(["user"], ClickToTracking)}
        >
          <div className="mb-5">
              <div className="bg bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
                  <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width={40} 
                  height={40} 
                  viewBox="0 0 24 24"
                  className="text-black" 
                  >
                  <path fill="currentColor" 
                  d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14">
                  </path>
                </svg>
              </div>
          </div>
          <p className="text-[#66009F] font-bold text-2xl">ติดตามสถานะคำขอ</p>
          <p className="text-[#B9B9B9] mt-2 text-base">ติดตามสถานะคำขอของตนเอง</p>
        </div>
      </div>
      )}

       {/* อันใหม่ */}
       {/* พนักงาน */}
       {(userInfo.role_n === "auditor" ) && (
        <div className="flex flex-col items-center justify-center mt-10 gap-5 px-5">
        {/* block1 */}
       <div
          className="relative bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
          onClick={() => handleClick(["auditor"], ClickToAuditor)}
        >
          {pendingAuditDocs > 0 && (
            <div className="absolute -top-2 -right-2 bg-[#CD0000] text-white text-sm px-3 py-1 rounded-full shadow-md">
              รอตรวจสอบ ({pendingAuditDocs})
            </div>
          )}

          <div className="mb-5">
            <div className="bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={40}
                height={40}
                viewBox="0 0 24 24"
                className="text-black"
              >
                <path
                  fill="currentColor"
                  d="M8 9a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m4 8H4v-1c0-1.33 2.67-2 4-2s4 .67 4 2zm8-9h-6v2h6zm0 4h-6v2h6zm0 4h-6v2h6zm2-12h-8v2h8v14H2V6h8V4H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m-9 2h-2V2h2z"
                ></path>
              </svg>
            </div>
          </div>

          <p className="text-[#66009F] font-bold text-2xl">
            เจ้าหน้าที่ตรวจสอบเอกสารคำร้อง
          </p>
          <p className="text-[#B9B9B9] mt-2 text-base">
            ตรวจสอบเอกสารคำร้องที่ผ่านการรับเข้ากองเรียบร้อยแล้ว
          </p>
        </div>


        <div className="bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
           onClick={() => handleClick(["auditor"], ClickToApprove)}
        >
          <div className="mb-5">
             <div className="bg bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
                <svg
                xmlns="http://www.w3.org/2000/svg" 
                width={40} 
                height={40} 
                viewBox="0 0 24 24"
                className="text-black"  >
                <path 
                fill="currentColor" 
                d="M8 9a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m4 8H4v-1c0-1.33 2.67-2 4-2s4 .67 4 2zm8-9h-6v2h6zm0 4h-6v2h6zm0 4h-6v2h6zm2-12h-8v2h8v14H2V6h8V4H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m-9 2h-2V2h2z">
                </path></svg>
             </div>
          </div>
          <p className="text-[#66009F] font-bold text-2xl">เจ้าหน้าที่ดำเนินการเสนอเรื่องต่ออธิการบดี</p>
          <p className="text-[#B9B9B9] mt-2 text-base">ส่งเอกสารคำร้องที่ตรวจสอบแล้วให้อธิการบดีพิจารณา และอัปโหลดผลอนุมัติ</p>
        </div>
      </div>
      )}

{/* หัวหน้างาน */}
{userInfo.role_n === "head_auditor" && (
  <div className="flex flex-col items-center justify-center mt-10 gap-5 px-5">
    {/* block1 */}
    <div
      className="relative bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
      onClick={() => handleClick(["head_auditor"], ClicktoHeadAuditor)}
    >
      {pendingDocs > 0 && (
        <div className="absolute -top-2 -right-2 bg-[#CD0000] text-white text-sm px-3 py-1 rounded-full shadow-md">
          รอตรวจสอบ ({pendingDocs})
        </div>
      )}

      <div className="mb-5">
        <div className="bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={40}
            height={40}
            viewBox="0 0 24 24"
            className="text-black"
          >
            <path
              fill="currentColor"
              d="M22 4h-8v3h-4V4H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M8 9a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2m4 8H4v-1c0-1.33 2.67-2 4-2s4 .67 4 2zm8 1h-6v-2h6zm0-4h-6v-2h6zm0-4h-6V8h6zm-7-4h-2V2h2z"
            ></path>
          </svg>
        </div>
      </div>

      <p className="text-[#66009F] font-bold text-2xl flex items-center">
        หัวหน้างาน
      </p>
      <p className="text-[#B9B9B9] mt-2 text-base">
        ตรวจสอบ อนุมัติ คำขออนุมัติเอกสารตามขั้นตอนที่กำหนด
      </p>
    </div>
  </div>
)}
      {/* ผู้อำนวยการกอง */}
      {(userInfo.role_n === "spv_auditor" ) && (
        <div className="flex flex-col items-center justify-center mt-10 gap-5 px-5">
        {/* block1 */}
        <div
          className="relative bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
          onClick={() => handleClick(["spv_auditor"], ClickToFinalAudit)}
        >
          {pendingSpvDocs > 0 && (
            <div className="absolute -top-2 -right-2 bg-[#CD0000] text-white text-sm px-3 py-1 rounded-full shadow-md">
              รอตรวจสอบ ({pendingSpvDocs})
            </div>
          )}

          <div className="mb-5">
            <div className="bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={40}
                height={40}
                viewBox="0 0 24 24"
                className="text-black"
              >
                <path
                  fill="currentColor"
                  d="M14 17h4v-3l5 4.5l-5 4.5v-3h-4zm-1-8h5.5L13 3.5zM6 2h8l6 6v4.34c-.63-.22-1.3-.34-2-.34a6 6 0 0 0-6 6c0 1.54.58 2.94 1.53 4H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2"
                ></path>
              </svg>
            </div>
          </div>

          <p className="text-[#66009F] font-bold text-2xl">
            ผู้อำนวยการกองตรวจสอบเอกสาร
          </p>
          <p className="text-[#B9B9B9] mt-2 text-base">
            คัดกรองเอกสารเพื่อส่งไปยังหน่วยงานที่ถูกต้อง
          </p>
        </div>

        {/* บล็อก2 */}
        <div
        className="relative bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
        onClick={() => handleClick(["spv_auditor"], ClicktoSpvauditor)}
      >

        {pendingSpvAcceptDocs > 0 && (
            <div className="absolute -top-2 -right-2 bg-[#CD0000] text-white text-sm px-3 py-1 rounded-full shadow-md">
              รอตรวจสอบ ({pendingSpvAcceptDocs})
            </div>
          )}

        <div className="mb-5">
          <div className="bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={40}
              height={40}
              viewBox="0 0 24 24"
              className="text-black"
            >
              <path
                fill="currentColor"
                d="M14 17h4v-3l5 4.5l-5 4.5v-3h-4zm-1-8h5.5L13 3.5zM6 2h8l6 6v4.34c-.63-.22-1.3-.34-2-.34a6 6 0 0 0-6 6c0 1.54.58 2.94 1.53 4H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2"
              ></path>
            </svg>
          </div>
        </div>

        <p className="text-[#66009F] font-bold text-2xl">
          ผู้อำนวยการกองคัดกรองเอกสาร
        </p>
        <p className="text-[#B9B9B9] mt-2 text-base">
          คัดกรองเอกสารเพื่อส่งไปยังหน่วยงานที่ถูกต้อง
        </p>
      </div>

        
      </div>
      )}









      {/* admin*/}
      {userInfo.role_n === "admin" && (
        <div className="flex flex-col items-center justify-center mt-10 gap-5 px-5">
        {/* block1 */}
        <div className="bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
          onClick={() => handleClick(["admin"], ClicktoAdminedit)}
        >
          <div className="mb-5">
             <div className="bg bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" 
              width={40} height={40}
              viewBox="0 0 24 24"
              className="text-black" >
                <path fill="currentColor"
                d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h4v-1.9l10-10V8l-6-6zm7 1.5L18.5 9H13zm7.1 9.5c-.1 0-.3.1-.4.2l-1 1l2.1 2.1l1-1c.2-.2.2-.6 0-.8l-1.3-1.3c-.1-.1-.2-.2-.4-.2m-2 1.8L12 20.9V23h2.1l6.1-6.1z">
                </path></svg>
             </div>
          </div>
          <p className="text-[#66009F] font-bold text-2xl">จัดการสิทธิ์ของผู้ใช้</p>
          <p className="text-[#B9B9B9] mt-2 text-base">เเก้ไข เพิ่มเเละลบผู้ใช้งาน</p>
        </div>
        {/* block2 */}
        {/* onClick ยังไม่ถูกที่ */}
        <div className="bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
          onClick={() => handleClick(["admin"], ClicktoActionLog)}
        >
          <div className="mb-5">
             <div className="bg bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
              <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width={40} 
                  height={40} 
                  viewBox="0 0 24 24"
                  className="text-black" 
                  >
                  <path fill="currentColor" 
                  d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14">
                  </path>
                </svg>
             </div>
          </div>
          <p className="text-[#66009F] font-bold text-2xl">ติดตามสถานะคำขอ</p>
          <p className="text-[#B9B9B9] mt-2 text-base">ตรวจสอบประวัติการใช้งานเอกสาร</p>
        </div>
        
      </div>
      )}

      








      {/* onClick ยังไม่ถูกที่ ทุกอัน */}
      {(userInfo.role_n === "endorser" || userInfo.role_n === "se_endorser") && (
        <div className="flex flex-col items-center justify-center mt-10 gap-5 px-5">
        {/* block1 */}
        <div className="bg-white hover:scale-105 shadow-[#E0E5F9] w-full max-w-lg p-6 shadow-2xl shadow-blue-400/50 rounded-2xl flex flex-col items-center justify-center text-center border border-[#F5F5F5] cursor-pointer hover:shadow-xl transition"
          onClick={() => handleClick(["endorser"],["se_endorser"], ClicktoAdminedit)}
        >
          <div className="mb-5">
             <div className="bg bg-[#E0E5F9] w-15 h-15 rounded flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" 
              width={40} 
              height={40} 
              viewBox="0 0 24 24">
                <path fill="currentColor"
                d="M4 21q-.825 0-1.412-.587T2 19V5q0-.825.588-1.412T4 3h16q.825 0 1.413.588T22 5v14q0 .825-.587 1.413T20 21zm1-4h5v-2H5zm9.55-2l4.95-4.95l-1.425-1.425l-3.525 3.55l-1.425-1.425l-1.4 1.425zM5 13h5v-2H5zm0-4h5V7H5z">
                </path></svg>
             </div>
          </div>
          <p className="text-[#66009F] font-bold text-2xl">อนุมัติคำขอ</p>
          <p className="text-[#B9B9B9] mt-2 text-base">อนุมัติคำขอของผู้ยื่นคำขอ</p>
        </div>
        
      </div>
      )}


    </div>
  );

}

export default Dashboard;

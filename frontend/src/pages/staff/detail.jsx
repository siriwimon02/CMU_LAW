import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from "react-router-dom";

function Detail() {

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const { id } = useParams();             // <-- get id from URL
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  // เปลี่ยนเวลาสากลเป็นเวลาไทย
  function formatThaiDate(iso) {
    try {
      return new Date(iso).toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return iso ?? "";
    }
  }

  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setError("");

        // 1) fetch user
        const u = await fetch('http://localhost:3001/auth/user', {
          headers: { Authorization: `${token}` },
        });
        if (!u.ok) throw new Error('Failed to fetch user');
        const user = await u.json();
        setUserInfo(user);

        // 2) fetch doc status history
        const s = await fetch(`http://localhost:3001/petition/docStatus/${id}`, {
          headers: { Authorization: `${token}` },
        });
        if (!s.ok) throw new Error('Failed to fetch doc status');

        const payload = await s.json(); // { message: "...", set_json: [...] }
        const hist = Array.isArray(payload.set_json) ? payload.set_json : [];

        // ถ้าอยากเรียงเวลาล่าสุดอยู่บนสุด เปิดคอมเมนต์บรรทัดล่างนี้ได้
        // hist.sort((a, b) => new Date(b.changeAt) - new Date(a.changeAt));

        setStatusHistory(hist);
      } catch (err) {
        console.error(err);
        setError(err?.message || "Fetch failed");
        setStatusHistory([]);
      } finally {
        setLoading(false);
      }
    }
    if (id) run();
  }, [id, token]);


 
  if (loading) return <div className="p-6">กำลังโหลด…</div>;

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 text-red-600">เกิดข้อผิดพลาด: {error}</div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white"
        >
          ← back
        </button>
      </div>
    );
  }
  console.log(statusHistory)
  return (
  <>
    <div className="bg-[#F8F8F8] min-h-screen flex justify-center items-center p-6">
      {/* box */}
      <div className="bg-white m-5 min-h-[90vh] w-full rounded-2xl p-6">
        
        {/* header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white shadow flex items-center justify-center border border-gray-100">
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

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="rounded-2xl bg-[#F6F8FF] p-5 border border-purple-100 shadow-sm">
            <p className="text-purple-700 font-semibold">เลขที่คำขอ</p>
            <p className="text-gray-500 mt-2">{statusHistory[0]?.doc_id_doc ?? "-"}</p>
          </div>
          <div className="rounded-2xl bg-[#F6F8FF] p-5 border border-purple-100 shadow-sm">
            <p className="text-purple-700 font-semibold">ผู้ยื่นคำขอ</p>
            <p className="text-gray-500 mt-2">{userInfo?.firstname} {userInfo?.lastname}</p>
          </div>
          <div className="rounded-2xl bg-[#F6F8FF] p-5 border border-purple-100 shadow-sm">
            <p className="text-purple-700 font-semibold">วันที่ยื่นคำขอ</p>
            <p className="text-gray-500 mt-2">
              {statusHistory[0]?.changeAt ? formatThaiDate(statusHistory[0].changeAt) : "-"}
            </p>
          </div>
        </div>

        <hr className="border-gray-200 mb-6 md:mb-8" />

        {/* empty state */}
        {statusHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
            ยังไม่มีประวัติสถานะสำหรับเอกสารนี้
          </div>
        ) : (
          // map รายการสถานะ
          statusHistory.map((item, idx) => {
            // จัดกลุ่มสีด้วย "ข้อความสถานะ"
            const redList = [
              'ส่งกลับให้ผู้ใช้แก้ไขเอกสาร','ส่งกลับให้แก้ไขจากการตรวจสอบโดยหัวหน้า',
              'ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย','ปฏิเสธคำร้อง'
            ];
            const greenList = [
              'รับเข้ากองเรียบร้อย','ส่งต่อไปยังกองอื่น','ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว',
              'ตรวจสอบขั้นต้นเสร็จสิ้น','ตรวจสอบและอนุมัติโดยหัวหน้าเสร็จสิ้น',
              'ตรวจสอบขั้นสุดท้ายเสร็จสิ้น','ตรวจสอบโดยอธิการบดีเสร็จสิ้น','อธิการบดีอนุมัติแล้ว'
            ];
            const orangeList = [
              'รอรับเข้ากอง','อยู่ระหว่างการตรวจสอบขั้นต้น',
              'อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า','อยู่ระหว่างการตรวจสอบขั้นสุดท้าย',
              'อยู่ระหว่างการตรวจสอบโดยอธิการบดี','รอการอนุมัติจากอธิการบดี'
            ];

            

            let bgColor = "bg-gray-200";
            if (redList.includes(item.status)) bgColor = "bg-[#FFF4F4]";
            else if (greenList.includes(item.status)) bgColor = "bg-[#F6FFF9]";
            else if (orangeList.includes(item.status)) bgColor = "bg-[#FFFCF6]";

            return (
              <div className="my-5 pl-5" key={item.docId ?? idx}>
                <div className="flex">
                  <div className={`ml-1 mr-3 w-1 rounded-full ${bgColor}`}></div>
                  <div className={`w-full md:w-1/2 rounded-lg p-5 shadow-sm relative ${bgColor}`}>
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-md bg-orange-500"></div>
                    <p className="font-semibold text-gray-800">{item.status}</p>
                    <p className="text-gray-700 text-sm mt-1">{item.doc_title ?? '-'}</p>
                    <p className="text-sm mt-2 text-gray-600">
                      {item.changeAt ? formatThaiDate(item.changeAt) : '-'}
                    </p>
                    {item.note && (
                      <p className="text-xs mt-2 text-gray-700">หมายเหตุ: {item.note}</p>
                    )}
                    <p className="text-xs mt-1 text-gray-600">เปลี่ยนโดย: {item.ChangeBy}</p>
                  </div>
                </div>
                
              
              </div>


            );
          })
        )}
      </div>
    </div>
  </>
);
}

export default Detail;

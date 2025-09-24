import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/backToDashboardButton"

function Detail() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

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

  // helper: bg + border color per status
  function getStatusClasses(status) {
    if (redList.includes(status))   return { bg: "bg-[#FFF4F4]", border: "border-[#CD0000]" };
    if (greenList.includes(status)) return { bg: "bg-[#F6FFF9]", border: "border-[#01B56D]" };
    if (orangeList.includes(status))return { bg: "bg-[#FFFCF6]", border: "border-[#E48500]" };
    return { bg: "bg-gray-200", border: "border-gray-300" };
  }

  // current-status font color (darker colors for readability)
  let fontColor = "text-gray-800";
  if (redList.includes(statusHistory[statusHistory.length-1]?.status))   fontColor = "text-[#CD0000]";
  else if (greenList.includes(statusHistory[statusHistory.length-1]?.status)) fontColor = "text-[#01B56D]";
  else if (orangeList.includes(statusHistory[statusHistory.length-1]?.status)) fontColor = "text-[#E48500]";

  // date formatter
  function formatThaiDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso ?? "";

    const datePart = d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    // Format time, strip an existing "น." if the engine adds it, then append once.
    let timePart = d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    timePart = timePart.replace(/\s*น\.\s*$/u, ""); // remove trailing "น." if present

    return `${datePart}  ${timePart} น.`;
  } catch {
    return iso ?? "";
  }
}


  useEffect(() => {
    async function run() {
      try {
        setLoading(true);
        setError("");

        const u = await fetch('http://localhost:3001/auth/user', {
          headers: { Authorization: `${token}` }, // or `Bearer ${token}` if your API expects it
        });
        if (!u.ok) throw new Error('Failed to fetch user');
        const user = await u.json();
        setUserInfo(user);

        const s = await fetch(`http://localhost:3001/petitionHeadAudit/docStatus/${id}`, {
          headers: { Authorization: `${token}` },
        });
        if (!s.ok) throw new Error('Failed to fetch doc status');
        const payload = await s.json();

        const hist = Array.isArray(payload.set_json) ? payload.set_json : [];
        // hist.sort((a, b) => new Date(b.changeAt) - new Date(a.changeAt)); // newest first (optional)
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
  console.log(statusHistory)

  if (loading) return <div className="p-6">กำลังโหลด…</div>;
  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 text-red-600">เกิดข้อผิดพลาด: {error}</div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-gray-900 text-white">
          ← back
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#F8F8F8] min-h-screen flex justify-center items-center p-6 font-kanit">
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
              <h1 className="text-2xl md:text-2xl font-semibold tracking-tight">ติดตามสถานะคำขอ</h1>
            </div>
            <Button />
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="rounded-2xl bg-[#F6F8FF] p-5 border-l-[5px] border-[#66009F] shadow-sm">
              <p className="text-[#66009F] font-semibold text-lg">เลขที่คำขอ</p>
              <p className="text-gray-500 mt-2">{statusHistory[0]?.doc_id_doc ?? "-"}</p>
            </div>

            <div className="rounded-2xl bg-[#F6F8FF] p-5 border-l-[5px] border-[#66009F] shadow-sm">
              <p className="text-[#66009F] font-semibold text-lg">ผู้ยื่นคำขอ</p>
              <p className="text-gray-500 mt-2">{userInfo?.firstname} {userInfo?.lastname}</p>
            </div>

            <div className="rounded-2xl bg-[#F6F8FF] p-5 border-l-[5px] border-[#66009F] shadow-sm">
              <p className="text-[#66009F] font-semibold text-lg">วันที่ยื่นคำขอ</p>
              <p className="text-gray-500 mt-2">
                {statusHistory[0]?.changeAt ? formatThaiDate(statusHistory[0].changeAt) : "-"}
              </p>
            </div>
          </div>

          <hr className="border-gray-400 mb-6 md:mb-8" />

          {/* current status */}
          <div>
            <p className="text-[#66009F] font-extrabold text-2xl mb-2">ขั้นตอนการดำเนินการ</p>
            <p className="px-5 text-gray-700 text-xl mb-2">สถานะปัจจุบัน</p>
            <p className={`px-8 text-xl font-semibold ${fontColor}`}>
              {statusHistory[statusHistory.length-1]?.status ?? "ไม่สามารถตรวจสอบได้"}
            </p>
          </div>

          {/* list */}
          {statusHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center text-gray-700">
              ยังไม่มีประวัติสถานะสำหรับเอกสารนี้
            </div>
          ) : (
            statusHistory.map((item, idx) => {
              const { bg, border } = getStatusClasses(item.status);
              return (
                <div className="my-6" key={item.docId ?? idx}>
                  <div className="flex">
                    <div className={`w-full md:w-1/2 rounded-lg p-5 shadow-sm relative border-l-[6px] ${border} ${bg}`}>
                      <p className="font-semibold text-gray-800 text-lg">{item.status}</p>
                      <p className="text-gray-700 text-md">{item.doc_title ?? '-'}</p>
                      <p className="text-sm  text-gray-600 text-md">
                        {item.changeAt ? formatThaiDate(item.changeAt) : '-'}
                      </p>
                      {item.note && <p className="text-sm text-gray-700">หมายเหตุ: {item.note}</p>}
                      {/* <p className="text-xs mt-1 text-gray-600">เปลี่ยนโดย: {item.ChangeBy}</p> */}
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

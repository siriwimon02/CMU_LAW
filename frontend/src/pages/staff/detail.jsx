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

        const s = await fetch(`http://localhost:3001/petition/docStatus/${id}`, {
            headers: { Authorization: `${token}` },
        });
        if (!s.ok) throw new Error('Failed to fetch doc status');
        const hist = await s.json();
        setStatusHistory(Array.isArray(hist) ? hist : []);

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
              <p className="text-gray-500 mt-2">{statusHistory[0]?.idformal ?? "-"}</p>
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
              if (!item) return null; // กัน null
              const { bg, border } = getStatusClasses(item.status || "");
              return (
                <div className="my-6" key={item.docId ?? idx}>
                  <div
                    className={`w-full md:w-1/2 rounded-lg p-5 shadow-sm relative border-l-[6px] ${border} ${bg}`}
                  >
                    <p className="font-semibold text-gray-800 text-lg">
                      {item.status ?? "-"}
                    </p>
                    {renderStatusDetail(item)}
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



function renderStatusDetail(item) {
  // 1) กรณี "ส่งกลับ"
  if (item.status.includes("ส่งกลับ")) {
    return (
      <div className="mt-2 space-y-1">
        {item.note && <p className="text-sm text-red-700">หมายเหตุ: {item.note}</p>}
        <p className="text-sm text-gray-700">
          แก้ไขโดย: {item.editedByname} {item.editedBylname} ({item.editedByemail})
        </p>
        <p className="text-sm text-gray-500">
          เวลาแก้ไข: {item.editAt ? formatThaiDate(item.editAt) : "-"}
        </p>
        <hr className="my-2" />
        <p className="text-sm text-gray-600">📌 ข้อมูลเดิม</p>
        <ul className="text-sm text-gray-500 list-disc list-inside">
          <li>เรื่อง: {item.oldTitle}</li>
          <li>ผู้รับมอบ: {item.oldAuthorize_to}</li>
          <li>ตำแหน่ง: {item.oldPosition}</li>
          <li>สังกัด: {item.oldAffiliation}</li>
          <li>รายละเอียด: {item.oldAuthorize_text}</li>
        </ul>
      </div>
    );
  }

  // 2) กรณี "แก้ไขเอกสารแล้ว / อัปโหลดเพิ่มเติมแล้ว"
  if (item.status.includes("แก้ไขเอกสารแล้ว") || item.status.includes("อัปโหลดเอกสารเพิ่มเติมแล้ว")) {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-sm text-green-700">
          แก้ไขล่าสุดโดย: {item.editedByname} {item.editedBylname} ({item.editedByemail})
        </p>
        <p className="text-sm text-gray-500">
          เวลา: {item.editAt ? formatThaiDate(item.editAt) : "-"}
        </p>
      </div>
    );
  }

  // 3) กรณี "ส่งต่อไปยังหน่วยงาน"
  if (item.status.includes("ส่งต่อไปยังหน่วยงาน")) {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-sm text-blue-700">
          จาก: {item.transferFrom} → ไปยัง: {item.transferTo}
        </p>
        <p className="text-sm text-gray-700">
          โดย: {item.transferByname} {item.transferBylname} ({item.transferByemail})
        </p>
        <p className="text-sm text-gray-500">
          เวลา: {item.transferAt ? formatThaiDate(item.transferAt) : "-"}
        </p>
        {item.note && <p className="text-sm text-gray-600">หมายเหตุ: {item.note}</p>}
      </div>
    );
  }

  // 4) กรณีสถานะทั่วไป (ตรวจสอบ / อนุมัติ / รับเข้ากอง ฯลฯ)
  return (
    <div className="mt-2 space-y-1">
      <p className="text-sm text-gray-700">
        โดย: {item.changeBy_name} {item.changeBy_lname} ({item.changeBy_email})
      </p>
      <p className="text-sm text-gray-500">
        เวลา: {item.changeAt ? formatThaiDate(item.changeAt) : "-"}
      </p>
      {item.date_of_signing && (
        <p className="text-sm text-gray-600">
          วันที่ลงนาม: {formatThaiDate(item.date_of_signing)}
        </p>
      )}
      {item.note && <p className="text-sm text-gray-600">หมายเหตุ: {item.note}</p>}
    </div>
  );
}


function formatThaiDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso ?? "";

    const datePart = d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });

    let timePart = d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    timePart = timePart.replace(/\s*น\.\s*$/u, "");

    return `${datePart} ${timePart} น.`;
  } catch {
    return iso ?? "";
  }
}


export default Detail;

import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import Header from "../../components/trackingHeader";

function DocumentDetails() {
  const { docId } = useParams();
  const token = localStorage.getItem("token");
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusHistory, setStatusHistory] = useState([]);

  // ตรวจสอบ token
  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchActionLog = async () => {
      try {
        const res = await fetch(`/api/action_log/${docId}`, {
          headers: {
            Authorization: token,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch action log");

        const data = await res.json();

        console.log("Fetched action log data:", data);

        if (data.thTimelineDesc && data.thTimelineDesc.length > 0) {
            console.log("First timeline item:", data.thTimelineDesc[0]);
            console.log("First timeline item:", data.thTimelineDesc[1]);
        } else {
        console.log("No timeline data found");
        }

        const sortedTimeline = data.thTimelineDesc.sort(
          (a, b) => new Date(b.date_time) - new Date(a.date_time)
        );
        setTimeline(sortedTimeline);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("เกิดข้อผิดพลาดในการโหลด Action Log");
        setLoading(false);
      }
    };

    fetchActionLog();
  }, [docId, token]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };
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
    'ตรวจสอบเอกสารเรียบร้อยแล้ว',
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
    'เอกสารอยู่ระหว่างการตรวจสอบเอกสารภายในกอง'
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

  
  return (
    <div className="min-h-screen font-kanit bg-[#F8F8F8] pb-10">
      <Header />
      <div className="flex items-center justify-center mt-5">
        <div className="bg-white rounded-2xl shadow-md p-6 w-[75vw] min-h-[75vh] flex flex-col">
          <h1 className="ml-5 text-2xl font-bold mb-5">ตรวจสอบประวัติเอกสาร</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="rounded-2xl bg-[#F6F8FF] p-5 border-l-[5px] border-[#66009F] shadow-sm">
              <p className="text-[#66009F] font-semibold text-lg">เลขที่คำขอ</p>
              <p className="text-gray-500 mt-2">{timeline[0]?.id_doc ?? "-"}</p>
            </div>

            <div className="rounded-2xl bg-[#F6F8FF] p-5 border-l-[5px] border-[#66009F] shadow-sm">
              <p className="text-[#66009F] font-semibold text-lg">ผู้ยื่นคำขอ</p>
              <p className="text-gray-500 mt-2">
                {timeline[timeline.length - 1]?.actionBy ?? "-"}
                </p>
            </div>

            <div className="rounded-2xl bg-[#F6F8FF] p-5 border-l-[5px] border-[#66009F] shadow-sm">
              <p className="text-[#66009F] font-semibold text-lg">วันที่ยื่นคำขอ</p>
              <p className="text-gray-500 mt-2">
                {timeline[0]?.date_time ? formatDate(timeline[0].date_time) : "-"}
              </p>
            </div>
          </div>
          <hr className="border-gray-400" />
          <h1 className="text-lg font-bold mt-5 text-[#66009F]">ประวัติการดำเนินการเอกสาร</h1>
          <div className="overflow-y-auto flex-1 m-5">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-[#F1EEFF] sticky top-0">
                        <tr >
                            <th className="px-4 py-2 text-center text-gray-700 text-sm">วันและเวลา</th>
                            <th className="px-4 py-2 text-center text-gray-700 text-sm">ผู้ดำเนินการ</th>
                            <th className="px-4 py-2 text-center text-gray-700 text-sm">บทบาท/ตำแหน่ง</th>
                            <th className="px-4 py-2 text-center text-gray-700 text-sm">การดำเนินการ</th>
                            <th className="px-4 py-2 text-center text-gray-700 text-sm">หมายเหตุ</th>
                        </tr>
                        </thead>
                        <tbody>
                        {timeline.map((tl, i) => (
                            <tr key={i} className="border-b border-gray-300 hover:bg-gray-50">
                                <td className="px-6 py-2">{formatDate(tl.date_time)}</td>
                                <td className="px-6 py-2">{tl.actionBy}</td>
                                <td className="px-6 py-2">{tl.role_name}</td>
                                <td className="px-6 py-2">{tl.action}</td>
                                <td className="px-6 py-2">{tl.text || "-"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentDetails;

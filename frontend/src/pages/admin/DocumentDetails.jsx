import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import Navbar from '../../components/navbar'

function DocumentDetails() {
  const { docId } = useParams();
  const token = localStorage.getItem("token");
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docData, setDocData] = useState(null);


  // ตรวจสอบ token
  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchActionLog = async () => {
      try {
        const res = await fetch(`/petitionAdmin/api/action_log/${docId}`, {
          headers: {
            Authorization: token,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch action log");

        const data = await res.json();

        console.log("Fetched action log data:", data);
        
        setDocData(data);

        if (data.thTimelineDesc && data.thTimelineDesc.length > 0) {
          for (let i = 0; i < data.thTimelineDesc.length; i++) {
            console.log(`Timeline item ${i}:`, data.thTimelineDesc[i]);
          }
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
        second: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

    const getRoleColor = (roleName) => {
        switch(roleName) {
            case 'user':
                return 'bg-[#efefef] text-[#686868]'; // เทา
            case 'auditor':
                return 'bg-[#FFFBEB] text-[#CA8A04]'; // เหลือง
            case 'spv_auditor':
                return 'bg-[#FEE2E2] text-[#DC2626]'; // สีแดง
             case 'head_auditor':
                return 'bg-[#FFEDD5] text-[#EA580C]'; // ส้ม
            case 'admin':
                return 'bg-[#F1EDFF] text-[#66009F]'; // สีม่วง
        }
    };
    

  return (
    <div className="min-h-screen font-kanit bg-[#F8F8F8] pb-10">
      <Navbar />
      <div className="flex items-center justify-center mt-5">
        <div className="bg-white rounded-2xl shadow-md p-6 w-[90vw] min-h-[100vh] flex flex-col">
          <h1 className="ml-5 text-2xl font-bold mb-5">ตรวจสอบประวัติเอกสาร</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="rounded-2xl bg-[#F6F8FF] p-5 border-l-[5px] border-[#66009F] shadow-sm">
              <p className="text-[#66009F] font-semibold text-lg">เลขที่คำขอ</p>
              <p className="text-gray-500 mt-2">{docData?.id_doc ?? "-"}</p>
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
          
          <div className="m-5 overflow-hidden">
            <div className="max-h-[35vw] overflow-y-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#F1EEFF] text-[#66009F] sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 font-normal text-center text-md">วันและเวลา</th>
                    <th className="px-4 py-2 font-normal text-center text-md">ผู้ดำเนินการ</th>
                    <th className="px-4 py-2 font-normal text-center text-md">สิทธิ์</th>
                    <th className="px-4 py-2 font-normal text-center text-md">การดำเนินการ</th>
                    <th className="px-4 py-2 font-normal text-center text-md">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.map((tl, i) => (
                    <tr key={i} className="border-b border-gray-300 hover:bg-gray-50">
                      <td className="px-6 py-2">{formatDate(tl.date_time)}</td>
                      <td className="px-6 py-2">{tl.actionBy}</td>
                      <td className="px-6 py-2">
                        <span className={`px-2 py-1 rounded-full text-sm ${getRoleColor(tl.role_name)}`}>
                          {tl.role_name}
                        </span>
                      </td>
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
    </div>
  );
}

export default DocumentDetails;

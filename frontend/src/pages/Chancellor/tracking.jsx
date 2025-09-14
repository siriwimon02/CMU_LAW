import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Header from "../../components/trackingHeader";

const BRAND_PURPLE = "#66009F";
export default function Tracking() {
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState(null);
  const [status, setStatus] = useState("pending"); // เริ่มที่ 'รอการอนุมัติ'

  const navigate = useNavigate();

  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3001/auth/user", {
          headers: { Authorization: `${token}` },
        });
        const data = await res.json();
        setUserInfo(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [token]);

  if (!userInfo) return <div>Loading...</div>;

  //เนื้อหาการ์ดของหน้า tracking fake ขึ้นมาน้า
  const cardMap = {
    checked: {
      requestNo: "POA-2025-0818-1631",
      applicant: "Siriwimon Y.",
      date: "18 ส.ค. 2025",
      label: "ตรวจสอบเอกสารเรียบร้อย",
      color: "#05A967",
    },
    pending: {
      requestNo: "POA-2025-0819-1122",
      applicant: "Siraprapa K.",
      date: "19 ส.ค. 2025",
      label: "รออนุมัติ",
      color: "#E48500", 
    },
    rejected: {
      requestNo: "POA-2025-0818-1631",
      applicant: "Siriwimon Y.",
      date: "18 ส.ค. 2025",
      label: "ไม่อนุมัติ",
      color: "#CD0000",
    },
  };
  const card = cardMap[status];
  const goDetail = () => navigate(`/detail/${card.requestNo}`);

  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
      <Header />

      {/* ปุ่มด้านบน ใช้ขนาด/spacing เดียวกับ seendorser น้าา */}
      <div className="w-full px-6 mt-6 flex gap-4">
        {/* ตรวจสอบเอกสารเรียบร้อยแล้ว */}
        <button
          onClick={() => setStatus("checked")}
          className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow hover:bg-gray-50 flex items-center gap-2"
          title="ตรวจสอบเอกสารเรียบร้อยแล้ว"
        >
          
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{ width: 20, height: 20, backgroundColor: BRAND_PURPLE }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>ตรวจสอบเอกสารเรียบร้อยแล้ว</span>
        </button>

        {/* รอการอนุมัติ — เอาวงกลมม่วงออก เหลือไอคอนเดี่ยวตามที่ขอ */}
        <button
          onClick={() => setStatus("pending")}
          className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow hover:bg-gray-50 flex items-center gap-2"
          title="รอการอนุมัติ"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke={BRAND_PURPLE}
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          <span>รอการอนุมัติ</span>
        </button>

        {/* ไม่อนุมัติ */}
        <button
          onClick={() => setStatus("rejected")}
          className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow hover:bg-gray-50 flex items-center gap-2"
          title="ไม่อนุมัติ"
        >
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{ width: 20, height: 20, backgroundColor: BRAND_PURPLE }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </span>
          <span>ไม่อนุมัติ</span>
        </button>
      </div>

      {/* การ์ดข้อมูล — ใช้สไตล์เดียวกับ seendorserน้าา */}
      <main className="flex-1">
        <article className="w-full px-6 mt-6">
          <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 shadow-md">
            <div className="flex flex-wrap md:flex-nowrap items-start md:items-center justify-between gap-4">
              {/* ซ้าย: ข้อมูลของ tracking */}
              <div className="leading-6 text-gray-900">
                <p className="font-bold text-lg">
                  เลขที่คำขอ: <span className="font-extrabold">{card.requestNo}</span>
                </p>
                <p>
                  ผู้ยื่นคำขอ: <span className="font-regular">{card.applicant}</span>
                </p>
                <p>วันที่ยื่นคำขอ: {card.date}</p>
                <p className="font-regular mt-1" style={{ color: card.color }}>
                  {card.label}
                </p>
              </div>

              {/* ขวา: ปุ่มการกระทำ(เหมือน seendorser)น้าา + ปุ่มอนุมัติ/ไม่อนุมัติเมื่อ pending */}
              <div className="flex items-center gap-4">
                {/* ดูรายละเอียด */}
                <button
                  onClick={goDetail}
                  className="bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 shadow-md hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-3.6-3.6" strokeLinecap="round" />
                  </svg>
                  ดูรายละเอียด
                </button>

                {/* โชว์เฉพาะตอนรออนุมัติ */}
                {status === "pending" && (
                  <>
                    <button
                      onClick={() => setStatus("checked")}
                      className="bg-[#05A967] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#048a52] flex items-center gap-2"
                    >
                      {/* check */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      อนุมัติ
                    </button>

                    <button
                      onClick={() => setStatus("rejected")}
                      className="bg-[#CD0000] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#a60000] flex items-center gap-2"
                    >
                      
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                      ไม่อนุมัติ
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

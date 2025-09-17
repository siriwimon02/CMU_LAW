import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Header from '../components/trackingHeader';
import ForwardToAuditorButton from "../components/ForwardToAuditorButton";
import ForwardToDepartmentButton from "../components/ForwardToDepartmentButton";

function SpvAuditor() {
  // 1.check role 2.tab bar 3.connect with db
  const navigate = useNavigate();                    // hook 1
  const token = localStorage.getItem("token");       // plain value

  // hooks must always run (same order every render)
  const [documentAll, setDocumentAll] = useState([]);// hook 3
  const [history_accept, sethistory_accept] = useState([]);
  const [history_change_des, sethistory_change_des] = useState([]);
  const [approveOpen, setApproveOpen] = useState(false); // hook 4
  const [selected, setSelected] = useState(null);    // hook 5
  const [modalPhase, setModalPhase] = useState("confirm"); // "confirm" | "success"
  const [deptView, setDeptView] = useState("form");
  // ✨ ใช้ state นี้ควบคุมป๊อปอัพ ForwardToDepartment
  const [rejectOpen, setRejectOpen] = useState(false);

  // ตัวกรองจากปุ่มด้านบน: 'all' | 'orange' | 'blue' | 'green'
  const [filterStatus, setFilterStatus] = useState('all');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res1 = await fetch("http://localhost:3001/petitionSuperAudit/wait_to_accept", {
          headers: { Authorization: `${token}` },
        });

        const res2 = await fetch("http://localhost:3001/petitionSuperAudit/history_accept", {
          headers: { Authorization: `${token}` },
        });

        const res3 = await fetch("http://localhost:3001/petitionSuperAudit/history_change_des", {
          headers: { Authorization: `${token}` },
        });

        const doc_wait_accept = await res1.json();
        const doc_accepted = await res2.json();
        const doc_changed_des = await res3.json();

        console.log(doc_wait_accept);
        console.log(doc_accepted);
        console.log(doc_changed_des);

        setDocumentAll(doc_wait_accept.document_json || []);
        sethistory_accept(doc_accepted.document_json || []);
        sethistory_change_des(doc_changed_des.document_json || []);
      } catch (e) {
        console.error("Fetch petitions failed", e.message);
        alert(`เกิดข้อผิดพลาด: ${e.message}`); // 👈 แจ้งเตือนผู้ใช้
        setDocumentAll([]);
        sethistory_accept([]);
        sethistory_change_des([]);
      }
    })();
  }, [token]);
  const data = documentAll



  // ฟังก์ชันช่วยเช็คสถานะ (รองรับข้อความไดนามิก)
  const isBlueStatus = (s) =>
  s === 'ส่งไปยังหน่วยงานอื่นเเล้ว' ||
  s?.startsWith('ส่งไปยัง') ||
  s?.startsWith('ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง');
  const isGreenStatus = (s) => s === 'รับเข้ากองเรียบร้อย';
  const isOrangeStatus = (s) => s === 'รอรับเข้ากอง';

  // ====== Handlers: ส่งไปหน่วยงานอื่น (ป๊อปอัพ ForwardToAuditorButton เดิม) ======
  const openApprove = (item) => {
    setSelected(item);
    setModalPhase("confirm");
    setApproveOpen(true);
  };
  const closeApprove = () => {
    setApproveOpen(false);
    setModalPhase("confirm");
    setSelected(null);
  };


  // ====== Handlers: ส่งต่อไปยังผู้ตรวจสอบ -> เปิดป๊อปอัพ ForwardToDepartment ======
  const openReject = (item) => {
    setSelected(item);
    setDeptView("form");
    setRejectOpen(true);
  };


  const closeReject = () => {
    setRejectOpen(false);
    setSelected(null);
    setDeptView("form");
  };


  const BRAND_PURPLE = "#66009F";


  const statusMap = {
    orange: 'รอคัดกรอง',
    blue:   'ส่งไปยังหน่วยงานอื่นเเล้ว',
    green:  'ส่งต่อไปที่ผู้ตรวจสอบเเล้ว',
  };

  const filteredItems = (() => {
    if (filterStatus === 'all') return data;

    if (filterStatus === 'orange') {
      return data.filter(it => isOrangeStatus(it.status_name));
    }
    if (filterStatus === 'blue') {
      // รวมทั้ง "ส่งไปยังหน่วยงานอื่นแล้ว" แบบเดิม และ "ส่งต่อไปยัง{หน่วยงาน}"
      return history_change_des.filter(it => isBlueStatus(it.status_name));
    }
    if (filterStatus === 'green') {
      return history_accept.filter(it => isGreenStatus(it.status_name));
    }
    return data;
  })();

  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
      <Header />

      {/* ปุ่มตัวกรอง */}
      <div className="w-full px-6 mt-6 flex gap-4">
        <button
          onClick={() => setFilterStatus('orange')}
          className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow hover:bg-gray-50 flex items-center gap-2"
          title="รอคัดกรอง"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill={BRAND_PURPLE}>
            <path d="M16.5 19q1.05 0 1.775-.725T19 16.5t-.725-1.775T16.5 14t-1.775.725T14 16.5t.725 1.775T16.5 19m5.1 4l-2.7-2.675q-.525.325-1.137.5T16.5 21q-1.875 0-3.187-1.312T12 16.5t1.313-3.187T16.5 12t3.188 1.313T21 16.5q0 .675-.187 1.288t-.513 1.137L23 21.6zM5 22q-.825 0-1.412-.587T3 20V4q0-.825.588-1.412T5 2h8l6 6v2.5q-.6-.25-1.225-.375T16.5 10q-3.075 0-4.812 2.038T9.95 16.575q0 1.55.738 3T13.025 22zm7-13h5l-5-5l5 5l-5-5z"></path>
          </svg>
          <span>รอคัดกรอง</span>
        </button>

        <button
          onClick={() => setFilterStatus('blue')}
          className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow hover:bg-gray-50 flex items-center gap-2"
          title="ส่งไปหน่วยงานอื่น"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill={BRAND_PURPLE}>
            <path d="M11 19h2v-4.175l1.6 1.6L16 15l-4-4l-4 4l1.425 1.4L11 14.825zm-5 3q-.825 0-1.412-.587T4 20V4q0-.825.588-1.412T6 2h8l6 6v12q0 .825-.587 1.413T18 22zm7-13h5l-5-5z"></path>
          </svg>
          <span>ส่งไปหน่วยงานอื่น</span>
        </button>

        <button
          onClick={() => setFilterStatus('green')}
          className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow hover:bg-gray-50 flex items-center gap-2"
          title="ส่งต่อไปที่ผู้ตรวจสอบ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill={BRAND_PURPLE}>
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 .41.12.8.34 1.12c.07.11.16.21.25.29c.36.37.86.59 1.41.59h7.53c-.53-.58-.92-1.25-1.18-2H6V4h7v5h5v3c.7 0 1.37.12 2 .34V8zm4 21l5-4.5l-3-2.7l-2-1.8v3h-4v3h4z"></path>
          </svg>
          <span>ส่งต่อไปที่ผู้ตรวจสอบ</span>
        </button>
      </div>

      {/* รายการเอกสาร */}
      {filteredItems.map((item) => {
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

        // ✅ แทนที่การใช้ blueList/greenList/orangeList ด้วยฟังก์ชันช่วย
        const isBlue   = isBlueStatus(item.status_name);
        const isGreen  = isGreenStatus(item.status_name);
        const isOrange = isOrangeStatus(item.status_name);

        return (
          <article key={item.id} className="rounded-md bg-white shadow p-4 mx-6 mt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1 text-gray-800">
                <p className="font-bold">
                  เลขที่คำขอ: <span className="font-extrabold">{item.request_no ?? item.id}</span>
                </p>
                <p>ผู้ที่ยื่นคำขอ: <span>{item.authorize_to}</span></p>
                <p>วันที่ยื่นคำขอ: {created}</p>

                <p
                  className="font-medium"
                  style={
                    isBlue
                      ? { color: "#0078E2" }
                      : isGreen
                      ? { color: "#05A967" }
                      : isOrange
                      ? { color: "#E48500" }
                      : { color: "#666666" }
                  }
                >
                  {item.status_name ?? "ไม่สามารถตรวจสอบได้"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 items-center self-start">
                {isOrange && (
                  <>
                    {/* ปุ่มส่งไปยังหน่วยงานอื่น */}
                    <button
                      type="button"
                      onClick={() => openApprove(item)}
                      className="bg-[#0078E2] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#0066c2] flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        style={{ transform: "rotate(-40deg)" }}
                      >
                        <path d="m19.8 12.925l-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5l-6 1.5zm0 0V7z"></path>
                      </svg>
                      ส่งไปยังหน่วยงานอื่น
                    </button>

                    {/* ปุ่มส่งต่อไปยังผู้ตรวจสอบ -> เปิดป๊อปอัพ ForwardToDepartment */}
                    <button
                      onClick={() => openReject(item)}
                      className="bg-[#05A967] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#048a52] flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                      </svg>
                      ส่งต่อไปที่ผู้ตรวจสอบ
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        );
      })}


      {/* ===== ป๊อปอัพเดิม: ส่งคำขอไปยังหน่วยงานอื่น (ฟ้า) ===== */}
      <ForwardToAuditorButton
      open={approveOpen}
      view={modalPhase}
      item={selected}
      onClose={closeApprove}
      onConfirm={({ department }) => {
        const deptLabelMap = {
          LAW: "กองกฎหมาย",
          RES: "สำนักงานบริหารงานวิจัย",
          INT: "ศูนย์บริหารพันธกิจสากล",
        };
        const deptLabel = deptLabelMap[department] ?? "หน่วยงานอื่น";

        // ✅ เซ็ตสถานะแบบเฉพาะหน่วยงาน
        setDocumentAll(prev =>
          (prev?.length ? prev : data).map(doc =>
            doc.id === selected?.id
              ? {
                  ...doc,
                  status_name: `ส่งไปยัง${deptLabel}`,   // 👈 เปลี่ยนเป็น "ส่งไปยัง..."
                  destination_name: deptLabel,
                }
              : doc
          )
        );

        setModalPhase("success");
        setTimeout(() => {
          setApproveOpen(false);
          setModalPhase("confirm");
          setSelected(null);
        }, 1000);
      }}
    />


      {/* ===== ป๊อปอัพ: ส่งต่อไปที่ผู้ตรวจสอบ (เขียว) ===== */}
      <ForwardToDepartmentButton
        open={rejectOpen}
        view={deptView}          // "form" | "success"
        item={selected}
        onClose={closeReject}
        hideTrigger
        onSubmit={({ note, item: submittedItem }) => {
          // ใช้ submittedItem (หรือ selected) ในการอัปเดต
          setDocumentAll(prev =>
            (prev?.length ? prev : data).map(doc =>
              doc.id === (submittedItem?.id ?? selected?.id)
                ? { ...doc, status_name: 'ส่งต่อไปที่ผู้ตรวจสอบเเล้ว' }
                : doc
            )
          );

          setDeptView("success");           // โชว์หน้า success
          setTimeout(() => closeReject(), 1500); // ปิดอัตโนมัติ
        }}
      />
    </div>
  );
}

export default SpvAuditor;

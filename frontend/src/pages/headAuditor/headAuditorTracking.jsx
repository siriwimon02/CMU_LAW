import React, { useEffect, useState, useMemo, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from '../../components/navbar'
import {CheckPopup,EditPopup,CheckConfirmedPopup,EditConfirmedPopup,} from "../../components/HeadAuditorPopups";


function HeadAuditorTracking() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [documentAll, setDocumentAll] = useState([]);
  const [historySendBack, setHistorySendBack] = useState([]);
  const [historyAccept, setHistoryAccept] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reason, setReason] = useState("");

  const [checkPopupOpen, setCheckPopupOpen] = useState(false);
  const [checkConfirmedOpen, setCheckConfirmedOpen] = useState(false);
  const [editPopupOpen, setEditPopupOpen] = useState(false);
  const [editConfirmedOpen, setEditConfirmedOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");


  // ===== สร้าง key localStorage ตามอีเมลผู้ใช้ =====
  function getCurrentUserEmailFromToken(tk) {
    try {
      const payload = JSON.parse(atob((tk || "").split(".")[1] || ""));
      return (payload?.email || payload?.user?.email || "").toLowerCase().trim();
    } catch {
      return "";
    }
  }

  const userEmailKey =
    getCurrentUserEmailFromToken(token) ||
    (localStorage.getItem("userEmail") || localStorage.getItem("email") || "")
      .toLowerCase()
      .trim() ||
    "unknown";

  const ns = (base) => `${base}:headAuditor:${userEmailKey}`;
  const LS_KEY_SEND_BACK = ns("historySendBack");
  const LS_KEY_ACCEPT = ns("historyAccept");

  const userKeyRef = useRef(userEmailKey);
  useEffect(() => {
    if (userKeyRef.current !== userEmailKey) {
    }
    userKeyRef.current = userEmailKey;
  }, [userEmailKey]);

  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  // ===== โหลดข้อมูลทั้งหมด =====
 useEffect(() => {
  async function getDocs() {
    try {
      const [res1, res2, res3] = await Promise.all([
        fetch("http://localhost:3001/petitionHeadAudit/wait_to_accept_byHeadaudit", {
          headers: { Authorization: `${token}` },
        }),
        fetch("http://localhost:3001/petitionHeadAudit/history_seconde_audited", {
          headers: { Authorization: `${token}` },
        }),
        fetch("http://localhost:3001/petitionHeadAudit/history_send_back_edit_headauditor", {
          headers: { Authorization: `${token}` },
        }),
      ]);

      const [docs1, rawAccept, rawSendBack] = await Promise.all([
        res1.json(),
        res2.json(),
        res3.json(),
      ]);
      setDocumentAll(docs1?.document_json || []);
      setHistoryAccept(rawAccept || []);
      setHistorySendBack(rawSendBack || []);

    } catch (err) {
      console.error("Fetch docs error:", err);
    } finally {
      setLoading(false);
    }
  }
  getDocs();
}, [token, reloadKey]);

// ตรวจสอบเอกสารที่เข้ามาแบบไม่รีหน้าจอเอง
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const res = await fetch("http://localhost:3001/petitionHeadAudit/wait_to_accept_byHeadaudit", {
        headers: { Authorization: `${token}` },
      });
      const data = await res.json();
      const newDocs = data?.document_json || [];

      if (newDocs.length > documentAll.length) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error checking new docs:", err);
    }
  }, 3000); 

  return () => clearInterval(interval);
}, [documentAll, token]);


const refreshDocuments = async () => {
      try {
        const [res1, res2, res3] = await Promise.all([
          fetch("http://localhost:3001/petitionHeadAudit/wait_to_accept_byHeadaudit", {
            headers: { Authorization: `${token}` },
          }),
          fetch("http://localhost:3001/petitionHeadAudit/history_seconde_audited", {
            headers: { Authorization: `${token}` },
          }),
          fetch("http://localhost:3001/petitionHeadAudit/history_send_back_edit_headauditor", {
            headers: { Authorization: `${token}` },
          }),
        ]);

        const [docs1, rawAccept, rawSendBack] = await Promise.all([
          res1.json(),
          res2.json(),
          res3.json(),
        ]);
        setDocumentAll(docs1?.document_json || []);
        setHistoryAccept(rawAccept || []);
        setHistorySendBack(rawSendBack || []);

    } catch (err) {
      console.error("Fetch docs error:", err);
    } finally {
      setLoading(false);
    }
}



//  Submit ตรวจสอบ 
const submitCheck = async () => {
  try {
    const res = await fetch(
      `http://localhost:3001/petitionHeadAudit/update_st_audit_by_Headaudit/${selectedDoc.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ text_edit_suggesttion: reason }),
      }
    );

    const data = await res.json();

    if (res.ok) {
      setCheckPopupOpen(false);

      setDocumentAll((prev) => prev.filter((d) => d.docId !== newCard.docId));
      setHistoryAccept((prev) => [...prev, newCard]);

      setCheckConfirmedOpen(true);

      setTimeout(() => {
        setCheckConfirmedOpen(false);
        window.location.reload();
      }, 1);
    } else {
      console.error("submitCheck failed:", await res.text());
    }
  } catch (err) {
    console.error("submitCheck error:", err);
  }
};



//  Submit ส่งกลับแก้ไข 
const submitEdit = async () => {
  try {
    const res = await fetch(
      `http://localhost:3001/petitionHeadAudit/edit_ByheadAuditor/${selectedDoc.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({ text_edit_suggesttion: reason }),
      }
    );

    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      console.log("no response json");
    }

    if (res.ok) {
      setDocumentAll((prev) => {
      const filtered = prev.filter(
        (d) => d.docId !== newCard.docId && d.id !== newCard.docId
      );
      localStorage.setItem("documentAll", JSON.stringify(filtered));
      return filtered;
    });


      setHistorySendBack((prev) => {
        const updated = [...prev, newCard];
        localStorage.setItem(LS_KEY_SEND_BACK, JSON.stringify(updated));
        return updated;
      });

      setEditPopupOpen(false);
      setReason("");
      setEditConfirmedOpen(true);

      setTimeout(() => {
        setEditConfirmedOpen(false);
        setReloadKey((k) => k + 1);
        window.location.reload();
      }, 1);
    } else {
      console.error("Submit failed:", await res.text());
    }
  } catch (err) {
    console.error("submitEdit error:", err);
  }
};



  const handleCheck = (doc) => {
    setSelectedDoc(doc);
    setReason("");
    setCheckPopupOpen(true);
  };

  const openEditPopup = (doc) => {
    setSelectedDoc(doc);
    setReason("");
    setEditPopupOpen(true);
  };

const currentItems = useMemo(() => {
  const pick = () => {
    if (activeTab === "documentAll") return documentAll;
    if (activeTab === "history_sendback") return historySendBack;
    if (activeTab === "history_accept") return historyAccept;

    // รวมทั้งหมดในโหมด all
    return [
      ...documentAll.map((x) => ({
        ...x,
        __bucket: "รอตรวจโดยหัวหน้ากอง",
      })),
      ...historySendBack.map((x) => ({
        ...x,
        __bucket: "ส่งกลับแก้ไข",
      })),
      ...historyAccept.map((x) => ({
        ...x,
        __bucket: "ตรวจสอบเสร็จสิ้น",
      })),
    ];
  };


const getSortTime = (doc) => {
  // กลุ่ม "รอตรวจโดยหัวหน้ากอง" ให้ใช้ changeAt ก่อน
  if (doc.__bucket === "รอตรวจโดยหัวหน้ากอง") {
    const t =
      doc.changeAt || doc.updatedAt || doc.editedAt || doc.createdAt || doc.createAt;
    const n = Date.parse(t);
    return Number.isNaN(n) ? 0 : n;
  }

  // กลุ่มอื่น ๆ ใช้ editedAt > updatedAt > changeAt > createdAt
  const t =
    doc.editedAt || doc.updatedAt || doc.changeAt || doc.createdAt || doc.createAt;
  const n = Date.parse(t);
  return Number.isNaN(n) ? 0 : n;
};

return pick()
  .slice() // กัน side-effect
  .sort((a, b) => {
    const aWait = a.__bucket === "รอตรวจโดยหัวหน้ากอง";
    const bWait = b.__bucket === "รอตรวจโดยหัวหน้ากอง";
    if (aWait !== bWait) return aWait ? -1 : 1; // กลุ่มรอตรวจอยู่บนสุดเสมอ

    // ภายในกลุ่มเดียวกัน เรียงตามเวลาล่าสุดก่อน
    const ta = getSortTime(a);
    const tb = getSortTime(b);
    if (tb !== ta) return tb - ta;

    // tie-breaker กันสลับตำแหน่งเมื่อเวลาเท่ากัน
    const ida = a.historyId || a.docId || a.id || 0;
    const idb = b.historyId || b.docId || b.id || 0;
    return idb - ida;
  });


}, [activeTab, documentAll, historySendBack, historyAccept]);


const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString ?? "";
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

    // รวมวันที่และเวลา
    return `${datePart} ${timePart} น.`;
  } catch {
    return dateString ?? "";
  }
};

const getDocNumber = (doc) => {
  return (
    doc.idformal ||
    doc.id_doc ||
    doc.doc_id ||
    doc.docId ||
    doc.id ||
    doc.idFormal || 
    "-"
  );
};


const greenList = ["หัวหน้างานตรวจสอบแล้ว","อยู่ระหว่างตรวจสอบโดยผู้อำนวยการ"];
const orangeList = ["อยู่ระหว่างตรวจสอบโดยหัวหน้างาน"];
const redList = ["อยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่","ส่งคืนแก้ไขเอกสารโดยหัวหน้างาน"];

if (loading) return <div>Loading...</div>;




 const ClickForMoreDetail = (doc) => {
    navigate(`/detail/${doc.docId || doc.id}`);

  }
  // view petition
  const ClickForViewPet = (doc) => {
    navigate(`/view/${doc.docId || doc.id}`);
  };



   return (
    <div className="min-h-screen font-kanit bg-[#F8F8F8]">
     <Navbar />
      <div className="flex flex-col items-center justify-center mt-5 pb-10">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#F5F5F5] w-[85vw] min-h-screen justify-center items-center  p-5">
          <p className="text-2xl font-bold mb-5">รายการเอกสารที่ต้องตรวจสอบ</p>
          {/* แถวค้นหา + เลือกสถานะ */}
          <div className="flex flex-col md:flex-row gap-3 mb-4 w-full">
            {/* ช่องค้นหาเอกสาร */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="พิมพ์เพื่อค้นหาเลขที่เอกสาร"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#66009F]"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 absolute left-3 top-1/2 -translate-y-1/2 text-[#66009F]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </div>

            {/* ช่องเลือกสถานะ */}
            <div className="relative flex-1">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full h-12 pl-12 pr-10 rounded-lg border text-sm bg-white text-gray-800 border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#66009F] appearance-none"
              >
                <option value="all">รวมทั้งหมด</option>
                <option value="documentAll">อยู่ระหว่างตรวจสอบโดยหัวหน้างาน</option>
                <option value="history_sendback">ส่งคืนแก้ไขเอกสารโดยหัวหน้างาน</option>
                <option value="history_accept">หัวหน้างานตรวจสอบแล้ว</option>
              </select>

              {/* ไอคอนด้านซ้าย */}
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#66009F]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"> <path d="M9.5 2A1.5 1.5 0 0 0 8 3.5v1A1.5 1.5 0 0 0 9.5 6h5A1.5 1.5 0 0 0 16 4.5v-1A1.5 1.5 0 0 0 14.5 2z"/> <path fillRule="evenodd" d="M6.5 4.037c-1.258.07-2.052.27-2.621.84C3 5.756 3 7.17 3 9.998v6c0 2.829 0 4.243.879 5.122c.878.878 2.293.878 5.121.878h6c2.828 0 4.243 0 5.121-.878c.879-.88.879-2.293.879-5.122v-6c0-2.828 0-4.242-.879-5.121c-.569-.57-1.363-.77-2.621-.84V4.5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3zM7 9.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 13.25a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 16.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5z" clipRule="evenodd"/> </svg>
              </span>

              {/* ลูกศรขวา */}
              <svg
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.2l3.71-2.97a.75.75 0 1 1 .94 1.16l-4.24 3.39a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18z" />
              </svg>
            </div>
          </div>


            {/* ทั้งหมด */}
     {activeTab === "all" && (
      <>
        {currentItems.length === 0 ? (
          <p className="text-2xl text-gray-500 flex item-center mt-10 justify-center">
            ไม่มีเอกสารที่ต้องตรวจสอบ
          </p>
        ) : (
           currentItems
            .filter((doc) => {
              const term = searchTerm.toLowerCase();
              return !term || getDocNumber(doc)?.toLowerCase().includes(term);
            })
            .map((doc, index) =>  {
                  const statusNow =
                    doc.status_name ||
                    doc.oldstatus ||
                    doc.doc_statusNow ||
                    doc.status?.status ||
                    "-";

                  const statusClass = greenList.includes(statusNow)
                    ? "text-[#05A967]"
                    : orangeList.includes(statusNow)
                    ? "text-[#E48500]"
                    : redList.includes(statusNow)
                    ? "text-[#CD0000]"
                    : "text-gray-600";

                  const showCheckButton = orangeList.includes(statusNow);
                    if (doc.__bucket === "รอตรวจโดยหัวหน้ากอง") {
                        return (
                      <div
                        key={doc.docId || doc.id}
                        className="border border-white rounded-xl px-4 py-5 mb-4 bg-white shadow-md flex flex-col gap-4 min-h-[180px] h-auto break-words overflow-hidden"
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                              <p className="font-bold text-xl break-words overflow-hidden line-clamp-2">{doc.doc_title || doc.title || "-"}</p>
                              <p  className="break-words overflow-hidden line-clamp-2">เลขที่คำขอ:{" "} 
                                  <span className="font-medium">
                                    {getDocNumber(doc)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">ผู้ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {doc.ownername} {doc.owneremail}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">เจ้าหน้าที่ตรวจสอบ:{" "} 
                                  <span className="font-medium">
                                    {doc.auditBy} {doc.auditByemail}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.createdAt)}
                                  </span>
                                </p>
       
                                <p className="text-black break-words overflow-hidden line-clamp-2">
                      
                                <span className={`font-medium ${statusClass}`}>
                                  {statusNow}
                                </span>
                                </p>
                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                            <button
                              onClick={() => ClickForMoreDetail(doc)}
                              className="bg-white border border-gray text-black px-4 py-2 rounded-lg flex items-center text-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
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

                            <button
                              onClick={() => ClickForViewPet(doc)}
                              className="bg-[#66009F] text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
                              >
                                <path
                                  fill="currentColor"
                                  d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"
                                />
                              </svg>
                              ดูเอกสาร
                            </button>

                            {showCheckButton && (
                              <>
                                <button
                                  onClick={() => handleCheck(doc)}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-6"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  ตรวจสอบ
                                </button>

                                <button
                                  onClick={() => openEditPopup(doc)}
                                  className="bg-[#0073D9] text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="none"
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"
                                    />
                                  </svg>
                                  ส่งแก้ไข
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                    }

                    if (doc.__bucket === "ส่งกลับแก้ไข") {
                      return (
                      <div
                        key={doc.docId || doc.id}
                        className="border border-white rounded-xl px-4 py-5 mb-4 bg-white shadow-md flex flex-col gap-4 min-h-[180px] h-auto break-words overflow-hidden"
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xl break-words overflow-hidden line-clamp-2"> {doc.title}</p>
                              <p  className="break-words overflow-hidden line-clamp-2">เลขที่คำขอ:{" "} 
                                  <span className="font-medium">
                                    {getDocNumber(doc)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">ผู้ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {doc.ownername} ({doc.owneremail})
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">เจ้าหน้าที่ตรวจสอบ:{" "} 
                                  <span className="font-medium">
                                    {doc.auditByname} ({doc.auditByemail})
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">
                                  <span className="font-medium">
                                    {doc.note_text || "-"}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.createAt)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ส่งคืนแก้ไข:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.editedAt)}
                                  </span>
                                </p>
                                <p className="text-black break-words overflow-hidden line-clamp-2">
                      
                                <span className={`font-medium ${statusClass}`}>
                                  {doc.oldstatus}
                                </span>
                                </p>

                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                            <button
                              onClick={() => ClickForMoreDetail(doc)}
                              className="bg-white border border-gray text-black px-4 py-2 rounded-lg flex items-center text-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
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

                            <button
                              onClick={() => ClickForViewPet(doc)}
                              className="bg-[#66009F] text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
                              >
                                <path
                                  fill="currentColor"
                                  d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"
                                />
                              </svg>
                              ดูเอกสาร
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                    }

                    if (doc.__bucket === "ตรวจสอบเสร็จสิ้น") {
                      return (
                      <div
                        key={doc.docId || doc.id}
                        className="border border-white rounded-xl px-4 py-5 mb-4 bg-white shadow-md flex flex-col gap-4 min-h-[180px] h-auto break-words overflow-hidden"
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                              <p className="font-bold text-xl break-words overflow-hidden line-clamp-2">{doc.doc_title || doc.title || "-"}</p>
                              <p  className="break-words overflow-hidden line-clamp-2">เลขที่คำขอ:{" "} 
                                  <span className="font-medium">
                                    {getDocNumber(doc)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">ผู้ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {doc.ownername} ({doc.owneremail})
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">เจ้าหน้าที่ตรวจสอบ:{" "} 
                                  <span className="font-medium">
                                    {doc.auditByname} ({doc.auditByemail})
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.createdAt || doc.createAt)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ตรวจสอบ:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.updatedAt || doc.changeAt)}
                                  </span>
                                </p>
                                <p className="text-black break-words overflow-hidden line-clamp-2">            
                                <span className={`font-medium ${statusClass}`}>
                                  {doc.oldstatus}
                                </span>
                                </p>
                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                            <button
                              onClick={() => ClickForMoreDetail(doc)}
                              className="bg-white border border-gray text-black px-4 py-2 rounded-lg flex items-center text-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
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

                            <button
                              onClick={() => ClickForViewPet(doc)}
                              className="bg-[#66009F] text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
                              >
                                <path
                                  fill="currentColor"
                                  d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"
                                />
                              </svg>
                              ดูเอกสาร
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                    }
                    return null;
                  })
                )}
              </>
            )}


            {/* อยู่ระหว่างรอตรวจสอบ */}
            {activeTab === "documentAll" && (
              <>
                {documentAll.length === 0 ? (
                  <p className="text-2xl text-gray-500 flex item-center mt-10 justify-center">
                    ไม่มีเอกสารที่ต้องตรวจสอบ
                  </p>
                ) : (
                  documentAll.map((doc) => {
                    const statusClass = greenList.includes(doc.status_name)
                      ? "text-[#05A967]"
                      : orangeList.includes(doc.status_name)
                      ? "text-[#E48500]"
                      : redList.includes(doc.status_name)
                      ? "text-[#CD0000]"
                      : "text-gray-600";

                    const showCheckButton = orangeList.includes(doc.status_name);

                    return (
                      <div
                        key={doc.docId || doc.id}
                        className="border border-white rounded-xl px-4 py-5 mb-4 bg-white shadow-md flex flex-col gap-4 min-h-[180px] h-auto break-words overflow-hidden"
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                              <p className="font-bold text-xl break-words overflow-hidden line-clamp-2">{doc.doc_title || doc.title || "-"}</p>
                              <p  className="break-words overflow-hidden line-clamp-2">เลขที่คำขอ:{" "} 
                                  <span className="font-medium">
                                    {getDocNumber(doc)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">ผู้ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {doc.ownername} {doc.owneremail}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">เจ้าหน้าที่ตรวจสอบ:{" "} 
                                  <span className="font-medium">
                                    {doc.auditBy} {doc.auditByemail}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.createdAt)}
                                  </span>
                                </p>
       
                                <p className="text-black break-words overflow-hidden line-clamp-2">
                      
                                <span className={`font-medium ${statusClass}`}>
                                  {doc.status_name}
                                </span>
                                </p>
                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                            <button
                              onClick={() => ClickForMoreDetail(doc)}
                              className="bg-white border border-gray text-black px-4 py-2 rounded-lg flex items-center text-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
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

                            <button
                              onClick={() => ClickForViewPet(doc)}
                              className="bg-[#66009F] text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
                              >
                                <path
                                  fill="currentColor"
                                  d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"
                                />
                              </svg>
                              ดูเอกสาร
                            </button>

                            {showCheckButton && (
                              <>
                                <button
                                  onClick={() => handleCheck(doc)}
                                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-6"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  ตรวจสอบ
                                </button>

                                <button
                                  onClick={() => openEditPopup(doc)}
                                  className="bg-[#0073D9] text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="none"
                                      stroke="currentColor"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"
                                    />
                                  </svg>
                                  ส่งแก้ไข
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* ส่งกลับแก้ไข */}
            {activeTab === "history_sendback" && (
              <>
                {historySendBack.length === 0 ? (
                  <p className="text-2xl text-gray-500 flex item-center mt-10 justify-center">
                    ไม่มีเอกสารที่ส่งกลับแก้ไข
                  </p>
                ) : (
                  historySendBack.map((doc) => {
                     const statusNow =
                    doc.status_name ||
                    doc.oldstatus ||
                    doc.doc_statusNow ||
                    doc.status?.status ||
                    "-";

                    const statusClass = greenList.includes(statusNow)
                    ? "text-[#05A967]"
                    : orangeList.includes(statusNow)
                    ? "text-[#E48500]"
                    : redList.includes(statusNow)
                    ? "text-[#CD0000]"
                    : "text-gray-600";


                    return (
                      <div
                        key={doc.docId || doc.id}
                        className="border border-white rounded-xl px-4 py-5 mb-4 bg-white shadow-md flex flex-col gap-4 min-h-[180px] h-auto break-words overflow-hidden"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xl break-words overflow-hidden line-clamp-2"> {doc.title}</p>
                              <p  className="break-words overflow-hidden line-clamp-2">เลขที่คำขอ:{" "} 
                                  <span className="font-medium">
                                    {getDocNumber(doc)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">ผู้ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {doc.ownername} ({doc.owneremail})
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">เจ้าหน้าที่ตรวจสอบ:{" "} 
                                  <span className="font-medium">
                                    {doc.auditByname} ({doc.auditByemail})
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">
                                  <span className="font-medium">
                                    {doc.note_text || "-"}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.createAt)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ส่งคืนแก้ไข:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.editedAt)}
                                  </span>
                                </p>
                                <p className="text-black break-words overflow-hidden line-clamp-2">
                      
                                <span className={`font-medium ${statusClass}`}>
                                  {doc.oldstatus}
                                </span>
                                </p>

                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                            <button
                              onClick={() => ClickForMoreDetail(doc)}
                              className="bg-white border border-gray text-black px-4 py-2 rounded-lg flex items-center text-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
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

                            <button
                              onClick={() => ClickForViewPet(doc)}
                              className="bg-[#66009F] text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
                              >
                                <path
                                  fill="currentColor"
                                  d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"
                                />
                              </svg>
                              ดูเอกสาร
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* ตรวจสอบเรียบร้อยแล้ว */}
            {activeTab === "history_accept" && (
              <>
                {historyAccept.length === 0 ? (
                  <p className="text-2xl text-gray-500 flex item-center mt-10 justify-center">
                    ไม่มีเอกสารที่ตรวจสอบเสร็จสิ้น
                  </p>
                ) : (
                  historyAccept.map((doc) => {
                    const statusNow =
                    doc.status_name || doc.oldstatus || doc.doc_statusNow || doc.status?.status || "-";
                    const statusClass = greenList.includes(statusNow)
                    ? "text-[#05A967]"
                    : orangeList.includes(statusNow)
                    ? "text-[#E48500]"
                    : redList.includes(statusNow)
                    ? "text-[#CD0000]"
                    : "text-gray-600";

                    return (
                      <div
                        key={doc.docId || doc.id}
                        className="border border-white rounded-xl px-4 py-5 mb-4 bg-white shadow-md flex flex-col gap-4 min-h-[180px] h-auto break-words overflow-hidden"
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-3">
                           <div className="flex-1 min-w-0">
                              <p className="font-bold text-xl break-words overflow-hidden line-clamp-2">{doc.doc_title || doc.title || "-"}</p>
                              <p  className="break-words overflow-hidden line-clamp-2">เลขที่คำขอ:{" "} 
                                  <span className="font-medium">
                                    {getDocNumber(doc)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">ผู้ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {doc.ownername} ({doc.owneremail})
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">เจ้าหน้าที่ตรวจสอบ:{" "} 
                                  <span className="font-medium">
                                    {doc.auditByname} ({doc.auditByemail})
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ยื่นคำร้อง:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.createdAt || doc.createAt)}
                                  </span>
                                </p>
                                <p  className="break-words overflow-hidden line-clamp-2">วันที่ตรวจสอบ:{" "} 
                                  <span className="font-medium">
                                    {formatDateTime(doc.updatedAt || doc.changeAt)}
                                  </span>
                                </p>
                                <p className="text-black break-words overflow-hidden line-clamp-2">            
                                <span className={`font-medium ${statusClass}`}>
                                  {doc.oldstatus}
                                </span>
                                </p>
                          </div>

                          <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                            <button
                              onClick={() => ClickForMoreDetail(doc)}
                               className="h-9 w-full sm:w-auto whitespace-nowrap bg-white border border-gray text-black px-3 rounded-lg flex items-center justify-center text-xs sm:text-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
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

                            <button
                              onClick={() => ClickForViewPet(doc)}
                              className="bg-[#66009F] text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                className="w-4 h-4 sm:w-5 sm:h-5 mr-1"
                              >
                                <path
                                  fill="currentColor"
                                  d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"
                                />
                              </svg>
                              ดูเอกสาร
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}


          {/* ตรวจสอบ */}
          {checkPopupOpen && (
            <CheckPopup
              selectedDoc={selectedDoc}
              onClose={() => setCheckPopupOpen(false)}
              onSubmit={submitCheck}
            />
          )}
          {/* แก้ไข */}
          {editPopupOpen && (
            <EditPopup
              selectedDoc={selectedDoc}
              reason={reason}
              setReason={setReason}
              onClose={() => setEditPopupOpen(false)}
              onSubmit={submitEdit}
            />
          )}
          {/* ยืนยันตรวจสอบ */}
          {checkConfirmedOpen && (
            <CheckConfirmedPopup onClose={() => setCheckConfirmedOpen(false)} />
          )}
          {/* ยืนยันแก้ไข */}
          {editConfirmedOpen && (
            <EditConfirmedPopup onClose={() => setEditConfirmedOpen(false)} />
          )}

                  </div>
                </div>
              </div>
            );
          }

export default HeadAuditorTracking;






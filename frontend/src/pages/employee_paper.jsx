import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "../components/trackingHeader";

function Employee_Paper() {
  // ===== Auth token (ไม่ใส่ Bearer) =====
  const authHeader = (localStorage.getItem("token") || "").replace(/^"+|"+$/g, "").trim();
  if (!authHeader) return <Navigate to="/login" replace />;

  // ===== UI State =====
  const [activeTab, setActiveTab] = useState("all"); // all | documentAll | history_change_des | history_accept // documentAll | history_change_des | history_accept
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // data
  const [documentAll, setDocumentAll] = useState([]);
  const [historyChangeDes, setHistoryChangeDes] = useState([]);
  const [historyAccept, setHistoryAccept] = useState([]);

  // destinations (ถ้า API นี้มีอยู่)
  const [destinations, setDestinations] = useState([]);

  // ===== Utils =====
  const formatThaiDateTime = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(iso);
    }
  };

  const statusClass = (name = "") => {
    if (!name) return "text-gray-700";
    if (name.includes("ตรวจสอบขั้นต้นเสร็จสิ้น")) return "text-green-700";
    if (name.includes("ส่งกลับ")) return "text-blue-700";
    if (name.includes("อยู่ระหว่าง")) return "text-orange-700";
    return "text-gray-700";
  };

  // ===== Endpoints per tab (แก้ path ให้ตรง backend) =====
  const fetchUrl = useMemo(() => {
    switch (activeTab) {
      case "history_change_des":
        return "http://localhost:3001/petitionAudit/history_thesendtoEditByauditor";
      case "history_accept":
        return "http://localhost:3001/petitionAudit/history_theAuditByauditor";
      case "documentAll":
        return "http://localhost:3001/petitionAudit/wait_to_audit_byAudit";
      case "all":
      default:
        return null; // all จะยิงทีเดียว 3 เอ็นด์พอยท์
    }
  }, [activeTab]);

  // ===== Load destinations (optional) =====
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("http://localhost:3001/api/destination", {
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
        });
        if (!mounted) return;
        const data = res.ok ? await res.json() : [];
        setDestinations(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setDestinations([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authHeader]);

  // ===== Load documents per tab =====
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    (async () => {
      try {
        if (activeTab === "all") {
          const [r1, r2, r3] = await Promise.all([
            fetch("http://localhost:3001/petitionAudit/wait_to_audit_byAudit", { headers: { Authorization: authHeader } }),
            fetch("http://localhost:3001/petitionAudit/history_thesendtoEditByauditor", { headers: { Authorization: authHeader } }),
            fetch("http://localhost:3001/petitionAudit/history_theAuditByauditor", { headers: { Authorization: authHeader } }),
          ]);

          if (!mounted) return;
          if (!r1.ok || !r2.ok || !r3.ok) {
            setError("โหลดข้อมูลบางส่วนไม่สำเร็จ");
          }

          const [d1, d2, d3] = await Promise.all([r1.ok ? r1.json() : [], r2.ok ? r2.json() : [], r3.ok ? r3.json() : []]);

          const norm = (raw) => (Array.isArray(raw) ? raw : Array.isArray(raw?.document_json) ? raw.document_json : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.set_json) ? raw.set_json : []);

          setDocumentAll(norm(d1));
          setHistoryChangeDes(norm(d2));
          setHistoryAccept(norm(d3));
          setLoading(false);
          return;
        }

        // โหมดเดิม (ทีละแท็บ)
        const res = await fetch(fetchUrl, { headers: { Authorization: authHeader } });
        if (!mounted) return;

        if (!res.ok) {
          setDocumentAll([]);
          setHistoryChangeDes([]);
          setHistoryAccept([]);
          setError(`โหลดข้อมูลไม่สำเร็จ (${res.status})`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.document_json)
          ? data.document_json
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.set_json)
          ? data.set_json
          : [];

        if (activeTab === "documentAll") setDocumentAll(rows);
        if (activeTab === "history_change_des") setHistoryChangeDes(rows);
        if (activeTab === "history_accept") setHistoryAccept(rows);
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setDocumentAll([]);
        setHistoryChangeDes([]);
        setHistoryAccept([]);
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [activeTab, fetchUrl, authHeader, reloadKey]);

  const currentItems = useMemo(() => {
    if (activeTab !== "all") {
      return activeTab === "documentAll" ? documentAll : activeTab === "history_change_des" ? historyChangeDes : historyAccept;
    }
    // รวมทั้งหมด พร้อมระบุหมวดเพื่อใช้ Styling/Badge ได้ถ้าต้องการ
    const tag = (x, bucket) => ({ ...x, __bucket: bucket });
    return [
      ...documentAll.map((x) => tag(x, "ที่รอตรวจขั้นต้น")),
      ...historyChangeDes.map((x) => tag(x, "ประวัติส่งกลับแก้ไข")),
      ...historyAccept.map((x) => tag(x, "ประวัติตรวจเสร็จสิ้น")),
    ];
  }, [activeTab, documentAll, historyChangeDes, historyAccept]);

  // ===== simple detail viewer (กดแล้วดึงรายละเอียดเอกสารจาก backend) =====
  const viewDetail = async (doc) => {
    try {
      const docId = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id;
      if (!docId) return alert("ไม่พบรหัสเอกสาร");
      const res = await fetch(`http://localhost:3001/petitionAudit/document/${docId}`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) return alert("โหลดรายละเอียดไม่สำเร็จ");
      const json = await res.json();
      const d = json?.setdoc || json;
      alert(
        [
          `เรื่อง: ${d.title || "-"}`,
          `ผู้ยื่น: ${d.authorize_to || "-"}`,
          `สถานะ: ${d.status_name || "-"}`,
          `ปลายทาง: ${d.destination_name || "-"}`,
          `สร้างเมื่อ: ${formatThaiDateTime(d.createdAt)}`,
        ].join("")
      );
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการโหลดรายละเอียด");
    }
  };

  // ดูเอกสารแนบ/ข้อมูลเอกสารแบบย่อ
  const viewDocs = async (doc) => {
    try {
      const docId = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id;
      if (!docId) return alert("ไม่พบรหัสเอกสาร");
      const res = await fetch(`http://localhost:3001/petitionAudit/document/${docId}`, {
        headers: { Authorization: authHeader },
      });
      if (!res.ok) return alert("ไม่สามารถดึงเอกสารได้");
      const json = await res.json();
      const d = json?.setdoc || json;
      const files = (d.attachments || d.files || []).map((f) => `• ${f.originalname || f.name || f}`);
      alert([`ไฟล์แนบ (${files.length}):`, ...(files.length ? files : ["— ไม่มีไฟล์แนบ —"])].join(""));
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการดึงเอกสาร");
    }
  };

  // ตรวจสอบเสร็จสิ้น (Approve)
  const approveDoc = async (doc) => {
    const docId = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id;
    if (!docId) return alert("ไม่พบรหัสเอกสาร");
    const text = window.prompt("บันทึกข้อเสนอแนะ (ไม่บังคับ)", "");
    try {
      const res = await fetch(`http://localhost:3001/petitionAudit/update_st_audit_by_audit/${docId}`, {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ text_suggesttion: text || "" }),
      });
      if (!res.ok) return alert(`ตรวจสอบไม่สำเร็จ (${res.status})`);
      alert("อัปเดตสถานะ: ตรวจสอบเสร็จสิ้น");
      setReloadKey((k) => k + 1);
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    }
  };

  // ส่งกลับให้แก้ไข
  const sendBack = async (doc) => {
    const docId = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id;
    if (!docId) return alert("ไม่พบรหัสเอกสาร");
    const text = window.prompt("ระบุเหตุผล/สิ่งที่ต้องแก้ไข", "กรุณาแนบเอกสารฉบับจริง …");
    if (text == null) return; // กด Cancel
    try {
      const res = await fetch(`http://localhost:3001/petitionAudit/edit_ByAuditor/${docId}`, {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ text_edit_suggesttion: text }),
      });
      if (!res.ok) return alert(`ส่งกลับไม่สำเร็จ (${res.status})`);
      alert("ส่งกลับให้แก้ไขเรียบร้อย");
      setReloadKey((k) => k + 1);
    } catch (e) {
      alert("เกิดข้อผิดพลาดในการส่งกลับ");
    }
  };

  // แนบไฟล์ (อัปเดตเอกสารโดย auditor)
  const attachFiles = async (doc) => {
    const docId = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id;
    if (!docId) return alert("ไม่พบรหัสเอกสาร");

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      const fd = new FormData();
      files.forEach((f) => fd.append("attachments", f));
      try {
        const res = await fetch(`http://localhost:3001/petitionAudit/update_document_ByAuditor/${docId}`, {
          method: "PUT",
          headers: { Authorization: authHeader },
          body: fd,
        });
        if (!res.ok) return alert(`แนบไฟล์ไม่สำเร็จ (${res.status})`);
        alert("อัปโหลดไฟล์เรียบร้อย");
        setReloadKey((k) => k + 1);
      } catch (e) {
        alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
      <Header />

      <main className="flex-1 bg-gray-100 p-4">
        <div
          style={{
            width: "100%",
            padding: 24,
            border: "1px solid #ddd",
            borderRadius: 12,
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            background: "white",
            fontFamily: "'Kanit', sans-serif",
          }}
        >
          <div className="flex flex-col gap-3">
            <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
              รายการเอกสารที่ต้องตรวจสอบ
            </h1>

            {/* Filter (Dropdown) */}
            <div className="relative w-full">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full h-12 appearance-none pl-12 pr-12 px-3 py-2 
                          rounded-lg border text-sm bg-white text-gray-800 
                          border-gray-300 shadow-sm"
              >
                <option value="all">รวมทั้งหมด</option>
                <option value="documentAll">อยู่ระหว่างการตรวจสอบขั้นต้น</option>
                <option value="history_change_des">ส่งกลับให้ผู้ใช้แก้ไขเอกสาร</option>
                <option value="history_accept">ตรวจสอบขั้นต้นเสร็จสิ้น</option>
              </select>

              {/* ไอคอนซ้าย สี #66009F */}
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#66009F]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9.5 2A1.5 1.5 0 0 0 8 3.5v1A1.5 1.5 0 0 0 9.5 6h5A1.5 1.5 0 0 0 16 4.5v-1A1.5 1.5 0 0 0 14.5 2z"/>
                  <path fillRule="evenodd" d="M6.5 4.037c-1.258.07-2.052.27-2.621.84C3 5.756 3 7.17 3 9.998v6c0 2.829 0 4.243.879 5.122c.878.878 2.293.878 5.121.878h6c2.828 0 4.243 0 5.121-.878c.879-.88.879-2.293.879-5.122v-6c0-2.828 0-4.242-.879-5.121c-.569-.57-1.363-.77-2.621-.84V4.5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3zM7 9.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 13.25a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 16.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5z" clipRule="evenodd"/>
                </svg>
              </span>

              {/* ลูกศรขวา */}
              <svg
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
              >
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.2l3.71-2.97a.75.75 0 1 1 .94 1.16l-4.24 3.39a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18z"/>
              </svg>
            </div>




          </div>


          {/* Loading / Error */}
          {loading && <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>}
          {!!error && !loading && (
            <p className="mt-4 text-red-600">{error}</p>
          )}

          {/* List */}
          {!loading && !error && currentItems.length === 0 && (
            <p className="mt-4 text-gray-500">ไม่พบเอกสาร</p>
          )}

          {!loading && !error && currentItems.map((doc, i) => {
            const createdISO = doc.createdAt || doc.created_at || doc.changeAt;
            const created = formatThaiDateTime(createdISO);

            const title = doc.request_no || doc.title || doc.doc_title || "—";
            const requester = doc.authorize_to || doc.requester_name || doc.ChangeBy || "—";
            const stName = doc.status_name || doc.status || doc.doc_StatusNow || "ไม่สามารถตรวจสอบได้";

            return (
              <article
                key={doc.id ?? doc.docId ?? `${title}-${created}-${i}`}
                className="rounded-2xl bg-white shadow p-4 mt-4"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                  <div className="flex-1 space-y-2 text-gray-800">
                    <p className="font-bold text-xl">{title}</p>

                    <div className="flex items-center flex-wrap gap-x-6 gap-y-1">
                      <span>ผู้ยื่นคำขอ: <span>{requester}</span></span>
                      <span>วันที่ยื่นคำขอ: {created}</span>
                    </div>

                    <div className="mt-1">
                      <span className="font-bold">สถานะ </span>
                      <span className={statusClass(stName)}>{stName}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                    <button
                      type="button"
                      onClick={() => viewDetail(doc)}
                      className="bg-white border border-gray-300 text-black px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-3.6-3.6" strokeLinecap="round" />
                      </svg>
                      <span>ดูรายละเอียด</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => viewDocs(doc)}
                      className="bg-[#6B21A8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B21A8] transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        aria-hidden="true"
                      >
                        <path fill="currentColor" d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"/>
                      </svg>
                      <span>ดูเอกสาร</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => approveDoc(doc)}
                      className="bg-[#16A34A] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#16A34A] transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                        fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                      </svg>
                      <span>ตรวจสอบ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => sendBack(doc)}
                      className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D4ED8] transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-5 h-5" fill="none" stroke="currentColor"
                        strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                        <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"/>
                      </svg>
                      <span>ส่งแก้ไข</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => attachFiles(doc)}
                      className="bg-[#D97706] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D97706] transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="currentColor" d="M17 17h-2.025q-.425 0-.7-.288T14 16t.288-.712T15 15h2v-2q0-.425.288-.712T18 12t.713.288T19 13v2h2q.425 0 .713.288T22 16t-.288.713T21 17h-2v2q0 .425-.288.713T18 20t-.712-.288T17 19zm-7 0H7q-2.075 0-3.537-1.463T2 12t1.463-3.537T7 7h3q.425 0 .713.288T11 8t-.288.713T10 9H7q-1.25 0-2.125.875T4 12t.875 2.125T7 15h3q.425 0 .713.288T11 16t-.288.713T10 17m-1-4q-.425 0-.712-.288T8 12t.288-.712T9 11h6q.425 0 .713.288T16 12t-.288.713T15 13zm13-1h-2q0-1.25-.875-2.125T17 9h-3.025q-.425 0-.7-.288T13 8t.288-.712T14 7h3q2.075 0 3.538 1.463T22 12"/>
                      </svg>
                      <span>แนบไฟล์</span>
                    </button>
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default Employee_Paper;

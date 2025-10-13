import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from '../../components/navbar'
import ForwardToHeadAuditor from "../../components/ForwardToHeadAuditor";
import ForwardToUser from "../../components/ForwardToUser"; 
// import { console } from "inspector";


function Employee_Paper() {
  // ===== Auth token (ไม่ใส่ Bearer) =====
  const authHeader = (localStorage.getItem("token") || "").replace(/^"+|"+$/g, "").trim();
  const navigate = useNavigate();
  if (!authHeader) return <Navigate to="/login" replace />;
  console.log(authHeader)
  // ===== UI State =====
  const [activeTab, setActiveTab] = useState("all"); // all | documentAll | history_change_des | history_accept
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  // const [acceptingDocument, setAcceptingDocument] = useState(false); // ✅ ต้องมี

  // data
  const [documentAll, setDocumentAll] = useState([]);
  const [historyChangeDes, setHistoryChangeDes] = useState([]);
  const [historyAccept, setHistoryAccept] = useState([]);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [deptView, setDeptView] = useState("form"); // form | success
  const [selected, setSelected] = useState(null);

  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [sendBackTarget, setSendBackTarget] = useState(null);
  const [submittingSendBack, setSubmittingSendBack] = useState(false);

  // optional
  const [destinations, setDestinations] = useState([]);
  const [userInfo, setUserInfo] = useState(null); // ถ้าคุณยังไม่มี endpoint profile ก็ปล่อย null ได้

  const BRAND_PURPLE = "#66009F";

  // ====== Modal ดูรายละเอียด ======
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // ===== UI State =====
  const [acceptingDocument, setAcceptingDocument] = useState(false);

  // ===== Helper: ให้รองรับ id หลายแบบและแปลงเป็นตัวเลข =====
  const getDocIdNumeric = (o) => {
    const cands = [o?.id, o?.docId, o?.documentId, o?.doc_id, o?.request_no];
    for (const c of cands) {
      if (typeof c === "number") return c;
      if (typeof c === "string" && /^\d+$/.test(c)) return parseInt(c, 10);
    }
    return 0;
  };

  // (ถ้ายังไม่มี)
  const getStatusText = (o) => o?.status_name ?? o?.status ?? o?.doc_StatusNow ?? "ไม่สามารถตรวจสอบได้";


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

  const formatThaiPretty = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      const date = d.toLocaleDateString("th-TH", {
        timeZone: "Asia/Bangkok",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
      const time = d.toLocaleTimeString("th-TH", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${date} เวลา ${time} น.`;
    } catch {
      return "—";
    }
  };


  const statusClass = (name = "") => {
    if (!name) return "text-gray-700";
    if (name.includes("ตรวจสอบขั้นต้นเสร็จสิ้น")) return "text-green-700";
    if (name.includes("ส่งกลับให้ผู้ใช้แก้ไขเอกสาร")) return "text-blue-700";
    if (name.includes("อยู่ระหว่างการตรวจสอบขั้นต้น")) return "text-orange-700";
    return "text-gray-700";
  };

  // ===== Helper: mapping ฟิลด์จากรูปแบบต่าง ๆ =====
  const getId = (o) =>
    o?.id ?? o?.docId ?? o?.documentId ?? o?.doc_id ?? o?.request_no ?? "-";
  const getTitle = (o) =>
    o?.title ?? o?.doc_title ?? o?.request_no ?? "—";
  const getRequester = (o) =>
    o?.authorize_to ?? o?.requester_name ?? o?.ChangeBy ?? "—";
  const getCreatedAt = (o) =>
    o?.createdAt ?? o?.created_at ?? o?.changeAt ?? o?.updatedAt ?? null;
  // const getStatusText = (o) =>
  //   o?.status_name ?? o?.status ?? o?.doc_StatusNow ?? "ไม่สามารถตรวจสอบได้";
  const getDestination = (o) =>
    o?.destination_name ?? o?.destination ?? "-";
  // const getDocIdNumeric = (o) =>
  //   Number(o?.id ?? o?.docId ?? o?.documentId ?? o?.doc_id ?? o?.request_no ?? 0);

  // แทนที่ฟังก์ชันตรวจสี
  const isBlueStatus = (txt = "") =>
    txt.includes("ส่งกลับ") || txt.includes("โดยหัวหน้ากอง");
  const isGreenStatus = (txt = "") =>
    txt.includes("ตรวจสอบขั้นต้นเสร็จสิ้น");
  const isOrangeStatus = (txt = "") =>
    txt.includes("อยู่ระหว่าง");


  // รวมศูนย์ normalize array
  const norm = (raw) =>
    Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.document_json)
      ? raw.document_json
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.set_json)
      ? raw.set_json
      : [];

  // ===== Endpoints per tab =====
  const fetchUrl = useMemo(() => {
    switch (activeTab) {
      case "history_change_des":
        return "http://localhost:3001/petitionAudit/history_send_back_edit_auditor";
      case "history_accept":
        return "http://localhost:3001/petitionAudit/history_audited";
      case "documentAll":
        return "http://localhost:3001/petitionAudit/wait_to_audit_byAudit";
      default:
        return null; // เผื่ออนาคต
    }
  }, [activeTab]);

  // ===== Load destinations (optional) =====
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("http://localhost:3001/api/destination", {
          headers: { Authorization: authHeader },
          signal: ac.signal,
        });
        if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        const data = res.ok ? await res.json() : [];
        setDestinations(Array.isArray(data) ? data : []);
      } catch {
        if (!ac.signal.aborted) setDestinations([]);
      }
    })();
    return () => ac.abort();
  }, [authHeader, navigate]);

  // (optional) โหลดข้อมูลผู้ใช้ ถ้ามี endpoint
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        // ถ้ายังไม่มี ให้คอมเมนต์บรรทัดนี้ได้
        // const res = await fetch("http://localhost:3001/auth/me", { headers: { Authorization: authHeader }, signal: ac.signal });
        // if (res.ok) setUserInfo(await res.json());
      } catch (_) {}
    })();
    return () => ac.abort();
  }, [authHeader]);

  // ===== Load documents per tab =====
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError("");

    (async () => {
      try {
        if (activeTab === "all") {
          const [r1, r2, r3] = await Promise.all([
            fetch("http://localhost:3001/petitionAudit/wait_to_audit_byAudit", {
              headers: { Authorization: authHeader },
              signal: ac.signal,
            }),
            fetch("http://localhost:3001/petitionAudit/history_send_back_edit_auditor", {
              headers: { Authorization: authHeader },
              signal: ac.signal,
            }),
            fetch("http://localhost:3001/petitionAudit/history_audited", {
              headers: { Authorization: authHeader },
              signal: ac.signal,
            }),
          ]);

          if (r1.status === 401 || r2.status === 401 || r3.status === 401) {
            navigate("/login", { replace: true });
            return;
          }

          if (!r1.ok || !r2.ok || !r3.ok) {
            setError("โหลดข้อมูลบางส่วนไม่สำเร็จ");
          }

          const [d1, d2, d3] = await Promise.all([
            r1.ok ? r1.json() : [],
            r2.ok ? r2.json() : [],
            r3.ok ? r3.json() : [],
          ]);

          setDocumentAll(norm(d1));
          setHistoryChangeDes(norm(d2));
          setHistoryAccept(norm(d3));
          setLoading(false);
          return;
        }

        // โหมดเดี่ยว
        const res = await fetch(fetchUrl, {
          headers: { Authorization: authHeader },
          signal: ac.signal,
        });

        if (res.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        if (!res.ok) {
          setDocumentAll([]);
          setHistoryChangeDes([]);
          setHistoryAccept([]);
          setError(`โหลดข้อมูลไม่สำเร็จ (${res.status})`);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const rows = norm(data);

        if (activeTab === "documentAll") setDocumentAll(rows);
        if (activeTab === "history_change_des") setHistoryChangeDes(rows);
        if (activeTab === "history_accept") setHistoryAccept(rows);
        setLoading(false);
      } catch (e) {
        if (!ac.signal.aborted) {
          setDocumentAll([]);
          setHistoryChangeDes([]);
          setHistoryAccept([]);
          setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
          setLoading(false);
        }
      }
    })();

    return () => ac.abort();
  }, [activeTab, fetchUrl, authHeader, reloadKey, navigate]);


  // const currentItems = useMemo(() => {
  //   if (activeTab !== "all") {
  //     return activeTab === "documentAll"
  //       ? documentAll
  //       : activeTab === "history_change_des"
  //       ? historyChangeDes
  //       : historyAccept;
  //   }
  //   const tag = (x, bucket) => ({ ...x, __bucket: bucket });
  //   return [
  //     ...documentAll.map((x) => tag(x, "ที่รอตรวจขั้นต้น")),
  //     ...historyChangeDes.map((x) => tag(x, "ประวัติส่งกลับแก้ไข")),
  //     ...historyAccept.map((x) => tag(x, "ประวัติตรวจเสร็จสิ้น")),
  //   ];
  // }, [activeTab, documentAll, historyChangeDes, historyAccept]);



  // ===== Detail modal =====
  // const openDetail = async (doc) => {
  //   try {
  //     const docId = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id;
  //     if (!docId) return alert("ไม่พบรหัสเอกสาร");
  //     setDetailOpen(true);
  //     setDetailLoading(true);
  //     setDetailData(null);

  //     const res = await fetch(`http://localhost:3001/petitionAudit/document/${docId}`, {
  //       headers: { Authorization: authHeader },
  //     });
  //     if (res.status === 401) {
  //       navigate("/login", { replace: true });
  //       return;
  //     }
  //     const data = res.ok ? await res.json() : null;
  //     setDetailData((data?.setdoc || data) || { error: true, message: "ไม่พบข้อมูลเอกสาร" });
  //   } catch (e) {
  //     setDetailData({ error: true, message: "โหลดรายละเอียดไม่สำเร็จ" });
  //   } finally {
  //     setDetailLoading(false);
  //   }
  // };
  // const closeDetail = () => {
  //   setDetailOpen(false);
  //   setDetailData(null);
  //   setDetailLoading(false);
  // };

  // ===== alert fallback =====
  // const viewDetail = async (doc) => {
  //   try {
  //     const docId = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id;
  //     if (!docId) return alert("ไม่พบรหัสเอกสาร");
  //     const res = await fetch(`http://localhost:3001/petitionAudit/document/${docId}`, {
  //       headers: { Authorization: authHeader },
  //     });
  //     if (res.status === 401) return navigate("/login", { replace: true });
  //     if (!res.ok) return alert("โหลดรายละเอียดไม่สำเร็จ");
  //     const json = await res.json();
  //     const d = json?.setdoc || json;
  //     alert(
  //       [
  //         `เรื่อง: ${d.title || "-"}`,
  //         `ผู้ยื่น: ${d.authorize_to || "-"}`,
  //         `สถานะ: ${d.status_name || "-"}`,
  //         `ปลายทาง: ${d.destination_name || "-"}`,
  //         `สร้างเมื่อ: ${formatThaiDateTime(d.createdAt)}`,
  //       ].join("\n")
  //     );
  //   } catch (e) {
  //     alert("เกิดข้อผิดพลาดในการโหลดรายละเอียด");
  //   }
  // };

  // ดูเอกสารแนบ/ข้อมูลเอกสารแบบย่อ
  // const viewDocs = async (doc) => {
  //   try {
  //     const docId = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id;
  //     if (!docId) return alert("ไม่พบรหัสเอกสาร");
  //     const res = await fetch(`http://localhost:3001/petitionAudit/document/${docId}`, {
  //       headers: { Authorization: authHeader },
  //     });
  //     if (res.status === 401) return navigate("/login", { replace: true });
  //     if (!res.ok) return alert("ไม่สามารถดึงเอกสารได้");
  //     const json = await res.json();
  //     const d = json?.setdoc || json;
  //     const files = (d.attachments || d.files || []).map((f) => `• ${f?.originalname || f?.name || f}`);
  //     alert([`ไฟล์แนบ (${files.length}):`, ...(files.length ? files : ["— ไม่มีไฟล์แนบ —"])].join("\n"));
  //   } catch (e) {
  //     alert("เกิดข้อผิดพลาดในการดึงเอกสาร");
  //   }
  // };

  // แทนที่ฟังก์ชันเดิมสองอันนี้
  const ClickForMoreDetail = (doc) => {
    const id = getDocIdNumeric(doc);
    if (!id) return alert("ไม่พบรหัสเอกสาร");
    navigate(`/detail/${id}`);
  };
  const ClickForViewPet = (doc) => {
    const id = getDocIdNumeric(doc);
    if (!id) return alert("ไม่พบรหัสเอกสาร");
    navigate(`/view/${id}`);
  };


  // const approveDoc = async (doc) => {
  //   const docId = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id;
  //   if (!docId) return alert("ไม่พบรหัสเอกสาร");
  //   const text = window.prompt("บันทึกข้อเสนอแนะ (ไม่บังคับ)", "");
  //   try {
  //     const res = await fetch(`http://localhost:3001/petitionAudit/update_st_audit_by_audit/${docId}`, {
  //       method: "PUT",
  //       headers: { Authorization: authHeader, "Content-Type": "application/json" },
  //       body: JSON.stringify({ text_suggesttion: text || "" }),
  //     });
  //     if (res.status === 401) return navigate("/login", { replace: true });
  //     if (!res.ok) return alert(`ตรวจสอบไม่สำเร็จ (${res.status})`);

  //     // ✅ คงการ์ดไว้ในลิสต์ แต่ปรับสถานะใหม่แทนการ reload
  //     setDocumentAll(prev =>
  //       prev.map(d =>
  //         (d.id ?? d.docId ?? d.documentId ?? d.doc_id) === docId
  //           ? { ...d, status_name: "ตรวจสอบขั้นต้นเสร็จสิ้น", updated_at: new Date().toISOString() }
  //           : d
  //       )
  //     );
  //     alert("อัปเดตสถานะ: ตรวจสอบเสร็จสิ้น");
  //     // ❌ ลบ setReloadKey
  //   } catch (e) {
  //     alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
  //   }
  // };


  const submitSendBack = async ({ item, note }) => {
    if (!item) return;
    const docId = item?.id ?? item?.docId ?? item?.documentId ?? item?.doc_id;
    if (!docId) return alert("ไม่พบรหัสเอกสาร");

    setSubmittingSendBack(true);
    try {
      const res = await fetch(`http://localhost:3001/petitionAudit/edit_ByAuditor/${docId}`, {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ text_edit_suggesttion: (note || "").trim() }),
      });
      if (res.status === 401) return navigate("/login", { replace: true });
      if (!res.ok) return alert(`ส่งกลับไม่สำเร็จ (${res.status})`);

      // ✅ คงการ์ดไว้ แล้วเปลี่ยนสถานะในหน้า
      setDocumentAll(prev =>
        prev.map(d =>
          (d.id ?? d.docId ?? d.documentId ?? d.doc_id) === docId
            ? {
                ...d,
                status_name: "ส่งกลับให้ผู้ใช้แก้ไขเอกสาร",
                updated_at: new Date().toISOString(),
                note_text: (note || "").trim() || "-",
              }
            : d
        )
      );

      setSendBackOpen(false);
      setSendBackTarget(null);
      // alert("ส่งกลับให้ผู้ใช้แก้ไขเรียบร้อย");
      // ❌ ลบ setReloadKey
    } catch (e) {
      console.error(e);
      // alert("เกิดข้อผิดพลาดในการส่งกลับ");
    } finally {
      setSubmittingSendBack(false);
    }
  };

  // const sendBack = (doc) => {
  //   if (!doc) return;
  //   setSendBackTarget(doc);
  //   setSendBackOpen(true);
  // };

  // const attachFiles = async (doc) => {
  //   // ใช้ helper เดิมถ้ามี; ถ้าไม่มีใช้บรรทัด fallback นี้
  //   const docId = (typeof getDocIdNumeric === "function")
  //     ? getDocIdNumeric(doc)
  //     : (doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id ?? 0);

  //   if (!docId) return alert("ไม่พบรหัสเอกสาร");

  //   // ฟอร์มแก้ไขอย่างเร็ว (ถ้าจะสวย ค่อยเปลี่ยนเป็น modal ภายหลัง)
  //   const title = window.prompt("เรื่อง (title):", doc?.title ?? "");
  //   if (title === null) return; // กดยกเลิก

  //   const authorizeTo = window.prompt("ผู้รับมอบอำนาจ (authorizeTo):", doc?.authorize_to ?? "");
  //   if (authorizeTo === null) return;

  //   const position = window.prompt("ตำแหน่ง (position):", doc?.position ?? "");
  //   if (position === null) return;

  //   const affiliation = window.prompt("สังกัด/หน่วยงาน (affiliation):", doc?.affiliation ?? "");
  //   if (affiliation === null) return;

  //   const authorizeText = window.prompt("รายละเอียด (authorizeText):", doc?.authorize_text ?? "");
  //   if (authorizeText === null) return;

  //   // ส่งเฉพาะ "ฟิลด์" เท่านั้น (multer().none() รองรับ form-data ที่มีแต่ฟิลด์)
  //   const fd = new FormData();
  //   fd.append("title", (title || "").trim());
  //   fd.append("authorizeTo", (authorizeTo || "").trim());
  //   fd.append("position", (position || "").trim());
  //   fd.append("affiliation", (affiliation || "").trim());
  //   fd.append("authorizeText", (authorizeText || "").trim());

  //   try {
  //     const res = await fetch(`http://localhost:3001/petitionAudit/update_document_ByAuditor/${docId}`, {
  //       method: "PUT",
  //       headers: { Authorization: authHeader },
  //       body: fd,
  //     });


  //     if (res.status === 401) return navigate("/login", { replace: true });
  //     if (!res.ok) {
  //       const t = await res.text().catch(() => "");
  //       return alert(`แก้ไขเอกสารไม่สำเร็จ (${res.status})\n${t}`);
  //     }

  //     // อัปเดตการ์ดให้ "คงอยู่" และสะท้อนค่าที่แก้ไขแล้ว
  //     const applyPatch = (arr) =>
  //       (Array.isArray(arr) ? arr : []).map((d) => {
  //         const idA =
  //           d?.id ?? d?.docId ?? d?.documentId ?? d?.doc_id ?? d?.request_no;
  //         if (String(idA) !== String(docId)) return d;
  //         return {
  //           ...d,
  //           title,
  //           authorize_to: authorizeTo,
  //           position,
  //           affiliation,
  //           authorize_text: authorizeText,
  //           status_name: "เจ้าหน้าที่แก้ไขเอกสารแล้ว",
  //           updated_at: new Date().toISOString(),
  //         };
  //       });

  //     // อัปเดตทุกลิสต์ที่อาจมีเอกสารนี้อยู่
  //     setDocumentAll((prev) => applyPatch(prev));
  //     setHistoryChangeDes?.((prev) => applyPatch(prev));
  //     setHistoryAccept?.((prev) => applyPatch(prev));

  //     alert("บันทึกการแก้ไขเรียบร้อย");
  //   } catch (e) {
  //     console.error(e);
  //     alert("เกิดข้อผิดพลาดในการแก้ไขเอกสาร");
  //   }
  // };

  const ClickForModify = (doc) => {
    const id = doc?.id ?? doc?.docId ?? doc?.documentId ?? doc?.doc_id ?? doc?.request_no;
    if (!id) return alert("ไม่พบรหัสเอกสาร");
    navigate(`/auditorModify/${id}`);
  };


  console.log(documentAll);


  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
      <Navbar />

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

            {userInfo && (
              <div className="bg-white shadow rounded-lg p-4 m-6">
                <h2 className="font-bold text-lg mb-2">ข้อมูลผู้ใช้</h2>
                <p>ชื่อ: {userInfo.firstname} {userInfo.lastname}</p>
                <p>อีเมล: {userInfo.email}</p>
                <p>หน่วยงาน: {userInfo.department_name}</p>
                <p>บทบาท: {userInfo.role_n}</p>
              </div>
            )}

            {/* แถบเลือก dataset (Dropdown) */}
            <div className="relative w-full px-6 mt-6">
              <label htmlFor="tabSelect" className="sr-only">เลือกชุดข้อมูล</label>

              <select
                id="tabSelect"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full h-12 appearance-none pl-12 pr-10 rounded-lg border text-sm bg-white text-gray-800 border-gray-300 shadow-sm"
              >
                <option value="all">รวมทั้งหมด</option>
                <option value="documentAll">อยู่ระหว่างการตรวจสอบขั้นต้น</option>
                <option value="history_change_des">ส่งกลับให้ผู้ใช้แก้ไขเอกสาร</option>
                <option value="history_accept">การตรวจสอบขั้นต้นเสร็จสิ้น</option>
              </select>

              {/* ไอคอนซ้าย */}
              <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2" style={{ color: BRAND_PURPLE }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9.5 2A1.5 1.5 0 0 0 8 3.5v1A1.5 1.5 0 0 0 9.5 6h5A1.5 1.5 0 0 0 16 4.5v-1A1.5 1.5 0 0 0 14.5 2z"/>
                  <path fillRule="evenodd" d="M6.5 4.037c-1.258.07-2.052.27-2.621.84C3 5.756 3 7.17 3 9.998v6c0 2.829 0 4.243.879 5.122c.878.878 2.293.878 5.121.878h6c2.828 0 4.243 0 5.121-.878c.879-.88.879-2.293.879-5.122v-6c0-2.828 0-4.242-.879-5.121c-.569-.57-1.363-.77-2.621-.84V4.5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3zM7 9.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 13.25a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 16.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5z" clipRule="evenodd"/>
                </svg>
              </span>

              {/* ลูกศรขวา */}
              <svg
                className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
              >
                <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.2l3.71-2.97a.75.75 0 1 1 .94 1.16l-4.24 3.39a.75.75 0 0 1-.94 0L5.21 8.39a.75.75 0 0 1 .02-1.18z"/>
              </svg>
            </div>
          </div>


          {/* รายการเอกสาร */}
          {/* อยู่ระหว่างการตรวจสอบขั้นต้น */}
          {activeTab === "all" && (
            <div>
              {(documentAll || []).map((doc, i) => {
                // คำนวณค่าสีตามสถานะ (เลือกฟิลด์ที่มีจริง)
                const statusText = doc.status_name ?? doc.status ?? doc.nowstatus ?? "";
                const isBlue = isBlueStatus(statusText);
                const isGreen = isGreenStatus(statusText);
                const isOrange = isOrangeStatus(statusText);

                const isFinalized =
                  statusText.includes("ตรวจสอบขั้นต้นเสร็จสิ้น") ||
                  statusText.includes("ส่งกลับให้ผู้ใช้แก้ไขเอกสาร");

                // ทำ id สำหรับ key และการนำทาง
                // const docId =
                //   doc.id ?? doc.docId ?? doc.documentId ?? doc.id_doc ?? doc.doc_id ?? i;
                
                const docId = getDocIdNumeric(doc) || i;  // ✅ ยึด helper เดิม

                return (
                  <article
                    key={`${docId}-${i}`}
                    className="rounded-md bg-white shadow p-4 mx-6 mt-4"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 text-gray-800">
                        
                        <p className="font-medium text-2xl" style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word" // หรือ "break-all"
                        }}>
                          <span>{doc.title ?? "—"}</span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            เลขที่คำขอ:{" "}
                            <span className="font-medium">{doc.doc_id ?? doc.id_doc ?? "—"}</span>
                          </span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            ผู้ที่ยื่นคำขอ:{" "}
                            <span className="font-medium">{doc.owneremail ?? "—"}</span>
                          </span>

                          {/* กลุ่มวันที่ */}
                          <span className="inline-flex items-center gap-1 ml-2 sm:ml-8">
                            <span>วันที่คำขอ:</span>
                            <span className="whitespace-nowrap">
                              {formatThaiPretty(doc.createdAt) /* ✅ อ่านง่าย */}
                            </span>
                          </span>
                        </p>

                        <p className="font-medium">
                          <span className="text-black">สถานะ</span>{" "}
                          <span
                            style={
                              isBlue
                                ? { color: "#CD0000" }
                                : isGreen
                                ? { color: "#05A967" }
                                : isOrange
                                ? { color: "#E48500" }
                                : { color: "#666666" }
                            }
                          >
                            {statusText || "—"}
                          </span>
                        </p>
                      </div>

                      {/* ปุ่มการทำงาน */}
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                        <button
                          type="button"
                          onClick={() => ClickForMoreDetail(doc)}
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
                          onClick={() => ClickForViewPet(doc)}
                          className="bg-[#6B21A8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B21A8] transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            aria-hidden="true"
                          >
                            <path fill="currentColor" d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l-4 4z"/>
                          </svg>
                          <span>ดูเอกสาร</span>
                        </button>

                        <button
                          type="button"
                          disabled={isFinalized}
                          onClick={() => { setSelected(doc); setDeptView("form"); setRejectOpen(true); }}
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
                          disabled={isFinalized}
                          onClick={() => { setSendBackTarget(doc); setSendBackOpen(true); }}
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
                          disabled={isFinalized}
                          onClick={() => ClickForModify(doc)}
                          className="bg-[#D97706] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D97706] transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="currentColor" d="M17 17h-2.025q-.425 0-.7-.288T14 16t.288-.712T15 15h2v-2q0-.425.288-.712T18 12t.713.288T19 13v2h2q.425 0 .713.288T22 16t-.288.713T21 17h-2v2q0 .425-.288.713T18 20t-.712-.288T17 19zm-7 0H7q-2.075 0-3.537-1.463T2 12t1.463-3.537T7 7h3q.425 0 .713.288T11 8t-.288.713T10 9H7q-1.25 0-2.125.875T4 12t.875 2.125T7 15h3q.425 0 .713.288T11 16t-.288.713T10 17m-1-4q-.425 0-.712-.288T8 12t.288-.712T9 11h6q.425 0 .713.288T16 12t-.288.713T15 13zm13-1h-2q0-1.25-.875-2.125T17 9h-3.025q-.425 0-.7-.288T13 8t.288-.712T14 7h3q2.075 0 3.538 1.463T22 12"/>
                          </svg>
                          <span>แก้ไขเอกสาร</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            

              {(historyChangeDes||[]).map((doc, i) => {
                // คำนวณค่าสีตามสถานะ (เลือกฟิลด์ที่มีจริง)
                const statusText = doc.status_name ?? doc.status ?? doc.nowstatus ?? "";
                const isBlue = isBlueStatus(statusText);
                const isGreen = isGreenStatus(statusText);
                const isOrange = isOrangeStatus(statusText);

                // ทำ id สำหรับ key และการนำทาง
                // const docId =
                //   doc.id ?? doc.docId ?? doc.documentId ?? doc.id_doc ?? doc.doc_id ?? i;

                const docId = getDocIdNumeric(doc) || i;  // ✅ ยึด helper เดิม

                return (
                  <article
                    key={`${docId}-${i}`}
                    className="rounded-md bg-white shadow p-4 mx-6 mt-4"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 text-gray-800">
                        {/* <p className="font-medium text-2xl">
                          <span>{doc.idformal ?? doc.idformal ?? "—"}</span>
                        </p> */}
                        <p className="font-medium text-2xl" style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word" // หรือ "break-all"
                        }}>
                          <span>{doc.title ?? "—"}</span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            เลขที่คำขอ:{" "}
                            <span className="font-medium">{doc.idformal ?? doc.idformal ?? "—"}</span>
                          </span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            ผู้ที่ยื่นคำขอ:{" "}
                            <span className="font-medium">{doc.owneremail ?? "—"}</span>
                          </span>

                          {/* กลุ่มวันที่ */}
                          <span className="inline-flex items-center gap-1 ml-2 sm:ml-8">
                            <span>วันที่คำขอ:</span>
                            <span className="whitespace-nowrap">
                              {formatThaiPretty(doc.editedAt) /* ✅ อ่านง่าย */}
                            </span>
                          </span>
                        </p>

                        <p className="font-medium">
                          <span className="text-black">สถานะ</span>{" "}
                          <span
                            style={
                              isBlue
                                ? { color: "#CD0000" }
                                : isGreen
                                ? { color: "#05A967" }
                                : isOrange
                                ? { color: "#E48500" }
                                : { color: "#666666" }
                            }
                          >
                            {statusText || "—"}
                          </span>
                        </p>
                      </div>

                      {/* ปุ่มการทำงาน */}
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                        <button
                          type="button"
                          onClick={() => ClickForMoreDetail(doc)}
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
                          onClick={() => ClickForViewPet(doc)}
                          className="bg-[#6B21A8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B21A8] transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            aria-hidden="true"
                          >
                            <path fill="currentColor" d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l-4 4z"/>
                          </svg>
                          <span>ดูเอกสาร</span>
                        </button>

                      </div>
                    </div>
                  </article>
                );

              })}

              {(historyAccept||[]).map((doc, i) => {

                // คำนวณค่าสีตามสถานะ (เลือกฟิลด์ที่มีจริง)
                const statusText = doc.status_name ?? doc.status ?? doc.nowstatus ?? "";
                const isBlue = isBlueStatus(statusText);
                const isGreen = isGreenStatus(statusText);
                const isOrange = isOrangeStatus(statusText);

                // ทำ id สำหรับ key และการนำทาง
                // const docId =
                //   doc.id ?? doc.docId ?? doc.documentId ?? doc.id_doc ?? doc.doc_id ?? i;

                const docId = getDocIdNumeric(doc) || i;  // ✅ ยึด helper เดิม

                return (
                  <article
                    key={`${docId}-${i}`}
                    className="rounded-md bg-white shadow p-4 mx-6 mt-4"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 text-gray-800">
                        {/* <p className="font-medium text-2xl">
                          <span>{doc.idformal ?? doc.idformal ?? "—"}</span>
                        </p> */}
                        <p className="font-medium text-2xl" style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word" // หรือ "break-all"
                        }}>
                          <span>{doc.doc_title ?? "—"}</span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            เลขที่คำขอ:{" "}
                            <span className="font-medium">{doc.idformal ?? doc.idformal ?? "—"}</span>
                          </span>
                        </p>

                        

                        <p className="flex flex-wrap items-center">
                          <span>
                            ผู้ที่ยื่นคำขอ:{" "}
                            <span className="font-medium">{doc.owneremail ?? "—"}</span>
                          </span>

                          {/* กลุ่มวันที่ */}
                          <span className="inline-flex items-center gap-1 ml-2 sm:ml-8">
                            <span>วันที่คำขอ:</span>
                            <span className="whitespace-nowrap">
                              {formatThaiPretty(getCreatedAt(doc))}
                            </span>
                          </span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            หัวหน้ากองผู้ตรวจสอบเอกสาร:{" "}
                            <span className="font-medium">{doc.headauditByemail ?? "—"}</span>
                          </span>
                        </p>

                        <p className="font-medium">
                          <span className="text-black">สถานะ</span>{" "}
                          <span
                            style={
                              isBlue
                                ? { color: "#CD0000" }
                                : isGreen
                                ? { color: "#05A967" }
                                : isOrange
                                ? { color: "#E48500" }
                                : { color: "#666666" }
                            }
                          >
                            {statusText || "—"}
                          </span>
                        </p>
                      </div>

                      {/* ปุ่มการทำงาน */}
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                        <button
                          type="button"
                          onClick={() => ClickForMoreDetail(doc)}
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
                          onClick={() => ClickForViewPet(doc)}
                          className="bg-[#6B21A8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B21A8] transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            aria-hidden="true"
                          >
                            <path fill="currentColor" d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l-4 4z"/>
                          </svg>
                          <span>ดูเอกสาร</span>
                        </button>

                      </div>
                    </div>
                  </article>
                );

              })}
            </div>

          )}

          {/* อยู่ระหว่างการตรวจสอบขั้นต้น */}
          {activeTab === "documentAll" && (
            <div>
              {(documentAll || []).map((doc, i) => {
                // คำนวณค่าสีตามสถานะ (เลือกฟิลด์ที่มีจริง)
                const statusText = doc.status_name ?? doc.status ?? doc.nowstatus ?? "";
                const isBlue = isBlueStatus(statusText);
                const isGreen = isGreenStatus(statusText);
                const isOrange = isOrangeStatus(statusText);

                // ทำ id สำหรับ key และการนำทาง
                // const docId =
                //   doc.id ?? doc.docId ?? doc.documentId ?? doc.id_doc ?? doc.doc_id ?? i;
                
                const docId = getDocIdNumeric(doc) || i;  // ✅ ยึด helper เดิม

                return (
                  <article
                    key={`${docId}-${i}`}
                    className="rounded-md bg-white shadow p-4 mx-6 mt-4"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 text-gray-800">
                        {/* <p className="font-medium text-2xl">
                          <span>{doc.doc_id ?? doc.id_doc ?? "—"}</span>
                        </p> */}
                        <p className="font-medium text-2xl" style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word" // หรือ "break-all"
                        }}>
                          <span>{doc.title ?? "—"}</span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            เลขที่คำขอ:{" "}
                            <span className="font-medium">{doc.doc_id ?? doc.id_doc ?? "—"}</span>
                          </span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            ผู้ที่ยื่นคำขอ:{" "}
                            <span className="font-medium">{doc.owneremail ?? "—"}</span>
                          </span>

                          {/* กลุ่มวันที่ */}
                          <span className="inline-flex items-center gap-1 ml-2 sm:ml-8">
                            <span>วันที่คำขอ:</span>
                            <span className="whitespace-nowrap">
                              {formatThaiPretty(doc.createdAt) /* ✅ อ่านง่าย */}
                            </span>
                          </span>
                        </p>

                        <p className="font-medium">
                          <span className="text-black">สถานะ</span>{" "}
                          <span
                            style={
                              isBlue
                                ? { color: "#CD0000" }
                                : isGreen
                                ? { color: "#05A967" }
                                : isOrange
                                ? { color: "#E48500" }
                                : { color: "#666666" }
                            }
                          >
                            {statusText || "—"}
                          </span>
                        </p>
                      </div>

                      {/* ปุ่มการทำงาน */}
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                        <button
                          type="button"
                          onClick={() => ClickForMoreDetail(doc)}
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
                          onClick={() => ClickForViewPet(doc)}
                          className="bg-[#6B21A8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B21A8] transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            aria-hidden="true"
                          >
                            <path fill="currentColor" d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l-4 4z"/>
                          </svg>
                          <span>ดูเอกสาร</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setSelected(doc); setDeptView("form"); setRejectOpen(true); }}
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
                          onClick={() => { setSendBackTarget(doc); setSendBackOpen(true); }}
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
                          onClick={() => ClickForModify(doc)}
                          className="bg-[#D97706] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D97706] transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="currentColor" d="M17 17h-2.025q-.425 0-.7-.288T14 16t.288-.712T15 15h2v-2q0-.425.288-.712T18 12t.713.288T19 13v2h2q.425 0 .713.288T22 16t-.288.713T21 17h-2v2q0 .425-.288.713T18 20t-.712-.288T17 19zm-7 0H7q-2.075 0-3.537-1.463T2 12t1.463-3.537T7 7h3q.425 0 .713.288T11 8t-.288.713T10 9H7q-1.25 0-2.125.875T4 12t.875 2.125T7 15h3q.425 0 .713.288T11 16t-.288.713T10 17m-1-4q-.425 0-.712-.288T8 12t.288-.712T9 11h6q.425 0 .713.288T16 12t-.288.713T15 13zm13-1h-2q0-1.25-.875-2.125T17 9h-3.025q-.425 0-.7-.288T13 8t.288-.712T14 7h3q2.075 0 3.538 1.463T22 12"/>
                          </svg>
                          <span>แก้ไขเอกสาร</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}


          {/* ส่งกลับให้ผู้ใช้แก้ไขเอกสาร */}
          {activeTab === "history_change_des" && (
            <div>
              {(historyChangeDes||[]).map((doc, i) => {
                // คำนวณค่าสีตามสถานะ (เลือกฟิลด์ที่มีจริง)
                const statusText = doc.status_name ?? doc.status ?? doc.nowstatus ?? "";
                const isBlue = isBlueStatus(statusText);
                const isGreen = isGreenStatus(statusText);
                const isOrange = isOrangeStatus(statusText);

                // ทำ id สำหรับ key และการนำทาง
                // const docId =
                //   doc.id ?? doc.docId ?? doc.documentId ?? doc.id_doc ?? doc.doc_id ?? i;

                const docId = getDocIdNumeric(doc) || i;  // ✅ ยึด helper เดิม

                return (
                  <article
                    key={`${docId}-${i}`}
                    className="rounded-md bg-white shadow p-4 mx-6 mt-4"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 text-gray-800">
                        {/* <p className="font-medium text-2xl">
                          <span>{doc.idformal ?? doc.idformal ?? "—"}</span>
                        </p> */}
                        <p className="font-medium text-2xl" style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word" // หรือ "break-all"
                        }}>
                          <span>{doc.title ?? "—"}</span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            เลขที่คำขอ:{" "}
                            <span className="font-medium">{doc.idformal ?? doc.idformal ?? "—"}</span>
                          </span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            ผู้ที่ยื่นคำขอ:{" "}
                            <span className="font-medium">{doc.owneremail ?? "—"} {doc.ownername}</span>
                          </span>

                          {/* กลุ่มวันที่ */}
                          <span className="inline-flex items-center gap-1 ml-2 sm:ml-8">
                            <span>วันที่คำขอ:</span>
                            <span className="whitespace-nowrap">
                              {formatThaiPretty(doc.editedAt) /* ✅ อ่านง่าย */}
                            </span>
                          </span>
                        </p>

                        <p className="font-medium">
                          <span className="text-black">สถานะ</span>{" "}
                          <span
                            style={
                              isBlue
                                ? { color: "#CD0000" }
                                : isGreen
                                ? { color: "#05A967" }
                                : isOrange
                                ? { color: "#E48500" }
                                : { color: "#666666" }
                            }
                          >
                            {statusText || "—"}
                          </span>
                        </p>
                      </div>

                      {/* ปุ่มการทำงาน */}
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                        <button
                          type="button"
                          onClick={() => ClickForMoreDetail(doc)}
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
                          onClick={() => ClickForViewPet(doc)}
                          className="bg-[#6B21A8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B21A8] transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            aria-hidden="true"
                          >
                            <path fill="currentColor" d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l-4 4z"/>
                          </svg>
                          <span>ดูเอกสาร</span>
                        </button>

                      </div>
                    </div>
                  </article>
                );

              })}
            </div>
          )}

          {/* ตรวจสอบขั้นต้นเสร็จสิ้น */}
          {activeTab === "history_accept" && (
            <div>
              {(historyAccept||[]).map((doc, i) => {

                // คำนวณค่าสีตามสถานะ (เลือกฟิลด์ที่มีจริง)
                const statusText = doc.status_name ?? doc.status ?? doc.nowstatus ?? "";
                const isBlue = isBlueStatus(statusText);
                const isGreen = isGreenStatus(statusText);
                const isOrange = isOrangeStatus(statusText);

                // ทำ id สำหรับ key และการนำทาง
                // const docId =
                //   doc.id ?? doc.docId ?? doc.documentId ?? doc.id_doc ?? doc.doc_id ?? i;

                const docId = getDocIdNumeric(doc) || i;  // ✅ ยึด helper เดิม

                return (
                  <article
                    key={`${docId}-${i}`}
                    className="rounded-md bg-white shadow p-4 mx-6 mt-4"
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1 text-gray-800">
                        {/* <p className="font-medium text-2xl">
                          <span>{doc.idformal ?? doc.idformal ?? "—"}</span>
                        </p> */}
                        <p className="font-medium text-2xl" style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          wordBreak: "break-word" // หรือ "break-all"
                        }}>
                          <span>{doc.doc_title ?? "—"}</span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            เลขที่คำขอ:{" "}
                            <span className="font-medium">{doc.idformal ?? doc.idformal ?? "—"}</span>
                          </span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            ผู้ที่ยื่นคำขอ:{" "}
                            <span className="font-medium">{doc.owneremail ?? "—"}</span>
                          </span>

                          {/* กลุ่มวันที่ */}
                          <span className="inline-flex items-center gap-1 ml-2 sm:ml-8">
                            <span>วันที่คำขอ:</span>
                            <span className="whitespace-nowrap">
                              {formatThaiPretty(getCreatedAt(doc))}
                            </span>
                          </span>
                        </p>

                        <p className="flex flex-wrap items-center">
                          <span>
                            หัวหน้ากองผู้ตรวจสอบเอกสาร:{" "}
                            <span className="font-medium">{doc.headauditByemail ?? "—"}</span>
                          </span>
                        </p>

                        <p className="font-medium">
                          <span className="text-black">สถานะ</span>{" "}
                          <span
                            style={
                              isBlue
                                ? { color: "#CD0000" }
                                : isGreen
                                ? { color: "#05A967" }
                                : isOrange
                                ? { color: "#E48500" }
                                : { color: "#666666" }
                            }
                          >
                            {statusText || "—"}
                          </span>
                        </p>
                      </div>

                      {/* ปุ่มการทำงาน */}
                      <div className="flex flex-wrap sm:flex-nowrap gap-2 justify-end self-start shrink-0">
                        <button
                          type="button"
                          onClick={() => ClickForMoreDetail(doc)}
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
                          onClick={() => ClickForViewPet(doc)}
                          className="bg-[#6B21A8] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B21A8] transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5"
                            aria-hidden="true"
                          >
                            <path fill="currentColor" d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l-4 4z"/>
                          </svg>
                          <span>ดูเอกสาร</span>
                        </button>

                      </div>
                    </div>
                  </article>
                );

              })}
            </div>
          )}

         </div>
      </main> 

      {/* ป๊อปอัป: ส่งต่อไปที่ผู้ตรวจสอบ (API จริง) */}
      <ForwardToHeadAuditor
        open={rejectOpen}
        view={deptView}
        item={selected}
        hideTrigger
        onClose={() => {
          setRejectOpen(false);
          setSelected(null);
          setDeptView("form");
        }}
        onSubmit={async ({ item: submittedItem, auditId }) => {
          const targetItem = submittedItem || selected;
          if (!targetItem || acceptingDocument) return;

          const allowStatuses = [
            "อยู่ระหว่างการตรวจสอบขั้นต้น",
            "ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง",
          ];
          const statusNow = (targetItem.status_name || "").trim();
          if (!allowStatuses.some(s => statusNow.includes(s))) {
            alert("เอกสารนี้ไม่อยู่ในสถานะที่สามารถส่งต่อหัวหน้ากองได้");
            return;
          }


          if (!auditId || Number.isNaN(Number(auditId))) {
            alert("กรุณาเลือกหัวหน้ากองให้ถูกต้อง");
            return;
          }

          setAcceptingDocument(true);
          try {
            const docId = getDocIdNumeric(targetItem);
            const response = await fetch(
              `http://localhost:3001/petitionAudit/update_st_audit_by_audit/${docId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: authHeader,
                },
                body: JSON.stringify({ set_headauditId: Number(auditId) }),
              }
            );

            const raw = await response.text();
            let result;
            try {
              result = raw ? JSON.parse(raw) : {};
            } catch {
              result = { raw };
            }

            if (response.ok) {
              // ✅ update card ในหน้าให้เห็นว่า “ตรวจสอบขั้นต้นเสร็จสิ้น”
              setDocumentAll((prev) =>
                prev.map((d) =>
                  getDocIdNumeric(d) === docId
                    ? {
                        ...d,
                        status_name: "ตรวจสอบขั้นต้นเสร็จสิ้น",
                        updated_at: new Date().toISOString(),
                        headauditBy: auditId,
                      }
                    : d
                )
              );

              setDeptView("success");
              setTimeout(() => {
                setRejectOpen(false);
                setSelected(null);
                setDeptView("form");
              }, 800);
            } else {
              console.error("API Error:", result);
              alert(result?.message || "ส่งต่อไม่สำเร็จ");
            }
          } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
          } finally {
            setAcceptingDocument(false);
          }
        }}
      />

      {/* ป๊อปอัป: ส่งกลับให้ผู้ใช้แก้ไขเอกสาร */}
      <ForwardToUser
        item={sendBackTarget}
        open={sendBackOpen}
        onClose={() => {
          setSendBackOpen(false);
          setSendBackTarget(null);
        }}
        view="form"
        defaultNote=""
        submitting={submittingSendBack}
        onSubmit={submitSendBack}
      />

      {/* ===== Modal ดูรายละเอียดเอกสาร ===== */}
      {/* {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">รายละเอียดเอกสาร</h3>
              <button onClick={closeDetail} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            {detailLoading ? (
              <p className="text-gray-600">กำลังโหลดข้อมูล…</p>
            ) : detailData?.error ? (
              <p className="text-red-600">{detailData.message}</p>
            ) : (
              <div className="space-y-2 text-gray-800 max-h-[70vh] overflow-auto">
                {detailData && (
                  <>
                    {detailData.id && (<p><span className="font-semibold">รหัสเอกสาร:</span> {detailData.id}</p>)}
                    {detailData.docId && (<p><span className="font-semibold">docId:</span> {detailData.docId}</p>)}
                    {detailData.title && (<p><span className="font-semibold">ชื่อเรื่อง:</span> {detailData.title}</p>)}
                    {detailData.authorize_to && (<p><span className="font-semibold">ผู้ยื่นคำขอ:</span> {detailData.authorize_to}</p>)}
                    {detailData.status_name && (<p><span className="font-semibold">สถานะ:</span> {detailData.status_name}</p>)}
                    {detailData.destination_name && (<p><span className="font-semibold">หน่วยงานปลายทาง:</span> {detailData.destination_name}</p>)}
                  </>
                )}
                <pre className="text-xs bg-gray-50 p-3 rounded-md border overflow-auto">
                  {JSON.stringify(detailData, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={closeDetail} className="px-4 py-2 rounded-lg border border-gray-300">ปิด</button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

export default Employee_Paper;

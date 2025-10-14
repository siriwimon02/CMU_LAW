import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import ForwardToAuditorButton from "../../components/ForwardToAuditorButton";
import ForwardToDepartmentButton from "../../components/ForwardToDepartmentButton";
import TrackingHeader from "../../components/trackingHeader";

function SpvAuditor() {
  const authHeader = (localStorage.getItem("token") || "")
    .replace(/^"+|"+$/g, "")
    .trim();

  if (!authHeader) {
    return <Navigate to="/login" replace />;
  }

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("documentAll"); // documentAll | history_change_des | history_accept
  const [documentAll, setDocumentAll] = useState([]);
  const [historyChangeDes, setHistoryChangeDes] = useState([]);
  const [historyAccept, setHistoryAccept] = useState([]);

  const [destinations, setDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState("confirm"); // confirm | success
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deptView, setDeptView] = useState("form"); // form | success
  const [selected, setSelected] = useState(null);

  const [forwardingDocument, setForwardingDocument] = useState(false);
  const [acceptingDocument, setAcceptingDocument] = useState(false);

  const [userInfo, setUserInfo] = useState(null);

  const [auditors, setAuditors] = useState([]);
  const [loadingAuditors, setLoadingAuditors] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const BRAND_PURPLE = "#66009F";

  // ✅ ช่องค้นหาเลขที่เอกสาร
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ ฟอร์แมตวันที่-เวลา (ใหม่)
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
      return `${datePart} ${timePart} น.`;
    } catch {
      return dateString ?? "";
    }
  };

  // ================== Data mappers ==================
  const getId = (item) => item?.request_no ?? item?.id ?? item?.docId ?? Math.random();
  const getTitle = (item) => item?.title ?? item?.doc_title ?? "-";
  const getRequester = (item) =>
    item?.authorize_to ?? item?.requester_name ?? item?.ChangeBy ?? "-";
  const getCreatedAt = (item) => item?.createdAt ?? item?.changeAt ?? null;
  const getStatusText = (item) =>
    item?.status_name ?? item?.status ?? item?.doc_StatusNow ?? "ไม่สามารถตรวจสอบได้";
  const getDestination = (item) => item?.destination_name ?? item?.new_des ?? "-";

  const isBlueStatus = (s = "") =>
    s === "ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง" ||
    s === "ส่งไปยังหน่วยงานอื่นแล้ว" ||
    s.startsWith("ส่งไปยัง") ||
    s.startsWith("ส่งต่อไปยัง");

  const isGreenStatus = (s = "") => {
    const t = (s || "").replaceAll("เเล้ว", "แล้ว");
    return t === "ส่งต่อไปที่ผู้ตรวจสอบแล้ว" || t === "รับเข้ากองเรียบร้อย";
  };

  const isOrangeStatus = (s = "") =>
    ["รอคัดกรอง", "รอรับเข้ากอง"].some((k) => (s || "").includes(k));

  // ================== Endpoints per tab ==================
  const fetchUrl = useMemo(() => {
    switch (activeTab) {
      case "history_change_des":
        return "http://localhost:3001/petitionSuperAudit/history_change_des";
      case "history_accept":
        return "http://localhost:3001/petitionSuperAudit/history_accepted";
      case "documentAll":
      default:
        return "http://localhost:3001/petitionSuperAudit/wait_to_accept";
    }
  }, [activeTab]);

  // ================== Load destinations ==================
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingDestinations(true);
      try {
        const res = await fetch("http://localhost:3001/api/destination", {
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
        });
        const data = res.ok ? await res.json() : [];
        if (mounted) setDestinations(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("fetch destinations error:", e);
        if (mounted) setDestinations([]);
      } finally {
        if (mounted) setLoadingDestinations(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authHeader]);

  // ================== Load auditors (ในไฟล์นี้) ==================
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingAuditors(true);
      try {
        const res = await fetch("http://localhost:3001/petitionSuperAudit/api/auditor", {
          headers: { Authorization: authHeader },
        });
        const data = res.ok ? await res.json() : null;
        if (mounted) {
          const list = Array.isArray(data?.find_auditor) ? data.find_auditor : [];
          setAuditors(list);
        }
      } catch (e) {
        console.error("fetch auditors error:", e);
        if (mounted) setAuditors([]);
      } finally {
        if (mounted) setLoadingAuditors(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authHeader]);

  // ================== Load documents per tab ==================
  useEffect(() => {
    let isMounted = true;

    const fetchDocuments = async () => {
      try {
        const res = await fetch(fetchUrl, {
          headers: { Authorization: authHeader },
        });

        if (res.ok) {
          const data = await res.json();
          const rows = Array.isArray(data)
            ? data
            : Array.isArray(data?.document_json)
            ? data.document_json
            : Array.isArray(data?.data)
            ? data.data
            : [];

          if (!isMounted) return;

          if (activeTab === "documentAll") setDocumentAll(rows);
          if (activeTab === "history_change_des") setHistoryChangeDes(rows);
          if (activeTab === "history_accept") setHistoryAccept(rows);
        } else {
          if (!isMounted) return;
          if (activeTab === "documentAll") setDocumentAll([]);
          if (activeTab === "history_change_des") setHistoryChangeDes([]);
          if (activeTab === "history_accept") setHistoryAccept([]);
        }
      } catch (e) {
        console.error("fetch error:", e);
        if (!isMounted) return;
        if (activeTab === "documentAll") setDocumentAll([]);
        if (activeTab === "history_change_des") setHistoryChangeDes([]);
        if (activeTab === "history_accept") setHistoryAccept([]);
      }
    };

    fetchDocuments();
    return () => {
      isMounted = false;
    };
  }, [activeTab, fetchUrl, authHeader]);

  // ================== helpers: ids & destination mapping ==================
  const getDocIdNumeric = (item) => {
    const candidates = [
      item?.id,
      item?.docId,
      item?.documentId,
      item?.idformal,
      item?.document_id,
      item?.doc_id,
    ];
    for (const c of candidates) {
      if (typeof c === "number" && Number.isFinite(c)) return c;
      if (typeof c === "string" && /^\d+$/.test(c.trim())) return parseInt(c.trim(), 10);
    }
    throw new Error("ไม่พบไอดีตัวเลขของเอกสารสำหรับเรียก API");
  };

  const getDestinationName = (destinationId) => {
    const destination = destinations.find(
      (dest) => String(dest.id) === String(destinationId)
    );
    return destination?.des_name || destination?.name || "หน่วยงานอื่น";
  };

  const getCurrentDestinationId = (item) => {
    if (item?.destinationId != null) return Number(item.destinationId);
    const byName = item?.destination_name ?? item?.new_des;
    if (!byName) return null;
    const hit = destinations.find((d) => (d.des_name || d.name) === byName);
    return hit ? Number(hit.id) : null;
  };

  const CODE_TO_NAME = {
    LAW: "กองกฎหมาย",
    RES: "สำนักงานบริหารงานวิจัย",
    INT: "ศูนย์บริหารพันธกิจสากล",
  };

  const findDestinationIdByThaiName = (thaiName) => {
    if (!thaiName) return NaN;
    const hard = (destinations || []).find(
      (d) => (d.des_name || d.name) === thaiName
    );
    if (hard) return Number(hard.id);

    const t = thaiName.trim();
    const soft = (destinations || []).find((d) => {
      const nm = (d.des_name || d.name || "").trim();
      return nm.includes(t) || t.includes(nm);
    });
    return soft ? Number(soft.id) : NaN;
  };

  const resolveDestinationId = (val) => {
    if (val == null) return NaN;
    if (typeof val === "number") return val;
    if (typeof val === "string" && /^\d+$/.test(val.trim())) {
      return Number(val.trim());
    }
    if (typeof val === "string") {
      const code = val.trim().toUpperCase();
      if (CODE_TO_NAME[code]) {
        return findDestinationIdByThaiName(CODE_TO_NAME[code]);
      }
      const byThai = findDestinationIdByThaiName(val);
      if (!Number.isNaN(byThai)) return byThai;
      const hit = (destinations || []).find((d) =>
        [d.code, d.abbr, d.value, d.slug]
          .filter(Boolean)
          .some((k) => String(k).toUpperCase() === code)
      );
      if (hit) return Number(hit.id);
    }
    if (typeof val === "object") {
      if ("id" in val && /^\d+$/.test(String(val.id))) return Number(val.id);
      if ("value" in val) {
        const v = String(val.value);
        if (/^\d+$/.test(v)) return Number(v);
        const mapped = CODE_TO_NAME[v.toUpperCase?.() || ""] || v;
        const byVal = findDestinationIdByThaiName(mapped);
        if (!Number.isNaN(byVal)) return byVal;
        const hit = (destinations || []).find((d) =>
          [d.code, d.abbr, d.value, d.slug]
            .filter(Boolean)
            .some((k) => String(k).toUpperCase() === String(v).toUpperCase())
        );
        if (hit) return Number(hit.id);
      }
    }
    return NaN;
  };

  // ================== helpers (display) ==================
  function fmtName(v) {
    const s = String(v ?? "").trim();
    return s.length ? s : "-";
  }

  function extractDetailFromRow(row = {}) {
    const safe = (v) => (v == null || String(v).trim?.() === "" ? null : v);
    return {
      id: row.id ?? row.docId ?? row.documentId ?? row.idformal ?? null,
      doc_id: row.doc_id ?? row.id_doc ?? row.request_no ?? null,
      title: safe(row.title ?? row.doc_title),
      authorize_to: safe(row.authorize_to ?? row.owneremail),
      position: safe(row.position),
      affiliation: safe(row.affiliation),
      authorize_text: safe(row.authorize_text ?? row.text_suggest),
      status_name: safe(row.status_name ?? row.status ?? row.doc_StatusNow),
      destination_name: safe(row.destination_name ?? row.to ?? row.new_des),
      auditedBy: safe(row.auditedBy ?? row.auditBy),
      auditedBy_name: safe(row.auditedBy_name ?? row.auditByname),
      headauditBy: safe(row.headauditBy ?? row.headauditByname),
      createdAt: safe(row.createdAt ?? row.changeAt),
      _source: "list-fallback",
    };
  }

  // ================== Detail modal helpers ==================
  const openDetail = async (doc) => {
    const fallback = extractDetailFromRow(doc);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(fallback);

    try {
      const documentId = getDocIdNumeric(doc);
      const res = await fetch(
        `http://localhost:3001/petitionSuperAudit/document/${documentId}`,
        { headers: { Authorization: authHeader } }
      );
      if (!res.ok) {
        setDetailLoading(false);
        return;
      }
      const data = await res.json();
      setDetailData({ ...fallback, ...data, _source: "api+fallback" });
    } catch (e) {
      console.error("load detail error:", e);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
  };

  // ================== Actions ==================
  const ClickForMoreDetail = (row) => {
    try {
      const id = getDocIdNumeric(row);
      navigate(`/detail/${id}`);
    } catch (e) {
      openDetail(row);
    }
  };

  // ================== Render helpers ==================
  const FILTER_WAIT = "เอกสารที่รอตรวจสอบ";
  const FILTER_TO_DEPT = "ส่งต่อไปหน่วยงานอื่น";
  const FILTER_TO_AUDITOR = "ส่งต่อไปที่ผู้ตรวจสอบ";

  const filter =
    activeTab === "documentAll"
      ? FILTER_WAIT
      : activeTab === "history_change_des"
      ? FILTER_TO_DEPT
      : FILTER_TO_AUDITOR;

  // ⬇⬇⬇ ตรงนี้คือจุดที่ “ย้ายปุ่มขึ้นขวาบน” ⬇⬇⬇
  function renderRow(item, actions = [], { showDestination = true } = {}) {
    const statusText =
      item?.status_name ?? item?.status ?? item?.doc_StatusNow ?? "ไม่สามารถตรวจสอบได้";
    const isBlue = isBlueStatus(statusText);
    const isGreen = isGreenStatus(statusText);
    const isOrange = isOrangeStatus(statusText);

    const toDept = item.destination_name ?? item.to ?? item.new_des;

    return (
      <div
        key={item.id ?? item.docId ?? item.request_no ?? Math.random()}
        className="relative bg-white rounded-lg shadow-md p-5"
      >
        {/* กล่องปุ่มด้านขวาบน */}
        <div className="absolute top-4 right-4 flex gap-2">
          {actions}
        </div>

        <div className="space-y-1 text-gray-800 pr-36">
          <p
            className="font-bold text-lg break-words overflow-hidden text-ellipsis line-clamp-2 pr-[260px] max-w-[calc(100%-12rem)]"
          >
            {item.title ?? item.doc_title ?? "-"}
          </p>
          <p className="text-sm text-black break-words overflow-hidden line-clamp-2">
            เลขที่คำขอ :{" "}
            <span className="font-medium">
              {item.doc_id ?? item.request_no ?? item.id ?? "-"}
            </span>
          </p>

          <p className="text-sm text-black break-words overflow-hidden line-clamp-2">
            ผู้ยื่นคำร้อง :{" "}
            <span className="font-medium">
              {item.owneremail ?? item.authorize_to ?? "-"}
            </span>
          </p>

          <p className="text-sm text-black break-words overflow-hidden line-clamp-2">
            เจ้าหน้าที่ตรวจสอบ :{" "}
            <span className="font-medium">
              {item.auditBy ?? item.auditByname ?? item.auditedBy_name ?? "-"}
            </span>
          </p>

          <p className="text-sm text-black break-words overflow-hidden line-clamp-2">
            หัวหน้าตรวจสอบ :{" "}
            <span className="font-medium">
              {item.headauditBy ?? item.headauditByname ?? "-"}
            </span>
          </p>

          <p className="text-sm text-black break-words overflow-hidden line-clamp-2">
            วันที่ยื่นคำร้อง : {item.createdAt ? formatDateTime(item.createdAt) : "-"}
          </p>

          {showDestination && (
            <p className="text-sm text-black break-words overflow-hidden line-clamp-2">
              ส่งไปยังหน่วยงาน :{" "}
              <span className="font-medium">
                {String(toDept ?? "").trim() || "-"}
              </span>
            </p>
          )}

          <p className="text-sm text-black break-words overflow-hidden line-clamp-2">
            <span
              className="font-bold"
              style={{
                color: isOrange
                  ? "#E48500"
                  : isBlue
                  ? "#0078E2"
                  : isGreen
                  ? "#05A967"
                  : "#666",
              }}
            >
              {statusText}
            </span>
          </p>
        </div>
      </div>
    );
  }
  // ⬆⬆⬆ จบส่วนจัดตำแหน่งปุ่มขวาบน ⬆⬆⬆

  // 🛠 ให้รองรับลิสต์ที่ถูกกรอง
  function renderDocuments(list = currentItems) {
    if (filter === FILTER_WAIT) {
      return (
        <div className="space-y-4 mt-4">
          {list.map((doc) =>
            renderRow(
              doc,
              [
                <button
                  key="detail"
                  onClick={() => ClickForMoreDetail(doc)}
                  className="border border-gray-200 bg-white px-4 py-3 rounded-lg text-sm flex itemsCenter gap-1 hover:bg-gray-100 shadow-sm transition"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  ดูรายละเอียด
                </button>,
                <button
                  key="to-dept"
                  onClick={() => { setSelected(doc); setModalPhase("confirm"); setApproveOpen(true); }}
                  className="bg-[#0078E2] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-[#0066c2]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" style={{ transform: "rotate(-40deg)" }}>
                    <path d="m19.8 12.925-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5-6 1.5zm0 0V7z"></path>
                  </svg>
                  ส่งไปหน่วยงานอื่น
                </button>,
                <button
                  key="to-auditor"
                  onClick={() => { setSelected(doc); setDeptView("form"); setRejectOpen(true); }}
                  className="bg-[#05A967] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-[#048a52]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  ส่งต่อผู้ตรวจสอบ
                </button>,
              ],
              { showDestination: false }
            )
          )}
        </div>
      );
    }

    if (filter === FILTER_TO_DEPT) {
      return (
        <div className="space-y-4 mt-4">
          {list.map((h) =>
            renderRow(
              {
                title: h.doc_title ?? h.title ?? "-",
                doc_id: h.idformal ?? h.docId ?? h.documentId ?? "-",
                owneremail: h.transferByemail ?? "-",
                auditBy: h.auditByname ?? "-",
                headauditBy: h.headauditByname ?? "-",
                createdAt: h.changeAt ?? null,
                status_name: h.nowstatus ?? h.oldstatus ?? "-",
                destination_name: h.to ?? h.destination_name ?? h.new_des ?? "-",
              },
              [
                <button
                  key="detail"
                  onClick={() => ClickForMoreDetail(h)}
                  className="border border-gray-200 px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  ดูรายละเอียด
                </button>,
              ]
            )
          )}
        </div>
      );
    }

    if (filter === FILTER_TO_AUDITOR) {
      return (
        <div className="space-y-4 mt-4">
          {list.map((r) =>
            renderRow(
              {
                title: r.doc_title ?? r.title ?? "-",
                doc_id: r.idformal ?? r.docId ?? r.documentId ?? "-",
                owneremail: r.owneremail ?? r.authorize_to ?? "-",
                auditBy: r.auditByname ?? r.auditedBy_name ?? "-",
                headauditBy: r.headauditByname ?? "-",
                createdAt: r.changeAt ?? r.createdAt ?? null,
                status_name: r.nowstatus ?? r.status_name ?? "ส่งต่อไปที่ผู้ตรวจสอบแล้ว",
              },
              [
                <button
                  key="detail"
                  onClick={() => ClickForMoreDetail(r)}
                  className="border border-gray-200 px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  ดูรายละเอียด
                </button>,
              ],
              { showDestination: false }
            )
          )}
        </div>
      );
    }
  }

  const currentItems =
    activeTab === "documentAll"
      ? documentAll
      : activeTab === "history_change_des"
      ? historyChangeDes
      : historyAccept;

  // ✅ กรองด้วยเลขที่เอกสาร (รองรับ request_no, doc_id, id)
  const filteredItems = (currentItems || []).filter((doc) => {
    const key = String(doc?.request_no ?? doc?.doc_id ?? doc?.id ?? "").toLowerCase();
    return !searchTerm || key.includes(String(searchTerm).toLowerCase());
  });

  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
      <TrackingHeader />

      {userInfo && (
        <div className="bg-white shadow rounded-lg p-4 m-6">
          <h2 className="font-bold text-lg mb-2">ข้อมูลผู้ใช้</h2>
          <p>ชื่อ: {userInfo.firstname} {userInfo.lastname}</p>
          <p>อีเมล: {userInfo.email}</p>
          <p>หน่วยงาน: {userInfo.department_name}</p>
          <p>บทบาท: {userInfo.role_n}</p>
        </div>
      )}

      {/* แถบปุ่มเลือก dataset */}
      <div className="w-full px-6 mt-6 flex gap-3 flex-wrap">
        <button
          onClick={() => setActiveTab("documentAll")}
          className="rounded-lg px-5 py-3 shadow border border-gray-200 bg-white flex items-center gap-2"
          title="รอรับเข้ากอง (Document All)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke={BRAND_PURPLE} strokeWidth="1.5" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0  0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
          </svg>
          รอรับเข้ากอง
        </button>

        <button
          onClick={() => setActiveTab("history_change_des")}
          className="rounded-lg px-5 py-3 shadow border border-gray-200 bg-white flex items-center gap-2"
          title="ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง (history_change_des)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill={BRAND_PURPLE}>
            <path d="M11 19h2v-4.175l1.6 1.6L16 15l-4-4l-4 4l1.425 1.4L11 14.825zm-5 3q-.825 0-1.412-.587T4 20V4q0-.825.588-1.412T6 2h8l6 6v12q0 .825-.587 1.413T18 22zm7-13h5l-5-5z"></path>
          </svg>
          ส่งไปหน่วยงานอื่น
        </button>

        <button
          onClick={() => setActiveTab("history_accept")}
          className="rounded-lg px-5 py-3 shadow border border-gray-200 bg-white flex items-center gap-2"
          title="ส่งต่อไปที่ผู้ตรวจสอบ (history_accept)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill={BRAND_PURPLE}>
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 .41.12.8.34 1.12c.07.11.16.21.25.29c.36.37.86.59 1.41.59h7.53c-.53-.58-.92-1.25-1.18-2H6V4h7v5h5v3c.7 0 1.37.12 2 .34V8zm4 21l5-4.5l-3-2.7l-2-1.8v3h-4v3h4z"></path>
          </svg>
          ส่งต่อไปที่ผู้ตรวจสอบ
        </button>
      </div>

      {/* 🔍 ช่องค้นหาเอกสาร (อยู่ใต้ปุ่ม 3 ปุ่ม) — จำกัดความกว้าง */}
      <div className="w-full px-6 mt-4">
        <div className="relative w-full max-w-[570px]">
          <input
            type="text"
            placeholder="พิมพ์เพื่อค้นหาเลขที่เอกสาร"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none"

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
      </div>


      {/* รายการเอกสาร */}
      <div className="mx-6">{renderDocuments(filteredItems)}</div>

      {/* ป๊อปอัป: ส่งคำขอไปยังหน่วยงานอื่น */}
      <ForwardToAuditorButton
        open={approveOpen}
        view={modalPhase}
        item={selected}
        loading={loadingDestinations}
        destinations={destinations}
        onViewDetail={(doc) => openDetail(doc)}
        onClose={() => { setApproveOpen(false); setModalPhase("confirm"); setSelected(null); }}
        onConfirm={async ({ department, text_suggest = "" }) => {
          if (!selected || forwardingDocument) return;
          const newDestId = resolveDestinationId(department);
          if (Number.isNaN(newDestId)) { alert("กรุณาเลือกหน่วยงานปลายทางให้ถูกต้อง"); return; }
          const statusNow = (getStatusText(selected) || "").replaceAll("เเล้ว", "แล้ว");
          if (!statusNow.includes("รอรับเข้ากอง")) { alert("เอกสารนี้ไม่อยู่ในสถานะ 'รอรับเข้ากอง' จึงไม่สามารถส่งต่อได้"); return; }
          const currentDestId = getCurrentDestinationId(selected);
          if (currentDestId != null && newDestId === Number(currentDestId)) { alert("ไม่สามารถส่งไปยังหน่วยงานเดิมได้"); return; }
          const exists = (destinations || []).some((d) => Number(d.id) === newDestId);
          if (!exists) { alert("ไม่พบบัญชีหน่วยงานปลายทางที่เลือก"); return; }

          setForwardingDocument(true);
          try {
            const documentId = getDocIdNumeric(selected);
            const response = await fetch(
              `http://localhost:3001/petitionSuperAudit/change_destination/${documentId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: authHeader },
                body: JSON.stringify({ new_destinationId: newDestId, text_suggest: text_suggest || "" }),
              }
            );
            let result; const raw = await response.text(); try { result = raw ? JSON.parse(raw) : {}; } catch { result = { raw }; }

            if (response.ok) {
              const destinationName = getDestinationName(newDestId);
              setDocumentAll((prev) =>
                (prev?.length ? prev : []).map((doc) => {
                  try {
                    const idNum = getDocIdNumeric(doc);
                    return idNum === documentId
                      ? { ...doc, status_name: "ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง", destination_name: destinationName, destinationId: newDestId, updated_at: new Date().toISOString() }
                      : doc;
                  } catch { return doc; }
                })
              );
              setModalPhase("success");
              setTimeout(() => { setApproveOpen(false); setModalPhase("confirm"); setSelected(null); }, 900);
            } else {
              console.error("[CHANGE_DEST] HTTP", response.status, "resp:", result);
              let errorMessage = "เกิดข้อผิดพลาดในการส่งเอกสาร";
              if (response.status === 400) errorMessage = result?.message?.includes("same as the current") ? "ไม่สามารถส่งไปยังหน่วยงานเดิมได้" : "ข้อมูลที่ส่งไม่ถูกต้อง";
              else if (response.status === 401) errorMessage = "สิทธิ์หมดอายุหรือไม่ถูกต้อง (401)";
              else if (response.status === 403) errorMessage = "คุณไม่มีสิทธิ์ในการดำเนินการนี้ (403)";
              else if (response.status === 404) errorMessage = result?.message?.includes("not in correct status") ? "เอกสารนี้ไม่อยู่ในสถานะที่สามารถส่งต่อได้" : "ไม่พบเอกสารหรือเอกสารไม่อยู่ในกองของคุณ";
              else if (response.status === 500) errorMessage = `เซิร์ฟเวอร์ล้ม (500): ${result?.message || result?.raw || "Server error"}`;
              else errorMessage = "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง";
              alert(errorMessage);
            }
          } catch (error) {
            console.error("Network error:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบเครือข่าย");
          } finally {
            setForwardingDocument(false);
          }
        }}
      />

      {/* ป๊อปอัป: ส่งต่อไปที่ผู้ตรวจสอบ */}
      <ForwardToDepartmentButton
        open={rejectOpen}
        view={deptView}
        item={selected}
        hideTrigger
        auditors={auditors}
        loadingAuditors={loadingAuditors}
        onViewDetail={(doc) => openDetail(doc)}
        onClose={() => { setRejectOpen(false); setSelected(null); setDeptView("form"); }}
        onSubmit={async ({ item: submittedItem, auditId }) => {
          const targetItem = submittedItem || selected;
          if (!targetItem || acceptingDocument) return;

          const statusNow = (getStatusText(targetItem) || "").replaceAll("เเล้ว", "แล้ว");
          if (!statusNow.includes("รอรับเข้ากอง")) { alert("เอกสารนี้ไม่อยู่ในสถานะ 'รอรับเข้ากอง'"); return; }
          if (!auditId || Number.isNaN(Number(auditId))) { alert("กรุณาเลือกผู้ตรวจสอบให้ถูกต้อง"); return; }

          setAcceptingDocument(true);
          try {
            const documentId = getDocIdNumeric(targetItem);
            const response = await fetch(
              `http://localhost:3001/petitionSuperAudit/update_st_ToAccpet/${documentId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: authHeader },
                body: JSON.stringify({ set_auditId: Number(auditId) }),
              }
            );
            let result; const raw = await response.text(); try { result = raw ? JSON.parse(raw) : {}; } catch { result = { raw }; }

            if (response.ok) {
              const a = (auditors || []).find(
                (x) => String(x.id ?? x.user_id ?? x.auditId ?? x.uid ?? x.userId ?? x.emp_id ?? x.empId) === String(auditId)
              );
              const auditorName =
                [a?.firstname, a?.lastname].filter(Boolean).join(" ") ||
                a?.name || a?.displayName || a?.email || String(auditId);

              const auditedById = result?.auditedBy ?? result?.auditIdBy ?? result?.assigned_auditor_id ?? Number(auditId);
              const auditedByName = result?.auditedBy_name ?? result?.assigned_auditor_name ?? auditorName;

              setDocumentAll((prev) =>
                (prev?.length ? prev : []).map((doc) => {
                  try {
                    const idNum = getDocIdNumeric(doc);
                    return idNum === documentId
                      ? { ...doc, status_name: "ส่งต่อไปที่ผู้ตรวจสอบแล้ว", updated_at: new Date().toISOString(), auditedBy: auditedById, auditedBy_name: auditedByName }
                      : doc;
                  } catch { return doc; }
                })
              );

              setDeptView("success");
              setTimeout(() => { setRejectOpen(false); setSelected(null); setDeptView("form"); }, 900);
            } else {
              console.error("[ACCEPT] HTTP", response.status, "resp:", result);
              let msg = "เกิดข้อผิดพลาดในการส่งต่อผู้ตรวจสอบ";
              if (response.status === 400) msg = "ข้อมูลเอกสารหรือผู้ตรวจสอบไม่ถูกต้อง";
              else if (response.status === 401) msg = "สิทธิ์หมดอายุหรือไม่ถูกต้อง (401)";
              else if (response.status === 403) msg = "คุณไม่มีสิทธิ์ในการดำเนินการนี้";
              else if (response.status === 404) msg = "ไม่พบเอกสารที่ต้องการ";
              else if (response.status === 500) msg = `เซิร์ฟเวอร์ล้ม (500): ${result?.message || result?.raw || "Server error"}`;
              alert(msg);
            }
          } catch (error) {
            console.error("Network error:", error);
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบเครือข่าย");
          } finally {
            setAcceptingDocument(false);
          }
        }}
      />

      {/* Modal: รายละเอียดเอกสาร */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg p-8 relative">
            <h3 className="text-xl font-bold mb-4">รายละเอียดเอกสาร</h3>
            <button onClick={closeDetail} className="absolute top-3 right-5 text-gray-500 hover:text-gray-700 text-xl">
              ✕
            </button>

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
                    {detailData.auditedBy && (<p><span className="font-semibold">ผู้ตรวจสอบที่รับเรื่อง:</span> {detailData.auditedBy_name || detailData.auditedBy}</p>)}
                  </>
                )}
                <pre className="text-xs bg-gray-50 p-3 rounded-md border overflow-auto">
                  {JSON.stringify(detailData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SpvAuditor;
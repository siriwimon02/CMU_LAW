// =============================
// File: src/pages/superAuditor/superAuditorTracking.jsx
// =============================
import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import Header from "../../components/trackingHeader";
import ForwardToAuditorButton from "../../components/ForwardToAuditorButton";
import ForwardToDepartmentButton from "../../components/ForwardToDepartmentButton";
import ViewDetailButton from "../../components/ViewDetailButton";

function SpvAuditor() {
  // ไม่ใส่ Bearerจ้าาาาาา
  const authHeader = (localStorage.getItem("token") || "")
    .replace(/^"+|"+$/g, "")
    .trim();
  if (!authHeader) {
    return <Navigate to="/login" replace />;
  }

  // ================== States ==================
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

  // (optional) เก็บ user info ถ้าคุณมี endpoint นี้
  const [userInfo, setUserInfo] = useState(null);

  // ✅ รายชื่อผู้ตรวจสอบ โหลดในไฟล์นี้แล้วส่งเข้าโมดอล
  const [auditors, setAuditors] = useState([]);
  const [loadingAuditors, setLoadingAuditors] = useState(false);

  // ✅ modal ดูรายละเอียดเอกสาร
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const BRAND_PURPLE = "#66009F";

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
    const candidates = [item?.id, item?.docId, item?.request_no];
    for (const c of candidates) {
      if (typeof c === "number" && Number.isInteger(c)) return c;
      if (typeof c === "string" && /^\d+$/.test(c)) return parseInt(c, 10);
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

  // ================== Detail modal helpers ==================
  const openDetail = async (doc) => {
    try {
      const documentId = getDocIdNumeric(doc);
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailData(null);

      const res = await fetch(
        `http://localhost:3001/petitionSuperAudit/document/${documentId}`,
        { headers: { Authorization: authHeader } }
      );
      const data = res.ok ? await res.json() : null;
      setDetailData(data || { error: true, message: "ไม่พบข้อมูลเอกสาร" });
    } catch (e) {
      console.error("load detail error:", e);
      setDetailData({ error: true, message: "โหลดรายละเอียดไม่สำเร็จ" });
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailData(null);
    setDetailLoading(false);
  };

  const currentItems =
    activeTab === "documentAll"
      ? documentAll
      : activeTab === "history_change_des"
      ? historyChangeDes
      : historyAccept;

  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
      <Header />

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0  0 1 13.5 7.125v-1.5a3.375 3.375 0  0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0  0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
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

      {/* รายการเอกสาร */}
      {Array.isArray(currentItems) && currentItems.length > 0 ? (
        currentItems.map((raw) => {
          const id = getId(raw);
          const title = getTitle(raw);
          const requester = getRequester(raw);
          const createdAt = getCreatedAt(raw);
          const statusText = getStatusText(raw);
          const destination = getDestination(raw);

          const created = createdAt
            ? new Date(createdAt).toLocaleString("th-TH", {
                timeZone: "Asia/Bangkok",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-";

          const isBlue = isBlueStatus(statusText);
          const isGreen = isGreenStatus(statusText);
          const isOrange = isOrangeStatus(statusText);

          return (
            <article key={id} className="rounded-md bg-white shadow p-4 mx-6 mt-4" style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-gray-800">
                  <p className="font-bold">เลขที่คำขอ: <span className="font-extrabold">{id}</span></p>
                  <p>ชื่อเรื่อง: <span>{title}</span></p>
                  <p>ผู้ที่ยื่นคำขอ: <span>{requester}</span></p>
                  <p>วันที่ยื่น/เปลี่ยนสถานะ: {created}</p>
                  {destination && destination !== "-" && (<p>หน่วยงานปลายทาง: <span>{destination}</span></p>)}
                  <p
                    className="font-medium"
                    style={
                      isBlue ? { color: "#0078E2" } :
                      isGreen ? { color: "#05A967" } :
                      isOrange ? { color: "#E48500" } :
                      { color: "#666666" }
                    }
                  >
                    {statusText}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center self-start">
                  {/* ✅ แสดงปุ่มดูรายละเอียดทุกแท็บ */}
                  <ViewDetailButton doc={raw} onClick={(doc) => openDetail(doc)} />

                  {/* ปุ่ม action อื่นๆ สำหรับเอกสารที่ยังรอรับเข้ากอง */}
                  {activeTab === "documentAll" && isOrange && (
                    <>
                      <button
                        type="button"
                        onClick={() => { setSelected(raw); setModalPhase("confirm"); setApproveOpen(true); }}
                        className="bg-[#0078E2] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#0066c2] flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor" style={{ transform: "rotate(-40deg)" }}>
                          <path d="m19.8 12.925l-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5l-6 1.5zm0 0V7z"></path>
                        </svg>
                        ส่งไปยังหน่วยงานอื่น
                      </button>

                      <button
                        onClick={() => { setSelected(raw); setDeptView("form"); setRejectOpen(true); }}
                        className="bg-[#05A967] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#048a52] flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0 1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        </svg>
                        ส่งต่อไปที่ผู้ตรวจสอบ
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })
      ) : (
        <p className="text-gray-500 mx-6 mt-6">ไม่พบเอกสารในแท็บนี้</p>
      )}

      {/* ป๊อปอัป: ส่งคำขอไปยังหน่วยงานอื่น (API จริง) */}
      <ForwardToAuditorButton
        open={approveOpen}
        view={modalPhase}
        item={selected}
        loading={loadingDestinations}
        destinations={destinations}
        onViewDetail={(doc) => openDetail(doc)}   // ✅ ปุ่มดูรายละเอียดในป๊อปอัปนี้
        onClose={() => {
          setApproveOpen(false);
          setModalPhase("confirm");
          setSelected(null);
        }}
        onConfirm={async ({ department, text_suggest = "" }) => {
          if (!selected || forwardingDocument) return;
          const newDestId = resolveDestinationId(department);
          if (Number.isNaN(newDestId)) {
            alert("กรุณาเลือกหน่วยงานปลายทางให้ถูกต้อง");
            return;
          }
          const statusNow = (getStatusText(selected) || "").replaceAll("เเล้ว","แล้ว");
          if (!statusNow.includes("รอรับเข้ากอง")) {
            alert("เอกสารนี้ไม่อยู่ในสถานะ 'รอรับเข้ากอง' จึงไม่สามารถส่งต่อได้");
            return;
          }
          const currentDestId = getCurrentDestinationId(selected);
          if (currentDestId != null && newDestId === Number(currentDestId)) {
            alert("ไม่สามารถส่งไปยังหน่วยงานเดิมได้");
            return;
          }
          const exists = (destinations || []).some((d) => Number(d.id) === newDestId);
          if (!exists) {
            alert("ไม่พบบัญชีหน่วยงานปลายทางที่เลือก");
            return;
          }

          setForwardingDocument(true);
          try {
            const documentId = getDocIdNumeric(selected);
            const response = await fetch(
              `http://localhost:3001/petitionSuperAudit/change_destination/${documentId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: authHeader,
                },
                body: JSON.stringify({
                  new_destinationId: newDestId,
                  text_suggest: text_suggest || "",
                }),
              }
            );

            let result;
            const raw = await response.text();
            try { result = raw ? JSON.parse(raw) : {}; } catch { result = { raw }; }

            if (response.ok) {
              const destinationName = getDestinationName(newDestId);
              setDocumentAll((prev) =>
                (prev?.length ? prev : []).map((doc) => {
                  try {
                    const idNum = getDocIdNumeric(doc);
                    return idNum === documentId
                      ? { ...doc,
                          status_name: "ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง",
                          destination_name: destinationName,
                          destinationId: newDestId,
                          updated_at: new Date().toISOString(),
                        }
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

      {/* ป๊อปอัป: ส่งต่อไปที่ผู้ตรวจสอบ (API จริง) */}
      <ForwardToDepartmentButton
        open={rejectOpen}
        view={deptView}
        item={selected}
        hideTrigger
        auditors={auditors}
        loadingAuditors={loadingAuditors}
        onViewDetail={(doc) => openDetail(doc)}   // ✅ ปุ่มดูรายละเอียดในป๊อปอัปนี้
        onClose={() => { setRejectOpen(false); setSelected(null); setDeptView("form"); }}
        onSubmit={async ({ item: submittedItem, auditId }) => {
          const targetItem = submittedItem || selected;
          if (!targetItem || acceptingDocument) return;

          const statusNow = (getStatusText(targetItem) || "").replaceAll("เเล้ว","แล้ว");
          if (!statusNow.includes("รอรับเข้ากอง")) {
            alert("เอกสารนี้ไม่อยู่ในสถานะ 'รอรับเข้ากอง'");
            return;
          }
          if (!auditId || Number.isNaN(Number(auditId))) {
            alert("กรุณาเลือกผู้ตรวจสอบให้ถูกต้อง");
            return;
          }

          setAcceptingDocument(true);
          try {
            const documentId = getDocIdNumeric(targetItem);
            const response = await fetch(
              `http://localhost:3001/petitionSuperAudit/update_st_ToAccpet/${documentId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: authHeader },
                body: JSON.stringify({ set_auditId: Number(auditId) }), // ✅ ตามสเปก
              }
            );

            let result;
            const raw = await response.text();
            try { result = raw ? JSON.parse(raw) : {}; } catch { result = { raw }; }

            if (response.ok) {
              // หาชื่อผู้ตรวจสอบจากลิสต์ (เผื่อ backend ไม่ส่งกลับ)
              const a = (auditors || []).find(
                x =>
                  String(x.id ?? x.user_id ?? x.auditId ?? x.uid ?? x.userId ?? x.emp_id ?? x.empId)
                  === String(auditId)
              );
              const auditorName =
                [a?.firstname, a?.lastname].filter(Boolean).join(" ") ||
                a?.name || a?.displayName || a?.email || String(auditId);

              // ถ้า backend ส่งฟิลด์ auditedBy / auditIdBy / assigned_auditor_id มา ให้ใช้ของจริง
              const auditedById =
                result?.auditedBy ??
                result?.auditIdBy ??
                result?.assigned_auditor_id ??
                Number(auditId);

              const auditedByName =
                result?.auditedBy_name ?? result?.assigned_auditor_name ?? auditorName;

              // อัปเดตการ์ดในหน้าให้เห็นว่าใครรับไปตรวจแล้ว
              setDocumentAll((prev) =>
                (prev?.length ? prev : []).map((doc) => {
                  try {
                    const idNum = getDocIdNumeric(doc);
                    return idNum === documentId
                      ? {
                          ...doc,
                          status_name: "ส่งต่อไปที่ผู้ตรวจสอบแล้ว",
                          updated_at: new Date().toISOString(),
                          auditedBy: auditedById,
                          auditedBy_name: auditedByName,
                        }
                      : doc;
                  } catch {
                    return doc;
                  }
                })
              );

              setDeptView("success");
              setTimeout(() => {
                setRejectOpen(false);
                setSelected(null);
                setDeptView("form");
              }, 900);
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

      {/* ✅ Modal ดูรายละเอียดเอกสาร */}
      {detailOpen && (
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
                    {detailData.auditedBy && (
                      <p><span className="font-semibold">ผู้ตรวจสอบที่รับเรื่อง:</span> {detailData.auditedBy_name || detailData.auditedBy}</p>
                    )}
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
      )}
    </div>
  );
}

export default SpvAuditor;

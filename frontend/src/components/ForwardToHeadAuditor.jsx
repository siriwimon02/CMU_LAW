import React, { useEffect, useMemo, useState } from "react";

export default function ForwardToHeadAuditor({
  item,
  buttonClassName = "",
  onSubmit,            // จะส่ง { item, auditId } กลับไป
  open: controlledOpen,
  onClose,
  hideTrigger = false,
  view: controlledView, // "form" | "success"
  // ✅ ของใหม่: รับจากภายนอกได้
  auditors: auditorsProp,
  loadingAuditors: loadingAuditorsProp,
}) {
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  const [phase, setPhase] = useState("form"); // "form" | "success"
  const view = controlledView ?? phase;

  // ===== โหลดรายชื่อหัวหน้ากอง =====
  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [auditId, setAuditId] = useState("");
  const [selectedHeadId, setSelectedHeadId] = useState(""); // number | ""


  const authHeader = (localStorage.getItem("token") || "")
    .replace(/^"+|"+$/g, "")
    .trim();

  const shouldFetch = !Array.isArray(auditorsProp); // ถ้าส่งมาจากภายนอก ไม่ต้อง fetch

  const norm = (s) => (s ?? "").toString().trim().toLowerCase();


 
  useEffect(() => {
    if (!open) return;
    setAuditId("");

    const onEsc = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    (async () => {
      if (!shouldFetch) {
        // ใช้ลิสต์จากภายนอก
        setAuditors(auditorsProp || []);
        setLoading(Boolean(loadingAuditorsProp));
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3001/petitionAudit/api/headauditor", {
          headers: { Authorization: authHeader },
        });
        const data = res.ok ? await res.json() : null;
        const list = Array.isArray(data?.find_auditor) ? data.find_auditor : [];
        
        // --- helpers ---//
        const raw = item?.headauditBy ?? item?.headauditBy?.id ?? null;
        const targetId = raw == null ? null : Number(raw);

        if (targetId != null) {
          const found = list.find(op => Number(op.id) === targetId);
          if (found) {
            setAuditors([found]);     // ✅ เจอ → โชว์แค่คนเดียว
            setAuditId(targetId);     // ✅ preselect
          } else {
            setAuditors(list);        // ❌ ไม่เจอ → โชว์ทั้งหมด
          }
        } else {
          setAuditors(list);          // ไม่มี head เดิม → โชว์ทั้งหมด
        }

      } catch (e) {
        console.error("load auditors error:", e);
        setAuditors([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, authHeader, shouldFetch, JSON.stringify(auditorsProp), loadingAuditorsProp]);




  // สร้าง options
  const options = useMemo(() => {
    return (auditors || [])
      .map((a) => {
        const id = a.id ?? a.user_id ?? a.auditId ?? a.uid ?? a.userId ?? a.emp_id ?? a.empId;
        const name = [a.firstname, a.lastname].filter(Boolean).join(" ") || a.name || a.displayName || "";
        const email = a.email || a.username || "";
        return {
          id: String(id ?? ""),
          label: `${name} ( ${email} )`,
        };
      })
      .filter((o) => o.id !== "")
      .filter((opt, i, arr) => arr.findIndex((o) => o.id === opt.id) === i)
      .sort((a, b) => a.label.localeCompare(b.label, "th"));
  }, [auditors]);

  const handleOpen = () => {
    if (isControlled) return;
    setInternalOpen(true);
  };

  const handleClose = () => {
    if (isControlled) onClose?.();
    else setInternalOpen(false);
    setPhase("form");
  };

  const submit = () => {
    if (!auditId) return;
    onSubmit?.({ item, auditId: Number(auditId) });
    if (controlledView === undefined) {
      setPhase("success");
      setTimeout(() => handleClose(), 1500);
    }
  };





  if (!open) {
    return (
      <>
        {!hideTrigger && !isControlled && (
          <button
            type="button"
            onClick={handleOpen}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-[#05A967] text-white shadow hover:opacity-95 focus:outline-none ${buttonClassName}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0 1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
            ส่งต่อไปที่หัวหน้าผู้ตรวจสอบ
          </button>
        )}
      </>
    );
  }

  if (view === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50" onClick={onClose ?? handleClose} />
        <div className="relative w-full max-w-[720px] h-1/2 rounded-2xl bg-white shadow-2xl overflow-auto grid place-items-center p-8 text-center">
          <button type="button" onClick={onClose ?? handleClose} aria-label="Close" className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
            </svg>
          </button>

          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">ส่งไปยังหัวหน้ากองเรียบร้อยเเล้ว</h3>
            <div className="mt-6 mx-auto w-14 h-14 rounded-full bg-emerald-600 grid place-items-center shadow">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ======== FORM VIEW ========
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose ?? handleClose} />
      <div className="relative w-full max-w-[720px] rounded-2xl bg-white shadow-2xl p-8 min-h-[420px]">
        <button type="button" onClick={onClose ?? handleClose} aria-label="Close" className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex min-h-[356px] flex-col">
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">ส่งคำขอไปยังหัวหน้าผู้ตรวจสอบ</h2>
          <p className="mt-6 text-lg sm:text-xl font-extrabold text-gray-900">
            เรื่อง: {item?.request_no ?? item?.title ?? "-"}
          </p>
          <p className="mt-6 text-lg sm:text-xl font-extrabold text-gray-900">
            เลขที่คำขอ: {item?.request_no ?? item?.doc_id ?? "-"}
          </p>
          <p className="mt-2 text-lg sm:text-xl text-gray-800"style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word" // หรือ "break-all"
          }}>
            ผู้ยื่นคำขอ: {item?.owneremail ?? "-"}
          </p>

          <label className="mt-6 text-base sm:text-lg text-gray-900">เลือกหัวหน้าผู้ตรวจสอบ</label>
          <div className="mt-2">
            <div className="relative">
              <select
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-gray-900 
                          focus:outline-none focus:ring-2 focus:ring-[#05A967] focus:border-[#05A967] appearance-none"
                value={auditId}
                onChange={(e) => setAuditId(e.target.value)}
                disabled={loading || (Array.isArray(auditorsProp) ? (loadingAuditorsProp || false) : options.length === 0)}
              >
                <option value="" disabled>
                  {loading || loadingAuditorsProp ? "กำลังโหลดรายชื่อหัวหน้าผู้ตรวจสอบ..." : "เลือกหัวหน้าผู้ตรวจสอบ"}
                </option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600">
                  <path d="M7 10l5 5 5-5z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </div>
        
          <div className="mt-auto pt-6 flex justify-end">
            <button
              type="button"
              disabled={!auditId || loading || loadingAuditorsProp}
              onClick={submit}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 shadow focus:outline-none 
                          ${auditId && !(loading || loadingAuditorsProp) ? "bg-[#05A967] text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg"
                   fill="none"
                   viewBox="0 0 24 24"
                   strokeWidth="1.5"
                   stroke="currentColor"
                   className="w-5 h-5">
                <path strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              ส่งต่อไปที่หัวหน้าผู้ตรวจสอบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

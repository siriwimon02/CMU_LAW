import React, { useEffect, useMemo, useState } from "react";

export default function ForwardToAuditorButton({
  item,
  destinations = [],
  loading = false,
  onConfirm,
  open: controlledOpen,
  onClose,
  view: controlledView, // "confirm" | "success"
}) {
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  const [phase, setPhase] = useState("confirm");
  const view = controlledView ?? phase;

  const [department, setDepartment] = useState("");
  const [textSuggest, setTextSuggest] = useState("");

  useEffect(() => {
    if (!open) return;
    setDepartment("");
    setTextSuggest("");

    const onEsc = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const options = useMemo(() => {
    return (destinations || [])
      .map((d) => ({
        id: String(d.id ?? ""),
        label: d.des_name || d.name || `หน่วยงาน ${d.id}`,
        value: String(d.id ?? ""),
      }))
      .filter((o) => o.id !== "")
      .sort((a, b) => a.label.localeCompare(b.label, "th"));
  }, [destinations]);

  const handleOpen = () => {
    if (!isControlled) setInternalOpen(true);
  };
  const handleClose = () => {
    if (isControlled) onClose?.();
    else setInternalOpen(false);
    setPhase("confirm");
  };
  const submit = () => {
    if (!department) return;
    onConfirm?.({ department, text_suggest: textSuggest });
    if (controlledView === undefined) {
      setPhase("success");
      setTimeout(() => handleClose(), 1200);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={handleOpen} className="hidden">
        เปิดป๊อปอัปส่งหน่วยงานอื่น
      </button>
    );
  }

  if (view === "success") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose ?? handleClose}
        />
        <div className="relative w-full max-w-[720px] h-1/2 rounded-2xl bg-white shadow-2xl overflow-auto grid place-items-center p-8 text-center">
          <button
            type="button"
            onClick={onClose ?? handleClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M6 6l12 12M18 6l-12 12"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              ส่งไปยังหน่วยงานอื่นเรียบร้อยแล้ว
            </h3>
            {/* ✅ เปลี่ยนสีเป็นเขียว */}
            <div className="mt-6 mx-auto w-14 h-14 rounded-full bg-[#05A967] grid place-items-center shadow">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ======== CONFIRM VIEW ========
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose ?? handleClose}
      />
      <div className="relative w-full max-w-[720px] rounded-2xl bg-white shadow-2xl p-8 min-h-[520px]">
        <button
          type="button"
          onClick={onClose ?? handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M6 6l12 12M18 6l-12 12"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex min-h-[456px] flex-col">
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
            ส่งคำขอไปยังหน่วยงานอื่น
          </h2>

          {/* ❌ ลบปุ่มดูรายละเอียดออกแล้ว */}

          <p className="mt-6 text-lg sm:text-xl font-extrabold text-gray-900">
            เลขที่คำขอ: {item?.request_no ?? item?.id ?? "-"}
          </p>
          <p className="mt-2 text-lg sm:text-xl text-gray-800">
            ผู้ยื่นคำขอ: {item?.authorize_to ?? "-"}
          </p>

          <label className="mt-6 text-base sm:text-lg text-gray-900">
            เลือกหน่วยงานปลายทาง
          </label>
          <div className="mt-2">
            <div className="relative">
              <select
                className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0078E2] focus:border-[#0078E2] appearance-none"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={loading || options.length === 0}
              >
                <option value="" disabled>
                  {loading ? "กำลังโหลดหน่วยงาน..." : "เลือกหน่วยงาน"}
                </option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.value}>
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

          <label className="mt-6 text-base sm:text-lg text-gray-900">
            เหตุผลเพิ่มเติม
          </label>
          <textarea
            rows={4}
            maxLength={500}
            value={textSuggest}
            onChange={(e) => setTextSuggest(e.target.value)}
            placeholder="เหตุผลเพิ่มเติม (ไม่บังคับ)"
            className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none"
          />

          <div className="mt-auto pt-6 flex justify-end">
            <button
              type="button"
              disabled={!department || loading}
              onClick={submit}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 shadow focus:outline-none ${
                department && !loading
                  ? "bg-[#0078E2] text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="m19.8 12.925-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5-6 1.5zm0 0V7z" />
              </svg>
              ส่งคำขอ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

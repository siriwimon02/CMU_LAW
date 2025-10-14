import React, { useEffect, useMemo, useState } from "react";

export default function ForwardToUser({
  item,
  buttonClassName = "",
  onSubmit,            // onSubmit({ item, note })
  open: controlledOpen,
  onClose,
  hideTrigger = false,
  view: controlledView, // "form" | "success" (เหมือน ForwardToHeadAuditor)
  defaultNote = "",
  submitting = false,
}) {
  // ===== โหมดควบคุม/ไม่ควบคุม เหมือน ForwardToHeadAuditor =====
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  const [phase, setPhase] = useState("form"); // "form" | "success"
  const view = controlledView ?? phase;

  // ===== ฟอร์มโน้ต =====
  const [note, setNote] = useState(defaultNote || "");

  useEffect(() => {
    setNote(defaultNote || "");
  }, [defaultNote, open]);

  // ===== จัดการ ESC + ล็อกสกรอลล์ตอนเปิด popup =====
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    onSubmit?.({ item, note });
    // ถ้า view ไม่ได้ถูกคุมจากภายนอก ให้โชว์ success แล้วปิดอัตโนมัติ
    if (controlledView === undefined) {
      setPhase("success");
      setTimeout(() => handleClose(), 1500);
    }
  };

  // ===== ปุ่ม trigger (เมื่อไม่คุมจากภายนอก) =====
  if (!open) {
    return (
      <>
        {!hideTrigger && !isControlled && (
          <button
            type="button"
            onClick={handleOpen}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-[#1D4ED8] text-white shadow hover:opacity-95 focus:outline-none ${buttonClassName}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0 1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
              />
            </svg>
            ส่งกลับให้ผู้ใช้แก้ไขเอกสาร
          </button>
        )}
      </>
    );
  }

  // ===== SUCCESS VIEW (เหมือน ForwardToHeadAuditor) =====
  if (view === "success") {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50" onClick={onClose ?? handleClose} />
        <div className="relative w-full max-w-[720px] h-1/2 rounded-2xl bg-white shadow-2xl overflow-auto grid place-items-center p-8 text-center">
          <button type="button" onClick={onClose ?? handleClose} aria-label="Close" className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
            </svg>
          </button>

          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">ส่งกลับเพื่อแก้ไขเรียบร้อยแล้ว</h3>
            <div className="mt-6 mx-auto w-14 h-14 rounded-full bg-[#1D4ED8] grid place-items-center shadow">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== FORM VIEW =====
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose ?? handleClose} />
      <div className="relative w-full max-w-[720px] rounded-2xl bg-white shadow-2xl p-8 min-h-[420px]">
        <button type="button" onClick={onClose ?? handleClose} aria-label="Close" className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex min-h-[356px] flex-col">
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">ส่งกลับให้ผู้ใช้แก้ไขเอกสาร</h2>

          <p className="mt-6 text-lg sm:text-xl font-extrabold text-gray-900">
            เลขที่คำขอ: {item?.request_no ?? item?.id ?? "-"}
          </p>
          <p className="mt-2 text-lg sm:text-xl text-gray-800" style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word" // หรือ "break-all"
          }}>
            ผู้ยื่นคำขอ: {item?.authorize_to ?? "-"}
          </p>

          <label className="mt-6 text-base sm:text-lg text-gray-900">รายละเอียดการแก้ไข</label>
          <div className="mt-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8]"
              placeholder="เช่น เพิ่มสำเนาบัตรประชาชนหน้า 2, ระบุเลขที่หนังสือ, แก้คำสะกด..."
              disabled={submitting}
            />
          </div>

          <div className="mt-auto pt-6 flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 shadow focus:outline-none 
                         ${!submitting ? "bg-[#1D4ED8] text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
            >
              {!submitting ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                >
                    <path d="m19.8 12.925-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5-6 1.5zm0 0V7z" />
                </svg>
              ) : (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5"
                >
                    <path d="m19.8 12.925-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5-6 1.5zm0 0V7z" />
                </svg>
              )}
              {submitting ? "กำลังส่ง..." : "ยืนยันส่งแก้ไข"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

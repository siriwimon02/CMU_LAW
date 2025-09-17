// src/components/ForwardToDepartmentButton.jsx
import React, { useEffect, useState } from "react";

export default function ForwardToDepartmentButton({
  item,
  buttonClassName = "",
  onSubmit,
  open: controlledOpen,
  onClose,
  hideTrigger = false,
  view: controlledView, // "form" | "success" (ถ้าส่งมาก็จะควบคุมจากภายนอก)
}) {
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  // phase ภายใน (ใช้เมื่อไม่ส่ง view มากำกับ)
  const [phase, setPhase] = useState("form"); // "form" | "success"
  const view = controlledView ?? phase;

  const [note, setNote] = useState("");

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
  }, [open]);

  const handleOpen = () => {
    if (isControlled) return;
    setInternalOpen(true);
  };

  const handleClose = () => {
    if (isControlled) onClose?.();
    else setInternalOpen(false);
    setNote("");
    setPhase("form");
  };

  const submit = () => {
    onSubmit?.({ note: note.trim(), item });
    setNote("");
    if (controlledView === undefined) {
      // คุมในตัวเอง -> ไปหน้า success
      setPhase("success");
      // ปิดอัตโนมัติหลัง 1.5 วิ
      setTimeout(() => handleClose(), 1500);
    }
    // ถ้าเป็น controlled view ให้ parent จัดการเปลี่ยน view เอง
  };

  // ถ้าไม่ open ก็ไม่ต้องเรนเดอร์
  if (!open) {
    return (
      <>
        {!hideTrigger && !isControlled && (
          <button
            type="button"
            onClick={handleOpen}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 bg-[#05A967] text-white shadow hover:opacity-95 focus:outline-none ${buttonClassName}`}
          >
            {/* ไอคอนที่ผู้ใช้ให้มา */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
            ส่งต่อไปที่ผู้ตรวจสอบ
          </button>
        )}
      </>
    );
  }

  // ==== เปิด modal แล้ว ====
  if (view === "success") {

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50" onClick={onClose ?? handleClose} />
        <div className="relative w-full max-w-[720px] h-1/2 rounded-2xl bg-white shadow-2xl overflow-auto grid place-items-center p-8 text-center">
          <button
            type="button"
            onClick={onClose ?? handleClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
            </svg>
          </button>

          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              ส่งไปยังผู้ตรวจสอบเรียบร้อยเเล้ว
            </h3>
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

  // === หน้าแบบฟอร์ม (form) ===
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative w-full max-w-[720px] rounded-2xl bg-white shadow-2xl p-8">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex flex-col">
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
            ส่งคำขอไปยังที่ผู้ตรวจสอบ
          </h2>

          <p className="mt-6 text-lg sm:text-xl font-extrabold text-gray-900">
            เลขที่คำขอ: {item?.request_no ?? item?.id ?? "-"}
          </p>
          <p className="mt-2 text-lg sm:text-xl text-gray-800">
            ผู้ยื่นคำขอ: {item?.authorize_to ?? "-"}
          </p>

          <label htmlFor="fd-note" className="mt-6 text-base sm:text-lg text-gray-900">
            เหตุผลเพิ่มเติม
          </label>
          <textarea
            id="fd-note"
            rows={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เหตุผลเพิ่มเติม"
            className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none"
          />

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 shadow focus:outline-none bg-[#05A967] text-white hover:opacity-95"
            >
              {/* ไอคอนที่ผู้ใช้ให้มา */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                  clipRule="evenodd"
                />
              </svg>
              ส่งต่อไปที่ผู้ตรวจสอบ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

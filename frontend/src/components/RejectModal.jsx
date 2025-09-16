// src/components/RejectModal.jsx
import React, { useEffect, useRef, useState } from "react";

export default function RejectModal({
  open,
  view = "confirm",         // "confirm" | "success"
  item,
  user,
  onClose,
  onConfirm,                 // (reason) => void
  closeOnOverlay = false,    // ค่าเริ่มต้น: ห้ามปิดด้วย overlay
  closeOnEsc = false,        // ค่าเริ่มต้น: ห้ามปิดด้วย ESC
}) {
  const cardRef = useRef(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    const onEsc = (e) => closeOnEsc && e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    setTimeout(() => cardRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, closeOnEsc]);

  useEffect(() => {
    if (!open) {
      setReason("");
      setError("");
    }
  }, [open, view]);

  if (!open) return null;

  const handleConfirm = () => {
    const r = reason.trim();
    if (view === "confirm" && r.length < 3) {
      setError("กรุณาใส่เหตุผลอย่างน้อย 3 ตัวอักษร");
      return;
    }
    onConfirm(r);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-title"
    >
      {/* overlay */}
      <div
        className={`absolute inset-0 bg-black/50 ${closeOnOverlay ? "cursor-pointer" : "cursor-default"}`}
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* card: ขนาดเท่ากับ ApproveModal */}
      <div
        ref={cardRef}
        tabIndex={-1}
        className="relative w-full max-w-[720px] h-[360px] sm:h-[420px] max-h-[85vh] rounded-2xl bg-white shadow-2xl overflow-auto outline-none"
      >
        {/* ปุ่ม X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
          </svg>
        </button>

        {view === "confirm" ? (
          // โหมดยืนยันการไม่อนุมัติ
          <div className="h-full flex flex-col p-6 sm:p-8">
            <h2 id="reject-title" className="text-3xl font-extrabold text-[#CD0000]">ไม่อนุมัติคำขอ</h2>

            <p className="mt-4 text-xl font-extrabold text-gray-900">
              เลขที่คำขอ: {item?.request_no ?? item?.id}
            </p>
            <p className="mt-2 text-xl text-gray-800">
              ผู้ยื่นคำขอ: {user?.firstname} {user?.lastname}
            </p>

            {/* เหตุผล */}
            <label className="mt-4 mb-2 text-md font-medium text-gray-700" htmlFor="reject-reason">
              เหตุผลเพิ่มเติม
            </label>
            <textarea
              id="reject-reason"
              className={`mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 ${
                error ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-gray-300"
              }`}
              rows={3}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
            //   placeholder="อธิบายสั้น ๆ ว่าทำไมถึงไม่อนุมัติ..."
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

            <div className="mt-auto flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-gray-800 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-[#CD0000] text-white px-5 py-2.5 shadow hover:bg-[#a60000]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#FFFFFF]">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                </svg>
                ยืนยันไม่อนุมัติ
              </button>
            </div>
          </div>
        ) : (
          // โหมดสำเร็จ: แสดงผลลัพธ์สำเร็จ (ไม่ปิดเอง)
          <div className="h-full grid place-items-center p-8 text-center">
            <div>
              <h3 id="reject-title" className="text-xl sm:text-2xl font-extrabold text-gray-900">
                ปฏิเสธคำขอเรียบร้อยแล้ว
              </h3>

              <div className="mt-6 mx-auto w-14 h-14 rounded-full bg-red-600 grid place-items-center shadow">
                {/* ไอคอนกากบาทสีขาว */}
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

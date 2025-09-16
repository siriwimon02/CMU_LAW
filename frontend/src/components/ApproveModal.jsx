// src/components/ApproveModal.jsx
import React, { useEffect } from "react";

export default function ApproveModal({ open, view = "confirm", item, user, onClose, onConfirm }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* card: ✅ สูงเท่ากันทุกโหมด */}
      <div className="relative w-full max-w-[720px] h-1/2  rounded-2xl bg-white shadow-2xl overflow-auto">
        {/* close */}
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
          // โหมดยืนยัน
          <div className="h-full flex flex-col p-8 ml-4">
            <h2 className="mt-4 text-3xl font-extrabold text-[#01B56D]">อนุมัติคำขอ</h2>

            <p className="mt-4 text-xl font-extrabold text-gray-900">
              เลขที่คำขอ: {item?.request_no ?? item?.id}
            </p>
            <p className="mt-4 text-xl text-gray-800">
              ผู้ยื่นคำขอ: {user?.firstname} {user?.lastname}
            </p>

            {/* ดันปุ่มไปล่างเสมอ */}
            <div className="mt-auto flex justify-end">
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-[#05A967] text-white px-5 py-2.5 shadow hover:bg-[#048a52]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#FFFFFF]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                อนุมัติ
              </button>
            </div>
          </div>
        ) : (
          // โหมดสำเร็จ
          <div className="h-full grid place-items-center p-8 text-center">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                อนุมัติคำขอเรียบร้อยแล้ว
              </h3>

              <div className="mt-6 mx-auto w-14 h-14 rounded-full bg-emerald-600 grid place-items-center shadow">
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
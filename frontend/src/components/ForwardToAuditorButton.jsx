// src/components/ApproveModal.jsx
import React, { useEffect, useState } from "react";

export default function ApproveModal({
  open,
  view = "confirm",           // "confirm" | "success"
  item,                        // เอกสารที่เลือก
  user,                        // ไม่จำเป็นต้องใช้ในจอนี้ (แต่อยู่เพื่อความเข้ากันได้)
  onClose,
  onConfirm                    // (payload) => void
}) {
  const [department, setDepartment] = useState("");

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

  useEffect(() => {
    // reset เมื่อเปิดใหม่
    if (open) setDepartment("");
  }, [open]);

  if (!open) return null;

  if (view === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-[720px] h-1/2 rounded-2xl bg-white shadow-2xl overflow-auto grid place-items-center p-8 text-center">
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

          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              ส่งไปยังหน่วยงานอื่นเรียบร้อยเเล้ว
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

  // view === "confirm"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* card: ✅ ขนาดเท่าเดิม */}
      <div className="relative w-full max-w-[720px] rounded-2xl bg-white shadow-2xl p-8">
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

  {/* body */}
  <div className="flex flex-col">
    <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-gray-900">
      ส่งคำขอไปยังหน่วยงานอื่น
    </h2>

    <p className="mt-6 text-lg sm:text-xl font-extrabold text-gray-900">
      เลขที่คำขอ: {item?.request_no ?? item?.id ?? "-"}
    </p>
    <p className="mt-2 text-lg sm:text-xl text-gray-800">
      ผู้ยื่นคำขอ: {item?.authorize_to ?? "-"}
    </p>

        {/* เลือกหน่วยงาน */}
        <label className="mt-6 text-base sm:text-lg text-gray-900">เลือกหน่วยงานปลายทาง</label>
        <div className="mt-2">
        <div className="relative">
            <select
            className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-gray-900 
                        focus:outline-none focus:ring-2 focus:ring-[#0078E2] focus:border-[#0078E2] appearance-none"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            >
            <option value="" disabled hidden> เลือกหน่วยงาน </option>
            <option value="LAW">กองกฎหมาย</option>
            <option value="RES">สำนักงานบริหารงานวิจัย</option>
            <option value="INT">ศูนย์บริหารพันธกิจสากล</option>
            </select>

            {/* caret */}
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600">
                <path d="M7 10l5 5 5-5z" fill="currentColor" />
            </svg>
            </div>
        </div>
        </div>


    {/* ปุ่ม */}
    <div className="mt-6 flex justify-end">
      <button
        type="button"
        disabled={!department}
        onClick={() => onConfirm?.({ department })}
        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 shadow
                   ${department ? "bg-[#0078E2] text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
             className="w-5 h-5" fill="currentColor" style={{ transform: "rotate(-40deg)" }}>
          <path d="m19.8 12.925-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5-6 1.5z"></path>
        </svg>
        ส่งไปยังหน่วยงานอื่น
      </button>
    </div>
  </div>
</div>

    </div>
  );
}

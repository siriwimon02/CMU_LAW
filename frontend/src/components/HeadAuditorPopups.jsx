import React, { useEffect } from "react";

// ตรวจสอบคำขอ
export function CheckPopup({ selectedDoc, onClose, onSubmit }) {
  if (!selectedDoc) return null;

  return (
       <div className="fixed inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative bg-white p-6 rounded-xl w-110  shadow-lg  ">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
                ✕
            </button>
            <p className="text-[#05A967]  text-3xl font-bold ">
                ตรวจสอบคำขอ
            </p>
            <p className="text-lg text-black break-words overflow-hidden line-clamp-2">
                เรื่อง:{" "} {selectedDoc.title_now || selectedDoc.title}
            </p>
            <p className="text-lg text-black  break-words overflow-hidden">
                ผู้ยื่นคำร้อง:{" "} <span>{selectedDoc.ownername} {selectedDoc.owneremail}</span>
            </p>
            <div className="flex p-2 justify-end">
                <button
                onClick={onSubmit}
                className="px-4 py-2 rounded-xl flex justify-center  bg-green-600 text-white hover:bg-green-700"
                >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                >
                    <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
                    />
                </svg>
                ยืนยันตรวจสอบ
                </button>
            </div>
            </div>
        </div>
  );
}

// ส่งกลับแก้ไข
export function EditPopup({ selectedDoc, reason, setReason, onClose, onSubmit }) {
  if (!selectedDoc) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center ">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative bg-white rounded-xl p-6 w-110 shadow-lg flex flex-col gap-1">
        <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
            ✕
        </button>
        <p className="text-2xl text-[#0073D9] font-bold">
            ส่งกลับเพื่อดำเนินการแก้ไข
        </p>
            <p className="text-lg text-black break-words overflow-hidden line-clamp-2">
            เรื่อง:{" "}<span>{selectedDoc.title_now || selectedDoc.title}</span>
        </p>
        <p className="text-lg text-black break-words overflow-hidden">
            ผู้ยื่นคำร้อง:{" "} <span>{selectedDoc.ownername} {selectedDoc.owneremail}</span>
        </p>
        <textarea
            className="border p-2 rounded h-35 resize-none"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เหตุผลเพิ่มเติม.."
            maxLength={500}
        />
        <p className="text-sm text-gray-400">
            {reason.length}/500
        </p>
        <div className="flex justify-end">
            <button
            onClick={onSubmit}
            disabled={!reason.trim()} 
            className={`px-4 py-2 rounded-xl flex items-center 
                ${reason.trim()
                ? "bg-[#0073D9] text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
            >
                <path
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"
                />
            </svg>
            ส่งแก้ไข
            </button>
        </div>
        </div>
    </div>
  );
}


//  ยืนยันตรวจสอบเรียบร้อย 
export function CheckConfirmedPopup({ onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
        onClose();
        }, 3000); 
        return () => clearTimeout(timer);
    }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative bg-white rounded-xl p-6 w-96 shadow-lg text-center flex flex-col items-center gap-4">
        <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
            ✕
        </button>
        <p className="text-2xl font-bold text-black">ตรวจสอบเรียบร้อยแล้ว</p>
        <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-16 h-16 text-[#05A967]"
        >
        <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 
            9.75-9.75s9.75 4.365 9.75 9.75-4.365 
            9.75-9.75 9.75S2.25 17.385 2.25 
            12Zm13.36-1.814a.75.75 0 1 
            0-1.22-.872l-3.236 4.53L9.53 
            12.22a.75.75 0 0 0-1.06 
            1.06l2.25 2.25a.75.75 0 0 
            0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
        />
        </svg>
        </div>
    </div>
  );
}


// ยืนยันส่งกลับแก้ไขเรียบร้อย
export function EditConfirmedPopup({ onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
        onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative bg-white rounded-xl p-6 w-96 shadow-lg text-center flex flex-col items-center gap-4">
            <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
            ✕
            </button>
            <p className="text-2xl font-bold text-black">
            ส่งกลับแก้ไขเรียบร้อยแล้ว
            </p>
            <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-16 h-16 text-[#05A967]"
            >
            <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 
                9.75-9.75s9.75 4.365 9.75 9.75-4.365 
                9.75-9.75 9.75S2.25 17.385 2.25 
                12Zm13.36-1.814a.75.75 0 1 
                0-1.22-.872l-3.236 4.53L9.53 
                12.22a.75.75 0 0 0-1.06 
                1.06l2.25 2.25a.75.75 0 0 
                0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
            />
            </svg>
        </div>
    </div>
  );
}

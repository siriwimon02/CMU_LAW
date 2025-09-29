import React from "react";

function ViewDetailButton({ doc, onClick }) {
  if (!doc) return null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(doc)}
      className="inline-flex items-center gap-2 rounded-xl px-5 py-2 shadow bg-white border border-gray-300 text-black hover:bg-gray-100"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-3.6-3.6" strokeLinecap="round" />
      </svg>
      ดูรายละเอียด
    </button>
  );
}

export default ViewDetailButton;

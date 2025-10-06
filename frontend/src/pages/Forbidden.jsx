// src/pages/Forbidden.jsx
export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-kanit">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-red-600">403 – ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-3 text-gray-600">
          คุณไม่มีสิทธิ์เข้าถึงหน้านี้ โปรดติดต่อผู้ดูแลระบบหรือกลับไปหน้าแรก
        </p>
        <a href="/dashboard" className="inline-block mt-6 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
          กลับหน้าแรก
        </a>
      </div>
    </div>
  );
}

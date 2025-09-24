import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/docIcon";
import BackB from "../../components/backToDashboardButton";

function ViewPetition() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // read-only fields
  const [title, setTitle] = useState("");
  const [authorizeTo, setAuthorizeTo] = useState("");
  const [position, setPosition] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [authorizeText, setAuthorizeText] = useState("");
  const [statusName, setStatusName] = useState("");

  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  // โหลดข้อมูลเอกสาร (view-only)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:3001/petitionHeadAudit/document/${id}`, {
          headers: { Authorization: `${token}` },
        });
        if (!res.ok) throw new Error(`Fetch doc failed: ${res.status}`);
        const payload = await res.json();
        const doc = payload?.setdoc;

        if (!alive) return;
        if (!doc) throw new Error("Invalid response shape: missing setdoc");
        setTitle(doc.title ?? "");
        setAuthorizeTo(doc.authorize_to ?? "");
        setPosition(doc.position ?? "");
        setAffiliation(doc.affiliation ?? "");
        setAuthorizeText(doc.authorize_text ?? "");
        setStatusName(doc.status_name ?? "");
        setError("");
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F6F7FB] font-[Kanit]">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] px-4 py-10 font-[Kanit]">
      <div className="mx-auto max-w-[980px]">
        <div className="rounded-2xl bg-white shadow-[0_6px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between pt-8 px-8 relative">
            {/* Centered title */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <h1 className="text-[22px] md:text-[26px] font-semibold text-[#66009F]">
                หนังสือมอบอำนาจ
              </h1>
            </div>

            {/* Back button aligned right */}
            <div className="ml-auto">
              <BackB />
            </div>
          </div>

          {/* <div className="w-full"> */}
            <div className="my-2 rounded-lg p-2 bg-gray-200 flex items-center justify-center w-fit mx-auto">
              <p className="text-md text-gray-500">
                เลขที่คำขอ : POA-2025-0819-1122
              </p>
            {/* </div> */}
          </div>



          <div className="p-2">
            {/* Section title */}
            <div className="mb-4">
              
              <hr className="mt-3 border-gray-200" />
            </div>

            {/* สถานะ */}
            {statusName && (
              <div className="mb-4 text-[14px] text-gray-700">
                สถานะปัจจุบัน: <strong>{statusName}</strong>
              </div>
            )}

            {/* แจ้งเตือน */}
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            {/* Read-only form look */}
            <div className="space-y-5">
              {/* 1 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">
                    1. เรื่อง มอบอำนาจการดำเนินงานที่เกี่ยวข้องกับ
                  </span>
                </label>
                <input
                  type="text"
                  value={title}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-gray-700"
                />
              </div>

              {/* 2 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">2. ผู้รับมอบอำนาจ</span>
                </label>
                <input
                  type="text"
                  value={authorizeTo}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-gray-700"
                />
              </div>

              {/* 3 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">3. ตำแหน่ง</span>
                </label>
                <input
                  type="text"
                  value={position}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-gray-700"
                />
              </div>

              {/* 4 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">4. สังกัด</span>
                </label>
                <input
                  type="text"
                  value={affiliation}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-gray-700"
                />
              </div>

              {/* 5 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">
                    5. ขอรับมอบหมายให้ดำเนินการในเรื่องใด
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={authorizeText}
                  readOnly
                  aria-readonly="true"
                  className="w-full resize-y rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-gray-700"
                />
              </div>
            </div>

            {/* ปุ่มกลับ
            <div className="pt-6">
              <button
                type="button"
                // i don't know where i need to go
                onClick={() => navigate(-1)}
                className="mx-auto block w-full sm:w-auto rounded-xl bg-gray-100 px-6 py-2.5 text-gray-800 ring-1 ring-gray-200 hover:bg-gray-200"
              >
                กลับ
              </button>
            </div> */}
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

export default ViewPetition;

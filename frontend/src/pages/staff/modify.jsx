import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/docIcon"
import BackB from "../../components/backToDashboardButton"

const ALLOW_STATUS = "ส่งกลับให้ผู้ใช้แก้ไขเอกสาร";  // สถานะที่อนุญาตให้แก้ไข

function Modify() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [canEdit, setCanEdit] = useState(false);      // เพิ่มตัวคุมสิทธิ์เข้าแก้ไข

  // form fields...
  const [title, setTitle] = useState("");
  const [authorizeTo, setAuthorizeTo] = useState("");
  const [position, setPosition] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [authorizeText, setAuthorizeText] = useState("");

  // (ออปชัน) เก็บชื่อสถานะไว้โชว์ถ้าต้องการ
  const [statusName, setStatusName] = useState("");

  const [files, setFiles] = useState([]);

  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:3001/petition/${id}`, {
          headers: { Authorization: `${token}` },
        });
        if (!res.ok) throw new Error(`Fetch doc failed: ${res.status}`);
        const doc = await res.json();
        if (!alive) return;

        // เช็กสิทธิ์ตั้งแต่ตรงนี้
        const allowed = doc?.status_name === ALLOW_STATUS;
        setCanEdit(allowed);
        setStatusName(doc?.status_name || "");

        // ถ้าไม่อนุญาต ไม่ต้อง prefill อะไรต่อแล้ว
        if (!allowed) {
          // เลือกได้ 1 แบบ: รีไดเรกต์ทันที หรือใช้ <Navigate/> ตอน render
          // แบบรีไดเรกต์ทันที:
          navigate("/tracking", {
            replace: true,
            state: { msg: "เอกสารไม่อยู่ในสถานะที่อนุญาตให้แก้ไข" },
          });
          return;
        }

        // prefill เฉพาะกรณีที่แก้ไขได้
        setTitle(doc.title ?? "");
        setAuthorizeTo(doc.authorize_to ?? "");
        setPosition(doc.position ?? "");
        setAffiliation(doc.affiliation ?? "");
        setAuthorizeText(doc.authorize_text ?? "");
        setError("");
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, token, navigate]);

  // ------- ทางเลือกที่ 2 (ถ้าไม่อยาก navigate ใน effect) -------
  // ถ้าอยาก “ดักตอน render” แทน ให้คอมเมนต์ navigate() ใน effect ทิ้ง
  // แล้วใช้บรรทัดนี้:
  // if (!loading && !canEdit) {
  //   return <Navigate to="/tracking" replace state={{ msg: "เอกสารไม่อยู่ในสถานะแก้ไขได้" }} />;
  // }
  // -------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F6F7FB] font-[Kanit]">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    );
  }

  // ถ้าเลือกใช้ “ดักตอน render” แทน navigate ใน effect ให้ใช้บล็อกด้านบน
  // ที่นี่เรา navigate ไปแล้ว จึงไม่ต้องเช็กซ้ำ

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");
    setSending(true);
    try {
      const form = new FormData();
      if (title)         form.append("title", title.trim());
      if (authorizeTo)   form.append("authorizeTo", authorizeTo.trim());
      if (position)      form.append("position", position.trim());
      if (affiliation)   form.append("affiliation", affiliation.trim());
      if (authorizeText) form.append("authorizeText", authorizeText.trim());
      for (const f of files) form.append("attachments", f);

      const res = await fetch(`http://localhost:3001/petition/edit/${id}`, {
        method: "PUT",
        headers: { Authorization: `${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `Update failed: ${res.status}`);

      setOkMsg(data?.message || "อัปเดตเอกสารสำเร็จ");
      setTimeout(() => navigate("/tracking"), 800);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB] px-4 py-10 font-[Kanit] ">
      <div className="mx-auto max-w-[980px]">
        <div className="rounded-2xl bg-white shadow-[0_6px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/5 ">
          <div className="mb-4 flex items-center justify-between pt-8 px-8">
            <div className="flex items-center gap-3">
              <Icon/>
              <h1 className="text-[22px] md:text-[26px] font-semibold text-gray-900">ยื่นคำขอมอบอำนาจ</h1>
            </div>
            <BackB/>
          </div>

          <div className="p-2">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#66009F]">รายละเอียดหนังสือมอบอำนาจ</span>
              </div>
              <hr className="mt-3 border-gray-200" />
            </div>

            {/* (ออปชัน) แสดงสถานะปัจจุบัน */}
            {statusName && (
              <div className="mb-4 text-[14px] text-gray-700">
                สถานะปัจจุบัน: <strong>{statusName}</strong>
              </div>
            )}

            {/* แจ้งเตือน */}
            {error && <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-red-700 ring-1 ring-red-200">{error}</div>}
            {okMsg && <div className="mb-3 rounded-lg bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-200">{okMsg}</div>}

            <form onSubmit={onSubmit} className="space-y-5">
              {/* fields… (เหมือนเดิมของคุณ) */}
              {/* 1 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">1. เรื่อง มอบอำนาจการดำเนินงานที่เกี่ยวข้องกับ</span>
                  <span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ชื่อโครงการ"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {/* 2 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">2. ผู้รับมอบอำนาจ</span>
                  <span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={authorizeTo}
                  onChange={(e) => setAuthorizeTo(e.target.value)}
                  placeholder="ชื่อ-สกุล ผู้รับมอบอำนาจ"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {/* 3 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">3. ตำแหน่ง</span>
                  <span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="ตำแหน่งของผู้รับมอบอำนาจ"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {/* 4 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">4. สังกัด</span>
                  <span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="หน่วยงาน/สังกัดของผู้รับมอบอำนาจ"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {/* 5 */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700">
                  <span className="font-medium">5. ขอรับมอบหมายให้ดำเนินการในเรื่องใด</span>
                  <span className="text-red-600"> *</span>
                </label>
                <textarea
                  rows={6}
                  value={authorizeText}
                  onChange={(e) => setAuthorizeText(e.target.value)}
                  placeholder="ระบุรายละเอียดอำนาจหน้าที่ที่มอบให้ เช่น การเซ็นเอกสาร การติดต่อหน่วยงาน การดำเนินการแทน ฯลฯ"
                  className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              {/* Upload */}
              <div>
                <label className="mb-1 block text-[15px] text-gray-700 font-medium">แนบเอกสารเพิ่มเติม</label>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-gray-200 hover:bg-gray-50">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => setFiles(e.target.files)}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                    </svg>
                    Select file
                  </label>
                  {files?.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      เลือกแล้ว {files.length} ไฟล์
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className={[
                    "mx-auto block w-full sm:w-auto rounded-xl bg-[#66009F] px-8 py-3 text-white shadow-lg transition",
                    sending ? "cursor-not-allowed opacity-70" : "hover:-translate-y-[1px] hover:shadow-xl"
                  ].join(" ")}
                >
                  {sending ? "กำลังส่ง…" : "บันทึกและส่งหนังสือมอบอำนาจ"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

export default Modify;

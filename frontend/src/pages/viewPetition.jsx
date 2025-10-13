import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Icon from "../components/docIcon";
import BackB from "../components/backButton";

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
  const [docId,setDocumentId] = useState("");
  const [destination,setDestination] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [order_n, setOrder_n] = useState("");

  const API_BASE = "http://localhost:3001";
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
        const res = await fetch(`http://localhost:3001/document/${id}`, {
          headers: { Authorization: `${token}` },
        });
        if (!res.ok) throw new Error(`Fetch doc failed: ${res.status}`);
        const payload = await res.json();
        const doc = payload?.setdoc;
        console.log(doc)
        if (!alive) return;
        if (!doc) throw new Error("Invalid response shape: missing setdoc");
        setTitle(doc.title ?? "");
        setAuthorizeTo(doc.authorize_to ?? "");
        setPosition(doc.position ?? "");
        setAffiliation(doc.affiliation ?? "");
        setAuthorizeText(doc.authorize_text ?? "");
        setStatusName(doc.status_name ?? "");
        setDocumentId(doc.doc_id ?? "")
        setDestination(doc.destination_name ?? "")
        setAttachments(Array.isArray(doc.document_attachments) ? doc.document_attachments : []);
        setOrder_n(doc.order_n ?? "");
        setError("");
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, token]);


  // download

  // ด้านบน component


  async function downloadAttachment(att, token) {
    try {
      const url = `${API_BASE}/attachments/${att.id}/download`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `${token}` },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`ดาวน์โหลดไม่สำเร็จ (${res.status}) ${txt || ""}`);
      }

      // ดึงชื่อไฟล์จาก header ถ้ามี
      const cd = res.headers.get("content-disposition") || "";
      const match = cd.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
      const headerFileName = decodeURIComponent(match?.[1] || match?.[2] || "");
      const fallbackName = att.file_name || att.file_path?.split("/").pop() || "download";

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = headerFileName || fallbackName;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 0);
    } catch (err) {
      console.error(err);
      alert(err.message || "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
    }
  }

  
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F6F7FB] font-[Kanit]">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    );
  }


  return (
    
    <div className="min-h-screen bg-[#F9FAFE] flex justify-center items-center px-4 py-10 overflow-hidden overscroll-none font-[Kanit]">
      <div className="max-w-[850px] w-full p-6 border  border-gray-300 rounded-xl shadow-md bg-white ">
        <div className="rounded-xl">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between  relative">
            {/* Centered title */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <h1 className="text-[26px] md:text-[26px] font-semibold text-[#66009F]">
                หนังสือมอบอำนาจ
              </h1>
            </div>

            {/* Back button aligned right */}
            <div className="ml-auto">
              <BackB />
            </div>
          </div>

          {/* <div className="w-full"> */}
            <div className=" rounded-lg p-2 bg-[#E0E5F936] flex items-center justify-center w-fit mx-auto">
              <p className="text-md text-[#808080]">
                เลขที่คำขอ : {docId}
              </p>
            {/* </div> */}
          </div>



          <div className="p-2">
            {/* Section title */}
            <div className="mb-4">
              
              <hr className="mt-3 border-gray-200" />
            </div>

            {/* สถานะ */}
            {/* {statusName && (
              <div className="mb-4 text-[14px] text-gray-700">
                สถานะปัจจุบัน: <strong>{statusName}</strong>
              </div>
            )} */}

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
                <label className="mb-1 block text-[15px] ">
                  <span className="font-medium">
                    1. เรื่อง มอบอำนาจการดำเนินงานที่เกี่ยวข้องกับ
                  </span>
                </label>
                <input
                  type="text"
                  value={title}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5 "
                />
              </div>

              {/* 2 */}
              <div>
                <label className="mb-1 block text-[15px]">
                  <span className="font-medium">2. ผู้รับมอบอำนาจ</span>
                </label>
                <input
                  type="text"
                  value={authorizeTo}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5"
                />
              </div>

              {/* 3 */}
              <div>
                <label className="mb-1 block text-[15px] ">
                  <span className="font-medium">3. ตำแหน่ง</span>
                </label>
                <input
                  type="text"
                  value={position}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5"
                />
              </div>

              {/* 4 */}
              <div>
                <label className="mb-1 block text-[15px]">
                  <span className="font-medium">4. สังกัด</span>
                </label>
                <input
                  type="text"
                  value={affiliation}
                  readOnly
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5 "
                />
              </div>

              {/* 5 */}
              <div>
                <label className="mb-1 block text-[15px]">
                  <span className="font-medium">
                    5. ขอรับมอบหมายให้ดำเนินการในเรื่องใด
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={authorizeText}
                  readOnly
                  aria-readonly="true"
                  className="w-full resize-y rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5 "
                />
              </div>

              {/* 6 */}
              <div>
                <label className="mb-1 block text-[15px]">
                  <span className="font-medium">
                    6. หน่วยงานปลายทาง
                  </span>
                </label>
                <input
                  readOnly
                  value={destination}
                  type="text"
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5"
                />
              </div>
              {/* 7 */}
              <div>
                <label className="mb-1 block text-[15px]">
                  <span className="font-medium">
                    7. เลขลำดับเอกสาร
                  </span>
                </label>
                <input
                  readOnly
                  value={docId}
                  type="text"
                  aria-readonly="true"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5 "
                />
              </div>

              {/* 8 file attachment */}
              {/* 8 file attachment */}
              <div>
                <label className="mb-1 block text-[15px]">
                  <span className="font-medium">8. เอกสารเพิ่มเติม</span>
                </label>

                {attachments.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5">
                    ไม่มีไฟล์แนบเอกสารเพิ่มเติม
                  </div>
                ) : (
                  <ul className="space-y-2">
                {attachments.map((att) => {
                  const name = att.file_name || att.file_path?.split("/").pop() || "download";
                  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(name);
                  const isPdf   = /\.pdf$/i.test(name);
                  const isDoc   = /\.(docx?|xlsx?)$/i.test(name);

                  return (
                    <li
                      key={att.id}
                      className="flex items-center justify-between rounded-lg bg-[#F7F7F7] border border-gray-200 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {/* ไอคอน IMG/PDF/DOC */}
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-gray-700 text-xs">
                          {isImage ? "IMG" : isPdf ? "PDF" : isDoc ? "DOC" : "FILE"}
                        </span>

                        {/* ชื่อไฟล์ + คำอธิบาย */}
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-800">{name}</span>
                          <p className="text-xs text-gray-500 mt-[2px]">
                            {att.attachmentType?.type_name === "UserUpload" && "เอกสารที่ผู้ใช้แนบ"}
                            {att.attachmentType?.type_name === "SignedDocument" && "เอกสารที่อธิการบดีลงนามแล้ว"}
                            {att.attachmentType?.type_name === "AuditorUpload" && "เอกสารที่ผู้ตรวจสอบแนบเพิ่มเติม"}
                            {att.attachmentType?.type_name === "GenerateDocument" && "เอกสารคำร้องที่ระบบสร้าง"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => downloadAttachment(att, token)}
                        className="rounded-md bg-[#66009F] px-3 py-1.5 text-white text-sm hover:opacity-90"
                      >
                        ดาวน์โหลด
                      </button>


                    </li>
                  );
                })}
              </ul>

                )}
              </div>
                {/* 9 order_number */}
                {order_n && (
                  <div className="mt-2">
                    <label className="mb-1 block text-[15px]">
                      <span className="font-medium">9. เลขที่คำสั่ง (Order Number)</span>
                    </label>
                    <input
                      readOnly
                      value={order_n}
                      type="text"
                      className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5 "
                    />
                  </div>
                )}

            </div>

            
          </div>
        </div>
        <div className="h-6" />

      </div>
    </div>
  );
}

export default ViewPetition;
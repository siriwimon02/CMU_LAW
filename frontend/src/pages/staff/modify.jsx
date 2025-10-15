import React, { useEffect, useState, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/docIcon";
import BackB from "../../components/backButton";

const ALLOW_STATUS = "ส่งคืนแก้ไขเอกสาร"; // only this status can edit

function Modify() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [statusName, setStatusName] = useState("");

  // form fields
  const [title, setTitle] = useState("");
  const [authorizeTo, setAuthorizeTo] = useState("");
  const [position, setPosition] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [authorizeText, setAuthorizeText] = useState("");

  // required docs flags (must be "true"/"false" strings when submitted)
  const [needPresidentCard, setNeedPresidentCard] = useState(false);
  const [needUniversityHouse, setNeedUniversityHouse] = useState(false);

  // optional: show destination dropdown but do NOT send it in this PUT
  const [destination,setDestination] = useState("");

  // uploads
  const [files, setFiles] = useState([]);
  const fileChange = (e) => setFiles(Array.from(e.target.files || []));
  const initialFlagsRef = useRef({ pres: false, house: false });

  // note that show what user need to edit
  const [note,setNote] = useState("");
  // keep a snapshot of initial text values to detect "only flags changed" case
  const initialRef = useRef({
    title: "",
    authorizeTo: "",
    position: "",
    affiliation: "",
    authorizeText: "",
  });

  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  // load document
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:3001/document/${id}`, {
          headers: { Authorization: `${token}` },
        });
        if (!res.ok) throw new Error(`Fetch doc failed: ${res.status}`);

        const data = await res.json();
        const doc = data.setdoc;

        const response = await fetch(`http://localhost:3001/history_statusForUser/${id}`,{
          headers: { Authorization: `${token}` },
        });
        const history = await response.json();

        const last = history[history.length - 1]; 
        setNote(last.note) // get only note of the last index


        if (!alive) return;

        // gate by status
        if (doc?.status_name !== ALLOW_STATUS) {
          setStatusName(doc?.status_name || "");
          navigate("/tracking", {
            replace: true,
            state: { msg: "เอกสารไม่อยู่ในสถานะที่อนุญาตให้แก้ไข" },
          });
          return;
        }
        setStatusName(doc?.status_name || "");

        // prefill text
        const t = doc.title ?? "";
        const aTo = doc.authorize_to ?? "";
        const pos = doc.position ?? "";
        const aff = doc.affiliation ?? "";
        const aTxt = doc.authorize_text ?? "";
        const des = doc.destination_name ?? "";

        setTitle(t);
        setAuthorizeTo(aTo);
        setPosition(pos);
        setAffiliation(aff);
        setAuthorizeText(aTxt);
        setDestination(des);

        // remember initial values
        initialRef.current = {
          title: t,
          authorizeTo: aTo,
          position: pos,
          affiliation: aff,
          authorizeText: aTxt,
        };

        // prefill flags from documentNeed[] using EXACT names your backend checks
        if (Array.isArray(doc.documentNeed)) {
          const hasPres = doc.documentNeed.some(
            (d) => d.requiredDocument?.name === "บัตรประจำตัวอธิการบดี"
          );
          const hasHouse = doc.documentNeed.some(
            (d) => d.requiredDocument?.name === "ทะเบียนบ้านมหาวิทยาลัย"
          );

          setNeedPresidentCard(hasPres);
          setNeedUniversityHouse(hasHouse);

          // ล็อกค่าเริ่มต้นไว้ ใช้ตัดสินใจว่าจะ disable หรือไม่
          initialFlagsRef.current = { pres: hasPres, house: hasHouse };
          }


        setError("");
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, token, navigate]);
  
  console.log(note)
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F6F7FB] font-[Kanit]">
        <div className="animate-pulse text-gray-500">Loading…</div>
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");
    setSending(true);

    try {
      // detect "only flags changed" (no text changed, no files)
      const init = initialRef.current;
      const textChanged =
        init.title !== title ||
        init.authorizeTo !== authorizeTo ||
        init.position !== position ||
        init.affiliation !== affiliation ||
        init.authorizeText !== authorizeText;

      if (!textChanged && files.length === 0) {
        // Backend returns 400 if only flags changed (it doesn't count as update/upload)
        // Warn user to edit at least one text field or attach a file.
        setSending(false);
        setError("โปรดแก้ไขข้อมูลอย่างน้อย 1 ช่อง หรือแนบไฟล์เพิ่มเติม (ระบบจะไม่บันทึกหากปรับเฉพาะตัวเลือกเอกสารประกอบ)");
        return;
      }

      const form = new FormData();
      if (title) form.append("title", title.trim());
      if (authorizeTo) form.append("authorizeTo", authorizeTo.trim());
      if (position) form.append("position", position.trim());
      if (affiliation) form.append("affiliation", affiliation.trim());
      if (authorizeText) form.append("authorizeText", authorizeText.trim());

      // IMPORTANT: booleans as strings
      form.append("needPresidentCard", String(needPresidentCard));
      form.append("needUniversityHouse", String(needUniversityHouse));

      // DO NOT append destinationId here (backend route doesn't accept it)

      files.forEach((f) => form.append("attachments", f));

      const res = await fetch(`http://localhost:3001/petition/edit/${id}`, {
        method: "PUT",
        headers: { Authorization: `${token}` }, // don't set Content-Type
        body: form,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Update failed: ${res.status}`);
      }

      setOkMsg(data?.message || "อัปเดตเอกสารสำเร็จ");
      setTimeout(() => navigate("/tracking"), 800);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFE] flex justify-center items-center px-4 py-10 overflow-hidden overscroll-none font-[Kanit]">
      <div className="max-w-[850px] w-full p-6 border  border-gray-300 rounded-xl shadow-md bg-white ">
        {/* <div className="mx-auto max-w-full"> */}
        <div className="rounded-xl">
          <div className="mb-2 flex items-center justify-between  relative">
            <div className="flex items-center gap-3">
              <Icon />
              <h1 className="text-[22px] md:text-[26px] font-semibold ">
                ยื่นคำขอมอบอำนาจ
              </h1>
            </div>
            <BackB />
          </div>

          <div className="p-2">
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#66009F]">
                  รายละเอียดหนังสือมอบอำนาจ
                </span>
              </div>
              <hr className="mt-3 border-gray-200" />
            </div>

            {/* show note */}
            <div className="mb-2 text-red-600 whitespace-pre-line break-words">
              <p>{note}</p>
            </div>


            {/* {statusName && (
              <div className="mb-4 text-[14px] text-gray-700">
                สถานะปัจจุบัน: <strong>{statusName}</strong>
              </div>
            )} */}

            {error && (
              <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}
            {okMsg && (
              <div className="mb-3 rounded-lg bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-200">
                {okMsg}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              {/* 1 */}
              <div>
                <label className="mb-1 block text-[15px] ">
                  <span className="font-medium">
                    1. เรื่อง มอบอำนาจการดำเนินงานที่เกี่ยวข้องกับ
                  </span>
                  <span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ชื่อโครงการ"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5"
                />
              </div>

              {/* 2 */}
              <div>
                <label className="mb-1 block text-[15px]">
                  <span className="font-medium">2. ผู้รับมอบอำนาจ</span>
                  <span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={authorizeTo}
                  onChange={(e) => setAuthorizeTo(e.target.value)}
                  placeholder="ชื่อ-สกุล ผู้รับมอบอำนาจ"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5"
                />
              </div>

              {/* 3 */}
              <div>
                <label className="mb-1 block text-[15px] ">
                  <span className="font-medium">3. ตำแหน่ง</span>
                  <span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="ตำแหน่งของผู้รับมอบอำนาจ"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5"
                />
              </div>

              {/* 4 */}
              <div>
                <label className="mb-1 block text-[15px]">
                  <span className="font-medium">4. สังกัด</span>
                  <span className="text-red-600"> *</span>
                </label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="หน่วยงาน/สังกัดของผู้รับมอบอำนาจ"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5"
                />
              </div>

              {/* 5 */}
              <div>
                <label className="mb-1 block text-[15px] ">
                  <span className="font-medium">
                    5. ขอรับมอบหมายให้ดำเนินการในเรื่องใด
                  </span>
                  <span className="text-red-600"> *</span>
                </label>
                <textarea
                  rows={6}
                  value={authorizeText}
                  onChange={(e) => setAuthorizeText(e.target.value)}
                  placeholder="รายละเอียดอำนาจหน้าที่ที่มอบให้"
                  className="w-full rounded-lg border border-gray-200 bg-[#F7F7F7] px-3 py-2.5"
                />
              </div>

              {/* 6 — show destination (read only) */}
              <div>
                <label className="mb-1 bloxk text-[15px]">
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

              {/* 7: doc requirements */}
              <div>
                <label className="mb-1 block text-[15px] ">
                  <span className="font-medium">7. เอกสารประกอบคำร้อง</span>
                </label>

                {/* สำเนาบัตรประจำตัวอธิการบดี */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={needPresidentCard}
                    disabled={initialFlagsRef.current.pres}   // ถ้าเริ่มต้นเป็น true ให้แก้ไม่ได้
                    onChange={(e) => {
                      if (initialFlagsRef.current.pres) return; // กัน double safety
                      setNeedPresidentCard(e.target.checked);
                    }}
                  />
                  <span>
                    สำเนาบัตรประจำตัวอธิการบดี
                    {initialFlagsRef.current.pres && (
                      <span className="ml-2 text-xs ">(แก้ไขไม่ได้)</span>
                    )}
                  </span>
                </label>

                {/* ทะเบียนบ้านมหาวิทยาลัย */}
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={needUniversityHouse}
                    disabled={initialFlagsRef.current.house}  // ถ้าเริ่มต้นเป็น true ให้แก้ไม่ได้
                    onChange={(e) => {
                      if (initialFlagsRef.current.house) return;
                      setNeedUniversityHouse(e.target.checked);
                    }}
                  />
                  <span>
                    ทะเบียนบ้านมหาวิทยาลัย
                    {initialFlagsRef.current.house && (
                      <span className="ml-2 text-xs ">(แก้ไขไม่ได้)</span>
                    )}
                  </span>
                </label>
              </div>


              {/* 8: uploads */}
              <div>
                <label className="mb-1 block text-[15px] font-medium">
                  8. แนบเอกสารเพิ่มเติม
                </label>
                <div className="rounded-xl border border-dashed border-[#E5E5E5] bg-[#F7F7F7] p-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-gray-200 hover:bg-gray-50">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={fileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                    </svg>
                    Select file
                  </label>
                  {files?.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">เลือกแล้ว {files.length} ไฟล์</div>
                  )}
                </div>
              </div>

              {/* submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={sending}
                  className={[
                    "mx-auto block w-full sm:w-auto rounded-xl bg-[#66009F] px-8 py-3 text-white shadow-lg transition",
                    sending ? "cursor-not-allowed opacity-70" : "hover:-translate-y-[1px] hover:shadow-xl",
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

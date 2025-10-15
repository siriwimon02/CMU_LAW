import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../../components/navbar";

function Tracking() {
  const token = localStorage.getItem("token");
  const [userInfo, setUserInfo] = useState(null);
  const [documentAll, setDocumentAll] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    async function getDocandUser() {
      try {
        const res1 = await fetch("http://localhost:3001/auth/user", {
          headers: { Authorization: `${token}` },
        });
        const user = await res1.json();

        const res2 = await fetch("http://localhost:3001/petition", {
          headers: { Authorization: `${token}` },
        });
        const docs = await res2.json();

        setUserInfo(user);
        setDocumentAll(Array.isArray(docs) ? docs : docs.data || []);
      } catch (e) {
        console.error(e);
        setDocumentAll([]);
      }
    }
    getDocandUser();
  }, [token]);

  // status colors
  const redList = [
  'ส่งคืนแก้ไขเอกสาร',
  'ส่งคืนแก้ไขเอกสารโดยหัวหน้างาน',
  'ส่งคืนแก้ไขเอกสารโดยผู้อำนวยการ',
  'ส่งกลับเพื่อแก้ไขก่อนเสนออธิการบดี',
  'อธิการบดีปฏิเสธคำร้อง',
  ];
  const greenList = [
    'รับเรื่องแล้ว',
    'ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง',
    'แก้ไขเอกสารเรียบร้อยแล้ว',
    'เจ้าหน้าที่ตรวจสอบแล้ว',
    'หัวหน้างานตรวจสอบแล้ว',
    'ผู้อำนวยการตรวจสอบแล้ว',
    'ตรวจสอบก่อนเสนออธิการบดีเสร็จสิ้น',
    'อธิการบดีอนุมัติแล้ว',
  ];
  const orangeList = [
    'รอรับเรื่อง',
    'อยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่',
    'อยู่ระหว่างตรวจสอบโดยหัวหน้างาน',
    'อยู่ระหว่างตรวจสอบโดยผู้อำนวยการ',
    'อยู่ระหว่างการตรวจสอบก่อนเสนออธิการบดี',
    'รอการพิจารณาอนุมัติจากอธิการบดี',
  ];

  const modifyList = [
  'ส่งคืนแก้ไขเอกสาร',
  // 'ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง',
  // 'ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย',
  // 'ส่งกลับเพื่อแก้ไขก่อนเสนออธิการบดี',
  // 'อธิการบดีปฏิเสธคำร้อง',
  ];
  // navigate
  const navigate = useNavigate();
  const ClicktoDashboard = () => navigate("/dashboard");
  const ClickForMoreDetail = (doc) => navigate(`/detailForUser/${doc.id}`);
  const ClickForViewPet = (doc) => navigate(`/view/${doc.id}`);
  const ClickForModify = (doc) => navigate(`/modify/${doc.id}`);

  // sort first
  const sortedDocs = useMemo(() => {
    const copy = [...documentAll];
    copy.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
    return copy;
  }, [documentAll, sortOrder]);

  // filter (เลขคำขอ + ชื่อเรื่อง)
  const filteredSortedDocs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sortedDocs;
    return sortedDocs.filter((doc) => {
      const no = `${doc.request_no ?? doc.doc_id ?? ""}`.toLowerCase();
      const title = `${doc.title ?? ""}`.toLowerCase();
      return no.includes(q) || title.includes(q);
    });
  }, [sortedDocs, searchTerm]);

  // --- Fancy Search Bar effects ---
  const searchRef = useRef(null);

  // "/" focuses search, "Esc" clears + blur
  useEffect(() => {
    const onKey = (e) => {
      // ignore when typing in an input/textarea/select
      const tag = document.activeElement?.tagName?.toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";

      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (document.activeElement === searchRef.current) {
          setSearchTerm("");
          searchRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8] overflow-x-hidden">
      <Navbar />

      {/* Main controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 w-full mx-6 mt-4">
        {/* SEARCH with effects */}
        <div className="relative group w-full max-w-md">
          <input
            ref={searchRef}
            type="text"
            placeholder="พิมพ์เพื่อค้นหาเลขที่เอกสาร หรือชื่อเรื่อง"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full h-12 pl-12 pr-12 rounded-lg border border-gray-300 text-sm
              bg-white
              transition-all duration-200 ease-out
              focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500
              shadow-sm focus:shadow-md
              placeholder:text-gray-400
            "
          />
          {/* search icon animates slightly on focus/typing */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`
              w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2
              text-[#66009F] transition-transform duration-200 ease-out
              ${searchTerm ? "translate-x-0.5" : "group-focus-within:translate-x-0.5"}
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>

          {/* clear button shows when typing */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100 transition"
              aria-label="ล้างข้อความค้นหา"
              title="ล้าง"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {/* SORT */}
        <div>
          <label className="sr-only">เอกสารล่าสุด</label>
          <div className="relative w-full max-w-xs">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="newest">เอกสารล่าสุด</option>
              <option value="oldest">เอกสารเก่าสุด</option>
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* LIST */}
      {filteredSortedDocs.length === 0 && (
        <p className="mx-6 mt-2 text-gray-500 animate-fade">
          ไม่พบผลลัพธ์สำหรับ “{searchTerm}”
        </p>
      )}

      {filteredSortedDocs.length > 0 &&
        filteredSortedDocs.map((doc) => {
          const created = doc.createdAt
            ? new Date(doc.createdAt).toLocaleString("th-TH", {
                timeZone: "Asia/Bangkok",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-";

          const isModifiable = modifyList.includes(doc.status_name);

          return (
            <article key={doc.id} className="rounded-lg bg-white shadow p-4 mx-6 my-2 transition hover:shadow-md">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-gray-800">
                  <p className="font-bold">
                    เลขที่คำขอ:{" "}
                    <span className="font-extrabold">{doc.request_no ?? doc.doc_id}</span>
                  </p>
                  <p>
                    ผู้ที่ยื่นคำขอ:{" "}
                    <span className="font-semibold">
                      {userInfo?.firstname} {userInfo?.lastname}
                    </span>
                  </p>

                  <p>
                    หน่วยงานปลายทาง:{" "}
                    <span className="font-medium">{doc.destination_name ?? "-"}</span>
                  </p>

                  <p className="truncate max-w-[650px]">
                    เรื่องที่ยื่น: <span className="font-medium">{doc.title ?? "-"}</span>
                  </p>

                  <p>วันที่ยื่นคำขอ: {created} </p>
                  <p
                    className={
                      greenList.includes(doc.status_name)
                        ? "text-emerald-600"
                        : orangeList.includes(doc.status_name)
                        ? "text-orange-600"
                        : redList.includes(doc.status_name)
                        ? "text-red-600"
                        : "text-red-600"
                    }
                  >
                    <span className="font-medium">{doc.status_name ?? "ไม่สามารถตรวจสอบได้"}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                  <button
                    onClick={() => ClickForMoreDetail(doc)}
                    className="inline-flex items-center gap-2 self-start rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
                  >
                    
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                      </svg>
                    
                    ดูรายละเอียด
                  </button>

                    {isModifiable && 
                  <button
                    onClick={() => ClickForModify(doc) }
                    className="inline-flex items-center gap-2 self-start rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50"
                  >
                    
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={20}
                        height={20}
                        viewBox="0 0 24 24"
                        className="text-black"
                      >
                        <path
                          fill="currentColor"
                          fillRule="evenodd"
                          d="M14.25 2.5a.25.25 0 0 0-.25-.25H7A2.75 2.75 0 0 0 4.25 5v14A2.75 2.75 0 0 0 7 21.75h10A2.75 2.75 0 0 0 19.75 19V9.147a.25.25 0 0 0-.25-.25H15a.75.75 0 0 1-.75-.75zm.75 9.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5zm0 4a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5z"
                          clipRule="evenodd"
                        ></path>
                        <path
                          fill="currentColor"
                          d="M15.75 2.824c0-.184.193-.301.336-.186q.182.147.323.342l3.013 4.197c.068.096-.006.22-.124.22H16a.25.25 0 0 1-.25-.25z"
                        ></path>
                      </svg>
                    
                    แก้ไขเอกสาร 
                  </button>
                  }
                  <button
                    onClick={() => ClickForViewPet(doc)}
                    className="bg-[#66009F] text-white px-4 py-2 rounded-md hover:bg-purple-900 text-sm flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      className="text-white"
                    >
                      <path
                        fill="currentColor"
                        d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"
                      />
                    </svg>
                    ดูเอกสาร
                  </button>
                </div>
              </div>
            </article>
          );
        })}
    </div>
  );
}

export default Tracking;

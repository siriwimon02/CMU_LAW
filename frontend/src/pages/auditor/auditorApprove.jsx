import { useEffect, useMemo, useState } from "react";
import Navbar from '../../components/navbar'
import { Navigate, useNavigate } from "react-router-dom"; // ✅ import useNavigate

function UploadDocumentApproved () {
    // ===== Auth token (ไม่ใส่ Bearer) =====
    const authHeader = (localStorage.getItem("token") || "").replace(/^"+|"+$/g, "").trim();
    if (!authHeader) return <Navigate to="/login" replace />;

    const [documentAll, setDocumentAll] = useState([]);
    const [historyApprove, setHistoryApprove] = useState([]);
    const [historyRejectDoc, setHistoryRejectDoc] = useState([]);

    const [filter, setFilter] = useState("รอการพิจารณา");
    const [query, setQuery]   = useState('');

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const navigate = useNavigate(); 

    //for pop up upload document
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedNeed, setSelectedNeed] = useState(null);

    // โหลด Database มา
    useEffect(() => {
        async function fetchData() {
        try {
            setRefreshing(true);
            const headers = { Authorization: authHeader };
            // Documents
            const resDocs = await fetch(
                "http://localhost:3001/petitionAudit/get_document_audited",
                { headers }
            );
            const docs = await resDocs.json();
            setDocumentAll(docs.document_json || []);

            // History Edit
            const resEdit = await fetch(
                "http://localhost:3001/petitionAudit/historyApprove",
                { headers }
            );
            const approve = await resEdit.json();
            setHistoryApprove(approve || []);

            // History Final Audited
            const resFinal = await fetch(
                "http://localhost:3001/petitionAudit/historyRejectDoc",
                { headers }
            );
            const rejects = await resFinal.json();
            setHistoryRejectDoc(rejects || []);
        } catch (err) {
            console.error("โหลดข้อมูลล้มเหลว", err);
        }
    }
        fetchData();
    }, []);




    // ✅ ฟังก์ชันรีเฟรช (พาเรนต์มีสิทธิ์อัปเดตสเตตของตัวเอง)
    const refreshDocuments = async () => {
        try {
          
          const headers = { Authorization: authHeader };

          const resDocs = await fetch("http://localhost:3001/petitionAudit/get_document_audited", { headers });
          const docs = await resDocs.json();
          setDocumentAll(docs.document_json || []);

          const resEdit = await fetch("http://localhost:3001/petitionAudit/historyApprove", { headers });
          const approve = await resEdit.json();
          setHistoryApprove(approve || []);

          const resFinal = await fetch("http://localhost:3001/petitionAudit/historyRejectDoc", { headers });
          const rejects = await resFinal.json();
          setHistoryRejectDoc(rejects || []);
        } catch (err) {
          console.error("โหลดข้อมูลล้มเหลว", err);
        } finally {
          setRefreshing(false);
        }
    };



    //console.log(documentAll);
    // console.log(historyApprove);
    // console.log(historyRejectDoc);

    function formatThaiDate(iso) {
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return iso ?? "";

            const datePart = d.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            });

            let timePart = d.toLocaleTimeString("th-TH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            });
            timePart = timePart.replace(/\s*น\.\s*$/u, "");

            return `${datePart} ${timePart} น.`;
        } catch {
            return iso ?? "";
        }
    }

    function formatThaiDateNotime(iso){
      try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return iso ?? "";
            const datePart = d.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            });
            return `${datePart}`;
        } catch {
            return iso ?? "";
        }

    }

    const normalize = (s) => (s || '')
    .toString()
    .toLowerCase()
    .replace(/[\s-]/g, ''); // ลบ space และ '-'

    const filteredDocs = useMemo(() => {
        const list = Array.isArray(documentAll) ? documentAll : [];
        const nq = normalize(query); // คำค้นที่ normalize แล้ว

        return list
            // ถ้าต้องกรองตามสถานะด้วย ก็ใส่ก่อน เช่น:
            // .filter(d => d.status_name === filter)
            .filter(d => normalize(d.doc_id).includes(nq))  // << ค้นหาแบบบางส่วน
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [documentAll, /* filter, */ query]);

    const filteredHisApprove = useMemo(() => {
        const list = Array.isArray(historyApprove) ? historyApprove : [];
        const nq = normalize(query); // คำค้นที่ normalize แล้ว

        return list
            // ถ้าต้องกรองตามสถานะด้วย ก็ใส่ก่อน เช่น:
            // .filter(d => d.status_name === filter)
            .filter(d => normalize(d.document.id_doc).includes(nq))  // << ค้นหาแบบบางส่วน
            .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
    }, [historyApprove, /* filter, */ query]);

    const filteredReject = useMemo(() => {
        const list = Array.isArray(historyRejectDoc) ? historyRejectDoc : [];
        const nq = normalize(query); // คำค้นที่ normalize แล้ว

        return list
            // ถ้าต้องกรองตามสถานะด้วย ก็ใส่ก่อน เช่น:
            // .filter(d => d.status_name === filter)
            .filter(d => normalize(d.document.id_doc).includes(nq))  // << ค้นหาแบบบางส่วน
            .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
    }, [historyRejectDoc, /* filter, */ query]);





//--------------------------------เอกสาร ที่ show ขึ้น---------------------------------------//
    function renderDocuments () {
        if (filter === "รอการพิจารณา") {
            if (filteredDocs.length === 0) {
                return (
                    <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">
                        <div className="mb-2 text-lg font-semibold">ไม่พบเอกสาร</div>
                    </div>
                );
            }
            return (
                <div className="space-y-4 mt-4">
                    {documentAll.length === 0 ? (
                        <p className="text-center text-gray-500 font-medium">
                        ยังไม่มีเอกสารที่รอการพิจารณา
                        </p>
                    ) : (
                        filteredDocs.map((doc) => {
                            const hasGenerated = !!doc.attachmentsByType?.GenerateDocument?.length;
                            return (
                                <div key={doc.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div className="flex-1 min-w-0 max-w-[800px]">
                                        <h3 className="font-bold text-xl text-gray-800 mb-2 break-words line-clamp-2">{doc.title}</h3>
                                        <p className="font-bold">
                                            เลขที่คำขอ :{" "}
                                            <span className="font-medium">{doc.doc_id}</span>
                                        </p>

                                        <p>
                                            ผู้ยื่นคำร้อง :{" "}
                                            <span className="font-medium">{doc.owneremail}</span>
                                        </p>

                                        <p>
                                            เจ้าหน้าที่ตรวจสอบ :{" "}
                                            <span className="font-medium">{doc.auditBy}</span>
                                        </p>

                                        <p>
                                            หัวหน้าตรวจสอบ :{" "}
                                            <span className="font-medium">{doc.headauditBy}</span>
                                        </p>

                                        <p>
                                            เอกสารประกอบคำร้อง :{" "}
                                            {doc.documentNeed && doc.documentNeed.length > 0 ? (
                                                doc.documentNeed.map((need, index) => (
                                                <span key={index} className="ml-2 font-medium text-gray-700">
                                                    {need.requiredDocument?.name}
                                                    {index < doc.documentNeed.length - 1 && ","}
                                                </span>
                                                ))
                                            ) : (
                                                <span className="ml-2 text-gray-400">ไม่มีเอกสารแนบ</span>
                                            )}
                                        </p>

                                        <p> วันที่ยื่นคำร้อง : {formatThaiDate(doc.createdAt)}</p>

                                        <p>
                                            <span style={{ color: "#E48500" }} className="font-bold">
                                            {doc.status_name}
                                            </span>
                                        </p>
                                    </div>

                                    {/* ปุ่ม ฝั่งขวา */}
                                    <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                                        <button
                                            onClick={() => ClickForMoreDetail(doc.id)}
                                            className="border px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                                        >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <circle cx="11" cy="11" r="7" />
                                            <path d="M21 21l-4.3-4.3" />
                                        </svg>
                                            ดูรายละเอียด
                                        </button>
                                    
                                        <button className="bg-[#66009F] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-700"
                                          onClick={() => ClickForViewPet(doc.id) }>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                className="w-5 h-5"
                                                aria-hidden="true"
                                            >
                                                <path
                                                fill="currentColor"
                                                d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"
                                                />
                                            </svg>
                                            ดูเอกสาร
                                        </button>

                                        <button className="bg-[#16A34A] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700"
                                        onClick={() => ClickForApproveOrReject(doc.id, doc.documentNeed)}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                fillRule="evenodd"
                                                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                                                clipRule="evenodd"
                                                />
                                            </svg>
                                            อัปโหลดเอกสาร
                                        </button>


                                        {/* ปุ่ม Generate / Download ตามสถานะไฟล์ที่สร้างแล้ว */}
                                        {hasGenerated ? (
                                            <button className="bg-[#DE9631] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-[#c77814]"
                                              onClick={() => ClickToDownloadFileGenerate(doc.id)}>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="w-5 h-5"
                                                >
                                                    <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                                                    />
                                                </svg>
                                                ดาวน์โหลดไฟล์ที่สร้างแล้ว
                                            </button>
                                        ) : (
                                            <button className="bg-[#DE9631] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-[#c77814]"
                                               onClick={() => ClickToGeneratePDF(doc.id)} disabled={modalOpen && modalType==='loading'}>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="w-5 h-5"
                                                >
                                                    <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                                                    />
                                                </svg>
                                                Generate PDF & DOCX
                                            </button>
                                        )}

                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            );
        }


        if (filter === "ผ่านการอนุมัติ"){
            if (filteredHisApprove.length === 0) {
                return (
                    <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">
                        <div className="mb-2 text-lg font-semibold">ไม่พบเอกสาร</div>
                    </div>
                );
            }
            return (
                <div className="space-y-4 mt-4">
                    {historyApprove.length === 0 ? (
                        <p className="text-center text-gray-500 font-medium">
                            ยังไม่มีเอกสารที่ผ่านการอนุมัติคำร้อง
                        </p>
                    ) : (
                        filteredHisApprove.map((h) => (
                            <div key={h.document.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div className="flex-1 min-w-0 max-w-[800px]">
                                    <h3 className="font-bold text-xl text-gray-800 mb-2 break-words line-clamp-2">{h.document.title}</h3>
                                    
                                    <p className="font-bold">
                                        เลขที่คำขอ :{" "}
                                        <span className="font-medium">{h.document.id_doc}</span>
                                    </p>
                                    
                                    <p>
                                        ผู้ยื่นคำร้อง :{" "}
                                        <span className="font-medium">{h.document.user.email}</span>
                                    </p>                                    
                                    
                                    <p> 
                                        หน่วยงานที่ยื่นคำร้อง : {" "}
                                        <span className="font-medium">{h.document.department.department_name}</span>
                                    </p>

                                    <p>
                                        เจ้าหน้าที่ตรวจสอบ :{" "}
                                        <span className="font-medium">{h.document.auditBy.email}</span>
                                    </p>

                                    <p>
                                        หัวหน้าตรวจสอบ :{" "}
                                        <span className="font-medium">{h.document.headauditBy.email}</span>
                                    </p>

                                    <p> วันที่ยื่นคำร้อง : {formatThaiDateNotime(h.document.date_of_signing)}</p>

                                    <p> วันที่อนุมัติคำร้อง : {formatThaiDate(h.changedAt)} </p>

                                    <p>
                                        <span style={{ color: "#05A967" }} className="font-bold">
                                        {h.status.status}
                                        </span>
                                    </p>

                                </div>

                                {/* ปุ่ม ฝั่งขวา */}
                                <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                                    <button
                                        onClick={() => ClickForMoreDetail(h.document.id)}
                                        className="border px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                                    >
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle cx="11" cy="11" r="7" />
                                        <path d="M21 21l-4.3-4.3" />
                                    </svg>
                                        ดูรายละเอียด
                                    </button>
                                
                                    <button className="bg-[#66009F] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-700"
                                      onClick={() => ClickForViewPet(h.document.id) }>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="w-5 h-5"
                                            aria-hidden="true"
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
                        ))
                    )}
                </div>
            );
        }

        if (filter === "ไม่ผ่านการอนุมัติ"){
            if (filteredReject.length === 0) {
                return (
                    <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">
                        <div className="mb-2 text-lg font-semibold">ไม่พบเอกสาร</div>
                    </div>
                );
            }
            return (
                <div className="space-y-4 mt-4">
                    {historyRejectDoc.length === 0 ? (
                        <p className="text-center text-gray-500 font-medium">
                            ยังไม่มีเอกสารที่ถูกปฏิเสธคำร้อง
                        </p>
                    ) : (
                        filteredReject.map((h) => (
                            <div key={h.document.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div className="flex-1 min-w-0 max-w-[800px]">
                                    <h3 className="font-bold text-xl text-gray-800 mb-2 break-words line-clamp-2">{h.document.title}</h3>
                                    
                                    <p className="font-bold">
                                        เลขที่คำขอ :{" "}
                                        <span className="font-medium">{h.document.id_doc}</span>
                                    </p>
                                    
                                    <p>
                                        ผู้ยื่นคำร้อง :{" "}
                                        <span className="font-medium">{h.document.user.email}</span>
                                    </p>                                    
                                    
                                    <p> 
                                        หน่วยงานที่ยื่นคำร้อง : {" "}
                                        <span className="font-medium">{h.document.department.department_name}</span>
                                    </p>

                                    <p>
                                        เจ้าหน้าที่ตรวจสอบ :{" "}
                                        <span className="font-medium">{h.document.auditBy.email}</span>
                                    </p>

                                    <p>
                                        หัวหน้าตรวจสอบ :{" "}
                                        <span className="font-medium">{h.document.headauditBy.email}</span>
                                    </p>

                                    <p> วันที่ยื่นคำร้อง : {formatThaiDate(h.document.createdAt)}</p>

                                    <p> วันที่ปฏิเสธคำร้อง : {formatThaiDate(h.changedAt)} </p>

                                    <p>
                                        <span style={{ color: "#CD0000" }} className="font-bold">
                                        {h.status.status}
                                        </span>
                                    </p>
                                </div>

                                {/* ปุ่ม ฝั่งขวา */}
                                <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                                    <button
                                        onClick={() => ClickForMoreDetail(h.document.id)}
                                        className="border px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                                    >
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle cx="11" cy="11" r="7" />
                                        <path d="M21 21l-4.3-4.3" />
                                    </svg>
                                        ดูรายละเอียด
                                    </button>

                                    <button className="bg-[#66009F] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-700"
                                      onClick={() => ClickForViewPet(h.document.id) }>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="w-5 h-5"
                                            aria-hidden="true"
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
                        ))
                    )}
                </div>
            );
        }
    }

  //--------------------------------เอกสาร ที่ show ขึ้น---------------------------------------//




  //------------------------------------generate file-------------------------------------//

  // ===== ModalLoader.jsx (จะวางในไฟล์เดียวกับหน้าเดิมก็ได้) =====
  function ModalLoader({ open, type = "loading", title, onClose }) {
    if (!open) return null;

    const isLoading = type === "loading";
    const isSuccess = type === "success";
    const isError   = type === "error";

    return (
      <div style={backdrop}>
        <div style={card}>
          {isLoading && <div style={spinner} />}
          {isSuccess && <div style={{...icon, borderColor:'#16a34a'}} />}
          {isError   && <div style={{...icon, borderColor:'#dc2626'}} />}

          <div style={{ marginTop: 12, fontSize: 16, textAlign: 'center' }}>
            {title}
          </div>
          {!isLoading && (
            <button style={btn} onClick={onClose}>ปิด</button>
          )}
        </div>
      </div>
    );
  }

  // ===== styles (inline ง่าย ๆ) =====
  const backdrop = {
    position:'fixed', inset:0, background:'rgba(0,0,0,.35)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
  };
  const card = {
    width: 320, minHeight: 160, background:'#fff', borderRadius:12,
    boxShadow:'0 10px 30px rgba(0,0,0,.2)', padding:'24px 20px',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'
  };
  const btn = {
    marginTop:16, padding:'8px 14px', borderRadius:8, border:'1px solid #e5e7eb',
    background:'#111827', color:'#fff', cursor:'pointer'
  };
  const spinner = {
    width: 42, height: 42, border:'4px solid #e5e7eb', borderTopColor:'#2563eb',
    borderRadius:'50%', animation:'spin 1s linear infinite'
  };
  const icon = {
    width: 32, height: 32, border:'6px solid', borderRadius:'50%'
  };

  // ใส่ keyframes ให้หมุน (ใส่ไว้ครั้งเดียวในแอป—ถ้ายังไม่มี)
  // คุณสามารถย้ายไปไว้ใน CSS global ก็ได้
  const styleEl = typeof document !== 'undefined' && document.createElement('style');
  if (styleEl && !document.getElementById('modal-loader-kf')) {
    styleEl.id = 'modal-loader-kf';
    styleEl.innerHTML = `@keyframes spin{to{transform:rotate(360deg)}}`;
    document.head.appendChild(styleEl);
  }

  // state สำหรับ modal
  const [modalOpen1, setModalOpen1] = useState(false);
  const [modalType, setModalType] = useState("loading"); // loading | success | error
  const [modalText, setModalText] = useState("");


  const ClickToGeneratePDF = async (id) => {
    setLoading(true);
    // เปิดป๊อปอัพสถานะกำลังทำงาน
    setModalType("loading");
    setModalText("กำลังสร้างไฟล์ PDF…");
    setModalOpen1(true);
    try {
      const res = await fetch(
        `http://localhost:3001/petitionAudit/generate_pdf/${id}`,
        {
          method : "POST",
          headers : {Authorization: authHeader}
        }
      )
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModalType("error");
        setModalText(data.message || `ส่งคำร้องไม่สำเร็จ (HTTP ${res.status})`);
        return; // ให้ผู้ใช้กดปิดเอง
      }

      // สำเร็จ
      setModalType("success");
      setModalText(data.message || "สร้างไฟล์สำเร็จ!");

      // ปิดอัตโนมัติหลัง 1.2 วิ (ปรับตามชอบ)
      await refreshDocuments();
      setTimeout(() => setModalOpen1(false), 500);     

    } catch (err) {
      console.error(err);
      alert("Server error: ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };



  //------------------------------------generate file-------------------------------------//

  // ดึงชื่อไฟล์จาก Content-Disposition
  function getFilenameFromDisposition(disposition = "") {
    // ตัวอย่าง: attachment; filename="12345.pdf"
    const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(disposition);
    if (!m) return null;
    try {
      return decodeURIComponent(m[1].replace(/\"/g, ''));
    } catch {
      return m[1].replace(/\"/g, '');
    }
  }

  // สร้างลิงก์ดาวน์โหลดจาก Blob แล้วคลิก
  async function downloadByFetch(url, token) {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: token },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const filename = getFilenameFromDisposition(cd) || url.split("/").pop() || "download";

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  }


  //download file aready to approve
  const ClickToDownloadFileGenerate = async (id) => {
    setLoading(true);
    try {
      // โหลดทีละไฟล์ เพื่อหลีกเลี่ยงบางเบราว์เซอร์บล็อกหลายดาวน์โหลดพร้อมกัน
      await downloadByFetch(`http://localhost:3001/petitionAudit/download_docx_generate/${id}`, authHeader);
      await downloadByFetch(`http://localhost:3001/petitionAudit/download_pdf_generate/${id}`, authHeader);

    } catch (err) {
      console.error(err);
      alert("ดาวน์โหลดไม่สำเร็จ: " + err.message);
    } finally {
      setLoading(false);
    }
  };


  const ClickForViewPet = (id) => {
      navigate(`/view/${id}`);
  }



  //-------------------------------action ปุ่ม-----------------------------------//
  const ClickForMoreDetail = (id) => {
      navigate(`/detail/${id}`); // ✅ ใช้ navigate
  };


  //------------------------------Pop up อัปโหลดเอกสาร--------------------------//
  const ClickForApproveOrReject = (id, documentNeed) => {
      setSelectedId(id);
      setSelectedNeed(documentNeed);
      setModalOpen(true);
  };

    return (        
        <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
            <Navbar />
             <div className="flex gap-3 mt-4 ml-5">

                <button
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg border shadow-md transition
                        ${filter === "รอการพิจารณา"
                        ? "bg-purple-50 border-purple-500 shadow-lg"
                        : "bg-white border-gray-300 hover:shadow-lg"}`}
                    onClick={() => setFilter("รอการพิจารณา")}>
    
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-6 text-[#66009F]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                    <span className="font-bold text-black">เอกสารรอการพิจารณา</span>
                </button>


                <button className={`flex items-center gap-2 px-5 py-3 rounded-lg border shadow-md transition 
                    ${filter === "ผ่านการอนุมัติ" 
                        ? "bg-purple-50 border-purple-500 shadow-lg" 
                        : "bg-white border-gray-300 hover:shadow-lg"}`}
                    onClick={() => setFilter("ผ่านการอนุมัติ")}>
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#66009F] text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
                    </svg>
                    </span>
                    <span className="font-bold text-black">เอกสารผ่านการอนุมัติ</span>
                </button>


                <button className={`flex items-center gap-2 px-5 py-3 rounded-lg border shadow-md transition 
                    ${filter === "ไม่ผ่านการอนุมัติ" 
                        ? "bg-purple-50 border-purple-500 shadow-lg" 
                        : "bg-white border-gray-300 hover:shadow-lg"}`}
                    onClick={() => setFilter("ไม่ผ่านการอนุมัติ")}>
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#66009F] text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    </span>
                    <span className="font-bold text-black">เอกสารไม่ผ่านการอนุมัติ</span>
                </button>


                <div className="relative inline-block">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="พิมพ์เพื่อค้นหาเลขที่เอกสาร"
                        className="w-190 border-2 border-purple-500 text-gray-700 rounded-lg px-12 py-3 
                                    focus:outline-none focus:ring-purple-500 bg-white"
                    />
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#66009F]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 absolute left-2 top-1/2 -translate-y-1/2 text-[#66009F]"
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
                    </span>
                </div>
             </div>

            <div className="p-4 grid gap-4">{renderDocuments()}</div>

            <DecisionModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                docId={selectedId}
                authHeader={authHeader}
                onDone={async () => {
                    setModalOpen(false);
                    await refreshDocuments();
                }}
            />

            <ModalLoader
              open={modalOpen1}
              type={modalType}
              title={modalText}
              onClose={async () => {
                setModalOpen1(false);
                await refreshDocuments();
              }}
            />
        </div>
    )
}
export default UploadDocumentApproved





















/** Modal สำหรับเลือก Approve/Reject ภายใน แล้วค่อยยืนยัน */
function DecisionModal({ open, onClose, docId, authHeader, onDone }) {
  const [choice, setChoice] = useState("approve"); // "approve" | "reject"
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const [order_number, setOrder_Number] = useState("");
  const [date_of_signing, setDate_of_signing] = useState("");

  const [attachments, setAttachments] = useState([]);
  const [endorsorfile, setEndorsorfile] = useState([]);

  const [uploadPresidentCard, setUploadPresidentCard] = useState(false);
  const [uploadUniversityHouse, setUploadUniversityHouse] = useState(false);

  const [fileError, setFileError] = useState("");
  const [fileErrorApprove, setFileErrorApprove] = useState("");

  const MAX_FILES = 3;

  if (!open) return null;

  const isApprove = choice === "approve";
  const title = "ยืนยันการดำเนินการ";
  const desc = "กรุณาเลือกว่าจะอนุมัติหรือปฏิเสธเอกสาร จากนั้นกด 'ยืนยัน' เพื่อดำเนินการ";

  const resetForm = () => {
    setChoice("approve");
    setNote("");
    setOrder_Number("");
    setDate_of_signing("");
    setAttachments([]);
    setEndorsorfile([]);
    setUploadPresidentCard(false);
    setUploadUniversityHouse(false);
    setFileError("");
    setFileErrorApprove("");
  };

  const addFiles = (current, setCurrent, setErr) => (e) => {
    const picked = Array.from(e.target.files || []);
    const spaceLeft = Math.max(0, MAX_FILES - current.length);
    const willAdd = picked.slice(0, spaceLeft);
    const combined = [...current, ...willAdd];
    setCurrent(combined);

    if (picked.length > willAdd.length) {
      setErr(`ไม่สามารถแนบไฟล์เกิน ${MAX_FILES} ไฟล์ได้`);
      setTimeout(() => setErr(""), 2500);
    } else {
      setErr("");
    }
    e.target.value = "";
  };

  const removeAt = (setCurrent) => (idx) =>
    setCurrent((prev) => prev.filter((_, i) => i !== idx));

  const handleConfirm = async () => {
    // ถ้า Reject ต้องมีเหตุผล
    //console.log(isApprove);
    if (!isApprove && !note.trim()) {
      alert("โปรดระบุเหตุผลการปฏิเสธ");
      return;
    }
    // ถ้า Approve ต้องมีวันที่ลงนาม
    if (isApprove && !date_of_signing) {
      alert("โปรดเลือกวันที่ลงนาม");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (isApprove) {
        formData.append("decision", "approve");
        formData.append("order_number", order_number)
        formData.append("date_of_signing", date_of_signing); // YYYY-MM-DD
        formData.append("uploadPresidentCard", uploadPresidentCard ? "true" : "false");
        formData.append("uploadUniversityHouse", uploadUniversityHouse ? "true" : "false");

        attachments.forEach((file) => formData.append("attachments", file));
        // ✅ แนบ endorsorfile ให้ถูกต้อง
        endorsorfile.forEach((file) => formData.append("endorsorfile", file));

        const res = await fetch(
          `http://localhost:3001/petitionAudit/upload_endorser_document/${docId}`,
          {
            method: "PUT",
            headers: { Authorization: authHeader }, // อย่าตั้ง Content-Type เอง
            body: formData,
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.message || `ส่งคำร้องไม่สำเร็จ (HTTP ${res.status})`);
          return;
        }
        alert(data.message || "บันทึกและส่งหนังสือมอบอำนาจสำเร็จ");
        resetForm();
        await onDone?.();
      } else {
        // Reject
        const formReject = new FormData();

        formReject.append("decision", "reject");
        formReject.append("text_suggesttion", note.trim());

        console.log(formReject)

        const res = await fetch(
          `http://localhost:3001/petitionAudit/upload_endorser_document/${docId}`,
          {
            method: "PUT",
            headers: { Authorization: authHeader },
            body: formReject,
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.message || `ส่งคำร้องไม่สำเร็จ (HTTP ${res.status})`);
          return;
        }
        alert(data.message || "บันทึกเหตุผลการปฏิเสธสำเร็จ");
        resetForm();
        await onDone?.();
      }
    } catch (err) {
      console.error(err);
      alert("Server error: ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  const atLimitA = attachments.length >= MAX_FILES;
  const atLimitB = endorsorfile.length >= MAX_FILES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (loading) return;
          resetForm();
          onClose();
        }}
        aria-label="Backdrop"
        disabled={loading}
      />

      {/* card */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={() => {
              if (loading) return;
              resetForm();
              onClose();
            }}
            className="rounded p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-gray-600">{desc}</p>

        {/* ตัวเลือก Approve / Reject */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setChoice("approve")}
            className={`rounded-lg border px-4 py-3 font-medium ${
              isApprove ? "border-green-600 text-green-700 bg-green-50" : "hover:bg-gray-50"
            }`}
            disabled={loading}
          >
            อนุมัติ
          </button>

          <button
            type="button"
            onClick={() => setChoice("reject")}
            className={`rounded-lg border px-4 py-3 font-medium ${
              !isApprove ? "border-red-600 text-red-700 bg-red-50" : "hover:bg-gray-50"
            }`}
            disabled={loading}
          >
            ปฏิเสธ
          </button>
        </div>

        {/* วันที่ลงนาม: แสดงเฉพาะตอนอนุมัติ */}
        {isApprove && (
          <label className="block mt-4">

            <span className="block text-sm font-medium text-gray-700 mt-2">เลขที่คำสั่ง</span>
            <input
              id="order_number"
              name="order_number"
              type="text"
              value={order_number}
              placeholder="เช่น กรุณากรอกเลขที่คำสั่ง"
              onChange={(e) => setOrder_Number(e.target.value)}
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />

            <span className="block text-sm font-medium text-gray-700 mt-2">วันที่ลงนาม</span>
            <input
              type="date"
              value={date_of_signing}
              onChange={(e) => setDate_of_signing(e.target.value)} // YYYY-MM-DD
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </label>
        )}

        {/* หมายเหตุ (แสดงเมื่อปฏิเสธ) */}
        {!isApprove && (
          <>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              เหตุผลการปฏิเสธ <span className="text-red-500">*</span>
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="กรอกเหตุผล..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
            />
          </>
        )}

        {/* อัปโหลดเอกสาร (เฉพาะตอนอนุมัติ) */}
        {isApprove && (
          <div className="text-sm leading-5">
            <h4 className="mt-2 mb-1 font-semibold">เอกสารประกอบคำร้อง</h4>
            <div className="space-y-1">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={uploadPresidentCard}
                  onChange={(e) => setUploadPresidentCard(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-gray-800">สำเนาบัตรประจำตัวอธิการบดี (บัตรประจำตัวพนักงาน)</span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={uploadUniversityHouse}
                  onChange={(e) => setUploadUniversityHouse(e.target.checked)}
                  disabled={loading}
                />
                <span className="text-gray-800">สำเนาทะเบียนบ้านมหาวิทยาลัยเชียงใหม่</span>
              </label>
            </div>

            {/* แนบเอกสารประกอบคำร้อง */}
            <h4 className="mt-3 mb-1 font-semibold">แนบเอกสารประกอบคำร้อง</h4>
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-600">รองรับ: .pdf .jpg .png .doc .docx .xls .xlsx</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {attachments.length}/{MAX_FILES}
                </span>
              </div>

              <input
                type="file"
                multiple
                onChange={addFiles(attachments, setAttachments, setFileError)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                disabled={loading || attachments.length >= MAX_FILES}
                className="block w-full text-xs file:mr-2 file:rounded file:border file:border-gray-300 file:bg-white file:px-2 file:py-1 file:text-xs hover:file:bg-gray-50 disabled:opacity-60"
              />

              {attachments.length > 0 && (
                <ul className="mt-2 max-h-36 overflow-auto space-y-1 pr-1">
                  {attachments.map((f, idx) => (
                    <li key={`${f.name}-${idx}`} className="flex items-center gap-2 rounded border px-2 py-1">
                      <span className="truncate text-xs">
                        {f.name} ({Math.ceil(f.size / 1024)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAt(setAttachments)(idx)}
                        className="ml-auto rounded bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200"
                        title="ลบไฟล์นี้"
                        disabled={loading}
                      >
                        ลบ
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {fileError && <div className="mt-1 text-xs text-red-600">{fileError}</div>}
              {attachments.length >= MAX_FILES && (
                <div className="mt-1 text-xs text-orange-600">ครบ {MAX_FILES} ไฟล์แล้ว</div>
              )}
            </div>

            {/* แนบเอกสารที่อธิการบดีอนุมัติแล้ว */}
            <h4 className="mt-3 mb-1 font-semibold">แนบเอกสารที่อธิการบดีอนุมัติเรียบร้อยแล้ว</h4>
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-600">รองรับ: .pdf .jpg .png .doc .docx .xls .xlsx</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {endorsorfile.length}/{MAX_FILES}
                </span>
              </div>

              <input
                type="file"
                multiple
                onChange={addFiles(endorsorfile, setEndorsorfile, setFileErrorApprove)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                disabled={loading || endorsorfile.length >= MAX_FILES}
                className="block w-full text-xs file:mr-2 file:rounded file:border file:border-gray-300 file:bg-white file:px-2 file:py-1 file:text-xs hover:file:bg-gray-50 disabled:opacity-60"
              />

              {endorsorfile.length > 0 && (
                <ul className="mt-2 max-h-36 overflow-auto space-y-1 pr-1">
                  {endorsorfile.map((f, idx) => (
                    <li key={`${f.name}-${idx}`} className="flex items-center gap-2 rounded border px-2 py-1">
                      <span className="truncate text-xs">
                        {f.name} ({Math.ceil(f.size / 1024)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAt(setEndorsorfile)(idx)}
                        className="ml-auto rounded bg-gray-100 px-2 py-0.5 text-xs hover:bg-gray-200"
                        title="ลบไฟล์นี้"
                        disabled={loading}
                      >
                        ลบ
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {fileErrorApprove && <div className="mt-1 text-xs text-red-600">{fileErrorApprove}</div>}
              {endorsorfile.length >= MAX_FILES && (
                <div className="mt-1 text-xs text-orange-600">ครบ {MAX_FILES} ไฟล์แล้ว</div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => {
              if (loading) return;
              resetForm();
              onClose();
            }}
            className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            ยกเลิก
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-white ${
              isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? "กำลังดำเนินการ..." : isApprove ? "ยืนยันอนุมัติ" : "ยืนยันปฏิเสธ"}
          </button>
        </div>
        
      </div>
    </div>
  );
}







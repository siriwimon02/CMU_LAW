import React, { useEffect, useState } from "react";
import Navbar from '../../components/navbar'
import { Navigate, useNavigate } from "react-router-dom"; // ✅ import useNavigate
import { useMemo } from "react";

function FinalAuditCheck() {
    // ===== Auth token =====
    const authHeader = (localStorage.getItem("token") || "").replace(/^"+|"+$/g, "").trim();
    if (!authHeader) return <Navigate to="/login" replace />;

    const [documentAll, setDocumentAll] = useState([]);
    const [historyEdit, setHistoryEdit] = useState([]);
    const [historyFinalAudited, setHistoryFinalAudited] = useState([]);
    const [filter, setFilter] = useState("เอกสารที่รอตรวจสอบ");
    const [query, setQuery]   = useState('');

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // ✅ ใช้ navigate

    //สำหรับยืนยันการตรวจสอบ
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmBusy, setConfirmBusy] = useState(false);
    const [pendingDoc, setPendingDoc] = useState(null);
    const [resultOpen, setResultOpen] = useState(false); 

    //สำหรับส่งกลับไปแก้ไข
    const [sendBackOpen, setSendBackOpen]   = useState(false);
    const [sendBackBusy, setSendBackBusy]   = useState(false);
    const [resultEditOpen, setResultEditOpen] = useState(false); 



    // โหลด Database มา
    useEffect(() => {
        async function fetchData() {
        try {
            const headers = { Authorization: authHeader };
            // Documents
            const resDocs = await fetch(
            "http://localhost:3001/petitionSuperAudit/wait_to_audit_bySpvAudit",
            { headers }
            );
            const docs = await resDocs.json();
            setDocumentAll(docs.document_json || []);

            // History Edit
            const resEdit = await fetch(
            "http://localhost:3001/petitionSuperAudit/history_send_back_edit_spvauditor",
            { headers }
            );
            const edits = await resEdit.json();
            setHistoryEdit(edits || []);

            // History Final Audited
            const resFinal = await fetch(
            "http://localhost:3001/petitionSuperAudit/history_final_audited",
            { headers }
            );
            const finals = await resFinal.json();
            setHistoryFinalAudited(finals || []);
        } catch (err) {
            console.error("โหลดข้อมูลล้มเหลว", err);
        }
        }

        fetchData();
    }, []);

    //console.log(historyFinalAudited);
    //console.log(documentAll)

    const refreshDocuments = async () => {
        try {
            const headers = { Authorization: authHeader };
            // Documents
            const resDocs = await fetch(
                "http://localhost:3001/petitionSuperAudit/wait_to_audit_bySpvAudit",
                { headers }
                );
            const docs = await resDocs.json();
            setDocumentAll(docs.document_json || []);

            // History Edit
            const resEdit = await fetch(
                "http://localhost:3001/petitionSuperAudit/history_send_back_edit_spvauditor",
                { headers }
                );
            const edits = await resEdit.json();
            setHistoryEdit(edits || []);

            // History Final Audited
            const resFinal = await fetch(
                "http://localhost:3001/petitionSuperAudit/history_final_audited",
                { headers }
                );
            const finals = await resFinal.json();
            setHistoryFinalAudited(finals || []);
        } catch (err){
            console.error("โหลดข้อมูลล้มเหลว", err);
        }
    }


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


    const ClickForMoreDetail = (id) => {
        navigate(`/detail/${id}`); // ✅ ใช้ navigate
    };

    const ClickForViewPet = (id) => {
        navigate(`/view/${id}`);
    }


    //-------------ค้นหาเลขที่คำขอ--------------------//

    // const filteredDocs = documentAll.filter(
    //     (doc) => 
    //         doc.doc_id.toLowerCase().includes(query.toLowerCase())
    // );
    // ตัวช่วย normalize: ตัดเว้นวรรค/ขีด และทำให้เป็น lower-case
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

    const filteredHisFinal = useMemo(() => {
        const list = Array.isArray(historyFinalAudited) ? historyFinalAudited : [];
        const nq = normalize(query); // คำค้นที่ normalize แล้ว

        return list
            // ถ้าต้องกรองตามสถานะด้วย ก็ใส่ก่อน เช่น:
            // .filter(d => d.status_name === filter)
            .filter(d => normalize(d.idformal).includes(nq))  // << ค้นหาแบบบางส่วน
            .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
    }, [historyFinalAudited, /* filter, */ query]);

    const filteredHisEdit = useMemo(() => {
        const list = Array.isArray(historyEdit) ? historyEdit : [];
        const nq = normalize(query); // คำค้นที่ normalize แล้ว

        return list
            // ถ้าต้องกรองตามสถานะด้วย ก็ใส่ก่อน เช่น:
            // .filter(d => d.status_name === filter)
            .filter(d => normalize(d.idformal).includes(nq))  // << ค้นหาแบบบางส่วน
            .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
    }, [historyEdit, /* filter, */ query]);

    


    // ✅ render documents ตาม filter
    function renderDocuments() {
        //console.log(documentAll, historyFinalAudited, historyEdit)
        if (filter === "เอกสารที่รอตรวจสอบ") {
            const list = Array.isArray(documentAll) ? documentAll : [];

            if (list.length === 0) {
                return (
                    <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">
                        <div className="mb-2 text-lg font-semibold">ไม่มีเอกสารที่รอตรวจสอบ</div>
                    </div>
                );
            }

            if (filteredDocs.length === 0) {
                return (
                    <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">
                        <div className="mb-2 text-lg font-semibold">ไม่พบเอกสาร</div>
                    </div>
                );
            }
            return (
                    <div className="space-y-4 mt-4 ml-10 mr-10">
                        {filteredDocs.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center"
                                    >
                                    {/* ฝั่งซ้าย */}
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
                                            หัวหน้าตรวจสอบ : {" "}
                                            <span className="font-medium">{doc.headauditBy}</span>
                                        </p>

                                        <p>
                                            วันที่ยื่นคำร้อง : {" "}
                                            {formatThaiDate(doc.createdAt)}
                                        </p>

                                        <p>
                                            <span style={{ color: "#E48500" }} className="font-bold">
                                            {doc.status_name}
                                            </span>
                                        </p>
                                    </div>

                                    
                                    {/* ฝั่งขวา: ปุ่ม */}
                                    <div className="flex gap-2 mt-3 md:mt-0">
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
                                        onClick={() => ClickForViewPet(doc.id)}>
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
                                            onClick={() => openConfirm({
                                            id: doc.id,
                                            title: doc.title,
                                            ownerEmail: doc.owneremail})}>
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
                                                ตรวจสอบ
                                        </button>

                                        <button className="bg-[#0073D9] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-[#0073D9]"
                                            onClick={() => openSendBackEdit({
                                                id: doc.id,
                                                title: doc.title,
                                                ownerEmail: doc.owneremail, // map ให้เป็น ownerEmail
                                            })}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-5 h-5 rotate-315"
                                        >
                                            <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                                            />
                                        </svg>
                                            ส่งกลับไปแก้ไข
                                        </button>
                                    </div>
                                </div>
                            ))}


                            {/* ======= Confirm Modal อยู่ไฟล์เดียวกัน ======= */}
                            <ConfirmModal
                                open={confirmOpen}
                                title="ยืนยันการตรวจสอบ"
                                submitting={confirmBusy}
                                onClose={() => {
                                    if (confirmBusy) return;     // กันปิดระหว่างกำลังยิง API
                                        setConfirmOpen(false);
                                        setPendingDoc(null);
                                    }}
                                onConfirm={() => pendingDoc && ClickForFinalAudit(pendingDoc.id)}
                            >
                            {pendingDoc && (
                                <div className="text-gray-700 space-y-2">
                                <div style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    wordBreak: "break-word" 
                                }}><span className="font-semibold">เรื่อง:</span> {pendingDoc.title}</div>
                                <div className="text-gray-600">
                                    <span className="font-medium font-semibold">ผู้ยื่นคำร้อง:</span> {pendingDoc.ownerEmail}
                                </div>
                                <div className="text-gray-600">
                                    <span className="font-medium font-semibold">ยืนยันว่าคุณได้ตรวจสอบเอกสารนี้เรียบร้อยแล้ว?</span>
                                </div>
                                </div>
                            )}
                            </ConfirmModal>

                            <ResultModal
                                open={resultOpen}
                                text="ตรวจสอบเรียบร้อยแล้ว"
                                duration={1000}             
                                onClose={() => setResultOpen(false)}
                            />

                            <SendBackToEditModal
                                open={sendBackOpen}
                                submitting={sendBackBusy}
                                onClose={() => {
                                    if (sendBackBusy) return;
                                    setSendBackOpen(false);
                                    setPendingDoc(null);
                                }}
                                onConfirm={handleSendBackConfirm}
                                >
                                {pendingDoc && (
                                    <div className="text-gray-700 space-y-2">
                                    <div style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        wordBreak: "break-word" 
                                    }}><span className="font-semibold">เรื่อง:</span> {pendingDoc.title}</div>
                                    <div className="text-gray-600">
                                        <span className="font-semibold">ผู้ยื่นคำร้อง:</span> {pendingDoc.ownerEmail}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        โปรดระบุเหตุผล/ส่วนที่ต้องแก้ไขให้ชัดเจน
                                    </div>
                                    </div>
                                )}
                            </SendBackToEditModal>

                            <ResultEditModal
                                open={resultEditOpen}
                                text="ส่งกลับเพื่อดำเนินการแก้ไข"
                                duration={1000}             
                                onClose={() => setResultEditOpen(false)}
                            />
                    </div>
            )
        }
        

        if (filter === "เอกสารที่ตรวจสอบเรียบร้อย") {
            const list = Array.isArray(historyFinalAudited) ? historyFinalAudited : [];
            if (list.length === 0) {
                return (
                    <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">
                        <div className="mb-2 text-lg font-semibold">ไม่มีเอกสารที่ตรวจสอบเรียบร้อยแล้ว</div>
                    </div>
                );
            }

            if (filteredHisFinal.length === 0) {
                return (
                    <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">
                        <div className="mb-2 text-lg font-semibold">ไม่พบเอกสาร</div>
                    </div>
                );
            }

            return (
                <div className="space-y-4 mt-4 ml-10 mr-10">
                {filteredHisFinal.map((item) => (
                    <div key={`final-${item.historyId}`} className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center">  
                        <div className="flex-1 min-w-0 max-w-[800px]">
                            {/* ข้อมูลฝั่งซ้าย */}
                            <h3 className="font-bold text-xl text-gray-800  break-words line-clamp-2">{item.doc_title}</h3>

                            <p>
                                <span style={{ color: "#05A967" }} className="font-bold">
                                {item.status}
                                </span>
                            </p>

                            <p className="font-bold">
                                เลขที่คำขอ :{" "}
                                <span className="font-medium">{item.idformal}</span>
                            </p>

                            <p>
                                ผู้ยื่นคำร้อง :{" "}
                                <span className="font-medium">
                                {item.ownername} ({item.owneremail})
                                </span>
                            </p>

                            <p>
                                เจ้าหน้าที่ตรวจสอบ :{" "}
                                <span className="font-medium">
                                {item.auditByname} ({item.auditByemail})
                                </span>
                            </p>

                            <p>
                                หัวหน้าที่ตรวจสอบ :{" "}
                                <span className="font-medium">
                                {item.headauditByname} ({item.headauditByemail})
                                </span>
                            </p>

                            <p>
                                วันที่ตรวจสอบ :{" "}
                                <span className="font-medium">
                                {formatThaiDate(item.changeAt)}
                                </span>
                            </p>

                            {item.note && (
                                <p className="text-gray-700">หมายเหตุ : {item.note}</p>
                            )}

                            <p className="text-gray-500">
                                สถานะปัจจุบัน : {item.doc_statusNow}
                            </p>


                        </div>

                        {/* ปุ่มฝั่งขวา */}
                        <div className="flex gap-2 mt-3 md:mt-0">
                            <button
                                onClick={() => ClickForMoreDetail(item.docId)}
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

                            <button
                                className="bg-[#66009F] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-700"
                                onClick={() => ClickForViewPet(item.docId)}>
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
                ))}
                </div>
            );
        }



        if (filter === "เอกสารที่ส่งกลับไปแก้ไข") {
            const list = Array.isArray(historyEdit) ? historyEdit : [];

            if (list.length === 0) {
                return (
                <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">
                    <div className="mb-2 text-lg font-semibold">ไม่มีเอกสารที่ส่งกลับไปแก้ไข</div>
                </div>
                );
            }

            if (filteredHisEdit.length === 0) {
                return (
                    <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-gray-600">
                        <div className="mb-2 text-lg font-semibold">ไม่พบเอกสาร</div>
                    </div>
                );
            }

            return (
                <div className="space-y-4 mt-4 ml-10 mr-10">
                {filteredHisEdit.map((edit) => (
                    <div key={edit.historyId} className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="flex-1 min-w-0 max-w-[800px]">
                            {/* ซ้าย */}
                            <h3 className="font-bold text-xl text-gray-800 break-words line-clamp-2">{edit.title}</h3>
                            <p>
                                <span style={{ color: "#0073D9" }} className="font-bold">
                                {edit.oldstatus}
                                </span>
                            </p>


                            <p className="font-bold">
                                เลขที่คำขอ :{" "}
                                <span className="font-medium">{edit.idformal}</span>
                            </p>

                            <p>
                                ผู้ยื่นคำร้อง :{" "}
                                <span className="font-medium">
                                {edit.ownername} ({edit.owneremail})
                                </span>
                            </p>

                            <p>
                                เจ้าหน้าที่ตรวจสอบ :{" "}
                                <span className="font-medium">
                                {edit.auditByname} ({edit.auditByemail})
                                </span>
                            </p>

                            <p>
                                หัวหน้าตรวจสอบ :{" "}
                                <span className="font-medium">
                                {edit.headauditByname} ({edit.headauditByemail})
                                </span>
                            </p>

                            <p>
                                วันที่ตรวจสอบ :{" "}
                                <span className="font-medium">{formatThaiDate(edit.editedAt)}</span>
                            </p>

                            <p className="break-words line-clamp-2" >หมายเหตุ: {edit.note_text}</p>

                            <p className="text-gray-500">
                                สถานะปัจจุบัน : {edit.nowstatus}
                            </p>
                        </div>

                            {/* ขวา */}
                        <div className="flex gap-2 md:mt-0">
                            <button
                                onClick={() => ClickForMoreDetail(edit.docId /* หรือ edit.documentId */)}
                                className="border px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-100"
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="7" />
                                <path d="M21 21l-4.3-4.3" />
                                </svg>
                                ดูรายละเอียด
                            </button>

                            <button
                                className="bg-[#66009F] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-700"
                                onClick={() => ClickForViewPet(edit.docId)} // หรือส่ง edit.docId ก็ได้ตามที่ฟังก์ชันต้องการ
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                                <path
                                    fill="currentColor"
                                    d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"
                                />
                                </svg>
                                ดูเอกสาร
                            </button>  
                        </div>
                    </div>
                ))}
                </div>
            );
        }

        return <p>ไม่พบข้อมูล</p>;
    }





















    //----------------------------------Pop up ยืนยันการตรวจสอบข้อมูล-------------------------------//
    const openConfirm = (payload) => {
        setPendingDoc({
            id: payload.id,
            title: payload.title,
            ownerEmail: payload.ownerEmail,
        });
        setConfirmOpen(true);
    };

    const ClickForFinalAudit = async (id) => {
        try {
            setConfirmBusy(true);
            const res = await fetch(
                `http://localhost:3001/petitionSuperAudit/update_st_audit_by_Spvaudit/${id}`,
                { method: "PUT", headers: { Authorization: authHeader } }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data.message || `ส่งคำร้องไม่สำเร็จ (HTTP ${res.status})`);
            return;
            }

            setConfirmOpen(false);
            // ปิดป๊อปยืนยัน เปิดป๊อปสำเร็จ
            setPendingDoc(null);
            await refreshDocuments();
            setResultOpen(true); 
            
        } catch (e) {
            console.error(e);
            alert("Server error: ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
        } finally {
            setConfirmBusy(false);
            setPendingDoc(null);
        }
    };


    function ConfirmModal({ 
        open, 
        title = "ยืนยันการทำรายการ",
        message = "ยืนยันว่าคุณได้ตรวจสอบเอกสารนี้เรียบร้อยแล้ว?",
        confirmText = "ยืนยัน",
        cancelText = "ยกเลิก",
        submitting = false,
        onConfirm,
        onClose,
        children,          // ถ้าอยากส่ง JSX เข้าไปแทน message
        }) {
        if (!open) return null;

        // กด Enter = confirm, Esc = close
        React.useEffect(() => {
            const onKey = (e) => {
            if (submitting) return;
            if (e.key === "Enter") onConfirm?.();
            if (e.key === "Escape") onClose?.();
            };
            window.addEventListener("keydown", onKey);
            return () => window.removeEventListener("keydown", onKey);
        }, [submitting, onConfirm, onClose]);

        return (
            <div className="fixed inset-0 z-50">
                <div
                    className="absolute inset-0 bg-black/40"
                    onClick={submitting ? undefined : onClose}
                />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between p-2 mt-4 mr-4 ml-4">
                            <h3 className="text-xl font-bold text-green-600">{title}</h3>
                            <button
                                className="text-gray-500 hover:text-black"
                                onClick={onClose}
                                disabled={submitting}
                                aria-label="close"
                                >
                                ✕
                            </button>
                        </div>

                        <div className="p-2 ml-4 mr-4">
                            {children ? (
                            children
                            ) : (
                            <p className="text-gray-700">{message}</p>
                            )}
                        </div>

                        <div className="p-4 ml-4 mr-4 flex justify-end gap-2">
                            <button
                            className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60"
                            onClick={onClose}
                            disabled={submitting}
                            >
                            {cancelText}
                            </button>
                            <button
                            className={`px-4 py-2 rounded-lg text-white disabled:opacity-60 ${
                                submitting ? "bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                            onClick={() => onConfirm?.()}
                            disabled={submitting}
                            >
                            {submitting ? "กำลังดำเนินการ…" : confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    function ResultModal({
        open,
        text = "ตรวจสอบเรียบร้อยแล้ว",
        duration = 1000,           // แสดงกี่ ms แล้วปิดเอง
        onClose,
        }) {
        React.useEffect(() => {
            if (!open) return;
            const t = setTimeout(() => onClose?.(), duration);
            return () => clearTimeout(t);
        }, [open, duration, onClose]);

        if (!open) return null;

        return (
            <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl px-10 py-15 text-center">
                    <h3 className="text-2xl md:text-3xl font-bold">{text}</h3>

                    <div className="mt-6 flex justify-center">
                        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                        <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        );
    }
    //----------------------------------Pop up ยืนยันการตรวจสอบข้อมูล-------------------------------//



















    //----------------------------------Pop up ส่งกลับไปแก้ไขเอกสาร----------------------------------//
    // เปิดโมดัล (เรียกจากปุ่ม “ส่งกลับไปแก้ไข”)
    const openSendBackEdit = (payload) => {
        setPendingDoc({
            id: payload.id,
            title: payload.title,
            ownerEmail: payload.ownerEmail, // ให้ชื่อคีย์คงที่
        });
        setSendBackOpen(true);
    };

    const handleSendBackConfirm = async (note) => {
        if (!pendingDoc) return;
        try {
            setSendBackBusy(true);

            const res = await fetch(
            `http://localhost:3001/petitionSuperAudit/edit_BySpvAuditor/${pendingDoc.id}`,
            {
                method: "PUT",
                headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
                },
                body: JSON.stringify({ text_edit_suggestion: note }),
            }
            );

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data.message || `ส่งกลับไม่สำเร็จ (HTTP ${res.status})`);
                return;
            }

            // ปิดโมดัล + รีเฟรช
            setSendBackOpen(false);
            setPendingDoc(null);
            await refreshDocuments();
            setResultEditOpen(true)

        } catch (err) {
            console.error(err);
            alert("Server error: ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
        } finally {
            setSendBackBusy(false);
        }
    };


    function SendBackToEditModal({
        open,
        title = "ส่งกลับเพื่อดำเนินการแก้ไข",
        message = "ระบุเหตุผล/ข้อเสนอแนะ",
        confirmText = "ส่งกลับไปแก้ไข",
        cancelText = "ยกเลิก",
        submitting = false,
        onConfirm,   // (note) => void
        onClose,     // () => void
        children,
    }) {
        const [note, setNote] = React.useState("");
        React.useEffect(() => { if (!open) setNote(""); }, [open]);

        if (!open) return null;

        return (
            <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={submitting ? undefined : onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between p-2 mt-4 mr-4 ml-4">
                    <h3 className="text-lg font-bold text-[#0073D9]">{title}</h3>
                    <button className="text-gray-500 hover:text-black" disabled={submitting} onClick={onClose}>✕</button>
                </div>

                <div className="p-2 ml-4 mr-4 space-y-3">
                    {children ? children : <p className="text-gray-700">{message}</p>}
                    <textarea
                    className="w-full border rounded-lg p-2 min-h-[120px] focus:outline-none focus:ring"
                    placeholder="พิมพ์เหตุผลที่ให้ผู้ยื่นคำร้องปรับแก้…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={submitting}
                    />
                </div>

                <div className="p-4 flex justify-end gap-2">
                    <button
                        className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60"
                        onClick={onClose}
                        disabled={submitting}
                    >
                    {cancelText}
                    </button>
                    <button
                        className={`p-2 ml-4 mr-4 rounded-lg text-white disabled:opacity-60 ${submitting ? "bg-[#0073D9]" : "bg-[#005BB0] hover:bg-[#0073D9]"}`}
                        onClick={() => onConfirm?.(note)}
                        disabled={submitting || !note.trim()}
                        title={!note.trim() ? "กรอกเหตุผลก่อนส่งกลับ" : ""}
                    >
                    {submitting ? "กำลังส่ง…" : confirmText}
                    </button>
                </div>
                </div>
            </div>
            </div>
        );
    }


    function ResultEditModal({
        open,
        text = "ส่งเอกสารกลับไปแก้ไขเรียบร้อยแล้ว",
        duration = 1000,           // แสดงกี่ ms แล้วปิดเอง
        onClose,
        }) {
        React.useEffect(() => {
            if (!open) return;
            const t = setTimeout(() => onClose?.(), duration);
            return () => clearTimeout(t);
        }, [open, duration, onClose]);

        if (!open) return null;

        return (
            <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl px-10 py-15 text-center">
                    <h3 className="text-2xl md:text-3xl font-bold">{text}</h3>

                    <div className="mt-6 flex justify-center">
                        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                        <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="white" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        );
    }



















    //รีเทรินนนนนนนนนใหญ่
    return (
        <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
        <Navbar />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mx-15">
            <div className="relative w-full">
                {/* ไอคอนซ้าย */}
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#66009F]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9.5 2A1.5 1.5 0 0 0 8 3.5v1A1.5 1.5 0 0 0 9.5 6h5A1.5 1.5 0 0 0 16 4.5v-1A1.5 1.5 0 0 0 14.5 2z"/>
                    <path fillRule="evenodd" d="M6.5 4.037c-1.258.07-2.052.27-2.621.84C3 5.756 3 7.17 3 9.998v6c0 2.829 0 4.243.879 5.122c.878.878 2.293.878 5.121.878h6c2.828 0 4.243 0 5.121-.878c.879-.88.879-2.293.879-5.122v-6c0-2.828 0-4.242-.879-5.121c-.569-.57-1.363-.77-2.621-.84V4.5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3zM7 9.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 13.25a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5zM7 16.75a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5zm3.5 0a.75.75 0 0 0 0 1.5H17a.75.75 0 0 0 0-1.5z" clipRule="evenodd"/>
                    </svg>
                </span>

                {/* select */}
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="appearance-none border-2 border-purple-500 text-gray-700 rounded-lg
                            px-5 py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                    aria-label="ตัวกรองสถานะเอกสาร"
                >
                    <option value="เอกสารที่รอตรวจสอบ">เอกสารที่รอตรวจสอบ</option>
                    <option value="เอกสารที่ตรวจสอบเรียบร้อย">เอกสารที่ตรวจสอบเรียบร้อย</option>
                    <option value="เอกสารที่ส่งกลับไปแก้ไข">เอกสารที่ส่งกลับไปแก้ไข</option>
                </select>

            </div>

            <div className="relative w-full">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ค้นหาเลขที่คำขอ"
                    className="w-fit border-2 border-purple-500 text-gray-700 rounded-lg px-12 py-3 
                                focus:outline-none focus:ring-purple-500 bg-white w-full"
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
        </div>
    );
}

export default FinalAuditCheck;

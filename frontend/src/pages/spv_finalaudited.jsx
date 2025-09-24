import React, { useEffect, useState } from "react";
import Header from "../components/trackingHeader";
import { Navigate, useNavigate } from "react-router-dom"; // ✅ import useNavigate


function FinalAuditCheck() {
    // ===== Auth token =====
    const authHeader = (localStorage.getItem("token") || "").replace(/^"+|"+$/g, "").trim();
    if (!authHeader) return <Navigate to="/login" replace />;

    const [documentAll, setDocumentAll] = useState([]);
    const [historyEdit, setHistoryEdit] = useState([]);
    const [historyFinalAudited, setHistoryFinalAudited] = useState([]);
    const [filter, setFilter] = useState("เอกสารที่รอตรวจสอบ");

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); // ✅ ใช้ navigate


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


    const ClickForMoreDetail = (doc) => {
        navigate(`/detail/${doc.id}`); // ✅ ใช้ navigate
    };



    // ✅ render documents ตาม filter
    function renderDocuments() {
        //console.log(documentAll, historyFinalAudited, historyEdit)
        if (filter === "เอกสารที่รอตรวจสอบ") {
            return (
                    <div className="space-y-4 mt-4">
                        {documentAll.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row justify-between items-start md:items-center"
                                    >
                                    {/* ฝั่งซ้าย */}
                                    <div className="space-y-1 text-gray-800">
                                        <h3 className="font-bold text-xl text-gray-800 mb-2">{doc.title}</h3>

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
                                            onClick={() => ClickForMoreDetail(doc)}
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

                                        <button className="bg-purple-600 text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-purple-700">
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

                                        <button className="bg-green-600 text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-green-700">
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

                                        <button className="bg-[#DE9631] text-white px-4 py-3 rounded-lg text-sm flex items-center gap-1 hover:bg-[#c77814]">
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
                                            ส่งกลับไปแก้ไข
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
            )
        }
        

        if (filter === "เอกสารที่ตรวจสอบเรียบร้อย") {
            //console.log(historyFinalAudited)
            return (
                <div className="space-y-4 mt-4">
                {historyFinalAudited.map((item, idx) => (
                    <div
                    key={`final-${item.historyId}-${idx}`}
                    className="bg-green-50 p-4 shadow rounded-lg"
                    >
                    <p className="font-bold text-xl text-green-700">{item.status}</p>

                    <p>เลขที่: {item.idformal}</p>
                    <p>ชื่อเรื่อง: {item.doc_title}</p>

                    <p>
                        ผู้ยื่นคำร้อง :{" "}
                        <span className="font-medium">{item.ownername} ({item.owneremail})</span>
                    </p>

                    <p>
                        เจ้าหน้าที่ตรวจสอบ :{" "}
                        <span className="font-medium">{item.auditByname} ({item.auditByemail})</span>
                    </p>

                    <p>
                        หัวหน้าตรวจสอบ :{" "}
                        <span className="font-medium">{item.headauditByname} ({item.headauditByemail})</span>
                    </p>

                    <p>
                        วันที่ตรวจสอบ :{" "}
                        <span className="font-medium">{formatThaiDate(item.changeAt)}</span>
                    </p>


                    <p className="text-gray-700">
                        หมายเหตุ : {item.note}
                    </p>

                    <p className="text-sm text-gray-500">
                        สถานะปัจจุบัน : {item.doc_statusNow}
                    </p>
                    </div>
                ))}
                </div>
            );
        }


        if (filter === "เอกสารที่ส่งกลับไปแก้ไข") {
            console.log(historyEdit)
            return (
                historyEdit.map((edit) => (
                    <div key={edit.historyId} className="bg-red-50 p-4 shadow rounded-lg">
                    <p className="font-bold text-red-700">{edit.oldstatus}</p>

                    <p>เลขที่: {edit.idformal}</p>
                    <p>ชื่อเรื่องเก่า: {edit.title}</p>

                    <p>
                        ผู้ยื่นคำร้อง :{" "}
                        <span className="font-medium">{edit.ownername} ({edit.owneremail})</span>
                    </p>

                    <p>
                        เจ้าหน้าที่ตรวจสอบ :{" "}
                        <span className="font-medium">{edit.auditByname} ({edit.auditByemail})</span>
                    </p>

                    <p>
                        หัวหน้าตรวจสอบ :{" "}
                        <span className="font-medium">{edit.headauditByname} ({edit.headauditByemail})</span>
                    </p>

                    <p>
                        วันที่ตรวจสอบ :{" "}
                        <span className="font-medium">{formatThaiDate(edit.editedAt)}</span>
                    </p>

                    <p>หมายเหตุ: {edit.note_text}</p>
                    <p className="text-sm text-gray-500">
                        สถานะปัจจุบัน : {edit.nowstatus}
                    </p>
                    </div>
                ))                
            );

        }
        return <p>ไม่พบข้อมูล</p>;
    }

    //รีเทรินนนนนนนนนใหญ่
    return (
        <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
        <Header />

        <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-fit border-2 border-purple-500 text-gray-700 rounded-lg px-5 py-3 
                        focus:outline-none focus:ring-purple-500 mt-4 ml-4"
        >
            <option value="เอกสารที่รอตรวจสอบ">เอกสารที่รอตรวจสอบ</option>
            <option value="เอกสารที่ตรวจสอบเรียบร้อย">เอกสารที่ตรวจสอบเรียบร้อย</option>
            <option value="เอกสารที่ส่งกลับไปแก้ไข">เอกสารที่ส่งกลับไปแก้ไข</option>
        </select>

        <div className="p-4 grid gap-4">{renderDocuments()}</div>
        </div>
    );
}

export default FinalAuditCheck;

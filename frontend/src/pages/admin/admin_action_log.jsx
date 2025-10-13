import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar'

function Admin_Action_Log() {
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]);
    const [search, setSearch] = useState("");
    const [filteredDocs, setFilteredDocs] = useState([]);

    if (!token) {
        alert("Please Login or SignIn First!!!");
        return <Navigate to="/login" replace />;
    }

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const res = await fetch("/api/documentAll", {
                    headers: {
                        "Authorization": `${token}`,
                    },
                });
                if (!res.ok) throw new Error("Failed to fetch documents");
                const data = await res.json();
                setDocuments(data);
                setFilteredDocs(data);
            } catch (err) {
                console.error(err);
                alert("เกิดข้อผิดพลาดในการโหลดข้อมูลเอกสาร");
            }
        };
        fetchDocuments();
    }, [token]);

    useEffect(() => {
        const filtered = documents.filter((doc) => 
            doc.title.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredDocs(filtered);
    }, [search, documents]);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleString("th-TH", { 
                timeZone: "Asia/Bangkok",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (e) {
            console.error("Invalid date string:", dateString, e);
            return dateString;
        }
    };

    const handleViewDetails = (docId) => {
        navigate(`/document/${docId}`);
    };

    return (
        <div className='min-h-screen font-kanit bg-[#F8F8F8] pb-10'>
            <Navbar />
            <div className="flex items-center justify-center mt-5">
                <div className="bg-white rounded-2xl shadow-md p-6 w-[75vw] h-[75vh] flex flex-col shadow-[30px]">
                    <h1 className="ml-5 text-2xl font-bold">ประวัติเอกสาร</h1>
                    <div className="relative w-full m-5 mb-3 flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="ค้นหาด้วยชื่อเอกสาร"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="absolute left-3 top-2.5 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 pt-2 space-y-4">
                        {filteredDocs.length > 0 ? (
                            filteredDocs.map((doc, index) => (
                                <div 
                                    key={doc.id || index} 
                                    className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition duration-150"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            {/* ชื่อเอกสาร */}
                                            <p className="text-lg text-black truncate mb-1">
                                                {doc.title}
                                            </p>
                                            {/* ผู้ยื่นคำขอ */}
                                            <p className="text-sm text-gray-600 truncate">
                                                <span>ผู้ยื่นคำขอ:</span> {doc.owneremail}
                                            </p>
                                            {/* วันที่ยื่นคำขอ */}
                                            <p className="text-sm text-gray-600 truncate">
                                                <span>วันที่ยื่นคำขอ:</span> {formatDate(doc.createdAt)}
                                            </p>
                                            {/* หน่วยงานปลายทาง */}
                                            <p className="text-sm text-gray-600 truncate">
                                                <span>หน่วยงานปลายทาง:</span> {doc.destination_name}
                                            </p>
                                        </div>
                                        
                                        {/* Action Buttons (Right Side) */}
                                        <div className="flex flex-col items-end space-y-2 ml-4">
                                            <button 
                                                className="flex items-center gap-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                                                onClick={() => handleViewDetails(doc.id)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                                                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                                                    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.972 0 9.188 3.226 10.677 7.697a1.125 1.125 0 0 1 0 .606C21.189 16.976 16.972 20.25 12.001 20.25c-4.972 0-9.188-3.226-10.677-7.697a1.125 1.125 0 0 1 0-.606ZM12 17.25a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Z" clipRule="evenodd" />
                                                </svg>
                                                ดูรายละเอียด
                                            </button>
                                            <button 
                                                className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                                                onClick={() => handlePrimaryAction(doc.docId || doc.id)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                                                    <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.18 1.18c.883.33 1.708.878 2.457 1.627l1.18-1.18a2.625 2.625 0 0 0 0-3.712ZM19.544 6.78l-4.78-4.78a.75.75 0 0 0-1.06 0l-.744.744a.75.75 0 1 0 1.06 1.06l.744-.744a.75.75 0 0 0 0-1.06Z" />
                                                    <path fillRule="evenodd" d="M15.352 2.977a49.1 49.1 0 0 1 3.27 3.27l-5.941 5.941a2.25 2.25 0 0 1-.77 1.096l-7.79 3.633 1.258 1.258 3.633-7.79a2.25 2.25 0 0 1 1.096-.77l5.941-5.941Zm-8.487 11.23a1.5 1.5 0 0 1-1.06-2.56l5.44-5.44a1.5 1.5 0 0 1 2.12 2.12l-5.44 5.44a1.5 1.5 0 0 1-1.06.44Z" clipRule="evenodd" />
                                                </svg>
                                                จัดการ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                ไม่พบเอกสารที่ค้นหา
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Admin_Action_Log;
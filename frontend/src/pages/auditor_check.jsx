import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Header from '../components/trackingHeader';

function Auditor_Check() {
    const token = localStorage.getItem("token");
    const [documentAll, setDocumentAll] = useState([]); // เริ่มเป็น array
  
    //ถ้าไม่มี token ให้เด้งไป login
    if (!token) {
      alert("Please Login or SignIn First!!!");
      return <Navigate to="/login" replace />;
    }
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDocandUser() {
      try {
        const res = await fetch("http://localhost:3001/petitionHeadAudit/wait_to_accept_byHeadaudit", {
          headers: { Authorization: `${token}` },
        });
        const docs = await res.json();
        setDocumentAll(docs.document_json || []);
        console.log(docs.document_json);
      } catch (e) {
        console.error(e);
        setDocumentAll([]);
      } finally {
        setLoading(false);
      }
    }
    getDocandUser();
  }, [token]);

  useEffect(() => {
    console.log("Updated documentAll:", documentAll);
  }, [documentAll]);


  //   const fakeData = [
  //   {
  //   id: 1,
  //   doc_id: undefined,
  //   department_name: '1',
  //   destination_name: 'สำนักงานบริหารงานวิจัย ',
  //   title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านกำแพงเพชร',
  //   authorize_to: 'เบล กำแพงเพชร',
  //   position: 'หัวหน้าชมรม',
  //   affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
  //   authorize_text: 'ขอเงิน',
  //   status_name: 'ตรวจสอบเอกสารเรียบร้อยเเล้ว',
  //   createdAt: "2025-09-13T12:01:05.381Z",
  //   date_of_signing: null
  //   },
  //   {
  //   id: 2,
  //   doc_id: undefined,
  //   department_name: '1',
  //   destination_name: 'สำนักงานบริหารงานวิจัย ',
  //   title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านสุโขทัย',
  //   authorize_to: 'น้อต สุโขทัย',
  //   position: 'หัวหน้าชมรม',
  //   affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
  //   authorize_text: 'ขอเงิน',
  //   status_name: 'รอการตรวจสอบ',
  //   createdAt: "2025-09-13T12:01:05.381Z",
  //   date_of_signing: null
  //   },
  //   {
  //   id: 3,
  //   doc_id: undefined,
  //   department_name: '1',
  //   destination_name: 'สำนักงานบริหารงานวิจัย ',
  //   title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านจอมทอง',
  //   authorize_to: 'แก้ม จอมทอง',
  //   position: 'หัวหน้าชมรม',
  //   affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
  //   authorize_text: 'ขอเงิน',
  //   status_name: 'รอการตรวจสอบ',
  //   createdAt: "2025-09-13T12:01:05.381Z",
  //   date_of_signing: null
  //   }
    
  // ]
  // const [documentAll, setDocumentAll] = useState(fakeData);


//   const handleCheck = async (docId) => {
//   try {
//     const res = await fetch(`http://localhost:3001/update_st_audit_by_Headaudit/${docId}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${token}`
//       },
//       body: JSON.stringify("-") // ถ้าไม่มีรายละเอียด
//     });

//     if (res.ok) {
//       const data = await res.json();
//       alert(`ตรวจสอบเอกสาร ID: ${docId} เรียบร้อยแล้ว`);

//       // อัปเดต documentAll โดยเปลี่ยน status_name เป็นสถานะใหม่
//       setDocumentAll(prev =>
//         prev.map(d =>
//           d.id === docId
//             ? { ...d, status_name: "ตรวจสอบเอกสารเรียบร้อยเเล้ว" } // แทนด้วย status ที่ API คืนมา หรือค่า greenList
//             : d
//         )
//       );
//     }
//   } catch (err) {
//     console.error(err);
//   }
// };

  const greenList = ["ตรวจสอบเอกสารเรียบร้อยเเล้ว"];
  const orangeList = ["รอการตรวจสอบ", "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า"];
  const redList = ["ไม่อนุมัติ"];
  // state เก็บสถานะที่เลือก
  const [filterStatus, setFilterStatus] = useState("ทั้งหมด");

  // filter documents ตามสถานะที่เลือก
  const filteredDocs = documentAll.filter((doc) => {
    if (filterStatus === "ทั้งหมด") return true;
    return doc.status_name === filterStatus;
  });

  // แก้ไข
    
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [checkPopupOpen, setCheckPopupOpen] = useState(false);
  const [editPopupOpen, setEditPopupOpen] = useState(false);
  const [reason, setReason] = useState("");

  const openEditPopup = (doc) => {
    setSelectedDoc(doc);
    setEditPopupOpen(true);
  };

  const submitEdit = () => {
    alert(`ส่งเอกสาร ID: ${selectedDoc.id} กลับแก้ไข: ${reason}`);
    setDocumentAll(prev => prev.filter(d => d.id !== selectedDoc.id));
    setEditPopupOpen(false);
    setReason("");
  };

  //   ตรวจสอบ
  const handleCheck = (doc) => {
    setSelectedDoc(doc);
    setCheckPopupOpen(true);
  };


  const submitCheck = () => {
    alert(`ตรวจสอบเอกสาร ID: ${selectedDoc.id} เรียบร้อยแล้ว`);
    setDocumentAll(prev =>
      prev.map(d =>
        d.id === selectedDoc.id
          ? { ...d, status_name: "ตรวจสอบเอกสารเรียบร้อยเเล้ว" }
          : d
      )
    );
    setCheckPopupOpen(false);
  };


  return (
    <div className="min-h-screen font-kanit bg-[#F8F8F8]">
      <Header/>
      <div className="flex flex-col items-center justify-center mt-5 pb-10">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#F5F5F5] w-[85vw] h-[85vh] justify-center items-center overflow-auto p-5">
          <p className="text-2xl font-bold mb-5">รายการเอกสารที่ต้องตรวจสอบ</p>
          <div className="flex justify-left  mb-2">
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-[#B9B9B9] rounded-xl px-15 py-2 text-l"
            >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="รอการตรวจสอบ">รอการตรวจสอบ</option>
                <option value="ตรวจสอบเอกสารเรียบร้อยเเล้ว">ตรวจสอบแล้ว</option>
                <option value="ไม่อนุมัติ">ไม่อนุมัติ</option>
            </select>
            </div>

          {documentAll.length === 0 && (
            <p className="text-2xl text-gray-500 flex justify-center">ไม่มีเอกสารที่ต้องตรวจสอบ</p>
          )}

          {filteredDocs.map((doc) => {
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

            const statusClass =
              greenList.includes(doc.status_name)
                ? "text-emerald-600"
                : orangeList.includes(doc.status_name)
                ? "text-orange-600"
                : redList.includes(doc.status_name)
                ? "text-red-600"
                : "text-gray-600";

            const showCheckButton = orangeList.includes(doc.status_name);


            return (
              <div key={doc.id} className="border border-white rounded-2xl p-4 mb-4 bg-white shadow-[0_5px_13px_rgba(3,0.5,0.3,0.3)] flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{doc.title}</p>
                    <p className="text-sm text-gray-500">ผู้ยื่นคำขอ: {doc.authorize_to}</p>
                    <p className="text-sm text-gray-400">วันที่ส่งคำขอ: {created}</p>
                    <p className={`text-sm font-medium ${statusClass}`}>{doc.status_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(`ดูรายละเอียด ID: ${doc.id}`)}
                      className="bg-white border border-gray text-black px-4 py-2 rounded-xl flex items-center text-sm"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-3.6-3.6" strokeLinecap="round" />
                    </svg>
                      ดูรายละเอียด
                    </button>
                    <button
                      onClick={() => alert(`ดูเอกสาร ID: ${doc.id}`)}
                      className="bg-[#66009F] text-white px-4 py-2 rounded-xl hover:bg-purple-700 text-sm flex items-center"
                    >
                      ดูเอกสาร
                    </button>

                    {showCheckButton && (
                      <>
                        <button
                          onClick={() => handleCheck(doc)}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 text-sm flex items-center"
                        >
                          ตรวจสอบ
                        </button>
                        <button
                           onClick={() => openEditPopup(doc)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm flex items-center"
                        >
                          ส่งแก้ไข
                        </button>
                      </>
                    )}
                    {/* ตรวจสอบ */}
                    {checkPopupOpen && selectedDoc && (
                        <div className="fixed inset-0 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative bg-white rounded-xl p-6 w-[400px] shadow-lg">
                            <p className="text-[#05A967] text-2xl font-bold ">ตรวจสอบคำขอ</p>
                            <p className="text-sm text-black">เรื่อง: {selectedDoc.title}</p>
                            <p className="text-sm text-black">ผู้ยื่นคำขอ: {selectedDoc.authorize_to}</p>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                onClick={() => setCheckPopupOpen(false)}
                                className="px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-400"
                                >
                                ยกเลิก
                                </button>
                                <button
                                onClick={submitCheck}
                                className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                                >
                                ยืนยันตรวจสอบ
                                </button>
                            </div>
                            </div>
                        </div>
                        )}
                    {/* แก้ไข */}
                    {editPopupOpen && selectedDoc && (
                        <div className="fixed inset-0 flex items-center justify-center ">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative bg-white rounded-xl p-6 w-96 shadow-lg flex flex-col gap-1">

                            <p className="text-2xl text-[#0073D9] font-bold">ส่งกลับเพื่อดำเนินการแก้ไข</p>
                            <p className="text-sm text-black">เรื่อง: {selectedDoc.title}</p>
                            <p className="text-sm text-black">ผู้ยื่นคำขอ: {selectedDoc.authorize_to}</p>
                            <textarea
                                className="border p-2 rounded h-24 resize-none"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="พิมพ์เหตุผลที่นี่..."
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                onClick={() => setEditPopupOpen(false)}
                                className="px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-400"
                                >
                                ยกเลิก
                                </button>
                                <button
                                onClick={submitEdit}
                                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                                >
                                ส่งแก้ไข
                                </button>
                            </div>
                            </div>
                        </div>
                        )}

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Auditor_Check;

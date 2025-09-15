import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Header from '../components/trackingHeader';

function Auditor_Check() {
    const token = localStorage.getItem("token");
    const [userInfo, setUserInfo] = useState(null);
    // const [documentAll, setDocumentAll] = useState([]); // เริ่มเป็น array
  
    // ถ้าไม่มี token ให้เด้งไป login
    if (!token) {
      alert("Please Login or SignIn First!!!");
      return <Navigate to="/login" replace />;
    }
  
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   async function getDocandUser() {
  //     try {
  //       const res1 = await fetch("http://localhost:3001/auth/user", {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       const user = await res1.json();

  //       const res2 = await fetch("http://localhost:3001/wait_to_accept_byHeadaudit", {
  //         headers: { Authorization: `Bearer ${token}` },
  //       });
  //       const docs = await res2.json();

  //       setUserInfo(user);
  //       setDocumentAll(docs.document_json || []);
  //     } catch (e) {
  //       console.error(e);
  //       setDocumentAll([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   getDocandUser();
  // }, [token]);
    const fakeData = [
    {
    id: 1,
    doc_id: undefined,
    department_name: '1',
    destination_name: 'สำนักงานบริหารงานวิจัย ',
    title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านกำแพงเพชร',
    authorize_to: 'เบล กำแพงเพชร',
    position: 'หัวหน้าชมรม',
    affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
    authorize_text: 'ขอเงิน',
    status_name: 'ตรวจสอบเอกสารเรียบร้อยเเล้ว',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    },
    {
    id: 2,
    doc_id: undefined,
    department_name: '1',
    destination_name: 'สำนักงานบริหารงานวิจัย ',
    title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านสุโขทัย',
    authorize_to: 'น้อต สุโขทัย',
    position: 'หัวหน้าชมรม',
    affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
    authorize_text: 'ขอเงิน',
    status_name: 'รอการตรวจสอบ',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    },
    {
    id: 3,
    doc_id: undefined,
    department_name: '1',
    destination_name: 'สำนักงานบริหารงานวิจัย ',
    title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านจอมทอง',
    authorize_to: 'แก้ม จอมทอง',
    position: 'หัวหน้าชมรม',
    affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
    authorize_text: 'ขอเงิน',
    status_name: 'รอการตรวจสอบ',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    }
  ]
  const [documentAll, setDocumentAll] = useState(fakeData);


  const handleCheck = (docId) => {
    alert(`ตรวจสอบเอกสาร ID: ${docId} เรียบร้อยแล้ว`);
    setDocumentAll(prev => prev.filter(d => d.id !== docId));
  };

  const greenList = ["ตรวจสอบเอกสารเรียบร้อยเเล้ว"];
  const orangeList = ["รอการตรวจสอบ", "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า"];
  const redList = ["ไม่อนุมัติ"];
   
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [reason, setReason] = useState("");

  const openPopup = (doc) => {
    setSelectedDoc(doc);
    setPopupOpen(true);
  };

  const submitReason = () => {
    alert(`ส่งเอกสาร ID: ${selectedDoc.id} กลับแก้ไข: ${reason}`);
    setDocumentAll(prev => prev.filter(d => d.id !== selectedDoc.id));
    setPopupOpen(false);
    setReason("");
  };

  // if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen font-kanit bg-[#F8F8F8]">
      <Header/>
      <div className="flex flex-col items-center justify-center mt-5 pb-10">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#F5F5F5] w-[85vw] h-[85vh] justify-center items-center overflow-auto p-5">
          <p className="text-2xl font-bold mb-5">รายการเอกสารที่ต้องตรวจสอบ</p>

          {documentAll.length === 0 && (
            <p className="text-2xl text-gray-500 flex justify-center">ไม่มีเอกสารที่ต้องตรวจสอบ</p>
          )}

          {documentAll.map((doc) => {
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
                      className="bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-900 text-sm"
                    >
                      ดูรายละเอียด
                    </button>
                    <button
                      onClick={() => alert(`ดูเอกสาร ID: ${doc.id}`)}
                      className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
                    >
                      ดูเอกสาร
                    </button>

                    {showCheckButton && (
                      <>
                        <button
                          onClick={() => handleCheck(doc.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                        >
                          ตรวจสอบ
                        </button>
                        <button
                          onClick={() => openPopup(doc)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                        >
                          ส่งแก้ไข
                        </button>
                      </>
                    )}
                    {popupOpen && selectedDoc && (
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
                              onClick={() => setPopupOpen(false)}
                              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={submitReason}
                              className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
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

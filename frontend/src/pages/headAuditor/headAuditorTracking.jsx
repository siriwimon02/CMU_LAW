import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Header from '../../components/trackingHeader';

function Auditor_Check() {
    const token = localStorage.getItem("token");
    const [documentAll, setDocumentAll] = useState([]); // เริ่มเป็น array
    const navigate = useNavigate();
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
  //   status_name: 'ตรวจสอบโดยหัวหน้ากองเสร็จสิ้น',
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
  //   status_name: 'อยู่ระหว่างการตรวจสอบโดยหัวหน้ากอง',
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
  //   status_name: 'อยู่ระหว่างการตรวจสอบโดยหัวหน้ากอง',
  //   createdAt: "2025-09-13T12:01:05.381Z",
  //   date_of_signing: null
  //   }
    
  // ]
  // const [documentAll, setDocumentAll] = useState(fakeData);

//ตรวจสอบ
  const handleCheck = async (docId) => {
  try {
    const res = await fetch(`http://localhost:3001/update_st_audit_by_Headaudit/${docId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify("-") // ถ้าไม่มีรายละเอียด
    });

    if (res.ok) {
      const data = await res.json();
      alert(`ตรวจสอบเอกสาร ID: ${docId} เรียบร้อยแล้ว`);

      // อัปเดต documentAll โดยเปลี่ยน status_name เป็นสถานะใหม่
      setDocumentAll(prev =>
        prev.map(d =>
          d.id === docId
            ? { ...d, status_name: "ตรวจสอบเอกสารเรียบร้อยเเล้ว" } // แทนด้วย status ที่ API คืนมา หรือค่า greenList
            : d
        )
      );
    }
  } catch (err) {
    console.error(err);
  }
};

  const greenList = ["ตรวจสอบโดยหัวหน้ากองเสร็จสิ้น"];
  const orangeList = ["อยู่ระหว่างการตรวจสอบโดยหัวหน้ากอง"];
  const redList = ["ส่งกลับเพื่อแก้ไขส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง"];
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


//สำหรับข้อมูลจริง
  const submitEdit = async () => {
  try {
    const res = await fetch(`http://localhost:3001/petitionHeadAudit/edit_ByheadAuditor/${selectedDoc.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`
      },
      body: JSON.stringify({ text_suggesttion: reason })
    });

    if (res.ok) {
      const data = await res.json();
      setDocumentAll(prev => prev.filter(d => d.id !== selectedDoc.id));
      setEditPopupOpen(false);
      setReason("");
    } else {
      console.error("Edit failed");
    }
  } catch (err) {
    console.error(err);
  }
};

//สำหรับข้อมูลปลอม
  // const submitEdit = () => {
  //   // alert(`ส่งเอกสาร ID: ${selectedDoc.id} กลับแก้ไข: ${reason}`);
  //   setDocumentAll(prev => prev.filter(d => d.id !== selectedDoc.id));
  //   setEditPopupOpen(false);
  //   setReason("");
  // };

    // ตรวจสอบ
  // const handleCheck = (doc) => {
  //   setSelectedDoc(doc);
  //   setCheckPopupOpen(true);
  //   setReason("");
  // };

//สำหรับข้อมูลจริง
//   const submitCheck = async () => {
//   try {
//     const res = await fetch(
//       `http://localhost:3001/petitionHeadAudit/update_st_audit_by_Headaudit/${selectedDoc.id}`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `${token}`,
//         },
//         body: JSON.stringify({ text_suggesttion: reason }),
//       }
//     );

//     if (res.ok) {
//       const data = await res.json();

//       setDocumentAll((prev) =>
//         prev.map((d) =>
//           d.id === selectedDoc.id
//             ? { ...d, status_name: "ตรวจสอบโดยหัวหน้ากองเสร็จสิ้น" }
//             : d
//         )
//       );

//       setCheckPopupOpen(false);
//     } else {
//       console.error("Update failed");
//     }
//   } catch (err) {
//     console.error(err);
//   }
// };



//สำหรับข้อมูลปลอม
  // const submitCheck = () => {
  //   // alert(`ตรวจสอบเอกสาร ID: ${selectedDoc.id} เรียบร้อยแล้ว`);
  //   setDocumentAll(prev =>
  //     prev.map(d =>
  //       d.id === selectedDoc.id
  //         ? { ...d, status_name: "ตรวจสอบโดยหัวหน้ากองเสร็จสิ้น" }
  //         : d
  //     )
  //   );
  //   setCheckPopupOpen(false);
  // };


  const ClickForMoreDetail = (doc) => {
    navigate(`/detailForHeadAuditor/${doc.id}`);
  }
  // view petition
  const ClickForViewPet = (doc) => {
    navigate(`/viewHeadAuditor/${doc.id}`);
  }

  return (
    <div className="min-h-screen font-kanit bg-[#F8F8F8]">
      <Header/>
      <div className="flex flex-col items-center justify-center mt-5 pb-10">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#F5F5F5] w-[85vw] h-[85vh] justify-center items-center overflow-auto p-5">
          <p className="text-2xl font-bold mb-5">รายการเอกสารที่ต้องตรวจสอบ</p>
          <div className="flex justify-left mb-2">
            <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-[#B9B9B9] rounded-xl px-10 py-3  text-l"
            >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="อยู่ระหว่างการตรวจสอบโดยหัวหน้ากอง">อยู่ระหว่างการตรวจสอบโดยหัวหน้ากอง</option>
                <option value="ตรวจสอบโดยหัวหน้ากองเสร็จสิ้น">ตรวจสอบโดยหัวหน้ากองเสร็จสิ้น</option>
                <option value="ส่งกลับเพื่อแก้ไขส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง">ส่งกลับเพื่อแก้ไขส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง</option>
            </select>
            </div>

          {documentAll.length === 0 && (
            <p className="text-2xl text-gray-500 flex item-center justify-center">ไม่มีเอกสารที่ต้องตรวจสอบ</p>
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
                ? "text-[#05A967]"
                : orangeList.includes(doc.status_name)
                ? "text-[#E48500]"
                : redList.includes(doc.status_name)
                ? "text-[#CD0000]"
                : "text-gray-600";

            const showCheckButton = orangeList.includes(doc.status_name);


            return (
              <div key={doc.id} className="border border-white rounded-xl px-4 py-5  mb-4 bg-white shadow-[0_5px_13px_rgba(3,0.5,0.3,0.3)] flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{doc.title}</p>
                    <p className="text-sm text-gray-500">ผู้ยื่นคำขอ: {doc.authorize_to}</p>
                    <p className="text-sm text-gray-400">วันที่ส่งคำขอ: {created}</p>
                    <p className={`text-sm font-medium ${statusClass}`}>{doc.status_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => ClickForMoreDetail(doc)}
                      className="bg-white border border-gray text-black px-4 py-2 rounded-lg flex items-center text-sm"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-3.6-3.6" strokeLinecap="round" />
                    </svg>
                      ดูรายละเอียด
                    </button>
                    <button
                      onClick={() => ClickForViewPet(doc)}
                      className="bg-[#66009F] text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm flex items-center"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg"
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24"
                    className="text-white">
                    <path fill="currentColor"
                    d="M16.5 19.308q1.166 0 1.987-.812q.82-.811.82-1.996q0-1.165-.82-1.986q-.821-.822-1.987-.822q-1.184 0-1.996.822q-.812.82-.812 1.986q0 1.185.812 1.996q.812.812 1.996.812m5.1 3l-2.796-2.79q-.487.382-1.07.586t-1.234.204q-1.586 0-2.697-1.111t-1.11-2.697t1.11-2.697t2.697-1.11t2.697 1.11t1.11 2.697q0 .656-.216 1.249t-.599 1.08l2.796 2.771zM5.616 21q-.691 0-1.153-.462T4 19.385V4.615q0-.69.463-1.152T5.616 3H13.5L18 7.5v3.02q-.37-.097-.744-.155q-.375-.057-.756-.057q-2.825 0-4.515 1.922t-1.689 4.326q0 1.203.478 2.355T12.294 21zM13 8h4l-4-4l4 4l-4-4z"/></svg>
                      ดูเอกสาร
                    </button>

                    {showCheckButton && (
                      <>
                        <button onClick={() => handleCheck(doc)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                        </svg>
                          ตรวจสอบ
                        </button>
                        <button onClick={() => openEditPopup(doc)} className="bg-[#0073D9] text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24">
                        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"/></svg>
                          ส่งแก้ไข
                        </button>
                      </>
                    )}
                    {/* ตรวจสอบ */}
                    {checkPopupOpen && selectedDoc && (
                        <div className="fixed inset-0 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <div className="relative bg-white rounded-xl p-6 w-96 shadow-lg flex flex-col gap-1">
                            <p className="text-[#05A967] text-2xl font-bold ">ตรวจสอบคำขอ</p>
                            <p className="text-sm text-black">เรื่อง: {selectedDoc.title}</p>
                            <p className="text-sm text-black">ผู้ยื่นคำขอ: {selectedDoc.authorize_to}</p>
                            <textarea
                                className="border p-2 rounded h-24 resize-none"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="เหตุผลเพิ่มเติม.."
                                maxLength={500}
                            />
                            <p className="text-sm text-gray-400">{reason.length}/500</p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setCheckPopupOpen(false)} className="px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-400">
                                  ยกเลิก
                                </button>
                                <button onClick={submitCheck} className="px-4 py-2 rounded-xl flex items-center bg-green-600 text-white hover:bg-green-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                  </svg>
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
                                placeholder="เหตุผลเพิ่มเติม.."
                                maxLength={500}
                            />
                             <p className="text-sm text-gray-400">{reason.length}/500</p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditPopupOpen(false)} className="px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-400">
                                  ยกเลิก
                                </button>
                                <button onClick={submitEdit} className="px-4 py-2 rounded-xl bg-[#0073D9] text-white flex items-center hover:bg-blue-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" 
                                  width="24" 
                                  height="24" 
                                  viewBox="0 0 24 24">
                                  <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"/></svg>
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

// เพิ่ม update ล่าสุด เปลี่ยนสถานะเช็ค path จาก /history_theAuditByHeadauditor

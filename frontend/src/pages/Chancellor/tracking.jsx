import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar'
import ApproveModal from '../../components/ApproveModal'
import RejectModal from '../../components/RejectModal'
function Tracking() {
// 1.check role 2.tab bar 3.connect with db
    const navigate = useNavigate();                    // hook 1
    const token = localStorage.getItem("token");       // plain value

    // hooks must always run (same order every render)
    const [userInfo, setUserInfo] = useState(null);    // hook 2
    const [documentAll, setDocumentAll] = useState([]);// hook 3
    const [approveOpen, setApproveOpen] = useState(false); // hook 4
    const [selected, setSelected] = useState(null);    // hook 5
    const [modalPhase, setModalPhase] = useState("confirm"); // "confirm" | "success"   
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectPhase, setRejectPhase] = useState("confirm"); // "confirm" | "success"
    
    // approve
    
    useEffect(() => {
        if (!token) return;               
        (async () => {
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
        })();
    }, [token]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }
    
    // color of status

    const [filter, setFilter] = useState("all"); // "all" | "green" | "orange" | "red"

    const greenList = ['ตรวจสอบเอกสารเรียบร้อยเเล้ว']
    const orangeList = [ 'รอการอนุมัติ']
    const redList = [ 'ไม่อนุมัติ' ]

    const groupRank = (status) => {
    if (greenList.includes(status)) return 1;
    if (orangeList.includes(status)) return 2;
    if (redList.includes(status)) return 3;
    return 99;
    };
    
    
    // approve
    const openApprove = (item) => {
    setSelected(item);
    setModalPhase("confirm");
    setApproveOpen(true);
    };

    const closeApprove = () => {
    setApproveOpen(false);
    setModalPhase("confirm");
    setSelected(null);
    };

    const confirmApprove = async () => {
    try {
        // TODO: call approve API here
        // await fetch(...)

        // แสดงหน้าสำเร็จ
        setModalPhase("success");

        // ปิดอัตโนมัติหลัง 10 วินาที
        setTimeout(() => {
        setApproveOpen(false);
        setModalPhase("confirm");
        setSelected(null);
        }, 10000);
    } catch (e) {
        console.error(e);
    }
    };

    // reject
    // handlers
    const openReject = (item) => {
      setSelected(item);
      setRejectPhase("confirm");
      setRejectOpen(true);
    };

    const closeReject = () => {
      setRejectOpen(false);
      setRejectPhase("confirm");
      setSelected(null);
    };

    const confirmReject = async (reason) => {
      try {
        // TODO: เรียก API ไม่อนุมัติจริง ๆ ที่นี่
        // await fetch(`http://localhost:3001/petition/${selected.id}/reject`, {
        //   method: "PATCH",
        //   headers: { "Content-Type": "application/json", Authorization: `${token}` },
        //   body: JSON.stringify({ reason }),
        // });

        // แสดงโหมดสำเร็จ (ไม่ปิดเอง)
        setRejectPhase("success");

        // **ไม่** setTimeout ปิดอัตโนมัติ ตามที่คุณต้องการ
      } catch (e) {
        console.error(e);
        alert("เกิดข้อผิดพลาดในการไม่อนุมัติ");
      }
    };
  // navigate
  const ClicktoDashboard = () => {
    navigate('/dashboard');
  }

  const ClickForMoreDetail = (doc) => {
    navigate(`/detail/${doc.id}`);
  }

  

  const ClickForReject = () =>{
    alert("Reject na jaaa")
  }

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
    status_name: 'รอการอนุมัติ',
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
    status_name: 'ไม่อนุมัติ',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    },
    {
    id: 4,
    doc_id: undefined,
    department_name: '1',
    destination_name: 'สำนักงานบริหารงานวิจัย ',
    title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านจอมทอง',
    authorize_to: 'อาย บ้านนอก ',
    position: 'หัวหน้าชมรม',
    affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
    authorize_text: 'ขอเงิน',
    status_name: 'ไม่อนุมัติ',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    },
    {
    id: 5,
    doc_id: undefined,
    department_name: '1',
    destination_name: 'สำนักงานบริหารงานวิจัย ',
    title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านจอมทอง',
    authorize_to: 'ปลิ้ม รังสิต',
    position: 'หัวหน้าชมรม',
    affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
    authorize_text: 'ขอเงิน',
    status_name: 'รอการอนุมัติ',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    },
    {
    id: 0,
    doc_id: undefined,
    department_name: '1',
    destination_name: 'สำนักงานบริหารงานวิจัย ',
    title: 'การเบิกเงินค่ากล้องถ่ายรูป 1 ล้านบาทของชมรมคนบ้านจอมทอง',
    authorize_to: 'Kamin NYC',
    position: 'หัวหน้าชมรม',
    affiliation: 'วิทยาการคอมพิวเตอร์ที่แม่บังคับมาเรียน',
    authorize_text: 'ขอเงิน',
    status_name: 'ตรวจสอบเอกสารเรียบร้อยเเล้ว',
    createdAt: "2025-09-13T12:01:05.381Z",
    date_of_signing: null
    }
  ]

  // choose source: real data first, fallback to fake
  const sourceData =  fakeData;

  // filter by current button
  const filtered = sourceData.filter((item) => {
    if (filter === "all") return true;
    if (filter === "green")  return greenList.includes(item.status_name);
    if (filter === "orange") return orangeList.includes(item.status_name);
    if (filter === "red")    return redList.includes(item.status_name);
    return true;
  });

  // sort: newest first by createdAt (fallback safe)
  const displayedData = [...filtered].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta; // desc
  });

  // If you prefer sort by group then date, use this instead:
  // const displayedData = [...filtered].sort((a,b) => {
  //   const ga = groupRank(a.status_name), gb = groupRank(b.status_name);
  //   if (ga !== gb) return ga - gb;
  //   const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  //   const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  //   return tb - ta;
  // });

  const BRAND_PURPLE = "#66009F";

  return (
    <div className="min-h-screen flex flex-col font-kanit bg-[#F8F8F8]">
      <Navbar />

      {/* ปุ่มด้านบน ใช้ขนาด/spacing เดียวกับ seendorser น้าา */}
      <div className="w-full px-6 mt-6 flex gap-4">
        {/* ตรวจสอบเอกสารเรียบร้อยแล้ว */}
        <button
          onClick={() => setFilter("green")}
          className={`bg-white border rounded-lg px-5 py-3 shadow flex items-center gap-2 hover:bg-gray-50
            ${filter === "green" ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200"}`}
          title="ตรวจสอบเอกสารเรียบร้อยแล้ว"
        >
          <span className="inline-flex items-center justify-center rounded-full"
            style={{ width: 20, height: 20, backgroundColor: BRAND_PURPLE }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>ตรวจสอบเอกสารเรียบร้อยแล้ว</span>
        </button>

        {/* รอการอนุมัติ — เอาวงกลมม่วงออก เหลือไอคอนเดี่ยวตามที่ขอ */}
        <button
          onClick={() => setFilter("orange")}
          className={`bg-white border rounded-lg px-5 py-3 shadow flex items-center gap-2 hover:bg-gray-50
            ${filter === "orange" ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200"}`}
          title="รอการอนุมัติ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={1.5} stroke={BRAND_PURPLE} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span>รอการอนุมัติ</span>
        </button>

        {/* ไม่อนุมัติ */}
        <button
          onClick={() => setFilter("red")}
          className={`bg-white border rounded-lg px-5 py-3 shadow flex items-center gap-2 hover:bg-gray-50
            ${filter === "red" ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200"}`}
          title="ไม่อนุมัติ"
        >
          <span className="inline-flex items-center justify-center rounded-full"
            style={{ width: 20, height: 20, backgroundColor: BRAND_PURPLE }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </span>
          <span>ไม่อนุมัติ</span>
        </button>
      </div>

        {/* แสดงรายการเอกสาร */}
        {displayedData.map((item) => {
          const created = item.createdAt
            ? new Date(item.createdAt).toLocaleString("th-TH", { 
                timeZone: "Asia/Bangkok",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-";
            //separate color, statusClass is string of color background
          const statusClass =
            greenList.includes(item.status_name)
              ? "text-emerald-600"
              : orangeList.includes(item.status_name)
              ? "text-orange-600"
              : redList.includes(item.status_name)
              ? "text-red-600"
              : "text-gray-600";
            const check = orangeList.includes(item.status_name);
          return (
            <article key={item.id} className="rounded-md bg-white shadow p-4 mx-6  mt-4 mb-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between  ">
                <div className="space-y-1 text-gray-800">
                  <p className="font-bold">
                    เลขที่คำขอ: <span className="font-extrabold">{item.request_no ?? item.id}</span>
                  </p>
                  <p>
                    ผู้ที่ยื่นคำขอ:{" "}
                    <span className="">
                      {item.authorize_to}
                    </span>
                  </p>
                  <p>วันที่ยื่นคำขอ: {created}</p>
                  <p className={statusClass}>
                    <span className="font-medium">{item.status_name ?? "ไม่สามารถตรวจสอบได้"}</span>
                  </p>
                </div>

                
                <div className="flex flex-wrap gap-2 items-center self-start">
                <button
                  // onClick={() => ClickForMoreDetail(item)}
                  onClick={() => setFilter("green")}
                  className="bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2 shadow-md hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  ดูรายละเอียด
                </button>
                {/* if it's orange group */}
                {check && (
                    <>
                    <button
                        type="button"
                        onClick={() => openApprove(item)}
                        className="bg-[#05A967] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#048a52] flex items-center gap-2"
                    >
                        
                    
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#FFFFFF]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        อนุมัติ
                    </button>

                    <button
                      onClick={() => openReject(item)}
                      className="bg-[#CD0000] text-white rounded-lg px-4 py-2 shadow-md hover:bg-[#a60000] flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#FFFFFF]">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
                      </svg>
                        ไม่อนุมัติ
                    </button>
                    </>
                )}
                </div>


              </div>
            </article>
          );
        })}
          
          
        {/* {documentAll.length > 0 &&
          documentAll.map((doc) => {
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
            return (
              <article
                key={doc.id}
                className="rounded-2xl bg-white shadow p-4 mb-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 text-gray-800">
                    <p className="font-bold">
                      เลขที่คำขอ:{" "}
                      <span className="font-extrabold">{doc.request_no ?? doc.id}</span>
                    </p>
                    <p>
                      ผู้ที่ยื่นคำขอ: <span className="font-semibold">{userInfo?.firstname} {userInfo?.lastname}</span>
                    </p>
                    <p>วันที่ยื่นคำขอ: {created} </p>
                    <p className={ 
                      greenList.includes(doc.status_name) ? "text-emerald-600"
                      : orangeList.includes(doc.status_name) ? "text-orange-600"    
                      : redList.includes(doc.status_name) ? "text-red-600":"text-red-600"
                    }>
                      <span className="font-medium">
                        {doc.status_name ?? "ไม่สามารถตรวจสอบได้"}
                      </span>
                    </p>
                  </div>
                    <button 
                      onClick={() => ClickForMoreDetail(doc)}
                      className="mt-2 inline-flex items-center gap-2 self-start rounded-xl border border-gray-300 bg-white px-4 py-2 text-gray-800 hover:bg-gray-50">
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
                </div>
              </article>
            ); 
           })} */}

      {/* </main> */}
        <ApproveModal
    open={approveOpen}
    view={modalPhase}
    item={selected}
    user={userInfo}
    onClose={closeApprove}
    onConfirm={confirmApprove}
    />

      <RejectModal
    open={rejectOpen}
    view={rejectPhase}
    item={selected}
    user={userInfo}
    onClose={closeReject}
    onConfirm={confirmReject}
    closeOnOverlay={true}   // ห้ามปิดด้วยคลิกฉากหลัง
    // closeOnEsc={false}       // ห้ามปิดด้วย ESC
  />
    </div>




  );
}

export default Tracking;

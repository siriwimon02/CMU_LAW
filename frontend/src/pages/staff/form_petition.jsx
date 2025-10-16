import React, { useState, useEffect, useMemo } from 'react';
// import { Navigate } from 'react-router-dom';
import Icon from "../../components/docIcon"
import Navbar from '../../components/navbar'
import { Navigate, useNavigate } from 'react-router-dom';


// import { Icon } from '@iconify/react';

function FormPetition() {
  const token = localStorage.getItem('token');
  console.log(token);
  // ถ้าต้องบังคับให้ล็อกอินก่อนใช้งาน เปิดคอมเมนต์นี้ได้เลย
  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [destinationId, setDestination] = useState('');
  const [title, setTitle] = useState('');
  const [authorize_to, setAuthorize_to] = useState('');
  const [position, setPosition] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [authorize_text, setAuthorize_text] = useState('');
  const [needPresidentCard, setNeedPresidentCard] = useState(false);
  const [needUniversityHouse, setNeedUniversityHouse] = useState(false);
  const [agree, setAgree] = useState(false);

  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ ใหม่: state เก็บไฟล์แนบหลายไฟล์
  const [attachments, setAttachments] = useState([]);

  //destination
  useEffect(() => {
  const fetchDestinations = async () => {
    try {
          const res = await fetch("http://localhost:3001/api/destination");
          const data = await res.json();
          setDestinations(data);
        } catch (err) {
          console.error("โหลดรายการหน่วยงานไม่สำเร็จ", err);
        }
      };
      fetchDestinations();
  }, []);
  console.log(destinations);

  // เพิ่ม state & memo ด้านบนใกล้ ๆ state อื่น ๆ
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modalStep, setModalStep] = useState('confirm'); // 'confirm' | 'success'

  const destinationName = useMemo(() => {
    const d = destinations.find(x => String(x.id) === String(destinationId));
    return d ? d.des_name : '';
  }, [destinations, destinationId]);

  const isValid = useMemo(() => {
    return (
      destinationId !== '' &&
      title.trim() &&
      authorize_to.trim() &&
      position.trim() &&
      affiliation.trim() &&
      authorize_text.trim() &&
      agree
    );
  }, [destinationId, title, authorize_to, position, affiliation, authorize_text, agree]);

  // useEffect(() => {
  //   if (confirmOpen && modalStep === 'success') {
  //     const t = setTimeout(() => {
  //       window.location.href = 'http://localhost:5173/tracking';
  //       // หรือถ้าใช้ react-router: const nav = useNavigate(); แล้ว nav('/tracking', { replace: true })
  //     }, 1000);
  //     return () => clearTimeout(t);
  //   }
  // }, [confirmOpen, modalStep]);

  useEffect(() => {
    if (confirmOpen && modalStep === 'success') {
      const timer = setTimeout(() => {
        setConfirmOpen(false);
        navigate('/tracking', { replace: true });
      }, 1000);

      return () => clearTimeout(timer); // ล้าง timer เมื่อ component unmount
    }
  }, [confirmOpen, modalStep, navigate]);


  const resetForm = () => {
    setDestination('');
    setTitle('');
    setAuthorize_to('');
    setPosition('');
    setAffiliation('');
    setAuthorize_text('');
    setNeedPresidentCard(false);
    setNeedUniversityHouse(false);
    setAgree(false);
    setAttachments([]);
  };

  // state ใหม่
  const [fileError, setFileError] = useState("");

  // ✅ ใหม่: เปลี่ยนไฟล์
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    const combined = [...attachments, ...files];

    if (combined.length > 5) {
      setFileError("ไม่สามารถแนบไฟล์เกิน 5 ไฟล์ได้");
      return; // ❌ ไม่อัปเดต state ถ้าเกิน
    }

    setFileError(""); // ✅ ล้าง error ถ้าไม่เกิน
    setAttachments(combined);

    // เคลียร์ค่า input เพื่อให้เลือกไฟล์ชื่อซ้ำได้ในครั้งถัดไป
    e.target.value = '';
  };

  // ✅ ใหม่: ลบไฟล์ทีละรายการ
  const handleRemoveFile = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };



  // send data to backend
  const sendPetition = async (e) => {
    e.preventDefault();
    setError('');
    setOkMsg('');

    if (!isValid) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วนและติ๊กยืนยันความถูกต้อง');
      return;
    }

    setLoading(true);
    try {
      // ใช้ FormData แทน JSON
      const formData = new FormData();
      formData.append('destinationId', destinationId);
      formData.append('title', title.trim());
      formData.append('authorize_to', authorize_to.trim());
      formData.append('position', position.trim());
      formData.append('affiliation', affiliation.trim());
      formData.append('authorize_text', authorize_text.trim());
      formData.append('needPresidentCard', needPresidentCard ? "true" : "false");
      formData.append('needUniversityHouse', needUniversityHouse ? "true" : "false");

      // แนบไฟล์หลายไฟล์
      attachments.forEach((file, idx) => {
        formData.append('attachments', file); 
        // backend จะได้ req.files['attachments']
      });

      // หลังจาก append ค่าเสร็จแล้ว
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const res = await fetch('http://localhost:3001/petition', {
        method: 'POST',
        headers: {
          Authorization: `${token}`, 
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || `ส่งคำร้องไม่สำเร็จ (HTTP ${res.status})`);
      } else {
        setOkMsg(data.message || 'บันทึกและส่งหนังสือมอบอำนาจสำเร็จ');
        setModalStep('success');
        resetForm();
      }
    } catch (err) {
      setError('Server error: ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  // เปลี่ยน handleSubmit เดิม ให้เปิดป็อปอัปแทน
  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setError('');
    setOkMsg('');
    if (!isValid) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วนและติ๊กยืนยันความถูกต้อง');
      return;
    }
    setModalStep('confirm');   // ✅ โหมดยืนยัน
    setConfirmOpen(true);
  };



  return (
    <div>
        <div className="font-kanit bg-[#F8F8F8]"><Navbar/></div>
    <div 
      style={{ 
        minHeight: '100vh',            
        backgroundColor: '#F9FAFE',    
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '40px 16px',
        overflow: 'hidden',              
        overscrollBehavior: 'none',
        fontFamily: "'Kanit', sans-serif"
      }}
    >
      <div 
        style={{ 
          maxWidth: 850, 
          width: '100%',
          padding: 24, 
          border: '1px solid #ddd', 
          borderRadius: 12, 
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          background: 'white',
          fontFamily: "'Kanit', sans-serif"
        }}
        
      >
       {/* header: ไอคอน + หัวข้อ + ปุ่มย้อนกลับ */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* ซ้าย: ไอคอน + หัวข้อ */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Icon/>
            <h1 style={{ fontSize: "28px", fontWeight: 500, margin: 0 }}>
              ยื่นคำขอมอบอำนาจ
            </h1>
          </div>
        </div>

        <h1 style={{ fontSize: '25px', fontWeight: 'bold', color: '#66009F' }}>
          รายละเอียดหนังสือมอบอำนาจ
        </h1>

        <hr />

        <form onSubmit={handleOpenConfirm}>
          {/* 1. เรื่อง */}
          <h4 style={{ marginTop: 16 }}>1. เรื่อง มอบอำนาจการดำเนินงานที่เกี่ยวข้องกับ
            <span className='text-[#FF0000]'> *</span>
          </h4>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ชื่อโครงการ เช่น คำขอมอบอำนาจการเบิกจ่าย/ติดต่อประสานงาน ฯลฯ"
            required
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #E5E5E5',
              backgroundColor: '#F7F7F7',
              borderRadius: 6
            }}
          />

          {/* 2. ผู้รับมอบอำนาจ */}
          <h4 style={{ marginTop: 16 }}>2. ผู้รับมอบอำนาจ
            <span className='text-[#FF0000]'> *</span>
          </h4>
          <input
            type="text"
            value={authorize_to}
            onChange={(e) => setAuthorize_to(e.target.value)}
            placeholder="ชื่อ-สกุล ผู้รับมอบอำนาจ"
            required
            maxLength={255}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #E5E5E5',
              backgroundColor: '#F7F7F7',
              borderRadius: 6
            }}
          />

          {/* 3. ตำแหน่ */}
          <h4 style={{ marginTop: 16 }}>3. ตำแหน่ง
            <span className='text-[#FF0000]'> *</span>
          </h4>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="ตำแหน่งของผู้รับมอบอำนาจ"
            required
            maxLength={255}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #E5E5E5',   // ✅ แก้ตรงนี้เป็นสตริงเดียว
              backgroundColor: '#F7F7F7',
              borderRadius: 6
            }}
          />

          {/* 4. สังกัด */}
          <h4 style={{ marginTop: 16 }}>4. สังกัด
            <span className='text-[#FF0000]'> *</span>
          </h4>
          <input
            type="text"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            placeholder="หน่วยงาน/สังกัดของผู้รับมอบอำนาจ"
            required
            maxLength={255}
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #E5E5E5',
              backgroundColor: '#F7F7F7',
              borderRadius: 6
            }}
          />

          {/* 5. รายละเอียดการมอบอำนาจ */}
          <h4 style={{ marginTop: 16 }}>5. ขอรับมอบหมายให้ดำเนินการในเรื่องใด
            <span className='text-[#FF0000]'> *</span>
          </h4>
          <textarea
            value={authorize_text}
            onChange={(e) => setAuthorize_text(e.target.value)}
            placeholder="ระบุรายละเอียดอำนาจหน้าที่ที่มอบให้ เช่น การเซ็นเอกสาร การติดต่อหน่วยงาน การดำเนินการเเทน ฯลฯ"
            required
            rows={6}
            style={{
              width: '100%',
              padding: 10,
              resize: 'vertical',
              border: '1px solid #E5E5E5',
              backgroundColor: '#F7F7F7',
              borderRadius: 6
            }}
          />

          {/* 6. หน่วยงานปลายทาง */}
          <h4 style={{ marginTop: 16 }}>6. หน่วยงานปลายทาง
            <span className='text-[#FF0000]'> *</span>
          </h4>
          <select
            value={destinationId}
            onChange={(e) => setDestination(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 10,
              border: '1px solid #E5E5E5',
              backgroundColor: '#F7F7F7',
              borderRadius: 6
            }}
          >
            <option value="">ต้องการส่งคำร้องไปยังหน่วยงานใด</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.des_name}
              </option>
            ))}
          </select>



          {/* เอกสารที่ต้องการใช้ประกอบ คำร้อง */}
          <h4 style={{ marginTop: 16 }}>7. เอกสารประกอบคำร้อง</h4>
          <div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={needPresidentCard}
                onChange={(e) => setNeedPresidentCard(e.target.checked)}
              />
              <span>สำเนาบัตรประจำตัวอธิการบดี (บัตรประจำตัวพนักงาน)</span>
            </label>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={needUniversityHouse}
                onChange={(e) => setNeedUniversityHouse(e.target.checked)}
              />
              <span>สำเนาทะเบียนบ้านมหาวิทยาลัยเชียงใหม่</span>
            </label>

            <p>หมายเหตุ : การพิจารณาให้เอกสารหรือไม่นั้น ขึ้นอยู่กับดุลพินิจของหน่วยงาน</p>
          </div>




          {/* ✅ ใหม่: แนบเอกสารเพิ่มเติม (หลายไฟล์) — อยู่ "ด้านบน" ช่องยืนยัน */}
          <h4 style={{ marginTop: 16 }}>8. แนบเอกสารเพิ่มเติม (ถ้ามี)</h4>
          <div
            style={{
              border: '1px dashed #CFCFCF',
              background: '#FAFAFA',
              borderRadius: 8,
              padding: 12
            }}
          >
            <input
              type="file"
              multiple
              onChange={handleFilesChange}
              // เลือกนามสกุลที่พบบ่อย ปรับได้ตามนโยบายองค์กร
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />

            {attachments.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  ไฟล์ที่เลือก ({attachments.length}/5):
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {attachments.map((f, idx) => (
                    <li key={idx} style={{ marginBottom: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ wordBreak: 'break-all' }}>
                        {f.name} ({Math.ceil(f.size / 1024)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        style={{
                          marginLeft: 'auto',
                          border: 'none',
                          background: '#F0F0F0',
                          padding: '4px 8px',
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                        title="ลบไฟล์นี้"
                      >
                        ลบ
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {fileError && (
              <div style={{ color: "red", marginTop: 6, fontSize: 14 }}>
                {fileError}
              </div>
            )}

          </div>



          {/* ยืนยันความถูกต้อง */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                required
              />
              <span>ยืนยันว่าข้อมูลที่กรอกถูกต้องและครบถ้วน</span>
            </label>
          </div>

          {/* แสดงสถานะ */}
          {error && (
            <div style={{ marginTop: 12, color: '#b00020' }}>
              {error}
            </div>
          )}
          {okMsg && (
            <div style={{ marginTop: 12, color: '#0a7d00' }}>
              {okMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            style={{
              marginTop: 20,
              padding: '12px 18px',
              borderRadius: 10,
              border: 'none',
              background: !isValid || loading ? '#9b9b9b' : '#66009F',
              color: 'white',
              cursor: !isValid || loading ? 'not-allowed' : 'pointer',
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform .06s ease, box-shadow .12s ease'
            }}
            onMouseEnter={(e) => {
              if (!isValid || loading) return;
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'กำลังส่ง…' : 'บันทึกและส่งหนังสือมอบอำนาจ'}
          </button>
        </form>

        {/* ===== Modal ยืนยันการส่ง ===== */}
        {confirmOpen && (
          <div
            onClick={() => modalStep === 'confirm' && setConfirmOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 420,
                maxWidth: '90vw',
                background: 'white',
                borderRadius: 12,
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                padding: 20,
                position: 'relative',
                fontFamily: "'Kanit', sans-serif",
                textAlign: 'center'
              }}
            >
              {/* ปุ่มปิด (แสดงเฉพาะตอน confirm) */}
              {modalStep === 'confirm' && (
                <button
                  aria-label="ปิด"
                  onClick={() => setConfirmOpen(false)}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'transparent',
                    border: 'none',
                    fontSize: 20,
                    cursor: 'pointer',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              )}

              {modalStep === 'confirm' ? (
                <>
                  <h2 style={{ margin: '0 28px 8px 0', fontSize: 22, fontWeight: 700 }}>
                    ยื่นคำมอบอำนาจ
                  </h2>
                  <div style={{ color: '#333', marginTop: 8, textAlign: 'left' }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 16, display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        wordBreak: "break-word" }}>เรื่อง {title || '…'}</div>
                    </div>
                    <div style={{ fontSize: 16 }}>
                      ส่งไปยัง&nbsp;
                      <span style={{ color: '#276EF1', fontWeight: 600 }}>
                        {destinationName || '-'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                    <button
                      type="button"
                      onClick={sendPetition}
                      disabled={loading}
                      style={{
                        background: '#66009F',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px 16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        fontSize: 15
                      }}
                    >
                      {loading ? 'กำลังส่ง…' : 'ยืนยันการส่ง'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>
                    ส่งหนังสือมอบอำนาจเรียบร้อยแล้ว
                  </h2>

                  {/* วงกลมเขียว + ติ๊กถูกสีขาว */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: '#22C55E', // เขียว
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(34,197,94,0.35)'
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, color: '#555' }}>
                    กำลังพาไปหน้าติดตามสถานะ…
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default FormPetition;




import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';


function FormPetition() {
  const token = localStorage.getItem("token");

  const [destinationId, setDestination] = useState('');
  const [title, setTitle] = useState('');
  const [authorize_to, setAuthorize_to] = useState('');
  const [position, setPosition] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [authorize_text, setAuthorize_text] = useState('');
  const [error, setError] = useState('');

  //ถ้าไม่ได้ Login เข้าไม่ได้
  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }
  
  const handlesubmitPetition = async e => {
    e.preventDefault();
    try{
      const petition = await fetch('http://localhost:3001/petition', {
        method: 'POST',
        headers:{
          'Authorization': `${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destinationId,title,authorize_to,position,affiliation,authorize_text
        })
      });

      const data = await petition.json();
      if (!petition.ok){
        setError(data.message || 'Submit form failed');
      }else{
        alert('Submit form successful');
      }
    } catch (err){
      setError('Server error');
    }
  };


  return (
    <div>
      <h1>Form Petition</h1>
      <form onSubmit={handlesubmitPetition}>
          <h4>กองที่ต้องการจะส่งคำร้องไป</h4>
          <select value={destinationId} onChange={ (e) => setDestination(parseInt(e.target.value))}>
            <option value="">-- กรุณาเลือกกอง --</option>
            <option value= {1}>กองกฏหมาย</option>
            <option value= {2}>สำนักงานบริหารงานวิจัย</option>
            <option value= {3}>ศูนย์บริหารพันธกิจสากล</option>
          </select>

          <h4>เรื่อง มอบอำนาจการดำเนินงานที่เกี่ยวข้องกับ ...</h4>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="เรื่อง มอบอำนาจการดำเนินงานที่เกี่ยวข้องกับ ..."
          />

          <h4>มอบอำนาจให้...</h4>
          <input
            type='text'
            value={authorize_to}
            onChange={(e) => setAuthorize_to(e.target.value)}
            required
            placeholder='มอบอำนาจให้...'
          />

          <h4>ตำแหน่งผู้รับมอบอำนาจ...</h4>
          <input
            type='text'
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            required
            placeholder='ตำแหน่งผู้รับมอบอำนาจ...'
          />

          <h4>สังกัดผู้รับมอบอำนาจ...</h4>
          <input
            type='text'
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            required
            placeholder='สังกัดผู้รับมอบอำนาจ...'
          />

          <h4>เป็นผู้มอบอำนาจในการ...</h4>
          <input 
            type="text"
            value={authorize_text}
            onChange={(e) => setAuthorize_text(e.target.value)}
            required
            placeholder='มอบอำนาจในเรื่อง...' 
          />

          <br/>
          <br/>
          <button type="submit">ส่งคำร้อง</button>
      </form>    
    </div>
  )

}

export default FormPetition;

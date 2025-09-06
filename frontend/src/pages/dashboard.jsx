import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


function Dashboard() {
  const [userInfo, setUserInfo] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  //ถ้าไม่ได้ Login เข้าไม่ได้
  if (!token) {
    alert("Please Login or SignIn First!!!");
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetch('http://localhost:3001/auth/user', {
      headers: {
        'Authorization': `${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUserInfo(data);
      })
      .catch(err => {
        console.error(err);
      });
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href='/login';
  }

  const ClicktoPetition = () => {
    navigate('/formpetition');
  }

  const ClicktoWatchPetition = () =>{
    navigate('/petition');
  }


  if (!userInfo) {
    return <div>Loading...</div>;  // หรือ แสดง loading ขณะรอข้อมูล
  }


  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome Home</h1>
      <p> Token : {token} </p>
      <p>Department: {userInfo.department_name || "No department data"}</p>
      <p>Email: {userInfo.email}</p>
      <p>Firstname: {userInfo.firstname}</p>
      <p>Lastname: {userInfo.lastname}</p>
      <p>Role: {userInfo.role_n || "No role data"}</p>
      <button onClick={logout}>Logout</button>


      <div>
        <button onClick={ClicktoPetition}> กรอกคำร้อง </button>
        <button onClick={ClicktoWatchPetition}>ติดตามเอกสารคำร้อง </button>
        <button>คำร้องที่ส่งเข้ามา</button>
        <button>คำร้อง(อนุมัติ)</button>
      </div>
    </div>
  );
}

export default Dashboard;


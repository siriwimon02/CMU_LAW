import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function petition() {
    const [documentAll, setdocumentAll] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const token = localStorage.getItem("token");


    //ถ้าไม่ได้ Login เข้าไม่ได้
    if (!token) {
        alert("Please Login or SignIn First!!!");
        return <Navigate to="/login" replace />;
    }

    useEffect(() =>{
        async function getDocandUser() {
            const res1 = await fetch('http://localhost:3001/auth/user', {
                headers: { 'Authorization': `${token}` }
            })
            const user = await res1.json();

            const res2 = await fetch('http://localhost:3001/petition', {
                headers: { 'Authorization': `${token}` }
            });
            const document = await res2.json();

            setUserInfo(user);
            setdocumentAll(document);
        }
        getDocandUser();
    },[token]);

    const homepage = () =>{
        window.location.href='/home';
    }

    console.log(documentAll);

    if (!userInfo && !documentAll) {
        return <div>Loading...</div>;  // หรือ แสดง loading ขณะรอข้อมูล
    }
    

    return (
        <div>
            <h1>petition</h1>
            <button onClick={homepage}>home</button>
            <p> Token : {token} </p>
            <p>Department: {userInfo.department_name || "No department data"}</p>
            <p>Email: {userInfo.email}</p>
            <p>Firstname: {userInfo.firstname}</p>
            <p>Lastname: {userInfo.lastname}</p>
            <p>Role: {userInfo.role_n || "No role data"}</p>


            <h3>Document Petition</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {documentAll.map(doc => (
                <div
                key={doc.id}
                style={{
                    border: "1px solid #ccc",
                    borderRadius: "10px",
                    padding: "16px",
                    width: "300px",
                    backgroundColor: "#f5f8ff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    fontFamily: "Arial, sans-serif"
                }}
                >
                <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "#1a237e" }}>
                    {doc.title}
                </h2>
                <p><strong>Status:</strong> {doc.status_name}</p>
                <p><strong>Destination:</strong> {doc.destination_name}</p>
                <p><strong>Department:</strong> {doc.department_name}</p>
                <p><strong>Affiliation:</strong> {doc.affiliation}</p>
                <p><strong>Position:</strong> {doc.position}</p>
                <p><strong>Authorize to:</strong> {doc.authorize_to}</p>
                <p><strong>Authorize Text:</strong> {doc.authorize_text}</p>
                <p><strong>Date of Signing:</strong> {doc.date_of_signing ?? "ยังไม่ระบุ"}</p>
                <p><strong>Created At:</strong> {new Date(doc.createdAt).toLocaleDateString()}</p>

                <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                    <button style={{ flex: 1, padding: "8px", cursor: "pointer" }}>Edit</button>
                    <button style={{ flex: 1, padding: "8px", cursor: "pointer", backgroundColor: "#e53935", color: "white", border: "none", borderRadius: "4px" }}>
                    Delete
                    </button>
                    <button style={{ flex: 1, padding: "8px", cursor: "pointer", backgroundColor: "#3949ab", color: "white", border: "none", borderRadius: "4px" }}>
                    Send to destination
                    </button>
                </div>
                </div>
            ))}
            </div>



        </div>
    )
};

export default petition;
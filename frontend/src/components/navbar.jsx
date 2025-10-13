import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Navbar() {
    const [userInfo, setUserInfo] = useState(null);
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

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
        navigate("/login");
    }

    if (!userInfo) {
        return <div>Loading...</div>;
    }


    return (
        <div>
            <div className="flex justify-between items-center w-full px-5 py-4">
                <img
                src="/images/Logo.svg"
                alt="Logo"
                className="w-[150px] h-[50px] object-contain"
                />

                {/* กลุ่มโปรไฟล์ + ปุ่มออกจากระบบ */}
                <div className="flex items-center gap-4">
                {/* ชื่อและอีเมล */}
                <div className="text-right">
                    <p className="text-lg font-semibold">
                    {userInfo.firstname} {userInfo.lastname}
                    </p>
                    <p className="text-sm text-gray-500">{userInfo.email}</p>
                </div>

                {/* รูปโปรไฟล์ */}
                <svg
                xmlns="http://www.w3.org/2000/svg" 
                width={40} 
                height={40}
                viewBox="0 0 24 24"
                class="border border-[#B9B9B9] rounded-full">
                <path fill="currentColor" 
                fillRule="evenodd"
                d="M8 7a4 4 0 1 1 8 0a4 4 0 0 1-8 0m0 6a5 5 0 0 0-5 5a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3a5 5 0 0 0-5-5z"
                clipRule="evenodd">
                </path></svg>

                {/* ปุ่มออกจากระบบ */}
                <div className="flex items-center px-4 py-2 hover:scale-105 border border-[#B9B9B9] rounded-lg cursor-pointer hover:bg-[#f5f5f5] transition"
                onClick={logout}
                >
                    <p className="text-[#66009F] font-bold text-base">ออกจากระบบ</p>
                </div>
                </div>
            </div>
            <div className="bg-[#66009F] w-full h-64 mt-2 flex flex-col items-center justify-center text-center px-4">
                    <p className="text-white font-bold text-3xl">
                    ระบบบริหารจัดการหนังสือมอบอำนาจออนไลน์
                    </p>
                    <p className="text-white text-lg mt-4">
                    จัดการคำขอมอบอำนาจ ติดตามสถานะ และอนุมัติเอกสารได้อย่างมีประสิทธิภาพ
                    </p>
                </div>  
        </div>
    );
};

export default Navbar;


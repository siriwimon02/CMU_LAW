import { useNavigate,  } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

function Tracking() {
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

    return(
        <>
            <header className="bg-white text-gray-800 px-5 py-4">
                    
                </header>

                <div className="bg-[#66009F] w-full h-64 mt-2 flex flex-col items-center justify-center text-center px-4">
                    <p className="text-white font-bold text-3xl">
                    ระบบบริหารจัดการหนังสือมอบอำนาจออนไลน์
                    </p>
                    <p className="text-white text-lg mt-4">
                    จัดการคำขอมอบอำนาจ ติดตามสถานะ และอนุมัติเอกสารได้อย่างมีประสิทธิภาพ
                    </p>
                </div>  
        </>

    )
}

export default Tracking
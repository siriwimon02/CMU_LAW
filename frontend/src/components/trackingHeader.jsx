import React from 'react';
import { useNavigate } from 'react-router-dom';

function Tracking() {
    const navigate = useNavigate();
    const ClicktoDashboard = () => {
        navigate('/dashboard');
    }

    return(
        <>
            <header className="bg-white text-gray-800 px-5 py-4">
                    <div className="mx-auto  flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                        src="/images/Logo.svg"
                        alt="Logo"
                        className="w-[150px] h-[50px] object-contain"
                        />
                    </div>
                    <button
                    onClick={ClicktoDashboard}
                    className="bg-[#66009F] w-10 h-10 flex items-center justify-center rounded-xl shadow hover:bg-[#4A0073] transition"
                    title="ย้อนกลับ"
                    >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                    >
                        <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    </button>

                    </div>
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
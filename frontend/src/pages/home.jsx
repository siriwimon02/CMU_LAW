import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Home() {
    return (
        <div>
            <div className="fixed top-6 inset-x-0 mx-auto flex items-center gap-3 z-50 w-fit px-4">
                <img
                    src="/images/Logo.svg"
                    alt="Logo"
                    className="w-[180px] h-[69px] object-contain"
                />
                <h1 className="text-3xl font-bold text-black ml-5">
                    Chiang Mai University Project Authorization
                </h1>
            </div>

            <div className="max-w-[1440px] w-full min-h-[590px] mx-auto bg-[url('/images/home_background.jpg')] bg-no-repeat bg-center bg-cover mt-30">
                <div className="p-10 text-white">
                    <h1 className="text-5xl font-bold text-center mt-10">ระบบบริหารจัดการหนังสือมอบอำนาจออนไลน์</h1>
                    <h2 className="text-2xl text-center mt-10">จัดการคำขอมอบอำนาจ ติดตามสถานะ และอนุมัติเอกสารได้อย่างมีประสิทธิภาพ</h2>
                </div>
                <div className="flex justify-center items-end h-75">
                    <button className="w-[493px] h-[80px] rounded-[20px] text-[#66009F] text-3xl text-bold flex items-center justify-center bg-white 
                    font-medium shadow hover:bg-[#66009F]  hover:text-white transition-colors duration-300">
                        Login With CMU Account
                    </button>
                </div>
            </div>
        </div>


    )
};

export default Home;
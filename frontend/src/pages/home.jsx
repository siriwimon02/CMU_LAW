import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Home() {
    return (
        <div>
            <img
                src="/images/Logo.svg"
                alt="Logo"
                className="fixed top-6 left-25 w-[180px] h-[69px] object-contain z-50"
            />
            <div className="fixed top-10 right-20 object-contain z-50">
                <h1 className="text-3xl font-bold text-center">Chiang Mai University Project Authorization</h1>
            </div>
            <div className="max-w-[1440px] w-full min-h-[590px] mx-auto bg-[url('/images/home_background.jpg')] bg-no-repeat bg-center bg-cover mt-30">
                <div className="p-10 text-white">
                    <h1 className="text-5xl font-bold text-center mt-20">ระบบบริหารจัดการหนังสือมอบอำนาจออนไลน์</h1>
                </div>
                <div className="text-white">
                    <h1 className="text-2xl font-bold text-center">จัดการคำขอมอบอำนาจ ติดตามสถานะ และอนุมัติเอกสารได้อย่างมีประสิทธิภาพ</h1>
                </div>
            </div>
        </div>


    )
};

export default Home;
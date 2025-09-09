import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
// import React from 'react';

function Home() {
    return (
        <div>
            <div className="min-h-screen flex flex-col bg-gray-100">

                {/* header (logo+title) */}
                <div className="flex justify-center items-center pt-8 pb-4"> {/* Added pb-4 for a small gap */}
                    <img
                        src="/images/Logo.svg"
                        alt="Logo"
                        className="w-[180px] h-[69px] object-contain"
                    />
                    <h1 className="font-kanit text-2xl sm:text-3xl text-black text-center ml-5">
                        Chiang Mai University Project Authorization
                    </h1>
                </div>
                {/* header (logo+title) */}

                {/* Background Section */}
                <div className="w-full flex-grow bg-[url('/images/bg.jpg')] bg-no-repeat bg-center bg-cover mt-6 shadow-lg flex 
                    flex-col justify-between">

                    {/* Text */}
                    <div className="p-6 sm:p-10 text-white pt-10 sm:pt-20"> {/* Added pt-10 sm:pt-20 for top padding */}
                        <h1 className="font-kanit text-3xl sm:text-5xl font-bold text-center mt-6 sm:mt-10">
                            ระบบบริหารจัดการหนังสือมอบอำนาจออนไลน์
                        </h1>
                        <h2 className="font-kanit text-lg sm:text-2xl text-center sm:mt-10">
                            จัดการคำขอมอบอำนาจ ติดตามสถานะ และอนุมัติเอกสารได้อย่างมีประสิทธิภาพ
                        </h2>
                    </div>

                    {/* button */}
                    <div className="flex justify-center items-end p-6 sm:p-10 pb-10 sm:pb-20"> {/* Added pb-10 sm:pb-20 for bottom padding */}
                        <button className="font-kanit w-full max-w-[493px] h-[60px] sm:h-[80px] rounded-[20px] text-[#66009F] text-xl sm:text-3xl 
                            flex items-center justify-center bg-white shadow hover:bg-[#66009F] hover:text-white transition-colors duration-300">
                            Login With CMU Account
                        </button>
                    </div>
                {/* Background Section */}

                </div>
            </div>
        </div>
    );
};

export default Home;


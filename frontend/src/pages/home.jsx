import React from 'react';

function Home() {
    return (
        <div>
            <div className="min-h-screen flex flex-col bg-gray-100">

                {/* header (logo+title) */}
                <div className="flex justify-center items-center pt-8 pb-4">
                    <img
                        src="/images/Logo.svg"
                        alt="Logo"
                        className="w-[160px] h-[60px] object-contain"
                    />
                    <h1 className="font-kanit text-2xl sm:text-3xl text-black text-center ml-5">
                        Chiang Mai University Project Authorization
                    </h1>
                </div>
                {/* header */}

                <div className="w-full flex-grow flex justify-center">
                    <div className="w-full max-w-[1600px] h-[500px] bg-[url('/images/bg.jpg')] bg-no-repeat bg-center bg-cover shadow-lg flex flex-col justify-between rounded-xl overflow-hidden">
                    
                    {/* ข้อความ */}
                    <div className="p-6 sm:p-10 text-white pt-10 sm:pt-20">
                    <h1 className="font-kanit text-3xl sm:text-5xl font-bold text-center mt-6 sm:mt-10">
                        ระบบบริหารจัดการหนังสือมอบอำนาจออนไลน์
                    </h1>
                        <h2 className="font-kanit text-lg sm:text-2xl text-center sm:mt-10">
                            จัดการคำขอมอบอำนาจ ติดตามสถานะ และอนุมัติเอกสารได้อย่างมีประสิทธิภาพ
                        </h2>
                    </div>

                        {/* ปุ่ม Login */}
                        <div className="flex justify-center items-end p-6 sm:p-10 pb-10 sm:pb-20">
                        <button className="font-kanit w-full max-w-[350px] h-[60px] rounded-xl bg-white text-[#66009F] text-xl font-semibold shadow hover:bg-[#66009F] hover:text-white transition-colors duration-300">
                            Login With CMU Account
                        </button>
                        </div>
                    </div>
                </div>

                {/* เพิ่มพื้นที่สีขาวด้านล่าง */}
                <div className="h-20 bg-gray-100"></div>
            </div>
        </div>
    );
};

export default Home;

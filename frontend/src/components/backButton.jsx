import React from "react"
import { useNavigate } from 'react-router-dom';


function Back() {
    const navigate = useNavigate();
    const ClickBack = () => {
        navigate(-1);
    }
    return(
        <button
            onClick={ClickBack}
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


    )
}

export default Back
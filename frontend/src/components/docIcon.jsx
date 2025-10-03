import React from "react"

function Icon() {
    return(
        <div className="bg bg-[#E0E5F9] w-11 h-11 p-2 rounded-lg flex items-center justify-center ">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={40} 
                    height={40} 
                    viewBox="0 0 24 24"
                    className="text-black" 
                  >
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="M14.25 2.5a.25.25 0 0 0-.25-.25H7A2.75 2.75 0 0 0 4.25 5v14A2.75 2.75 0 0 0 7 21.75h10A2.75 2.75 0 0 0 19.75 19V9.147a.25.25 0 0 0-.25-.25H15a.75.75 0 0 1-.75-.75zm.75 9.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5zm0 4a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1 0-1.5z"
                      clipRule="evenodd"
                    ></path>
                    <path
                      fill="currentColor"
                      d="M15.75 2.824c0-.184.193-.301.336-.186q.182.147.323.342l3.013 4.197c.068.096-.006.22-.124.22H16a.25.25 0 0 1-.25-.25z"
                    ></path>
                </svg>
             </div>
    )
}

export default Icon
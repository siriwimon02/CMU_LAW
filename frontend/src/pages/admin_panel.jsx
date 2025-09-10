import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';


function Admin_Panel() {
    const [search, setSearch] = useState("");

    const users = Array.from({ length: 20 }).map((_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@cmu.ac.th`,
        role: `Role ${i + 1}`,
    }));

    // ฟิลเตอร์ตามคำค้นหา
    const filteredUsers = users.filter(
        (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) || 
        user.role.toLowerCase().includes(search.toLowerCase())
    );
    
    return (
        <div className="font-kanit bg-[#F7F7FD] min-h-screen flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-md p-6 w-[75vw] h-[75vh] flex flex-col">
                <h1 className="ml-5 text-xl">การจัดการสิทธิ์ผู้ใช้งาน</h1>
                <div className="relative w-full sm:w-80 m-5">
                <input
                    type="text"
                    placeholder="ค้นหาด้วยชื่ออีเมลหรือ สิทธิ์"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
                <div className="overflow-y-auto flex-1 border rounded-lg m-5">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-100 sticky top-0">
                    <tr >
                        <th className="px-4 py-2 text-center text-gray-700">ชื่อผู้ใช้</th>
                        <th className="px-4 py-2 text-center text-gray-700">อีเมล</th>
                        <th className="px-4 py-2 text-center text-gray-700">สิทธิ์ปัจจุบัน</th>
                        <th className="px-4 py-2 text-center text-gray-700">การจัดการ</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredUsers.map((user, i) => (
                        <tr key={i} className="border-t text-center">
                        <td className="px-4 py-2">{user.name}</td>
                        <td className="px-4 py-2">{user.email}</td>
                        <td className="px-4 py-2">
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">
                            {user.role}
                            </span>
                        </td>
                        <td className="px-4 py-2">
                            <button className="text-purple-600 hover:underline">
                                แก้ไขสิทธิ์
                            </button>
                            <button className="text-purple-600 hover:underline ml-8">
                                ลบ
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            </div>
    )
}


export default Admin_Panel;
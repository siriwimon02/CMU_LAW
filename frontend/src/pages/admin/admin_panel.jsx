import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import AddUserModal from '../../components/addUserModal';
import EditUserRole from '../../components/editUserRole';
import Navbar from '../../components/navbar'

function Admin_Panel() {
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [refreshing, setRefreshing] = useState(false);


    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    if (!token) {
        alert("Please Login or SignIn First!!!");
        return <Navigate to="/login" replace />;
    }

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                console.log("TOKEN:", token);
                const res = await fetch("/petitionAdmin/api/user", {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token
                    }
                });
                if (!res.ok) {
                    const errText = await res.text();
                    console.error("Error fetching users:", errText);
                    throw new Error("Failed to fetch users");
                }
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                console.error(err);
                navigate("/login");
            }
        };
        if (token) {
            fetchUsers();
        } else {
            navigate("/login");
        }
    }, [token, navigate]);


    const refreshUser = useCallback(async () => {
        setRefreshing(true);
        try {
            const res = await fetch(`/petitionAdmin/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            const safe = (u) => ({ ...u, role: u.role ?? { id: u.rId ?? null, role_name: '' } });
            console.log(data)
            setUsers(Array.isArray(data) ? data.map(safe) : []);
        } catch (e) {
            console.error('refreshUser error:', e);
        } finally {
            setRefreshing(false);
        }
    }, [token]);


    // const handleDeleteUser = async (userId) => {
    //     if (!window.confirm('คุณต้องการลบผู้ใช้นี้?')) {
    //         return;
    //     }

    //     try {
    //         const res = await fetch(`/petitionAdmin/delete_user/${userId}`, {
    //             method: 'DELETE',
    //             headers: {
    //                 "Authorization": token
    //             }
    //         });

    //         if (!res.ok) throw new Error('Failed to delete user');

    //         setUsers(users.filter(user => user.id !== userId));
    //         alert('ลบผู้ใช้สำเร็จ');
    //     } catch (err) {
    //         console.error('Error deleting user:', err);
    //         alert('ลบผู้ใช้ไม่สำเร็จ');
    //     }
    // };

    
    const filteredUsers = users.filter(
        (user) =>
        user.firstname.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) || 
        user.role.role_name.toLowerCase().includes(search.toLowerCase())
    );

        
    const getRoleColor = (roleName) => {
        switch(roleName) {
            case 'user':
                return 'bg-[#efefef] text-[#686868]'; // เทา
            case 'auditor':
                return 'bg-[#FFFBEB] text-[#CA8A04]'; // เหลือง
            case 'spv_auditor':
                return 'bg-[#FEE2E2] text-[#DC2626]'; // สีแดง
             case 'head_auditor':
                return 'bg-[#FFEDD5] text-[#EA580C]'; // ส้ม
            case 'admin':
                return 'bg-[#F1EDFF] text-[#66009F]'; // สีม่วง
        }
    };

    const getDepColor = (roleName) => {
        switch(roleName) {
            case 'กองกฎหมาย':
                return 'bg-[#eaebff] text-[#2025b2]'; // น้ำเงิน
            case 'สำนักงานบริหารงานวิจัย':
                return 'bg-[#ddf3ff] text-[#3a8db7]'; // ฟ้า
            case 'ศูนย์บริหารพันธกิจสากล':
                return 'bg-[#F0FFF0] text-[#17a897]'; // สีเขียว
            default:
                return 'bg-[#efefef] text-[#686868]'; //เทา
        }
    };

    return (
        <div className='min-h-screen font-kanit bg-[#F8F8F8] pb-10'>
            <Navbar />
            <div className="flex items-center justify-center mt-5">
                <div className="bg-white rounded-2xl shadow-md p-6 w-[90vw] h-[75vh] flex flex-col">
                    <h1 className="ml-5 text-xl font-bold">การจัดการสิทธิ์ผู้ใช้งาน</h1>
                    <div className="relative w-full m-5 mb-3 flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="ค้นหาด้วยชื่ออีเมลหรือ สิทธิ์"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 placeholder-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="absolute left-3 top-2.5 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                                </svg>
                            </span>
                        </div>

                        <div className="flex items-center justify-center space-x-2 ml-5 mr-10">
                            <button onClick={() => setShowModal(true)}
                            className='flex items-center gap-1 text-white text-base font-semibold bg-[#66009F] border border-[#A6A6A6] shadow-md rounded-lg px-6 py-3 hover:bg-white hover:text-[#66009F] transition-colors duration-300'>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                </svg>
                                เพิ่มผู้ใช้
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 m-5">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-[#F1EEFF] sticky top-0">
                        <tr >
                            <th className="px-4 py-2 text-center text-gray-700">ชื่อผู้ใช้</th>
                            <th className='px-4 py-2 text-center text-gray-700'>หน่วยงาน</th>
                            <th className="px-4 py-2 text-center text-gray-700">อีเมล</th>
                            <th className="px-4 py-2 text-center text-gray-700">สิทธิ์ปัจจุบัน</th>
                            <th className="px-4 py-2 text-center text-gray-700">การจัดการ</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUsers.map((user, i) => (
                            <tr key={i} className="hover:bg-gray-50 border-gray-300 border-t text-center">
                            <td className="px-6 py-2">{user.firstname}</td>
                            <td className="px-6 py-2">
                                <span className={`px-2 py-1 rounded-full text-sm ${getDepColor(user.department.department_name)}`}>
                                    {user.department.department_name}
                                </span>
                            </td>
                            <td className="px-6 py-2">{user.email}</td>
                            <td className="px-6 py-2">
                                <span className={`px-2 py-1 rounded-full text-sm ${getRoleColor(user.role.role_name)}`}>
                                {user.role.role_name}
                                </span>
                            </td>
                            <td className="text-center px-4 py-2">
                                <div className="flex items-center justify-center space-x-2">
                                    <button onClick={() => {
                                        setSelectedUser(user);
                                        setShowEditModal(true);
                                    }}
                                    className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-[#66009F] border shadow-sm rounded-lg hover:bg-white hover:text-[#66009F] transition-colors duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4 mr-1">
                                            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                                            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                                        </svg>
                                        แก้ไขสิทธิ์
                                    </button>

                                    {/* <button onClick={() => handleDeleteUser(user.id)}
                                    className="text-[#66009F] hover:text-red-500 hover:scale-105 transition-colors duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                                        </svg>
                                    </button> */}
                                </div>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>

            <AddUserModal
                isVisible={showModal}
                onClose={() => setShowModal(false)}
                onAddUser={async () => {
                    await refreshUser();          // ✅ ดึงรายการใหม่จาก backend ที่ส่ง role ครบแล้ว
                    setShowModal(false);          // ปิด modal หลังรีเฟรชเสร็จ
                }}
            />

            <EditUserRole
                isVisible={showEditModal}
                onClose={async () => { setShowEditModal(false); await refreshUser(); }}
                user={selectedUser}
                onUpdate={async () => {
                    await refreshUser();    // ✅ ดึงรายการใหม่จาก backend (ซึ่งควร select role มาด้วย)
                }}
            />
        </div>
    );
};


export default Admin_Panel;
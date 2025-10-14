import React, { useEffect, useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    firstname: '',
    lastname: '',
    departmentName: '',
    role_id: ''
  });

  const [roleOfUser, setRoleOfUser] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  //ดึงdata role
  useEffect(() => {
    async function getRoleUser() {
      try {
        const res1 = await fetch("http://localhost:3001/api/roleofuser");
        if (!res1.ok) throw new Error("Network response was not ok");
        const role = await res1.json();
        setRoleOfUser(role);
      } catch (err) {
        console.error("Error fetching role:", err);
      }
    }
    getRoleUser();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "role_id" ? Number(value) : value   // แปลงเป็น int ถ้าเป็น role_id
    }));
  };

  //ส่งdata
  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Register failed');
      } else {
        localStorage.setItem('token', data.token);
        alert('Register successful');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form 
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Register</h2>

        <input 
          type="email" 
          name="email" 
          value={form.email} 
          onChange={handleChange} 
          required 
          placeholder="Email CMU"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />
        
        <input 
          type="text" 
          name="firstname" 
          value={form.firstname} 
          onChange={handleChange} 
          required 
          placeholder="First name"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />
        
        <input 
          type="text" 
          name="lastname" 
          value={form.lastname} 
          onChange={handleChange} 
          required 
          placeholder="Last Name"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />
                
        <input 
          type="text" 
          name="departmentName"  
          value={form.departmentName}
          onChange={handleChange}
          required 
          placeholder="Department"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button 
          disabled={loading}
          className="w-full py-2 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

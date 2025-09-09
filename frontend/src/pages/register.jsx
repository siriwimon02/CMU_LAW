import React, { useEffect, useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    firstname: '',
    lastname: '',
    department: '',
    role_id: ''
  });

  const [roleOfUser, setroleOfuser] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  useEffect( () => {
    async function getRoleUser() {
      const res1 = await fetch('http://localhost:3001/api/roleofuser', {
        
      })
    }
  });



  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
    <form onSubmit={handleRegister}>
      <h2>Register</h2>
      <h1 className="font-kanit text-3xl">สวัสดี Tailwind</h1>
      <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Email CMU" />
      <input type="text" name="firstname" value={form.firstname} onChange={handleChange} required placeholder="First name" />
      <input type="text" name="lastname" value={form.lastname} onChange={handleChange} required placeholder="Last Name" />
      <input type="text" name="department" value={form.department} onChange={handleChange} required placeholder="Department" />

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button disabled={loading}>{loading ? 'Loading...' : 'Register'}</button>
    </form>
  );
}


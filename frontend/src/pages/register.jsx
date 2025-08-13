import React, { useState } from 'react';

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="Email" />
      <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Password" />
      <input type="text" name="firstname" value={form.firstname} onChange={handleChange} required placeholder="First Name" />
      <input type="text" name="lastname" value={form.lastname} onChange={handleChange} required placeholder="Last Name" />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button disabled={loading}>{loading ? 'Loading...' : 'Register'}</button>
    </form>
  );
}


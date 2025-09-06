import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // <-- import useNavigate


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();  // <-- กำหนด navigate

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
      } else {
        localStorage.setItem('token', data.token);
        alert('Login successful');
        navigate("/dashboard");
      }

    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };


  
  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button disabled={loading}>{loading ? 'Loading...' : 'Login'}</button>
    </form>
  );
}



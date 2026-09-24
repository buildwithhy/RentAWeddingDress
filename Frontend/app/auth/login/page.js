'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function LoginPage() {
  const router = useRouter();
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!contact || !password) {
      toast.error('Please enter phone number and password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Contact: contact,
          Password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.Message || 'Login failed');
        return;
      }

      localStorage.setItem('user', JSON.stringify({
        userId: data.UserId,
        name: data.Name,
        contact: data.Contact,
      }));

      toast.success(`Welcome back, ${data.Name}!`);
      router.push('/home');

    } catch {
      toast.error('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ───────────── LEFT HERO ───────────── */}
      <div style={{
        flex: 1,
        backgroundImage: `url('/images/Hero.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '60px'
      }} className="hide-mobile">

        {/* Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3))'
        }} />

        <div style={{ position: 'relative', color: 'white', maxWidth: '500px' }}>
          {/* <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(40px,5vw,64px)',
            lineHeight: 1.1,
            marginBottom: '20px'
          }}>
            Rent Your <br />
            <span style={{ color: '#C9A96E' }}>Dream Look</span>
          </h1> */}

          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.7
          }}>
            {/* Pakistan's premier wedding dress rental platform. */}
          </p>
        </div>
      </div>

      {/* ───────────── RIGHT FORM ───────────── */}
      <div style={{
        flex: 1,
        background: '#FAF7F2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>

        <div style={{ width: '100%', maxWidth: '420px' }}>

          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '36px',
            marginBottom: '10px'
          }}>
            Welcome Back
          </h2>

          <p style={{ color: '#7A6E72', marginBottom: '30px' }}>
            Sign in to find your perfect dress.
          </p>

          <form onSubmit={handleLogin}>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>
                Phone Number
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="03xxxxxxxxx"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #E8E0E4',
                  background: 'white',
                  marginTop: '6px'
                }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #E8E0E4',
                  background: 'white',
                  marginTop: '6px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#1A1218',
                color: 'white',
                padding: '16px',
                border: 'none',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Signing In...' : 'Log In'}
            </button>

          </form>

          <p style={{ marginTop: '20px', fontSize: '13px', color: '#7A6E72' }}>
            Don't have an account?{' '}
            <Link href="/auth/register" style={{ color: '#B5485A' }}>
              Sign Up
            </Link>
          </p>

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>

    </div>
  );
}
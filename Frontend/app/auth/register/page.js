'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    contact: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  // ✅ If already logged in, go home
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) router.push('/home');
  }, [router]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!form.name || !form.contact || !form.password || !form.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 3) {
      toast.error('Password must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Name: form.name,
          Contact: form.contact,
          Password: form.password,
          ConfirmPassword: form.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.Message || data?.message || 'Registration failed');
        return;
      }

      toast.success('Account created! Please login now');
      router.push('/auth/login');
    } catch {
      toast.error('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* ───────────── LEFT HERO (same as login) ───────────── */}
      <div
        style={{
          flex: 1,
          backgroundImage: `url('/images/Hero.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: '60px',
        }}
        className="hide-mobile"
      >
        {/* Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.72), rgba(0,0,0,0.28))',
          }}
        />

        {/* Optional text (kept subtle like your login page) */}
       
      </div>

      {/* ───────────── RIGHT FORM (same style as login) ───────────── */}
      <div
        style={{
          flex: 1,
          background: '#FAF7F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h2
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '36px',
              marginBottom: '10px',
            }}
          >
            Create Account
          </h2>

          <p style={{ color: '#7A6E72', marginBottom: '30px' }}>
            Sign up to start renting your perfect dress.
          </p>

          <form onSubmit={handleRegister}>
            {/* Full Name */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#7A6E72',
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Enter your full name"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #E8E0E4',
                  background: 'white',
                  marginTop: '6px',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#B5485A')}
                onBlur={(e) => (e.target.style.borderColor = '#E8E0E4')}
              />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#7A6E72',
                }}
              >
                Phone Number
              </label>
              <input
                type="text"
                value={form.contact}
                onChange={(e) => set('contact', e.target.value)}
                placeholder="03xxxxxxxxx"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #E8E0E4',
                  background: 'white',
                  marginTop: '6px',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#B5485A')}
                onBlur={(e) => (e.target.style.borderColor = '#E8E0E4')}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#7A6E72',
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Create password"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #E8E0E4',
                  background: 'white',
                  marginTop: '6px',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#B5485A')}
                onBlur={(e) => (e.target.style.borderColor = '#E8E0E4')}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '25px' }}>
              <label
                style={{
                  fontSize: '11px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#7A6E72',
                }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #E8E0E4',
                  background: 'white',
                  marginTop: '6px',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#B5485A')}
                onBlur={(e) => (e.target.style.borderColor = '#E8E0E4')}
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
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '20px', fontSize: '13px', color: '#7A6E72' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#B5485A' }}>
              Log In
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
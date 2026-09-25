'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';

// ============================================================================
// COMPONENT: Navbar
// DESCRIPTION:
//   Global sticky header with responsive mobile drawer navigation:
//   - Shows Links: Home, Browse Dresses, List Dress, My Rentals, My Bookings
//   - Shows user status, Owner Credit or Penalty balances
//   - Login / Logout actions
//
// BACKEND API REFERENCES:
//   - GET /api/bookings/credit/{userId} -> Refresh user credit & penalty balances
//
// DATABASE TABLES LINKED:
//   - dbo.Users (CreditBalance)
// ============================================================================

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (u) {
        try {
          const parsed = JSON.parse(u);
          setUser(parsed);
          // Refresh balance from backend
          if (parsed.userId) {
            fetch(`/api/bookings/credit/${parsed.userId}`)
              .then(r => r.ok ? r.json() : null)
              .then(data => {
                if (data) {
                  const credit = data.CreditBalance ?? 0;
                  const updated = {
                    ...parsed,
                    penaltyBalance: credit < 0 ? Math.abs(credit) : 0,
                    ownerCredit: credit > 0 ? credit : 0,
                  };
                  setUser(updated);
                  localStorage.setItem('user', JSON.stringify(updated));
                }
              })
              .catch(() => {});
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out!');
    router.push('/auth/login');
  };

  // Auth pages pe navbar mat dikhao
  if (pathname.startsWith('/auth')) return null;

  const links = [
    { href: '/home', label: 'Home' },
    { href: '/browse', label: 'Dresses' },
    { href: '/upload-dress', label: 'List Dress' },
    { href: '/my-rentals', label: 'My Rentals' },
    { href: '/my-bookings', label: 'My Bookings' },
  ];

  return (
    <>
      <nav
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E0E4',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 5%',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              background: '#1A1218',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <path
                d="M20 34s-14-8.5-14-18a8 8 0 0116 0 8 8 0 0116 0c0 9.5-14 18-14 18z"
                fill="white"
                opacity="0.9"
              />
              <circle cx="20" cy="16" r="4" fill="white" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '20px',
              fontWeight: 600,
              color: '#1A1218',
            }}
          >
            Wed<span style={{ color: '#B5485A' }}>Dress</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <ul
          style={{ display: 'flex', gap: '28px', listStyle: 'none', margin: 0 }}
          className="hidden-mobile"
        >
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    textDecoration: 'none',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: active ? '#B5485A' : '#1A1218', // ✅ BLACK visible
                    fontWeight: active ? 600 : 500,        // ✅ slightly bolder
                  }}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Auth Buttons */}
        <div
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
          className="hidden-mobile"
        >
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user.ownerCredit > 0 && (
                <div style={{
                  background: '#E1F5EE',
                  border: '1px solid #9FE1CB',
                  color: '#0F6E56',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span>💰 Credit:</span>
                  <span style={{ color: '#0F6E56', fontWeight: 700 }}>+PKR {Number(user.ownerCredit).toLocaleString()}</span>
                </div>
              )}
              {user.penaltyBalance > 0 && (
                <div style={{
                  background: '#FCEBEB',
                  border: '1px solid #F7C1C1',
                  color: '#A32D2D',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span>⚠️ Penalty:</span>
                  <span style={{ color: '#D32F2F', fontWeight: 700 }}>-PKR {Number(user.penaltyBalance).toLocaleString()}</span>
                </div>
              )}
              <span style={{ fontSize: '13px', color: '#1A1218' }}>
                Hi, <strong style={{ color: '#1A1218' }}>{user.name.split(' ')[0]}</strong>
              </span>
              <button
                onClick={logout}
                style={{
                  border: '1px solid #E8E0E4',
                  background: 'none',
                  padding: '7px 16px',
                  fontSize: '11px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  color: '#1A1218',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                style={{
                  border: '1px solid #B5485A',
                  color: '#B5485A',
                  padding: '7px 16px',
                  fontSize: '11px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                style={{
                  background: '#1A1218',
                  color: 'white',
                  padding: '7px 16px',
                  fontSize: '11px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
          className="show-mobile"
          aria-label="Toggle menu"
        >
          <div
            style={{
              width: '22px',
              height: '2px',
              background: '#1A1218',
              marginBottom: '5px',
              transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
              transition: 'all 0.3s',
            }}
          />
          <div
            style={{
              width: '22px',
              height: '2px',
              background: '#1A1218',
              marginBottom: '5px',
              opacity: menuOpen ? 0 : 1,
              transition: 'all 0.3s',
            }}
          />
          <div
            style={{
              width: '22px',
              height: '2px',
              background: '#1A1218',
              transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
              transition: 'all 0.3s',
            }}
          />
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99 }}>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(26,18,24,0.5)',
            }}
          />

          {/* Drawer */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: '280px',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                borderBottom: '1px solid #E8E0E4',
              }}
            >
              <span
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                Wed<span style={{ color: '#B5485A' }}>Dress</span>
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: '#7A6E72',
                }}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Nav Links */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 0',
                    borderBottom: '1px solid #E8E0E4',
                    textDecoration: 'none',
                    fontSize: '13px',
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: pathname === href ? '#B5485A' : '#1A1218',
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Auth */}
            <div style={{ padding: '20px', borderTop: '1px solid #E8E0E4' }}>
              {user ? (
                <>
                  <p style={{ fontSize: '13px', color: '#7A6E72', marginBottom: '8px' }}>
                    Logged in as <strong>{user.name}</strong>
                  </p>
                  {user.ownerCredit > 0 && (
                    <div style={{
                      background: '#E1F5EE',
                      border: '1px solid #9FE1CB',
                      color: '#0F6E56',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '8px',
                      textAlign: 'center',
                    }}>
                      💰 Compensation Credit: <strong style={{ color: '#0F6E56' }}>+PKR {Number(user.ownerCredit).toLocaleString()}</strong>
                    </div>
                  )}
                  {user.penaltyBalance > 0 && (
                    <div style={{
                      background: '#FCEBEB',
                      border: '1px solid #F7C1C1',
                      color: '#A32D2D',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      textAlign: 'center',
                    }}>
                      ⚠️ Penalty Due: <strong style={{ color: '#D32F2F' }}>-PKR {Number(user.penaltyBalance).toLocaleString()}</strong>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      background: '#B5485A',
                      color: 'white',
                      border: 'none',
                      padding: '12px',
                      fontSize: '11px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '12px',
                      border: '1px solid #B5485A',
                      color: '#B5485A',
                      textDecoration: 'none',
                      fontSize: '11px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '12px',
                      background: '#1A1218',
                      color: 'white',
                      textDecoration: 'none',
                      fontSize: '11px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .hidden-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
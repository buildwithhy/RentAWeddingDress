'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/utils/getImageUrl';

// ============================================================================
// PAGE: My Bookings (/my-bookings)
// DESCRIPTION:
//   Owner Dashboard for managing rental requests on outfits uploaded by the owner:
//   - Accept or Reject incoming rental bookings
//   - Confirm Handover / Dispatch outfit to customer
//   - Confirm Return of outfit after rental completion
//
// BACKEND API REFERENCES:
//   - GET  /api/rentals/owner/{id}        -> Fetch owner incoming bookings (RentalsController.GetOwnerRentals)
//   - POST /api/rentals/update-status     -> Update booking lifecycle status (RentalsController.UpdateStatus)
//
// DATABASE TABLES LINKED:
//   - dbo.Bookings (BookingId, CustomerId, OwnerId, DressId, StartDate, EndDate, Status, TotalPrice)
//   - dbo.Dresses (D_id, Title, RentPrice)
//   - dbo.Users (U_id, Name, Contact)
// ============================================================================

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

// ─── Status config — Owner View ───
const STATUS = {
  0: { label: 'Pending',              bg: '#FAEEDA', color: '#854F0B' },
  1: { label: 'Accepted',             bg: '#E6F1FB', color: '#185FA5' },
  2: { label: 'Cancelled by Customer',bg: '#F5E6E9', color: '#7A2535' },
  3: { label: 'Rejected',             bg: '#FCEBEB', color: '#A32D2D' },
  4: { label: 'Waiting Confirmation', bg: '#FFF8E6', color: '#7A5A00' },
  5: { label: 'Rental Active',        bg: '#E1F5EE', color: '#0F6E56' },
  6: { label: 'Return Requested',     bg: '#F0E6FB', color: '#5A2D82' },
  7: { label: 'Completed',            bg: '#EAF3DE', color: '#3B6D11' },
};

// ─── Action Button ───
function ActionBtn({ label, onClick, color = '#1A1218', disabled = false, loading = false, filled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '8px 16px', fontSize: '11px', letterSpacing: '1.5px',
        textTransform: 'uppercase', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        border: `1px solid ${color}`,
        background: filled ? color : 'white',
        color: filled ? 'white' : color,
        opacity: disabled || loading ? 0.5 : 1, fontWeight: 500,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!disabled && !loading && !filled) { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white'; } }}
      onMouseLeave={(e) => { if (!filled) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = color; } }}
    >
      {loading ? 'Please wait...' : label}
    </button>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/auth/login'); return; }
    const user = JSON.parse(u);
    fetchBookings(user.userId);
  }, []);

  const fetchBookings = async (ownerId) => {
    try {
      const res = await fetch(`${API}/rentals/owner/${ownerId}`);
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch { }
    setLoading(false);
  };

  const performAction = async (bookingId, newStatus, successMsg) => {
    setActionLoading(bookingId + '-' + newStatus);
    try {
      const res = await fetch(`${API}/rentals/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ BookingId: bookingId, Status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.Message || data || 'Action failed');
      toast.success(successMsg);
      // Immediately update local state
      setBookings(prev =>
        prev.map(b => (b.BookingId === bookingId ? { ...b, Status: newStatus } : b))
      );
      const u = JSON.parse(localStorage.getItem('user'));
      if (u) await fetchBookings(u.userId);
    } catch (err) {
      toast.error(err.message);
    }
    setActionLoading(null);
  };

  const imgSrc = (img) => getImageUrl(img);

  const fmt = (d) => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 5%' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 600, color: '#1A1218', marginBottom: '4px' }}>
            My Bookings
          </h1>
          <p style={{ color: '#7A6E72', fontSize: '13px' }}>Manage bookings on your listed dresses</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E8E0E4', marginBottom: '24px' }}>
          <Link href="/my-rentals" style={{ padding: '10px 20px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72', textDecoration: 'none', borderBottom: '2px solid transparent' }}>
            My Rentals
          </Link>
          <div style={{ padding: '10px 20px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#B5485A', borderBottom: '2px solid #B5485A' }}>
            My Bookings
          </div>
        </div>

        {/* Compensation Credit Banner if any */}
        {!loading && bookings.some(b => b.Status === 2 && Number(b.PenaltyApplied) > 0) && (
          <div style={{
            background: '#E1F5EE',
            border: '1px solid #9FE1CB',
            padding: '14px 20px',
            marginBottom: '20px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F6E56', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💰</span> Total Cancellation Compensation Credited:
              </div>
              <p style={{ fontSize: '11px', color: '#0F6E56', margin: '3px 0 0 0', opacity: 0.9 }}>
                50% compensation received for customer late cancellations (cancelled within 4 days of start date)
              </p>
            </div>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 700, color: '#0F6E56' }}>
              +Rs. {bookings.reduce((sum, b) => sum + (b.Status === 2 ? Number(b.PenaltyApplied || 0) : 0), 0).toLocaleString()}
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'white', border: '1px solid #E8E0E4', padding: '16px', display: 'flex', gap: '16px', animation: 'pulse 1.5s infinite' }}>
                <div style={{ width: '72px', height: '88px', background: '#E8E0E4', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '14px', background: '#E8E0E4', width: '60%', marginBottom: '10px', borderRadius: '4px' }} />
                  <div style={{ height: '12px', background: '#E8E0E4', width: '40%', marginBottom: '10px', borderRadius: '4px' }} />
                  <div style={{ height: '32px', background: '#E8E0E4', width: '50%', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && bookings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', opacity: 0.15, marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#1A1218', marginBottom: '8px' }}>No Bookings Yet</h3>
            <p style={{ color: '#7A6E72', fontSize: '13px', marginBottom: '24px' }}>No one has booked your dress yet</p>
            <Link href="/upload-dress" style={{ display: 'inline-block', background: '#B5485A', color: 'white', padding: '12px 32px', textDecoration: 'none', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              List a Dress
            </Link>
          </div>
        )}

        {/* Bookings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bookings.map(booking => {
            const status = STATUS[booking.Status] || STATUS[0];
            const src = getImageUrl(booking);

            return (
              <div key={booking.BookingId} style={{ background: 'white', border: '1px solid #E8E0E4' }}>
                <div style={{ display: 'flex', gap: '14px', padding: '16px' }}>

                  {/* Image */}
                  <Link href={`/dress/${booking.DressId}`} style={{ flexShrink: 0 }}>
                    <div style={{ width: '72px', height: '88px', background: '#F5E6E9', overflow: 'hidden' }}>
                      {src ? (
                        <img src={src} alt={booking.DressTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-dress.png'; }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', opacity: 0.2 }}>👗</div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <Link href={`/dress/${booking.DressId}`} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '17px', fontWeight: 500, color: '#1A1218', textDecoration: 'none', lineHeight: 1.2 }}>
                        {booking.DressTitle}
                      </Link>
                      {/* Status Badge */}
                      <span style={{ fontSize: '10px', padding: '3px 10px', flexShrink: 0, background: status.bg, color: status.color, fontWeight: 600, borderRadius: '3px' }}>
                        {status.label}
                      </span>
                    </div>

                    <p style={{ fontSize: '11px', color: '#C4BAC0', marginBottom: '2px' }}>Booking #{booking.BookingId}</p>
                    <p style={{ fontSize: '12px', color: '#7A6E72', marginBottom: '4px' }}>
                      📅 {fmt(booking.StartDate)} → {fmt(booking.EndDate)}
                    </p>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#B5485A', fontWeight: 600, marginBottom: '12px' }}>
                      Rs. {booking.TotalPrice?.toLocaleString()}
                    </p>

                    {/* ─── OWNER ACTION BUTTONS based on status ─── */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>

                      {/* STATUS 0 — Pending: Owner can Accept or Reject */}
                      {booking.Status === 0 && (
                        <>
                          <ActionBtn
                            label="✓ Accept Booking"
                            color="#0F6E56"
                            filled
                            loading={actionLoading === booking.BookingId + '-1'}
                            onClick={() => performAction(booking.BookingId, 1, 'Booking accepted! Customer will be notified.')}
                          />
                          <ActionBtn
                            label="✗ Reject Booking"
                            color="#A32D2D"
                            loading={actionLoading === booking.BookingId + '-3'}
                            onClick={() => {
                              if (confirm('Are you sure you want to reject this booking?')) {
                                performAction(booking.BookingId, 3, 'Booking rejected.');
                              }
                            }}
                          />
                        </>
                      )}

                      {/* STATUS 1 — Accepted: Owner marks dress as dispatched */}
                      {booking.Status === 1 && (
                        <ActionBtn
                          label="📦 Mark as Dispatched"
                          color="#185FA5"
                          filled
                          loading={actionLoading === booking.BookingId + '-4'}
                          onClick={() => performAction(booking.BookingId, 4, 'Dress marked as dispatched. Waiting for customer pickup confirmation.')}
                        />
                      )}

                      {/* STATUS 2 — Cancelled by Customer */}
                      {booking.Status === 2 && (
                        <div style={{
                          fontSize: '12px',
                          color: Number(booking.PenaltyApplied) > 0 ? '#0F6E56' : '#7A2535',
                          background: Number(booking.PenaltyApplied) > 0 ? '#E1F5EE' : '#F5E6E9',
                          padding: '8px 14px',
                          border: `1px solid ${Number(booking.PenaltyApplied) > 0 ? '#9FE1CB' : '#E8C0C8'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          width: '100%',
                          borderRadius: '3px',
                        }}>
                          <span>❌ Cancelled by Customer</span>
                          {Number(booking.PenaltyApplied) > 0 ? (
                            <strong style={{ color: '#0F6E56', fontSize: '11px' }}>
                              💰 +Rs. {Number(booking.PenaltyApplied).toLocaleString()} Compensation Credited
                            </strong>
                          ) : (
                            <span style={{ color: '#7A2535', fontSize: '11px' }}>
                              (Free Policy Cancellation)
                            </span>
                          )}
                        </div>
                      )}

                      {/* STATUS 3 — Rejected by Owner */}
                      {booking.Status === 3 && (
                        <div style={{ fontSize: '12px', color: '#A32D2D', background: '#FCEBEB', padding: '7px 14px', border: '1px solid #F7C1C1' }}>
                          ❌ You Rejected this Booking
                        </div>
                      )}

                      {/* STATUS 4 — Dispatched: Waiting for customer to confirm pickup */}
                      {booking.Status === 4 && (
                        <div style={{ fontSize: '12px', color: '#7A5A00', background: '#FFF8E6', padding: '7px 14px', border: '1px solid #F5DFA0' }}>
                          ⏳ Waiting for Customer Pickup Confirmation
                        </div>
                      )}

                      {/* STATUS 5 — Active Rental: Owner info only */}
                      {booking.Status === 5 && (
                        <div style={{ fontSize: '12px', color: '#0F6E56', background: '#E1F5EE', padding: '7px 14px', border: '1px solid #9FE1CB' }}>
                          ✅ Rental Active — Customer has the dress
                        </div>
                      )}

                      {/* STATUS 6 — Return Requested: Owner confirms return */}
                      {booking.Status === 6 && (
                        <ActionBtn
                          label="✓ Confirm Return Received"
                          color="#5A2D82"
                          filled
                          loading={actionLoading === booking.BookingId + '-7'}
                          onClick={() => performAction(booking.BookingId, 7, 'Return confirmed! Rental completed.')}
                        />
                      )}

                      {/* STATUS 7 — Completed */}
                      {booking.Status === 7 && (
                        <div style={{ fontSize: '12px', color: '#3B6D11', background: '#EAF3DE', padding: '7px 14px', border: '1px solid #C0DD97' }}>
                          ✅ Rental Completed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
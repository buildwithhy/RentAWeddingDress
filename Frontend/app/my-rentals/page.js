'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/utils/getImageUrl';

// ============================================================================
// PAGE: My Rentals (/my-rentals)
// DESCRIPTION:
//   Customer Dashboard for tracking outfits rented by the logged-in customer:
//   - Shows status (Pending, Accepted, Active, Return Pending, Completed, Cancelled)
//   - Cancel Booking (POST /api/bookings/cancel)
//   - Reschedule Booking Dates (POST /api/bookings/reschedule)
//   - Request Return of Outfit (POST /api/rentals/request-return)
//   - Submit Review and Rating (POST /api/dresses/review)
//
// BACKEND API REFERENCES:
//   - GET  /api/rentals/customer/{id}      -> Fetch customer rentals (RentalsController.GetCustomerRentals)
//   - POST /api/bookings/cancel            -> Cancel booking (BookingsController.CancelBooking)
//   - POST /api/bookings/reschedule        -> Reschedule booking dates (BookingsController.RescheduleBooking)
//   - POST /api/rentals/request-return     -> Request return to owner (RentalsController.RequestReturn)
//   - POST /api/dresses/review             -> Post rating & review (DressesController.AddReview)
//
// DATABASE TABLES LINKED:
//   - dbo.Bookings (BookingId, CustomerId, DressId, StartDate, EndDate, Status, TotalPrice)
//   - dbo.Dresses (D_id, Title, RentPrice)
//   - dbo.Reviews (Review_id, D_id, U_id, Rating, Comment)
// ============================================================================

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

// ─── Status config — Customer View ───
const STATUS = {
  0: { label: 'Pending',          bg: '#FAEEDA', color: '#854F0B' },
  1: { label: 'Accepted',         bg: '#E6F1FB', color: '#185FA5' },
  2: { label: 'Cancelled',        bg: '#F5E6E9', color: '#7A2535' },
  3: { label: 'Rejected',         bg: '#FCEBEB', color: '#A32D2D' },
  4: { label: 'Waiting Pickup',   bg: '#FFF8E6', color: '#7A5A00' },
  5: { label: 'Rental Active',    bg: '#E1F5EE', color: '#0F6E56' },
  6: { label: 'Return Pending',   bg: '#F0E6FB', color: '#5A2D82' },
  7: { label: 'Completed',        bg: '#EAF3DE', color: '#3B6D11' },
};

// ─── Review Modal ───
function ReviewModal({ rental, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(26,18,24,0.65)', padding: '20px',
    }}>
      <div style={{ background: 'white', width: '100%', maxWidth: '440px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 600, color: '#1A1218' }}>
            Rate this Dress
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7A6E72' }}>✕</button>
        </div>
        <p style={{ color: '#7A6E72', fontSize: '13px', fontStyle: 'italic', marginBottom: '20px' }}>{rental.DressTitle}</p>

        {/* Stars */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '36px' }}
            >
              <span style={{ color: (hover || rating) >= star ? '#C9A96E' : '#E8E0E4' }}>★</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (rating === 0) {
              toast.error('Please give a rating');
              return;
            }
            onSubmit(rental.BookingId, rental.DressId, rating);
          }}
          style={{
            width: '100%',
            background: '#1A1218',
            color: 'white',
            border: 'none',
            padding: '14px',
            fontSize: '11px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Submit Review
        </button>
      </div>
    </div>
  );
}

// ─── Reschedule Modal ───
function RescheduleModal({ rental, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState(rental.StartDate ? rental.StartDate.split('T')[0] : '');
  const [endDate, setEndDate] = useState(rental.EndDate ? rental.EndDate.split('T')[0] : '');
  const [loading, setLoading] = useState(false);

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error('End date must be greater than start date');
      return;
    }

    setLoading(true);
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API}/bookings/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: u.userId,
          BookingId: rental.BookingId,
          StartDate: startDate,
          EndDate: endDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.Message || data || 'Reschedule failed');

      toast.success(data.Message || 'Booking rescheduled successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(26,18,24,0.65)', padding: '20px',
    }}>
      <div style={{ background: 'white', width: '100%', maxWidth: '440px', padding: '28px', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 600, color: '#1A1218' }}>
            Reschedule Booking
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7A6E72' }}>✕</button>
        </div>
        <p style={{ color: '#7A6E72', fontSize: '13px', fontStyle: 'italic', marginBottom: '20px' }}>{rental.DressTitle} (Booking #{rental.BookingId})</p>

        <form onSubmit={handleReschedule}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72', marginBottom: '6px' }}>
              New Start Date
            </label>
            <input
              type="date"
              min={today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', border: '1.5px solid #E2D9D0',
                borderRadius: '6px', fontSize: '13px', background: '#FAF8F5', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72', marginBottom: '6px' }}>
              New Return Date
            </label>
            <input
              type="date"
              min={startDate || today}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 12px', border: '1.5px solid #E2D9D0',
                borderRadius: '6px', fontSize: '13px', background: '#FAF8F5', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '12px', border: '1px solid #D0C8CC',
                background: 'white', color: '#1A1218', fontSize: '11px',
                letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '12px', border: 'none',
                background: '#1A1218', color: 'white', fontSize: '11px',
                letterSpacing: '2px', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Checking...' : 'Save Dates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Action Button Component ───
function ActionBtn({ label, onClick, color = '#1A1218', disabled = false, loading = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '8px 16px', fontSize: '11px', letterSpacing: '1.5px',
        textTransform: 'uppercase', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        border: `1px solid ${color}`, background: 'white', color,
        opacity: disabled || loading ? 0.5 : 1, fontWeight: 500,
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!disabled && !loading) { e.currentTarget.style.background = color; e.currentTarget.style.color = 'white'; } }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = color; }}
    >
      {loading ? 'Please wait...' : label}
    </button>
  );
}

export default function MyRentalsPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [reviewRental, setReviewRental] = useState(null);
  const [rescheduleRental, setRescheduleRental] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { router.push('/auth/login'); return; }
    const user = JSON.parse(u);
    fetchRentals(user.userId);
  }, []);

  const fetchRentals = async (userId) => {
    try {
      const res = await fetch(`${API}/rentals/user/${userId}`);
      const data = await res.json();
      setRentals(Array.isArray(data) ? data : []);
    } catch { }
    setLoading(false);
  };

  const performAction = async (bookingId, newStatus, successMsg) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`${API}/rentals/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ BookingId: bookingId, Status: newStatus }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Action failed');
      toast.success(successMsg);
      const u = JSON.parse(localStorage.getItem('user'));
      await fetchRentals(u.userId);
    } catch (err) {
      toast.error(err.message);
    }
    setActionLoading(null);
  };

  const cancelBookingWithPolicy = async (rental) => {
    const startDate = new Date(rental.StartDate);
    const today = new Date();
    const diffDays = (startDate - today) / (1000 * 60 * 60 * 24);
    const isLate = diffDays <= 4;
    const penaltyAmount = Math.round(Number(rental.TotalPrice || 0) * 0.5);

    let confirmMsg = 'Are you sure you want to cancel this booking?';
    if (isLate) {
      confirmMsg = `⚠️ Late Cancellation Warning:\n\nThis booking starts in less than 4 days.\nCancelling now incurs a 50% penalty of Rs. ${penaltyAmount.toLocaleString()} which will be added as a negative credit balance to your account and charged on your next order.\n\nDo you want to proceed?`;
    } else {
      confirmMsg = '✅ Free Cancellation:\n\nThis booking is more than 4 days away from start date. No cancellation fee will be charged.\n\nDo you want to proceed with cancellation?';
    }

    if (!confirm(confirmMsg)) return;

    setActionLoading(rental.BookingId);
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API}/bookings/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: u.userId,
          BookingId: rental.BookingId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.Message || 'Cancellation failed');

      if (data.Penalty > 0 || data.HasPenalty) {
        toast.success(data.Message || 'Booking cancelled with late penalty.');
      } else {
        toast.success(data.Message || 'Booking cancelled successfully.');
      }

      await fetchRentals(u.userId);

    } catch (err) {
      toast.error(err.message);
    }
    setActionLoading(null);
  };

  const submitReview = async (bookingId, dressId, rating) => {
    try {
      const res = await fetch(`${API}/rentals/add-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BookingId: bookingId,
          DressId: dressId,
          Rating: rating,
          Feedback: null
        }),
      });

      if (!res.ok) throw new Error('Review submission failed');

      toast.success('Review submitted! ✅');
      setReviewRental(null);

      setRentals(prev =>
        prev.map(r =>
          r.BookingId === bookingId ? { ...r, Reviewed: true } : r
        )
      );

    } catch (err) {
      toast.error(err.message);
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 5%' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 600, color: '#1A1218', marginBottom: '4px' }}>
            My Rentals
          </h1>
          <p style={{ color: '#7A6E72', fontSize: '13px' }}>Track, manage, or cancel your rented dresses</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E8E0E4', marginBottom: '24px' }}>
          <div style={{ padding: '10px 20px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#B5485A', borderBottom: '2px solid #B5485A' }}>
            My Rentals
          </div>
          <Link href="/my-bookings" style={{ padding: '10px 20px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72', textDecoration: 'none', borderBottom: '2px solid transparent' }}>
            My Bookings (Owner)
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: 'white', border: '1px solid #E8E0E4', padding: '16px', display: 'flex', gap: '16px', animation: 'pulse 1.5s infinite' }}>
                <div style={{ width: '72px', height: '88px', background: '#E8E0E4', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '14px', background: '#E8E0E4', width: '60%', marginBottom: '10px', borderRadius: '4px' }} />
                  <div style={{ height: '12px', background: '#E8E0E4', width: '40%', marginBottom: '10px', borderRadius: '4px' }} />
                  <div style={{ height: '12px', background: '#E8E0E4', width: '30%', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && rentals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', opacity: 0.15, marginBottom: '16px' }}>📦</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#1A1218', marginBottom: '8px' }}>No Rentals Yet</h3>
            <p style={{ color: '#7A6E72', fontSize: '13px', marginBottom: '24px' }}>You have not rented any dress yet</p>
            <Link href="/browse" style={{ display: 'inline-block', background: '#B5485A', color: 'white', padding: '12px 32px', textDecoration: 'none', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Browse Dresses
            </Link>
          </div>
        )}

        {/* Rentals List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rentals.map(rental => {
            const status = STATUS[rental.Status] || STATUS[0];
            const src = getImageUrl(rental);
            const isLoading = actionLoading === rental.BookingId;

            return (
              <div key={rental.BookingId} style={{ background: 'white', border: '1px solid #E8E0E4' }}>
                <div style={{ display: 'flex', gap: '14px', padding: '16px' }}>

                  {/* Image */}
                  <Link href={`/dress/${rental.DressId}`} style={{ flexShrink: 0 }}>
                    <div style={{ width: '72px', height: '88px', background: '#F5E6E9', overflow: 'hidden' }}>
                      {src ? (
                        <img src={src} alt={rental.DressTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-dress.png'; }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', opacity: 0.2 }}>👗</div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <Link href={`/dress/${rental.DressId}`} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '17px', fontWeight: 500, color: '#1A1218', textDecoration: 'none', lineHeight: 1.2 }}>
                        {rental.DressTitle}
                      </Link>
                      {/* Status Badge */}
                      <span style={{ fontSize: '10px', padding: '3px 10px', flexShrink: 0, background: status.bg, color: status.color, fontWeight: 600, borderRadius: '3px' }}>
                        {status.label}
                      </span>
                    </div>

                    <p style={{ fontSize: '11px', color: '#C4BAC0', marginBottom: '2px' }}>Booking #{rental.BookingId}</p>
                    <p style={{ fontSize: '12px', color: '#7A6E72', marginBottom: '4px' }}>
                      📅 {fmt(rental.StartDate)} → {fmt(rental.EndDate)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#B5485A', fontWeight: 600, margin: 0 }}>
                        Rs. {rental.TotalPrice?.toLocaleString()}
                      </p>
                      {rental.PenaltyApplied > 0 && (
                        <span style={{ fontSize: '10px', background: '#FCEBEB', color: '#A32D2D', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                          Includes Rs. {rental.PenaltyApplied.toLocaleString()} Previous Penalty
                        </span>
                      )}
                    </div>

                    {/* ─── ACTION BUTTONS based on status ─── */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>

                      {/* STATUS 0 / 1 — Customer can Reschedule or Cancel with Policy check */}
                      {(rental.Status === 0 || rental.Status === 1) && (
                        <>
                          <ActionBtn
                            label="Reschedule Dates"
                            color="#185FA5"
                            loading={isLoading}
                            onClick={() => setRescheduleRental(rental)}
                          />
                          <ActionBtn
                            label="Cancel Booking"
                            color="#A32D2D"
                            loading={isLoading}
                            onClick={() => cancelBookingWithPolicy(rental)}
                          />
                        </>
                      )}

                      {/* STATUS 1 — Accepted: Waiting for owner to pick */}
                      {rental.Status === 1 && (
                        <div style={{ fontSize: '12px', color: '#185FA5', background: '#E6F1FB', padding: '7px 14px', border: '1px solid #B8D4F4' }}>
                          ⏳ Waiting for owner to dispatch dress
                        </div>
                      )}

                      {/* STATUS 2 — Cancelled */}
                      {rental.Status === 2 && (
                        <div style={{ fontSize: '12px', color: '#7A2535', background: '#F5E6E9', padding: '7px 14px', border: '1px solid #E8C0C8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>❌ Booking Cancelled</span>
                          {rental.PenaltyApplied > 0 && (
                            <strong style={{ color: '#A32D2D', fontSize: '11px' }}>
                              (50% Late Cancellation Penalty: Rs. {rental.PenaltyApplied.toLocaleString()})
                            </strong>
                          )}
                        </div>
                      )}

                      {/* STATUS 3 — Rejected by Owner */}
                      {rental.Status === 3 && (
                        <div style={{ fontSize: '12px', color: '#A32D2D', background: '#FCEBEB', padding: '7px 14px', border: '1px solid #F7C1C1' }}>
                          ❌ Order Rejected by Owner
                        </div>
                      )}

                      {/* STATUS 4 — Owner picked/dispatched: Customer must confirm pickup */}
                      {rental.Status === 4 && (
                        <ActionBtn
                          label="✓ Confirm Pickup"
                          color="#0F6E56"
                          loading={isLoading}
                          onClick={() => performAction(rental.BookingId, 5, 'Pickup confirmed! Rental is now active.')}
                        />
                      )}

                      {/* STATUS 5 — Active: Customer can request return */}
                      {rental.Status === 5 && (
                        <>
                          <div style={{ fontSize: '12px', color: '#0F6E56', background: '#E1F5EE', padding: '7px 14px', border: '1px solid #9FE1CB' }}>
                            ✅ Rental Active
                          </div>
                          <ActionBtn
                            label="Return Dress"
                            color="#5A2D82"
                            loading={isLoading}
                            onClick={() => {
                              if (confirm('Request to return this dress?')) {
                                performAction(rental.BookingId, 6, 'Return request sent to owner.');
                              }
                            }}
                          />
                        </>
                      )}

                      {/* STATUS 6 — Return Requested: Waiting for owner */}
                      {rental.Status === 6 && (
                        <div style={{ fontSize: '12px', color: '#5A2D82', background: '#F0E6FB', padding: '7px 14px', border: '1px solid #D4B8F4' }}>
                          🔄 Return Pending — Waiting for owner confirmation
                        </div>
                      )}

                      {/* STATUS 7 — Completed: Write Review */}
                      {rental.Status === 7 && !rental.Reviewed && (
                        <>
                          <div style={{ fontSize: '12px', color: '#3B6D11', background: '#EAF3DE', padding: '7px 14px', border: '1px solid #C0DD97' }}>
                            ✅ Rental Completed
                          </div>
                          <ActionBtn
                            label="Write a Review"
                            color="#B5485A"
                            onClick={() => setReviewRental(rental)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {reviewRental && (
        <ReviewModal
          rental={reviewRental}
          onClose={() => setReviewRental(null)}
          onSubmit={submitReview}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleRental && (
        <RescheduleModal
          rental={rescheduleRental}
          onClose={() => setRescheduleRental(null)}
          onSuccess={() => {
            const u = JSON.parse(localStorage.getItem('user'));
            if (u) fetchRentals(u.userId);
          }}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

// ============================================================================
// PAGE: Booking Success (/booking/success)
// DESCRIPTION:
//   Confirmation receipt page shown after successfully placing a dress booking.
//   Reads bookingId, total amount, and dress name from URL query parameters.
//
// QUERY PARAMETERS:
//   - bookingId: ID of newly created booking in dbo.Bookings
//   - total: Final amount charged or payable (Rs.)
//   - dress: Title of the rented dress outfit
//
// DATABASE TABLES LINKED:
//   - dbo.Bookings (BookingId, Status = 0 [Pending])
// ============================================================================

function SuccessContent() {
  // ── URL se booking details nikalo ──
  const params = useSearchParams();
  const bookingId = params.get('bookingId');
  const total = params.get('total');
  const dress = params.get('dress');

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 5%' }}>
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {/* ── Green Checkmark ── */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#EAF3DE', border: '2px solid #C0DD97',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: '36px',
        }}>
          ✓
        </div>

        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '36px', fontWeight: 600, color: '#1A1218', marginBottom: '8px',
        }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: '#7A6E72', fontSize: '14px', marginBottom: '32px' }}>
         Your booking has been placed successfully. The owner will contact you soon.
        </p>

        {/* ── Booking Details Card ── */}
        <div style={{ background: 'white', border: '1px solid #E8E0E4', padding: '24px', marginBottom: '24px', textAlign: 'left' }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 600, color: '#1A1218', marginBottom: '16px' }}>
            Booking Details
          </h3>

          {/* Booking ID */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E8E0E4' }}>
            <span style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72' }}>Booking ID</span>
            <span style={{ fontSize: '13px', color: '#1A1218', fontWeight: 500 }}>#{bookingId}</span>
          </div>

          {/* Dress Name */}
          {dress && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E8E0E4' }}>
              <span style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72' }}>Dress</span>
              <span style={{ fontSize: '13px', color: '#1A1218', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{dress}</span>
            </div>
          )}

          {/* Total Price */}
          {total && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginTop: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1218' }}>Total Amount</span>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#B5485A', fontWeight: 600 }}>
                Rs. {Number(total).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* ── Status Info ── */}
        <div style={{
          background: '#FFF8E6', border: '1px solid #F5DFA0',
          padding: '14px 18px', marginBottom: '28px', fontSize: '13px',
          color: '#7A5A00', display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left',
        }}>
          <span style={{ fontSize: '16px' }}>ℹ️</span>
          Your booking is <strong>pending</strong>. Status will update once the owner confirms.
        </div>

        {/* ── Buttons ── */}
        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <Link href="/my-rentals" style={{
            display: 'block', background: '#1A1218', color: 'white',
            padding: '14px', fontSize: '11px', letterSpacing: '3px',
            textTransform: 'uppercase', textDecoration: 'none',
          }}>
           View My Rentals
          </Link>
          <Link href="/browse" style={{
            display: 'block', border: '1px solid #E8E0E4', color: '#1A1218',
            padding: '14px', fontSize: '11px', letterSpacing: '3px',
            textTransform: 'uppercase', textDecoration: 'none', background: 'white',
          }}>
            Browse More Dresses
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Suspense wrapper zaroori hai useSearchParams ke liye ──
export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
        <p style={{ color: '#7A6E72' }}>Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
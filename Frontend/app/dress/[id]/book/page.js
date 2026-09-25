'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/utils/getImageUrl';
import { formatDressAge } from '@/utils/formatters';

// ============================================================================
// PAGE: Book Dress (/dress/[id]/book)
// DESCRIPTION:
//   Handles the complete customer booking workflow:
//   - Size quantity selection
//   - Rental date range selection (Start & End dates)
//   - Inventory availability check (via backend check endpoint)
//   - Credit balance & penalty adjustments calculation
//   - Delivery address selection or new address addition
//   - Final booking confirmation
//
// BACKEND API REFERENCES:
//   - GET  /api/dresses/{id}                 -> Get dress details (DressesController.GetDressById)
//   - GET  /api/bookings/credit/{userId}    -> Get user credit/penalty balance (BookingsController.GetUserCredit)
//   - GET  /api/users/{userId}/addresses    -> Get user saved delivery addresses (UsersController.GetUserAddresses)
//   - POST /api/users/add-address           -> Add new user address (UsersController.AddAddress)
//   - POST /api/bookings/check              -> Verify stock availability (BookingsController.CheckAvailability)
//   - POST /api/bookings/confirm            -> Confirm rental booking (BookingsController.ConfirmBooking)
//
// DATABASE TABLES LINKED:
//   - dbo.Bookings (BookingId, CustomerId, OwnerId, DressId, StartDate, EndDate, Status, TotalPrice, etc.)
//   - dbo.BookingItems (BookingItemId, BookingId, SizeId, Quantity, UnitPrice)
//   - dbo.UserAddresses (UA_id, U_id, Address)
//   - dbo.Users (U_id, CreditBalance, etc.)
// ============================================================================

const API = process.env.NEXT_PUBLIC_API_URL || '/api';


export default function BookingPage() {
  const { id } = useParams();
  const router = useRouter();

  const [dress, setDress] = useState(null);
  const [dressTitle, setDressTitle] = useState('');
  const [rentPrice, setRentPrice] = useState(0);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedQuantities, setSelectedQuantities] = useState({});

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      toast.error('Please login first');
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(u);

    // Fetch user credit / penalty balance
    fetch(`${API}/bookings/credit/${user.userId}`)
      .then(res => res.ok ? res.json() : null)
      .then(creditData => {
        if (creditData) {
          setUserProfile({
            PenaltyBalance: creditData.CreditBalance < 0 ? Math.abs(creditData.CreditBalance) : 0,
            CreditBalance: creditData.CreditBalance,
          });
        }
      })
      .catch(() => {});

    // Fetch dress
    fetch(`${API}/dresses/${id}`)
      .then(r => r.json())
      .then(d => {
        setDress(d);
        setDressTitle(d.Title);
        setRentPrice(d.RentPrice);

        let sizesList = [];
        if (d.SizesWithQuantity && d.SizesWithQuantity.length > 0) {
          sizesList = d.SizesWithQuantity;
        } else if (d.Sizes && d.Sizes.length > 0) {
          sizesList = d.Sizes.map((name, idx) => ({
            SizeId: idx + 1,
            SizeName: typeof name === 'string' ? name : (name.SizeName || 'Standard'),
            Quantity: 1,
          }));
        }
        setAvailableSizes(sizesList);

        // Pre-select 1 quantity of the first available size
        if (sizesList.length > 0) {
          setSelectedQuantities({ [sizesList[0].SizeId]: 1 });
        }
      });

    // Fetch addresses
    fetch(`${API}/users/${user.userId}/addresses`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAddresses(data);
          setSelectedAddressId(data[0].UA_id);
        }
      });

  }, [id]);

  const updateQuantity = (sizeId, delta) => {
    setSelectedQuantities(prev => {
      const current = prev[sizeId] || 0;
      const updated = Math.max(0, current + delta);
      setAvailability(null);
      return { ...prev, [sizeId]: updated };
    });
  };

  const getSelectedItems = () => {
    return Object.entries(selectedQuantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([sId, qty]) => ({
        SizeId: Number(sId),
        Quantity: Number(qty),
      }));
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    const items = getSelectedItems();
    if (items.length === 0) {
      toast.error('Please select at least 1 quantity of a size');
      return;
    }

    setChecking(true);

    try {
      const res = await fetch(`${API}/bookings/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          DressId: Number(id),
          StartDate: startDate,
          EndDate: endDate,
          Items: items,
        }),
      });

      const data = await res.json();
      setAvailability(data);

      if (!res.ok || !data.IsAvailable) {
        toast.error(data.Message || 'Selected sizes/dates are not available');
      } else {
        toast.success(data.Message || 'Inventory available!');
      }

    } catch {
      toast.error('Could not check availability');
    } finally {
      setChecking(false);
    }
  };

  const confirmBooking = async () => {
    if (!availability?.IsAvailable) {
      toast.error('Please check availability first');
      return;
    }

    const items = getSelectedItems();
    if (items.length === 0) {
      toast.error('Please select at least 1 size quantity');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    let userAddressId = selectedAddressId;

    setConfirming(true);

    try {
      if (useNewAddress || addresses.length === 0) {
        if (!newAddress.trim()) {
          toast.error('Enter your full delivery address');
          setConfirming(false);
          return;
        }

        const addrRes = await fetch(`${API}/users/add-address`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            U_id: user.userId,
            Address: newAddress.trim(),
          }),
        });

        if (!addrRes.ok) throw new Error('Address save failed');

        const addrListRes = await fetch(`${API}/users/${user.userId}/addresses`);
        const addrList = await addrListRes.json();
        userAddressId = addrList[addrList.length - 1].UA_id;
      }

      const res = await fetch(`${API}/bookings/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: user.userId,
          DressId: Number(id),
          UserAddressId: userAddressId,
          StartDate: startDate,
          EndDate: endDate,
          Items: items,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.Message || 'Booking failed');

      const totalAmount = data.FinalTotal ?? data.OrderTotal ?? data.TotalPrice ?? 0;
      router.push(`/booking/success?bookingId=${data.BookingId}&total=${totalAmount}&dress=${encodeURIComponent(dressTitle)}`);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    height: '38px',
    fontSize: '13px',
    border: '1.5px solid #E2D9D0',
    borderRadius: '7px',
    background: '#FAF8F5',
    outline: 'none',
    color: '#1A1218',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '10.5px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: '#6E6267',
    fontWeight: 600,
    marginBottom: '4px',
  };

  const totalSelectedQty = Object.values(selectedQuantities).reduce((a, b) => a + Number(b), 0);
  const penalty = Number(userProfile?.PenaltyBalance || 0);
  const dressImage = dress ? getImageUrl(dress) : null;

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#F8F5F0',
      padding: '16px 3% 20px',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }} className="book-page-wrapper">

      <div style={{
        maxWidth: '1420px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: '14px',
      }}>

        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '10px',
          borderBottom: '1px solid #E5DED6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link href={`/dress/${id}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase',
              color: '#7A6E72', textDecoration: 'none', fontWeight: 600,
            }}>
              ← Back to Dress
            </Link>
            <span style={{ color: '#D2C7BC' }}>|</span>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '28px',
              fontWeight: 600,
              color: '#1A1218',
              margin: 0,
              lineHeight: 1.1,
            }}>
              Reserve & Book Dress
            </h1>
            <span style={{
              fontSize: '11px',
              background: '#EAF3DE',
              color: '#3B6D11',
              padding: '3px 10px',
              borderRadius: '20px',
              fontWeight: 600,
            }}>
              Cash on Delivery (COD)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => router.push(`/dress/${id}`)}
              style={{
                padding: '9px 18px',
                background: 'white',
                border: '1px solid #DCD5CE',
                color: '#5C4A3E',
                fontSize: '11px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: '6px',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmBooking}
              disabled={!availability?.IsAvailable || confirming}
              style={{
                padding: '9px 28px',
                background: (!availability?.IsAvailable || confirming) ? '#888' : '#1A1218',
                border: 'none',
                color: 'white',
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: (!availability?.IsAvailable || confirming) ? 'not-allowed' : 'pointer',
                borderRadius: '6px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(26,18,24,0.2)',
              }}
            >
              {confirming ? 'Confirming...' : 'Confirm Booking (COD) →'}
            </button>
          </div>
        </div>

        {/* Full-Screen 2-Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          gap: '18px',
          alignItems: 'stretch',
          flex: 1,
        }} className="book-main-grid">

          {/* ═════════ LEFT: Dress Summary Card ═════════ */}
          <div style={{
            background: 'white',
            border: '1px solid #E5DED6',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            height: '100%',
            boxSizing: 'border-box',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={labelStyle}>Selected Dress Summary</span>
              <span style={{ fontSize: '11px', color: '#B5485A', fontWeight: 600 }}>
                Rs. {rentPrice?.toLocaleString()}/day
              </span>
            </div>

            {/* Dress Photo + Badges */}
            <div style={{
              borderRadius: '10px',
              border: '1px solid #E0D7CE',
              overflow: 'hidden',
              background: '#FAF8F5',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ position: 'relative', flex: 1, minHeight: '180px', background: '#F5E6E9', overflow: 'hidden' }}>
                {dressImage ? (
                  <img src={dressImage} alt={dressTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.25 }}>👗</div>
                )}
                {dress?.Gender && (
                  <div style={{
                    position: 'absolute', top: '8px', left: '8px',
                    background: dress.Gender === 'Female' ? '#B5485A' : '#1A1218',
                    color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '3px',
                  }}>
                    {dress.Gender}
                  </div>
                )}
                {dress?.Condition && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: '#3B6D11', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '3px', fontWeight: 600,
                  }}>
                    {dress.Condition}/10
                  </div>
                )}
              </div>

              <div style={{ padding: '12px 14px', background: 'white' }}>
                {dress?.Occasion && (
                  <div style={{ fontSize: '10px', color: '#C9A96E', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    {dress.Occasion}
                  </div>
                )}
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 600, color: '#1A1218', lineHeight: 1.2, margin: '2px 0' }}>
                  {dressTitle}
                </div>
                <div style={{ fontSize: '12px', color: '#7A6E72', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <span>📍</span> {dress?.City || 'City'}{dress?.Location ? ` (${dress.Location})` : ''}
                </div>
                {dress?.AgeInMonths !== undefined && (
                  <div style={{ fontSize: '11px', color: '#854F0B', fontWeight: 600, marginTop: '4px' }}>
                    ✨ {formatDressAge(dress.AgeInMonths)}
                  </div>
                )}
              </div>
            </div>

            {/* Cancellation Policy Banner */}
            <div style={{
              background: '#FAF8F5', border: '1px solid #E5DED6',
              padding: '10px 12px', borderRadius: '8px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#1A1218', marginBottom: '2px' }}>
                🛡️ Cancellation Policy Protection
              </div>
              <p style={{ fontSize: '10.5px', color: '#7A6E72', margin: 0, lineHeight: 1.4 }}>
                Free cancellation up to 4 days prior to delivery. Cancellations within 4 days incur a 50% penalty charged on your next order.
              </p>
            </div>
          </div>

          {/* ═════════ RIGHT: Unified Booking Form ═════════ */}
          <div style={{
            background: 'white',
            border: '1px solid #E5DED6',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
            height: '100%',
            boxSizing: 'border-box',
          }}>

            {/* 1. SIZES & QUANTITIES SELECTION */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={labelStyle}>1. Select Sizes & Copies *</label>
                <span style={{ fontSize: '11px', color: '#1A1218', fontWeight: 700 }}>
                  Selected Total: {totalSelectedQty} pieces
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                {availableSizes.map(s => {
                  const qty = selectedQuantities[s.SizeId] || 0;
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={s.SizeId}
                      style={{
                        border: isSelected ? '1.5px solid #1A1218' : '1px solid #E2D9D0',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        background: isSelected ? '#FAF8F5' : '#FCFAF7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1A1218' }}>Size {s.SizeName}</span>
                        <div style={{ fontSize: '10px', color: '#7A6E72' }}>{s.Quantity} in stock</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(s.SizeId, -1)}
                          style={{
                            width: '24px', height: '24px', border: '1px solid #DCD5CE',
                            background: 'white', borderRadius: '4px', cursor: 'pointer',
                            fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >-</button>
                        <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(s.SizeId, 1)}
                          style={{
                            width: '24px', height: '24px', border: '1px solid #DCD5CE',
                            background: 'white', borderRadius: '4px', cursor: 'pointer',
                            fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. DATES & AVAILABILITY */}
            <div style={{
              background: '#FAF8F5',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #E5DED6',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 180px', gap: '10px', alignItems: 'flex-end' }}>
                <div>
                  <label style={labelStyle}>Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setAvailability(null);
                    }}
                    style={{ ...inputStyle, background: 'white' }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setAvailability(null);
                    }}
                    style={{ ...inputStyle, background: 'white' }}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={checkAvailability}
                    disabled={checking || totalSelectedQty === 0}
                    style={{
                      width: '100%',
                      height: '38px',
                      background: (checking || totalSelectedQty === 0) ? '#AAA' : '#1A1218',
                      color: 'white',
                      border: 'none',
                      borderRadius: '7px',
                      fontSize: '11px',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      cursor: (checking || totalSelectedQty === 0) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {checking ? 'Checking...' : 'Check Dates'}
                  </button>
                </div>
              </div>

              {/* Status feedback */}
              {availability && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  background: availability.IsAvailable ? '#EAF3DE' : '#FCEBEB',
                  border: `1px solid ${availability.IsAvailable ? '#C0DD97' : '#F7C1C1'}`,
                  color: availability.IsAvailable ? '#3B6D11' : '#A32D2D',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>✓ {availability.Message}</span>
                  {availability.IsAvailable && (
                    <strong>{availability.NumberOfDays} Days × {totalSelectedQty} items</strong>
                  )}
                </div>
              )}
            </div>

            {/* 3. DELIVERY ADDRESS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={labelStyle}>3. Delivery Address *</label>
                {addresses.length > 0 && (
                  <span
                    onClick={() => setUseNewAddress(!useNewAddress)}
                    style={{ fontSize: '11px', color: '#B5485A', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {useNewAddress ? '← Use Saved Address' : '+ Add New Address'}
                  </span>
                )}
              </div>

              {addresses.length > 0 && !useNewAddress ? (
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  style={inputStyle}
                >
                  {addresses.map(addr => (
                    <option key={addr.UA_id} value={addr.UA_id}>
                      {addr.Address}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter your complete house address, street, and area..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  style={inputStyle}
                />
              )}
            </div>

            {/* 4. PRICE BREAKDOWN & WALLET BALANCE */}
            <div style={{
              background: '#FAF8F5',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1.5px solid #E5DED6',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                <span style={{ color: '#7A6E72' }}>
                  Dress Rental Subtotal {availability?.NumberOfDays ? `(${availability.NumberOfDays} days × ${totalSelectedQty} items)` : ''}
                </span>
                <span style={{ fontWeight: 600, color: '#1A1218' }}>
                  Rs. {availability?.SubTotal ? availability.SubTotal.toLocaleString() : '0'}
                </span>
              </div>

              {penalty > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#A32D2D', background: '#FCEBEB', padding: '3px 8px', borderRadius: '4px', margin: '4px 0' }}>
                  <span>⚠️ Previous Late Cancellation Penalty (Added)</span>
                  <span style={{ fontWeight: 700 }}>+ Rs. {penalty.toLocaleString()}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5DED6', paddingTop: '8px', marginTop: '6px' }}>
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1A1218' }}>Total Payable on Delivery (COD)</span>
                  {penalty > 0 && (
                    <div style={{ fontSize: '10px', color: '#7A6E72' }}>* Penalty clears automatically when order completes.</div>
                  )}
                </div>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', color: '#B5485A', fontWeight: 700 }}>
                  Rs. {availability?.SubTotal ? (Number(availability.SubTotal) + penalty).toLocaleString() : '0'}
                </span>
              </div>
            </div>

            {/* 5. CONFIRM BUTTON */}
            <div>
              <button
                onClick={confirmBooking}
                disabled={!availability?.IsAvailable || confirming}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: (!availability?.IsAvailable || confirming) ? '#888' : '#1A1218',
                  color: 'white',
                  border: 'none',
                  fontSize: '12px',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  cursor: (!availability?.IsAvailable || confirming) ? 'not-allowed' : 'pointer',
                  borderRadius: '7px',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(26,18,24,0.25)',
                }}
              >
                {confirming ? 'Confirming Your Booking...' : 'Confirm Booking (Cash on Delivery) →'}
              </button>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 960px) {
          .book-page-wrapper {
            height: auto !important;
            min-height: 100vh !important;
          }
          .book-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
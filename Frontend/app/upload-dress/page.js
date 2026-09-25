'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatDressAge } from '@/utils/formatters';

// ============================================================================
// PAGE: Upload Dress (/upload-dress)
// DESCRIPTION:
//   Allows dress owners to list a wedding/party outfit for rent:
//   - Multiple Image Uploads (up to 5 images)
//   - Dynamic Categories & Subcategories
//   - Multi-size Selection with individual stock quantities
//   - Dress Age (Years + Months) & Condition Rating
//   - GPS Location Detection & Update Shop Location
//
// BACKEND API REFERENCES:
//   - POST /api/dresses/upload-image             -> Upload image file to /Content/Dresses/ (DressesController.UploadImage)
//   - POST /api/dresses/create                   -> Create dress record (DressesController.CreateDress)
//   - GET  /api/dresses/categories               -> Get all dress categories (DressesController.GetCategories)
//   - GET  /api/dresses/categories/{id}/subcategories -> Get subcategories (DressesController.GetSubCategories)
//   - GET  /api/dresses/sizes                    -> Get all sizes (DressesController.GetSizes)
//   - POST /api/users/update-shop-location       -> Update GPS for all dresses of owner (UsersController.UpdateShopLocation)
//
// DATABASE TABLES LINKED:
//   - dbo.Dresses (D_id, U_id, Category_id, SubCategory_id, Title, Description, RentPrice, Condition, AgeInMonths, Latitude, Longitude)
//   - dbo.DressImages (DI_id, D_id, ImgPath)
//   - dbo.DressSizes (D_id, Size_id, Quantity)
// ============================================================================

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const OCCASIONS = ['Barat', 'Walima', 'Mehndi', 'Engagement', 'Party', 'Nikkah'];

const CITIES = [
  'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'
];

const CONDITIONS = [
  { label: '10/10 (New with Tags)', value: 10 },
  { label: '9/10 (Like New)', value: 9 },
  { label: '8/10 (Excellent)', value: 8 },
  { label: '7/10 (Very Good)', value: 7 },
  { label: '6/10 (Good)', value: 6 },
  { label: '5/10 (Fair)', value: 5 },
];

export default function UploadDressPage() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadedPaths, setUploadedPaths] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'detecting' | 'success' | 'denied'

  // Default: Only Medium (Size_id: 2) selected with 1 copy. S, L, XL are 0 (unselected).
  const [form, setForm] = useState({
    title: '',
    gender: 'Female',
    categoryId: '1',
    subCategoryId: '1',
    occasion: 'Barat',
    condition: '10',
    sizeIds: [2],
    sizeQuantities: { 2: 1 },
    rentPrice: '',
    description: '',
    city: 'Islamabad',
    location: '',
    ageYears: '',
    ageMonths: '',
  });

  // Auto-detect GPS coordinates on page load
  const detectGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    setGpsStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus('success');
      },
      () => {
        setGpsStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      toast.error('Please login first');
      router.push('/auth/login');
      return;
    }
    const user = JSON.parse(u);

    // Auto-detect browser GPS
    detectGps();

    // Check if user already has a saved shop location in DB
    fetch(`${API}/users/shop-location/${user.userId}`)
      .then(r => r.json())
      .then(loc => {
        if (loc?.Latitude && loc?.Longitude) {
          setGpsCoords({ lat: loc.Latitude, lng: loc.Longitude });
          setGpsStatus('success');
        }
      })
      .catch(() => {});

    // Load categories dynamically from backend API
    fetch(`${API}/dresses/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      })
      .catch(() => {});

    // Load sizes dynamically from backend API
    fetch(`${API}/dresses/sizes`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setSizes(data);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!form.categoryId) {
      setSubCategories([]);
      return;
    }
    fetch(`${API}/dresses/categories/${form.categoryId}/subcategories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setSubCategories(data);
          if (!data.some(s => String(s.SubCategory_id) === String(form.subCategoryId))) {
            setForm(prev => ({ ...prev, subCategoryId: String(data[0].SubCategory_id) }));
          }
        } else {
          setSubCategories([]);
        }
      })
      .catch(() => {
        setSubCategories([]);
      });
  }, [form.categoryId, form.subCategoryId]);

  const updateShopGps = async () => {
    const u = localStorage.getItem('user');
    if (!u) return;
    const user = JSON.parse(u);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setUpdatingLocation(true);
    setGpsStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`${API}/users/update-shop-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              UserId: user.userId,
              Latitude: pos.coords.latitude,
              Longitude: pos.coords.longitude,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.Message || 'Location update failed');
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsStatus('success');
          toast.success(`📍 Shop GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) set for all dresses!`);
        } catch (err) {
          toast.error(err.message);
          setGpsStatus('denied');
        } finally {
          setUpdatingLocation(false);
        }
      },
      () => {
        toast.error('Could not get GPS coordinates. Check browser permission.');
        setUpdatingLocation(false);
        setGpsStatus('denied');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(file);

      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch(`${API}/dresses/upload-image`, { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Server error: ' + res.status);
        const data = await res.json();
        if (!data.ImagePath) throw new Error('No path returned');
        setUploadedPaths(prev => [...prev, data.ImagePath]);
        toast.success('Photo uploaded!');
      } catch (err) {
        toast.error('Upload failed: ' + err.message);
      }
    }
    setUploading(false);
  };

  const removeImage = (i) => {
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
    setUploadedPaths(prev => prev.filter((_, idx) => idx !== i));
  };

  // Toggle size on/off
  const toggleSize = (id) => {
    const isSelected = form.sizeIds.includes(id);
    if (isSelected) {
      // Deselect size and remove quantity
      setForm(prev => {
        const newSizeIds = prev.sizeIds.filter(s => s !== id);
        const newQuantities = { ...prev.sizeQuantities };
        delete newQuantities[id];
        return { ...prev, sizeIds: newSizeIds, sizeQuantities: newQuantities };
      });
    } else {
      // Select size with initial 1 copy
      setForm(prev => ({
        ...prev,
        sizeIds: [...prev.sizeIds, id],
        sizeQuantities: { ...prev.sizeQuantities, [id]: 1 },
      }));
    }
  };

  // Increase/Decrease quantity stepper
  const setQuantity = (id, delta) => {
    const current = Number(form.sizeQuantities[id]) || 0;
    const nextVal = current + delta;
    if (nextVal <= 0) {
      // If decreased to 0, automatically deselect this size
      toggleSize(id);
    } else {
      setForm(prev => ({
        ...prev,
        sizeQuantities: { ...prev.sizeQuantities, [id]: nextVal }
      }));
    }
  };

  const totalAgeMonths = (Number(form.ageYears) || 0) * 12 + (Number(form.ageMonths) || 0);
  const totalStockCount = form.sizeIds.reduce((sum, sId) => sum + (Number(form.sizeQuantities[sId]) || 0), 0);

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Please enter a dress title'); return; }
    if (!form.categoryId) { toast.error('Please select a category'); return; }
    if (!form.subCategoryId) { toast.error('Please select a sub-category'); return; }
    if (!form.city) { toast.error('Please select your city'); return; }
    if (!form.rentPrice || Number(form.rentPrice) <= 0) { toast.error('Please enter a valid rental price'); return; }
    if (form.sizeIds.length === 0) { toast.error('Please select at least one available size'); return; }
    if (previews.length === 0) { toast.error('Please upload at least one dress photo'); return; }

    const user = JSON.parse(localStorage.getItem('user'));
    setSubmitting(true);
    try {
      const sizeStock = {};
      form.sizeIds.forEach(id => {
        sizeStock[id] = Number(form.sizeQuantities[id]) || 1;
      });

      const res = await fetch(`${API}/dresses/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserId: user.userId,
          Dtitle: form.title.trim(),
          CategoryId: Number(form.categoryId),
          SubCategoryId: Number(form.subCategoryId),
          Gender: form.gender,
          Condition: Number(form.condition),
          AgeYears: Number(form.ageYears) || 0,
          AgeMonths: Number(form.ageMonths) || 0,
          AgeDays: 0,
          RentPrice: Number(form.rentPrice),
          Description: form.description,
          Occasions: form.occasion ? [form.occasion] : [],
          SizeIds: form.sizeIds,
          SizeStock: sizeStock,
          ImagePaths: uploadedPaths,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.Message || 'Upload failed');

      // ✅ AUTOMATICALLY SYNC GPS LOCATION TO BACKEND (Method 1)
      // Ensures Latitude & Longitude are saved in database table dbo.Dresses
      try {
        let latToSync = gpsCoords?.lat;
        let lngToSync = gpsCoords?.lng;

        if (!latToSync || !lngToSync) {
          if (typeof window !== 'undefined' && navigator.geolocation) {
            await new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  latToSync = pos.coords.latitude;
                  lngToSync = pos.coords.longitude;
                  resolve();
                },
                () => resolve(),
                { timeout: 3000 }
              );
            });
          }
        }

        if (latToSync && lngToSync) {
          await fetch(`${API}/users/update-shop-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              UserId: user.userId,
              Latitude: latToSync,
              Longitude: lngToSync,
            }),
          });
        }
      } catch {}

      toast.success('✨ Dress listed successfully!');
      router.push('/browse');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    height: '38px',
    fontSize: '13px',
    border: '1.5px solid #E2D9D0',
    borderRadius: '7px',
    background: '#FAF8F5',
    outline: 'none',
    color: '#1A1218',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, background 0.15s',
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

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#F8F5F0',
      padding: '16px 3% 20px',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
    }} className="upload-page-wrapper">

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '28px',
              fontWeight: 600,
              color: '#1A1218',
              margin: 0,
              lineHeight: 1.1,
            }}>
              List Your Designer Dress
            </h1>
            <span style={{
              fontSize: '11px',
              background: '#EAE1D7',
              color: '#5C4A3E',
              padding: '3px 10px',
              borderRadius: '20px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              Studio Listing
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => router.push('/browse')}
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
              type="button"
              onClick={updateShopGps}
              disabled={updatingLocation}
              style={{
                padding: '9px 16px',
                background: gpsCoords ? '#EBF5E9' : 'white',
                border: gpsCoords ? '1px solid #70AD47' : '1px solid #DCD5CE',
                color: gpsCoords ? '#276A1B' : '#1A1218',
                fontSize: '11px',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                cursor: updatingLocation ? 'not-allowed' : 'pointer',
                borderRadius: '6px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s',
              }}
              title="Detects GPS and updates shop location for all your dresses in SQL database"
            >
              <span>📍</span>
              {updatingLocation
                ? 'Detecting GPS...'
                : gpsCoords
                  ? `Shop GPS: ${gpsCoords.lat.toFixed(2)}, ${gpsCoords.lng.toFixed(2)} ✓`
                  : 'Set Shop GPS'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '9px 26px',
                background: submitting ? '#7A6E72' : '#B5485A',
                border: 'none',
                color: 'white',
                fontSize: '11px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                borderRadius: '6px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(181,72,90,0.25)',
              }}
            >
              {submitting ? 'Publishing...' : 'Publish Listing →'}
            </button>
          </div>
        </div>

        {/* Full-Screen 2-Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: '18px',
          alignItems: 'stretch',
          flex: 1,
        }} className="studio-main-grid">

          {/* ═════════ LEFT: Media & Live Customer Preview ═════════ */}
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
            {/* Upload Area */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={labelStyle}>Dress Photos *</label>
                <span style={{ fontSize: '11px', color: '#888' }}>{previews.length} photos</span>
              </div>

              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed #D2C7BC',
                  borderRadius: '8px',
                  background: '#FCFAF7',
                  padding: previews.length > 0 ? '10px' : '22px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B5485A'; e.currentTarget.style.background = '#FBF5F6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D2C7BC'; e.currentTarget.style.background = '#FCFAF7'; }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📷</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1218' }}>
                  {uploading ? 'Uploading Photo...' : '+ Click to Upload Photos'}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Front, back & embroidery shots</div>
              </div>
              <input
                ref={fileRef} type="file" accept="image/*" multiple
                onChange={handleImages} style={{ display: 'none' }}
              />

              {/* Uploaded Thumbnails */}
              {previews.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '10px' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{
                      position: 'relative', aspectRatio: '1', borderRadius: '6px',
                      overflow: 'hidden', border: i === 0 ? '2px solid #B5485A' : '1px solid #E0D7CE',
                    }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        style={{
                          position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px',
                          background: 'rgba(0,0,0,0.75)', color: 'white', border: 'none',
                          borderRadius: '50%', fontSize: '11px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Customer Preview Card */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid #EFEAE4',
              paddingTop: '12px',
              minHeight: '220px',
            }}>
              <span style={{ ...labelStyle, marginBottom: '8px' }}>Customer Card Live Preview</span>
              <div style={{
                borderRadius: '10px',
                border: '1px solid #E0D7CE',
                overflow: 'hidden',
                background: '#FAF8F5',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ position: 'relative', flex: 1, minHeight: '160px', background: '#F5E6E9', overflow: 'hidden' }}>
                  {previews.length > 0 ? (
                    <img src={previews[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.25 }}>👗</div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.78)',
                    color: 'white', padding: '3px 8px', fontSize: '11.5px', borderRadius: '4px', fontWeight: 600,
                  }}>
                    Rs. {form.rentPrice ? Number(form.rentPrice).toLocaleString() : '0'}/day
                  </div>
                  <div style={{
                    position: 'absolute', top: '8px', left: '8px', background: form.gender === 'Female' ? '#B5485A' : '#1A1218',
                    color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '3px',
                  }}>
                    {form.gender}
                  </div>
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px', background: '#3B6D11',
                    color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '3px', fontWeight: 600,
                  }}>
                    {form.condition}/10
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'white' }}>
                  <div style={{ fontSize: '10px', color: '#C9A96E', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    {form.occasion}
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', fontWeight: 600, color: '#1A1218', lineHeight: 1.2, margin: '2px 0' }}>
                    {form.title || 'Untitled Dress'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7A6E72', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📍</span> {form.city}{form.location ? ` • ${form.location}` : ''}
                  </div>
                  <div style={{ fontSize: '11px', color: '#854F0B', fontWeight: 600, marginTop: '3px' }}>
                    ✨ {formatDressAge(totalAgeMonths)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═════════ RIGHT: Unified Luxury Form ═════════ */}
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

            {/* ROW 1: Title & Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '14px', alignItems: 'flex-start' }}>
              <div>
                <label style={labelStyle}>Dress Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Maria B Crimson Velvet Bridal Lehnga with Heavy Zardozi Work"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  style={{ ...inputStyle, fontWeight: 500 }}
                  onFocus={(e) => { e.target.style.borderColor = '#B5485A'; e.target.style.background = 'white'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E2D9D0'; e.target.style.background = '#FAF8F5'; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <div style={{ display: 'flex', border: '1.5px solid #E2D9D0', borderRadius: '7px', overflow: 'hidden', height: '38px' }}>
                  {['Female', 'Male'].map(g => (
                    <button
                      key={g} type="button" onClick={() => set('gender', g)}
                      style={{
                        flex: 1, border: 'none', fontSize: '12.5px', cursor: 'pointer',
                        background: form.gender === g ? '#1A1218' : 'white',
                        color: form.gender === g ? 'white' : '#6E6267',
                        fontWeight: form.gender === g ? 600 : 400,
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ROW 2: Category, Sub-Category, Occasion, Condition */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => { set('categoryId', e.target.value); set('subCategoryId', ''); }}
                  style={inputStyle}
                >
                  {categories.map(c => (
                    <option key={c.Category_id} value={c.Category_id}>{c.Cname}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Sub-Category *</label>
                <select
                  value={form.subCategoryId}
                  onChange={(e) => set('subCategoryId', e.target.value)}
                  style={inputStyle}
                >
                  {subCategories.map(s => (
                    <option key={s.SubCategory_id} value={s.SubCategory_id}>{s.SCname}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Occasion</label>
                <select
                  value={form.occasion}
                  onChange={(e) => set('occasion', e.target.value)}
                  style={inputStyle}
                >
                  {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => set('condition', e.target.value)}
                  style={inputStyle}
                >
                  {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* ROW 3: City, Area, Dress Age (Years & Months) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1fr 1fr', gap: '12px', alignItems: 'flex-start' }}>
              <div>
                <label style={labelStyle}>City *</label>
                <select
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  style={inputStyle}
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Area / Neighborhood</label>
                  {gpsCoords && (
                    <span style={{ fontSize: '10px', color: '#2E7D32', fontWeight: 600 }}>
                      📍 GPS Active ({gpsCoords.lat.toFixed(2)}, {gpsCoords.lng.toFixed(2)})
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Gulberg III, DHA Phase 5, F-7"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Age (Years)</label>
                <input
                  type="number" min="0" max="20" placeholder="0 Years"
                  value={form.ageYears}
                  onChange={(e) => set('ageYears', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Age (Months)</label>
                <input
                  type="number" min="0" max="11" placeholder="0 Months"
                  value={form.ageMonths}
                  onChange={(e) => set('ageMonths', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* ROW 4: Rent Price + Sizes & Physical Inventory Stock */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '230px 1fr',
              gap: '14px',
              background: '#FAF8F5',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1.5px solid #E5DED6',
              alignItems: 'center',
            }}>
              <div>
                <label style={{ ...labelStyle, color: '#B5485A' }}>Rental Cost (Per Day) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                    color: '#B5485A', fontWeight: 700, fontSize: '13px',
                  }}>Rs.</span>
                  <input
                    type="number"
                    placeholder="4500"
                    value={form.rentPrice}
                    onChange={(e) => set('rentPrice', e.target.value)}
                    style={{
                      ...inputStyle,
                      paddingLeft: '36px',
                      fontWeight: 700,
                      color: '#B5485A',
                      fontSize: '15px',
                      background: 'white',
                      height: '36px',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={labelStyle}>Available Sizes & Stock Quantity *</label>
                  <span style={{ fontSize: '11px', color: '#1A1218', fontWeight: 700 }}>
                    Total Inventory: {totalStockCount} pieces
                  </span>
                </div>

                {/* Size Chips & Dynamic Stepper Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {sizes.map(s => {
                    const isSelected = form.sizeIds.includes(s.Size_id);
                    const qty = form.sizeQuantities[s.Size_id] || 0;
                    return (
                      <div
                        key={s.Size_id}
                        style={{
                          border: isSelected ? '1.5px solid #1A1218' : '1.5px dashed #D2C7BC',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          height: '34px',
                          background: isSelected ? 'white' : '#FCFAF7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSize(s.Size_id)}
                          style={{
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            fontSize: '12px', fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? '#1A1218' : '#8C827A', padding: 0,
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>Size {s.SizeName}</span>
                        </button>

                        {isSelected ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <button
                              type="button" onClick={() => setQuantity(s.Size_id, -1)}
                              title="Decrease (0 removes size)"
                              style={{
                                width: '20px', height: '20px', border: '1px solid #CCC',
                                background: '#FAF8F5', borderRadius: '3px', cursor: 'pointer',
                                fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >-</button>
                            <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              type="button" onClick={() => setQuantity(s.Size_id, 1)}
                              style={{
                                width: '20px', height: '20px', border: '1px solid #CCC',
                                background: '#FAF8F5', borderRadius: '3px', cursor: 'pointer',
                                fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >+</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#B0A8A0', fontWeight: 500 }}>0 stock</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ROW 5: Description */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Dress Description</label>
              <textarea
                placeholder="Detail fabric (pure silk, chiffon), embellishments (zardozi, gotta, pearls), sizing details, accessories included..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                style={{
                  ...inputStyle,
                  flex: 1,
                  minHeight: '60px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.45,
                  fontSize: '12.5px',
                  padding: '8px 12px',
                }}
              />
            </div>

            {/* Submit Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
              <div style={{ fontSize: '11px', color: '#7A6E72' }}>
                🛡️ 50% late cancellation policy & multi-inventory stock management enabled.
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '12px 34px',
                  background: submitting ? '#7A6E72' : '#1A1218',
                  border: 'none',
                  color: 'white',
                  fontSize: '11.5px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  borderRadius: '7px',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(26,18,24,0.25)',
                }}
              >
                {submitting ? 'Publishing...' : 'Publish Dress Listing →'}
              </button>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 960px) {
          .upload-page-wrapper {
            height: auto !important;
            min-height: 100vh !important;
          }
          .studio-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
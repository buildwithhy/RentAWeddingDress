'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getImageUrl } from '@/utils/getImageUrl';
import { formatDressAge } from '@/utils/formatters';

// ============================================================================
// PAGE: Dress Details (/dress/[id])
// DESCRIPTION:
//   Balanced, luxury e-commerce product layout:
//   - Proportional 2-column studio layout (Left: Gallery, Right: Details & Action)
//   - Clear readable typography (14-16px body, 32px serif headings)
//   - Structured specs cards, live size stock, customer reviews, and booking CTA
//
// BACKEND API REFERENCES:
//   - GET /api/dresses/{id}         -> Fetch dress details (DressesController.GetDressById)
//   - GET /api/dresses/{id}/reviews -> Fetch reviews for this dress (DressesController.GetDressReviews)
// ============================================================================

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function DressDetailPage() {
  const { id } = useParams();
  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (u) {
        try { setCurrentUser(JSON.parse(u)); } catch {}
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/dresses/${id}`)
      .then(r => r.json())
      .then(data => { setDress(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const loadAllReviews = async () => {
    setShowReviewsModal(true);
    if (allReviews.length === 0) {
      setLoadingReviews(true);
      try {
        const res = await fetch(`${API}/dresses/${id}/reviews`);
        const data = await res.json();
        setAllReviews(Array.isArray(data) ? data : []);
      } catch {}
      setLoadingReviews(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '38px', height: '38px', border: '2.5px solid #B5485A',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: '#7A6E72', fontSize: '14px', letterSpacing: '1px' }}>Loading dress details...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!dress) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '56px', opacity: 0.2, marginBottom: '16px' }}>👗</div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: '#1A1218', marginBottom: '12px' }}>Dress Not Found</h2>
        <Link href="/browse" style={{ color: '#B5485A', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Back to Browse Dresses</Link>
      </div>
    </div>
  );

  const imagesList = (dress.Images && dress.Images.length > 0)
    ? dress.Images
    : (dress.DressImages && dress.DressImages.length > 0)
      ? dress.DressImages
      : [dress.ImgPath || dress.ImagePath || dress.Image].filter(Boolean);

  const isOwner = currentUser && dress.OwnerId && currentUser.userId === dress.OwnerId;

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', padding: '24px 20px 48px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── BREADCRUMB ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link href="/browse" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: '#7A6E72', textDecoration: 'none', fontSize: '12px',
            letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600,
          }}>
            ← Back to Browse
          </Link>
          <span style={{ fontSize: '12px', color: '#7A6E72', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {dress.Category || 'Outfit'} &bull; {dress.Occasion || 'Wedding'}
          </span>
        </div>

        {/* ── TWO-COLUMN LUXURY STUDIO GRID ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(340px, 480px) 1fr', gap: '36px',
          alignItems: 'start',
        }} className="dress-layout-grid">

          {/* ── LEFT COLUMN: IMAGE GALLERY ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Main Showcase Image */}
            <div style={{
              background: '#F5E6E9', width: '100%', height: '540px', borderRadius: '12px',
              overflow: 'hidden', position: 'relative', border: '1px solid #E8E0E4',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            }} className="main-image-box">
              {imagesList.length > 0 ? (
                <img
                  src={getImageUrl(imagesList[activeImg])}
                  alt={dress.Title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/placeholder-dress.png';
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', opacity: 0.15 }}>👗</div>
              )}

              {/* Gender badge */}
              {dress.Gender && (
                <div style={{
                  position: 'absolute', top: '16px', left: '16px',
                  background: dress.Gender === 'Female' ? '#B5485A' : '#1A1218',
                  color: 'white', fontSize: '11px', padding: '5px 12px', borderRadius: '4px',
                  letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                  {dress.Gender}
                </div>
              )}

              {/* Condition Badge */}
              {dress.Condition > 0 && (
                <div style={{
                  position: 'absolute', top: '16px', right: '16px',
                  background: 'rgba(26,18,24,0.85)', color: 'white',
                  fontSize: '11px', padding: '5px 12px', borderRadius: '4px',
                  fontWeight: 600, backdropFilter: 'blur(4px)',
                }}>
                  {dress.Condition}/10 Condition
                </div>
              )}

              {/* Photo Count */}
              {imagesList.length > 1 && (
                <div style={{
                  position: 'absolute', bottom: '16px', right: '16px',
                  background: 'rgba(26,18,24,0.8)', color: 'white',
                  fontSize: '12px', padding: '4px 12px', borderRadius: '6px',
                }}>
                  {activeImg + 1} of {imagesList.length}
                </div>
              )}
            </div>

            {/* Thumbnails Row */}
            {imagesList.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {imagesList.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{
                      flexShrink: 0, width: '72px', height: '88px',
                      borderRadius: '8px', overflow: 'hidden', border: '2.5px solid',
                      borderColor: activeImg === i ? '#B5485A' : '#E8E0E4',
                      cursor: 'pointer', padding: 0, background: 'white',
                      opacity: activeImg === i ? 1 : 0.65, transition: 'all 0.15s',
                    }}
                  >
                    <img src={getImageUrl(img)} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder-dress.png';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: DETAILS, SPECS, SIZES, REVIEWS & CTA ── */}
          <div style={{
            background: 'white', border: '1px solid #E8E0E4', borderRadius: '14px',
            padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '22px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          }}>

            {/* Header: Title + Price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', borderBottom: '1.5px solid #F0EAED', paddingBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                {dress.Occasion && (
                  <span style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: '#B5485A', fontWeight: 600 }}>
                    {dress.Occasion} Ensemble
                  </span>
                )}
                <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 600, color: '#1A1218', lineHeight: 1.2, margin: '4px 0 10px' }}>
                  {dress.Title}
                </h1>

                {/* Rating & Reviews counter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} style={{ color: i <= Math.round(dress.AverageRating || 0) ? '#C9A96E' : '#E8E0E4', fontSize: '16px' }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: '14px', color: '#1A1218', fontWeight: 600 }}>
                    {dress.AverageRating > 0 ? `${dress.AverageRating.toFixed(1)} / 5.0` : 'No ratings yet'}
                  </span>
                  {dress.Reviews?.length > 0 && (
                    <button onClick={loadAllReviews} style={{ background: 'none', border: 'none', color: '#B5485A', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                      ({dress.Reviews.length} customer review{dress.Reviews.length !== 1 ? 's' : ''})
                    </button>
                  )}
                </div>
              </div>

              {/* Price Tag */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', color: '#B5485A', fontWeight: 600, lineHeight: 1 }}>
                  Rs. {dress.RentPrice?.toLocaleString()}
                </div>
                <span style={{ fontSize: '12px', color: '#7A6E72', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500 }}>
                  Per Day Rent
                </span>
              </div>
            </div>

            {/* ── SPECIFICATIONS (CLEAN 2-COLUMN GRID) ── */}
            <div>
              <p style={{ fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72', marginBottom: '10px', fontWeight: 600 }}>
                Outfit Specifications
              </p>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px',
              }} className="specs-grid">
                
                <div style={{ background: '#FAF7F2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #EFEAE6' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#7A6E72', display: 'block', marginBottom: '2px' }}>Category</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1218' }}>{dress.Category || '—'}</span>
                </div>

                <div style={{ background: '#FAF7F2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #EFEAE6' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#7A6E72', display: 'block', marginBottom: '2px' }}>Sub Category</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1218' }}>{dress.SubCategory || '—'}</span>
                </div>

                <div style={{ background: '#FAF7F2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #EFEAE6' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#7A6E72', display: 'block', marginBottom: '2px' }}>Condition</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1218' }}>{dress.Condition ? `${dress.Condition}/10 Rating` : '10/10 (Excellent)'}</span>
                </div>

                <div style={{ background: '#FAF7F2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #EFEAE6' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#7A6E72', display: 'block', marginBottom: '2px' }}>Dress Age</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#854F0B' }}>✨ {formatDressAge(dress.AgeInMonths)}</span>
                </div>

                <div style={{ background: '#FAF7F2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #EFEAE6' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#7A6E72', display: 'block', marginBottom: '2px' }}>City / Location</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1218' }}>📍 {dress.City || 'All Pakistan'}{dress.Location ? ` (${dress.Location})` : ''}</span>
                </div>

                <div style={{ background: '#FAF7F2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #EFEAE6' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: '#7A6E72', display: 'block', marginBottom: '2px' }}>Occasion</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1218' }}>🎉 {dress.Occasions?.join(', ') || dress.Occasion || 'Wedding & Party'}</span>
                </div>

              </div>
            </div>

            {/* Description */}
            {dress.Description && (
              <div>
                <p style={{ fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72', marginBottom: '6px', fontWeight: 600 }}>Description</p>
                <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.7, margin: 0 }}>
                  {dress.Description}
                </p>
              </div>
            )}

            {/* Available Sizes & Live Stock */}
            {((dress.SizesWithQuantity && dress.SizesWithQuantity.length > 0) || (dress.Sizes && dress.Sizes.length > 0)) && (
              <div>
                <p style={{ fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72', marginBottom: '10px', fontWeight: 600 }}>
                  Available Sizes & Live Stock
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {dress.SizesWithQuantity && dress.SizesWithQuantity.length > 0 ? (
                    dress.SizesWithQuantity.map((sq, idx) => (
                      <div key={idx} style={{
                        border: '1.5px solid #D0C8CC', background: sq.Quantity > 0 ? '#FFFFFF' : '#F9F9F9',
                        padding: '8px 18px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', gap: '10px',
                      }}>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#1A1218' }}>{sq.SizeName}</span>
                        <span style={{ fontSize: '13px', color: sq.Quantity > 0 ? '#0F6E56' : '#A32D2D', fontWeight: 600 }}>
                          {sq.Quantity > 0 ? `✓ ${sq.Quantity} in stock` : '✕ Out of stock'}
                        </span>
                      </div>
                    ))
                  ) : (
                    dress.Sizes?.map(size => (
                      <span key={size} style={{
                        padding: '8px 18px', border: '1.5px solid #1A1218', background: '#1A1218',
                        color: 'white', fontSize: '14px', borderRadius: '8px', fontWeight: 600,
                      }}>
                        {size}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div style={{ borderTop: '1px solid #F0EAED', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72', fontWeight: 600 }}>
                  Customer Reviews ({dress.Reviews?.length || 0})
                </span>
                {dress.Reviews?.length > 0 && (
                  <button onClick={loadAllReviews} style={{ background: 'none', border: 'none', color: '#B5485A', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    View All Reviews →
                  </button>
                )}
              </div>

              {!dress.Reviews || dress.Reviews.length === 0 ? (
                <div style={{ background: '#FAF7F2', padding: '14px 18px', borderRadius: '8px', color: '#7A6E72', fontSize: '13px', fontStyle: 'italic' }}>
                  No customer reviews yet. Be the first to book and rate this dress!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {dress.Reviews.slice(0, 2).map((r, i) => (
                    <div key={i} style={{ background: '#FAF7F2', border: '1px solid #EFEAE6', padding: '12px 16px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1218' }}>{r.UserName || 'Customer'}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} style={{ color: star <= r.Rating ? '#C9A96E' : '#E8E0E4', fontSize: '12px' }}>★</span>
                          ))}
                        </div>
                      </div>
                      {r.Feedback && <p style={{ fontSize: '13px', color: '#444', margin: 0, lineHeight: 1.5 }}>{r.Feedback}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action CTA Button */}
            <div style={{ paddingTop: '8px' }}>
              {isOwner ? (
                <div style={{
                  background: '#E6F1FB', border: '1.5px solid #B8D4F4', borderRadius: '8px',
                  padding: '16px', textAlign: 'center', color: '#185FA5',
                  fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase',
                  fontWeight: 600,
                }}>
                  👗 You are the owner of this dress
                </div>
              ) : (
                <Link href={`/dress/${dress.D_id}/book`} style={{
                  display: 'block', textAlign: 'center', borderRadius: '8px',
                  background: '#1A1218', color: 'white',
                  padding: '16px', fontSize: '14px',
                  letterSpacing: '2.5px', textTransform: 'uppercase',
                  textDecoration: 'none', fontWeight: 600,
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 16px rgba(26,18,24,0.2)',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#B5485A'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(181,72,90,0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1218'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,18,24,0.2)'; }}
                >
                  Rent / Advance Book Now →
                </Link>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* ── ALL REVIEWS MODAL ── */}
      {showReviewsModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(26,18,24,0.65)', padding: '20px',
        }}>
          <div style={{
            background: 'white', width: '100%', maxWidth: '560px',
            maxHeight: '80vh', overflowY: 'auto', padding: '28px', borderRadius: '12px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', fontWeight: 600, color: '#1A1218', margin: 0 }}>
                  Customer Reviews
                </h3>
                <p style={{ color: '#7A6E72', fontSize: '13px', margin: '4px 0 0' }}>{dress.Title}</p>
              </div>
              <button onClick={() => setShowReviewsModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#7A6E72' }}>✕</button>
            </div>

            {loadingReviews ? (
              <p style={{ color: '#7A6E72', textAlign: 'center', padding: '28px 0', fontSize: '14px' }}>Loading reviews...</p>
            ) : allReviews.length === 0 ? (
              <p style={{ color: '#7A6E72', textAlign: 'center', padding: '28px 0', fontStyle: 'italic', fontSize: '14px' }}>No reviews found for this dress.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {allReviews.map((r, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #E8E0E4', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#1A1218' }}>{r.UserName || 'Customer'}</span>
                      <span style={{ fontSize: '12px', color: '#7A6E72' }}>
                        {r.Date ? new Date(r.Date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ color: star <= r.Rating ? '#C9A96E' : '#E8E0E4', fontSize: '14px' }}>★</span>
                      ))}
                    </div>
                    {r.Feedback && <p style={{ fontSize: '14px', color: '#444', margin: 0, lineHeight: 1.6 }}>{r.Feedback}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .dress-layout-grid { grid-template-columns: 1fr !important; }
          .main-image-box { height: 400px !important; }
          .specs-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

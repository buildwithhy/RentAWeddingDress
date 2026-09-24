'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getImageUrl } from '@/utils/getImageUrl';
import { formatDressAge } from '@/utils/formatters';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function DressDetailPage() {
  const { id } = useParams();
  const [dress, setDress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/dresses/${id}`)
      .then(r => r.json())
      .then(data => { setDress(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px', height: '40px', border: '2px solid #B5485A',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: '#7A6E72', fontSize: '13px' }}>Loading dress details...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!dress) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F2' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', opacity: 0.2, marginBottom: '16px' }}>👗</div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', marginBottom: '16px' }}>Dress not found</h2>
        <Link href="/browse" style={{ color: '#B5485A', textDecoration: 'none', fontSize: '13px' }}>← Back to Browse</Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 5%' }}>

        {/* Back button */}
        <Link href="/browse" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          color: '#7A6E72', textDecoration: 'none', fontSize: '11px',
          letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '32px',
        }}>
          ← Back to Browse
        </Link>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }} className="detail-grid">

          {/* LEFT — Images */}
          <div>
            {(() => {
              const imagesList = (dress.Images && dress.Images.length > 0)
                ? dress.Images
                : (dress.DressImages && dress.DressImages.length > 0)
                  ? dress.DressImages
                  : [dress.ImgPath || dress.ImagePath || dress.Image].filter(Boolean);
              return (
                <>
                  <div style={{
                    background: '#F5E6E9', aspectRatio: '3/4',
                    overflow: 'hidden', position: 'relative', marginBottom: '10px',
                  }}>
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
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', opacity: 0.1 }}>👗</div>
                    )}
                    {imagesList.length > 1 && (
                      <div style={{
                        position: 'absolute', bottom: '12px', right: '12px',
                        background: 'rgba(0,0,0,0.6)', color: 'white',
                        fontSize: '11px', padding: '4px 10px',
                      }}>
                        {activeImg + 1} / {imagesList.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {imagesList.length > 1 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {imagesList.map((img, i) => (
                        <button key={i} onClick={() => setActiveImg(i)}
                          style={{
                            flexShrink: 0, width: '64px', height: '80px',
                            overflow: 'hidden', border: '2px solid',
                            borderColor: activeImg === i ? '#B5485A' : 'transparent',
                            cursor: 'pointer', padding: 0, background: 'none',
                            opacity: activeImg === i ? 1 : 0.6,
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
                </>
              );
            })()}
          </div>

          {/* RIGHT — Info */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 600, color: '#1A1218', lineHeight: 1.1 }}>
                {dress.Title}
              </h1>
              <span style={{
                background: dress.Gender === 'Female' ? '#B5485A' : '#1A1218',
                color: 'white', fontSize: '10px', padding: '4px 10px',
                letterSpacing: '1.5px', textTransform: 'uppercase', flexShrink: 0,
              }}>
                {dress.Gender}
              </span>
            </div>

            {/* Price */}
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', color: '#B5485A', fontWeight: 600 }}>
                Rs. {dress.RentPrice?.toLocaleString()}
              </span>
              <span style={{ fontSize: '13px', color: '#7A6E72' }}> / day</span>
            </div>

            {/* Rating */}
            {dress.AverageRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} style={{ color: i <= Math.round(dress.AverageRating) ? '#C9A96E' : '#E8E0E4', fontSize: '16px' }}>★</span>
                ))}
                <span style={{ fontSize: '13px', color: '#7A6E72' }}>{dress.AverageRating.toFixed(1)}</span>
              </div>
            )}

            {/* Info Table */}
            <div style={{ border: '1px solid #E8E0E4', background: 'white', marginBottom: '20px' }}>
              {[
                { label: 'Category', value: dress.Category },
                { label: 'Sub Category', value: dress.SubCategory },
                { label: 'Condition', value: `${dress.Condition}/10` },
                { label: 'Occasion', value: dress.Occasions?.join(', ') || '—' },
                { label: 'City', value: dress.City || '—' },
                { label: 'Area / Location', value: dress.Location || '—' },
                { label: 'Dress Age', value: formatDressAge(dress.AgeInMonths) },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 16px', borderBottom: '1px solid #E8E0E4',
                }}>
                  <span style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72' }}>{label}</span>
                  <span style={{ fontSize: '13px', color: '#1A1218', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {dress.Description && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72', marginBottom: '8px' }}>Description</p>
                <p style={{
                  fontSize: '13px', color: '#1A1218', lineHeight: 1.7,
                  overflow: 'hidden',
                  display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 3,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {dress.Description}
                </p>
                {dress.Description.length > 120 && (
                  <button onClick={() => setExpanded(!expanded)}
                    style={{ color: '#B5485A', background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer', marginTop: '4px', padding: 0 }}>
                    {expanded ? 'Show less ↑' : 'Read more ↓'}
                  </button>
                )}
              </div>
            )}

            {/* Sizes & Stock */}
            {((dress.SizesWithQuantity && dress.SizesWithQuantity.length > 0) || (dress.Sizes && dress.Sizes.length > 0)) && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7A6E72', marginBottom: '10px' }}>Available Sizes & Inventory</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {dress.SizesWithQuantity && dress.SizesWithQuantity.length > 0 ? (
                    dress.SizesWithQuantity.map((sq, idx) => (
                      <div key={idx} style={{
                        border: '1px solid #1A1218', background: 'white',
                        padding: '6px 14px', textAlign: 'center', minWidth: '54px',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1A1218' }}>{sq.SizeName}</div>
                        <div style={{ fontSize: '10px', color: sq.Quantity > 0 ? '#0F6E56' : '#A32D2D', fontWeight: 500 }}>
                          {sq.Quantity > 0 ? `${sq.Quantity} in stock` : 'Out of stock'}
                        </div>
                      </div>
                    ))
                  ) : (
                    dress.Sizes?.map(size => (
                      <span key={size} style={{
                        width: '44px', height: '40px', border: '1px solid #1A1218',
                        background: '#1A1218', color: 'white', fontSize: '13px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 500,
                      }}>
                        {size}
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Cancellation Policy Banner */}
            <div style={{
              background: '#FAF7F2', border: '1px solid #E8E0E4',
              padding: '14px', marginBottom: '20px', borderRadius: '4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#1A1218', marginBottom: '4px' }}>
                <span>🛡️</span> Cancellation Policy
              </div>
              <ul style={{ fontSize: '11px', color: '#7A6E72', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li><strong>Free cancellation</strong> up to 4 days prior to rental start date.</li>
                <li>Cancellations within 4 days incur a <strong>50% rental fee penalty</strong> credited to your account.</li>
              </ul>
            </div>

            {/* Book Button */}
            <Link href={`/dress/${dress.D_id}/book`} style={{
              display: 'block', textAlign: 'center',
              background: '#1A1218', color: 'white',
              padding: '16px', fontSize: '11px',
              letterSpacing: '3px', textTransform: 'uppercase',
              textDecoration: 'none', fontWeight: 500,
            }}>
              Rent / Advance Book →
            </Link>
          </div>
        </div>

        {/* ── REVIEWS ── */}
        <div style={{ marginTop: '60px', borderTop: '1px solid #E8E0E4', paddingTop: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <div>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 600, color: '#1A1218' }}>
                Ratings & Reviews
              </h2>
              {dress.AverageRating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} style={{ color: i <= Math.round(dress.AverageRating) ? '#C9A96E' : '#E8E0E4', fontSize: '18px' }}>★</span>
                  ))}
                  <span style={{ color: '#C9A96E', fontWeight: 500 }}>{dress.AverageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {!dress.Reviews || dress.Reviews.length === 0 ? (
            <p style={{ color: '#7A6E72', fontSize: '14px', fontStyle: 'italic' }}>No reviews yet — be the first to rent this dress!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {dress.Reviews.map((r, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E8E0E4', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: '#F5E6E9', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '16px', fontWeight: 500, color: '#B5485A',
                    }}>
                      {r.UserName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#1A1218' }}>{r.UserName}</p>
                      <p style={{ fontSize: '11px', color: '#7A6E72' }}>
                        {new Date(r.Date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} style={{ color: i <= r.Rating ? '#C9A96E' : '#E8E0E4', fontSize: '14px' }}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '13px', color: '#1A1218', lineHeight: 1.6 }}>{r.Feedback}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

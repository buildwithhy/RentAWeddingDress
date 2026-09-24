'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/utils/getImageUrl';
import { formatDressAge } from '@/utils/formatters';

const API = process.env.NEXT_PUBLIC_API_URL || '/api';

const OCCASIONS = ['Barat', 'Walima', 'Mehndi', 'Engagement', 'Party', 'Nikkah'];
const SIZES = ['S', 'M', 'L', 'XL'];
const SIZE_ID_MAP = { 'S': 1, 'M': 2, 'L': 3, 'XL': 4 };

const CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot'
];

const AGE_OPTIONS = [
  { label: 'Brand New (< 3 Months)', value: 3 },
  { label: 'Under 6 Months', value: 6 },
  { label: 'Under 1 Year', value: 12 },
  { label: 'Under 2 Years', value: 24 },
  { label: 'Any Age', value: '' },
];

const BRIDAL_SUBS = ['Lehnga Choli', 'Maxi', 'Saree', 'Sharara / Gharara', 'Shirt With Lehnga'];
const GROOM_SUBS = ['Sherwani', 'Kurta Pajama', '3-Piece Suits', 'Prince Coats', 'Waist Coats'];
const FORMAL_SUBS = ['Lehnga Choli', 'Gowns', 'Saris', 'Sharara / Gharara', '3-Piece Suits', 'Kurta Pajama'];

const CONDITIONS = [
  { label: '10/10', value: 10 },
  { label: '9/10', value: 9 },
  { label: '8/10', value: 8 },
  { label: '7/10', value: 7 },
  { label: '6/10', value: 6 },
  { label: '5/10', value: 5 },
  { label: '4/10', value: 4 },
  { label: '3/10', value: 3 },
  { label: '2/10', value: 2 },
  { label: '1/10', value: 1 },
];

const SUB_ID_MAP = {
  'Lehnga Choli': 1, 'Maxi': 2, 'Saree': 3,
  'Sharara / Gharara': 4, 'Shirt With Lehnga': 5,
  'Sherwani': 6, 'Kurta Pajama': 7, '3-Piece Suits': 8,
  'Prince Coats': 9, 'Waist Coats': 10,
  'Gowns': 12, 'Saris': 13,
};

const FORMAL_SUB_ID_MAP = {
  'Lehnga Choli': 11, 'Gowns': 12, 'Saris': 13,
  'Sharara / Gharara': 4, '3-Piece Suits': 14, 'Kurta Pajama': 15,
};

function Chip({ label, active, onClear, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
        border: active ? '2px solid #B5485A' : '1.5px solid #D0C8CC',
        background: active ? '#F5E6E9' : 'white',
        color: active ? '#B5485A' : '#1A1218',
        borderRadius: '20px', fontWeight: active ? 600 : 400,
        whiteSpace: 'nowrap', transition: 'all 0.15s',
      }}>
        {label}
        {active && onClear ? (
          <span onClick={(e) => { e.stopPropagation(); onClear(); setOpen(false); }}
            style={{ fontWeight: 700, fontSize: '16px', lineHeight: 1 }}>×</span>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          background: 'white', border: '1px solid #E8E0E4',
          borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
          zIndex: 200, minWidth: '200px', padding: '8px 0',
          maxHeight: '380px', overflowY: 'auto',
        }}>
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}

const SubItem = ({ label, selected, onClick }) => (
  <button onClick={onClick} style={{
    display: 'block', width: '100%', textAlign: 'left',
    padding: '9px 20px', background: selected ? '#F5E6E9' : 'transparent',
    border: 'none', fontSize: '13px', cursor: 'pointer',
    color: selected ? '#B5485A' : '#1A1218', fontWeight: selected ? 600 : 400,
  }}
    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = '#FAF7F2'; }}
    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
  >
    {selected ? '● ' : '○ '}{label}
  </button>
);

const ApplyBtn = ({ onClick }) => (
  <div style={{ padding: '8px 12px', borderTop: '1px solid #E8E0E4', marginTop: '4px' }}>
    <button onClick={onClick} style={{
      width: '100%', background: '#B5485A', color: 'white',
      border: 'none', padding: '10px', fontSize: '13px',
      cursor: 'pointer', borderRadius: '8px', fontWeight: 500,
    }}>Apply</button>
  </div>
);

export default function BrowsePage() {
  const [dresses, setDresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [bridalSub, setBridalSub] = useState('');
  const [groomSub, setGroomSub] = useState('');
  const [formalSub, setFormalSub] = useState('');
  const [gender, setGender] = useState('');
  const [occasion, setOccasion] = useState('');
  const [city, setCity] = useState('');
  const [maxAgeInMonths, setMaxAgeInMonths] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minCondition, setMinCondition] = useState('');

  useEffect(() => { fetchDresses({}); }, []);

  const getActiveSubCategoryId = (bSub, gSub, fSub) => {
    if (bSub) return SUB_ID_MAP[bSub] || null;
    if (gSub) return SUB_ID_MAP[gSub] || null;
    if (fSub) return FORMAL_SUB_ID_MAP[fSub] || null;
    return null;
  };

  const fetchDresses = async (filters) => {
    setLoading(true);
    try {
      const body = {};
      if (filters.search) body.Search = filters.search;
      if (filters.categoryId) body.CategoryId = filters.categoryId;
      if (filters.subCategoryId) body.SubCategoryId = filters.subCategoryId;
      if (filters.gender) body.Gender = filters.gender;
      if (filters.occasion) body.Occasion = filters.occasion;
      if (filters.city) body.City = filters.city;
      if (filters.maxAgeInMonths) body.MaxAgeInMonths = Number(filters.maxAgeInMonths);
      if (filters.minPrice) body.MinPrice = Number(filters.minPrice);
      if (filters.maxPrice) body.MaxPrice = Number(filters.maxPrice);
      if (filters.startDate) body.StartDate = filters.startDate;
      if (filters.endDate) body.EndDate = filters.endDate;
      if (filters.minCondition) body.MinCondition = Number(filters.minCondition);
      if (filters.selectedSizes && filters.selectedSizes.length > 0) {
        body.SizeIds = filters.selectedSizes.map(s => SIZE_ID_MAP[s]).filter(Boolean);
      }

      const res = await fetch(`${API}/dresses/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setDresses(Array.isArray(data) ? data : []);
    } catch {
      setDresses([]);
    }
    setLoading(false);
  };

  const doSearch = (overrides = {}) => {
    const bSub = overrides.bridalSub !== undefined ? overrides.bridalSub : bridalSub;
    const gSub = overrides.groomSub !== undefined ? overrides.groomSub : groomSub;
    const fSub = overrides.formalSub !== undefined ? overrides.formalSub : formalSub;

    const catId = bSub ? 1 : gSub ? 2 : fSub ? 3 : null;
    const subId = getActiveSubCategoryId(bSub, gSub, fSub);
    const gen = bSub ? 'Female' : gSub ? 'Male' : (overrides.gender !== undefined ? overrides.gender : gender);

    fetchDresses({
      search,
      categoryId: catId,
      subCategoryId: subId,
      gender: gen,
      occasion: overrides.occasion !== undefined ? overrides.occasion : occasion,
      city: overrides.city !== undefined ? overrides.city : city,
      maxAgeInMonths: overrides.maxAgeInMonths !== undefined ? overrides.maxAgeInMonths : maxAgeInMonths,
      minPrice,
      maxPrice,
      selectedSizes: overrides.selectedSizes !== undefined ? overrides.selectedSizes : selectedSizes,
      startDate,
      endDate,
      minCondition: overrides.minCondition !== undefined ? overrides.minCondition : minCondition,
    });
  };

  const clearAll = () => {
    setSearch(''); setBridalSub(''); setGroomSub('');
    setFormalSub(''); setGender(''); setOccasion('');
    setCity(''); setMaxAgeInMonths('');
    setMinPrice(''); setMaxPrice(''); setSelectedSizes([]);
    setStartDate(''); setEndDate('');
    setMinCondition('');
    fetchDresses({});
  };

  const today = new Date().toISOString().split('T')[0];

  const hasFilters = bridalSub || groomSub || formalSub || gender || occasion
    || city || maxAgeInMonths || minPrice || maxPrice || selectedSizes.length > 0 || startDate || minCondition;

  const bridalLabel = bridalSub || 'Bridal';
  const groomLabel = groomSub || 'Groom';
  const formalLabel = formalSub || 'Formal';
  const autoGender = bridalSub ? 'Female' : groomSub ? 'Male' : gender;
  const genderLabel = autoGender || 'Gender';
  const cityLabel = city || 'City / Location';
  const ageLabel = maxAgeInMonths ? `< ${maxAgeInMonths} Months` : 'Dress Age';
  const priceLabel = (minPrice || maxPrice) ? `Rs.${minPrice || '0'} – ${maxPrice || '∞'}` : 'Price';
  const sizeLabel = selectedSizes.length > 0 ? `Size: ${selectedSizes.join(', ')}` : 'Size';
  const occasionLabel = occasion || 'Occasion';
  const dateLabel = startDate || 'Date';
  const conditionLabel = minCondition ? `${minCondition}/10` : 'Condition';

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2' }}>

      <div style={{ background: 'white', borderBottom: '1px solid #E8E0E4', position: 'sticky', top: '64px', zIndex: 50, padding: '14px 5%' }}>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', border: '1.5px solid #E8E0E4', padding: '10px 16px', background: '#FAF7F2', borderRadius: '10px' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#B5485A" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search dresses by title, brand, or style..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', color: '#1A1218', outline: 'none' }}
            />
            {search && (
              <button onClick={() => { setSearch(''); fetchDresses({}); }}
                style={{ background: 'none', border: 'none', color: '#7A6E72', cursor: 'pointer', fontSize: '18px' }}>×</button>
            )}
          </div>
          <button onClick={() => doSearch()} style={{ background: '#B5485A', color: 'white', border: 'none', padding: '10px 28px', fontSize: '14px', cursor: 'pointer', borderRadius: '10px', fontWeight: 500 }}>
            Search
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>

          {/* CITY CHIP */}
          <Chip label={cityLabel} active={!!city} onClear={() => { setCity(''); doSearch({ city: '' }); }}>
            {({ close }) => (<>
              <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #E8E0E4' }}>
                <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>Select City</span>
              </div>
              {CITIES.map(c => (
                <SubItem key={c} label={c} selected={city === c}
                  onClick={() => setCity(city === c ? '' : c)} />
              ))}
              <ApplyBtn onClick={() => { doSearch(); close(); }} />
            </>)}
          </Chip>

          {/* DRESS AGE CHIP */}
          <Chip label={ageLabel} active={!!maxAgeInMonths} onClear={() => { setMaxAgeInMonths(''); doSearch({ maxAgeInMonths: '' }); }}>
            {({ close }) => (<>
              <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #E8E0E4' }}>
                <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>Dress Age</span>
              </div>
              {AGE_OPTIONS.map(opt => (
                <SubItem key={opt.label} label={opt.label} selected={String(maxAgeInMonths) === String(opt.value)}
                  onClick={() => setMaxAgeInMonths(String(maxAgeInMonths) === String(opt.value) ? '' : opt.value)} />
              ))}
              <ApplyBtn onClick={() => { doSearch(); close(); }} />
            </>)}
          </Chip>

          {/* BRIDAL CHIP */}
          <Chip label={bridalLabel} active={!!bridalSub} onClear={() => { setBridalSub(''); setGender(''); doSearch({ bridalSub: '' }); }}>
            {({ close }) => (<>
              <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #E8E0E4' }}>
                <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>Bridal — Female</span>
              </div>
              {BRIDAL_SUBS.map(sub => (
                <SubItem key={sub} label={sub} selected={bridalSub === sub}
                  onClick={() => {
                    setBridalSub(bridalSub === sub ? '' : sub);
                    setGroomSub(''); setFormalSub('');
                    setGender('Female');
                  }} />
              ))}
              <ApplyBtn onClick={() => { doSearch(); close(); }} />
            </>)}
          </Chip>

          {/* GROOM CHIP */}
          <Chip label={groomLabel} active={!!groomSub} onClear={() => { setGroomSub(''); setGender(''); doSearch({ groomSub: '' }); }}>
            {({ close }) => (<>
              <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #E8E0E4' }}>
                <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>Groom — Male</span>
              </div>
              {GROOM_SUBS.map(sub => (
                <SubItem key={sub} label={sub} selected={groomSub === sub}
                  onClick={() => {
                    setGroomSub(groomSub === sub ? '' : sub);
                    setBridalSub(''); setFormalSub('');
                    setGender('Male');
                  }} />
              ))}
              <ApplyBtn onClick={() => { doSearch(); close(); }} />
            </>)}
          </Chip>

          {/* FORMAL CHIP */}
          <Chip label={formalLabel} active={!!formalSub} onClear={() => { setFormalSub(''); doSearch({ formalSub: '' }); }}>
            {({ close }) => (<>
              <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #E8E0E4' }}>
                <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>Formal</span>
              </div>
              {FORMAL_SUBS.map(sub => (
                <SubItem key={sub} label={sub} selected={formalSub === sub}
                  onClick={() => { setFormalSub(formalSub === sub ? '' : sub); setBridalSub(''); setGroomSub(''); }} />
              ))}
              <ApplyBtn onClick={() => { doSearch(); close(); }} />
            </>)}
          </Chip>

          <div style={{ width: '1px', height: '28px', background: '#E8E0E4', margin: '0 2px' }} />

          {/* GENDER CHIP */}
          <Chip
            label={genderLabel}
            active={!!autoGender}
            onClear={!bridalSub && !groomSub ? () => { setGender(''); doSearch({ gender: '' }); } : null}
          >
            {({ close }) => (<>
              <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #E8E0E4' }}>
                <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>Gender</span>
              </div>
              {(bridalSub || groomSub) && (
                <div style={{ padding: '8px 16px', fontSize: '12px', color: '#7A6E72', background: '#FAF7F2' }}>
                  Auto selected from category
                </div>
              )}
              {['Male', 'Female'].map(g => (
                <SubItem key={g} label={g} selected={autoGender === g}
                  onClick={() => {
                    if (!bridalSub && !groomSub) setGender(gender === g ? '' : g);
                  }} />
              ))}
              <ApplyBtn onClick={() => { doSearch(); close(); }} />
            </>)}
          </Chip>

          {/* OCCASION CHIP */}
          <Chip label={occasionLabel} active={!!occasion} onClear={() => { setOccasion(''); doSearch({ occasion: '' }); }}>
            {({ close }) => (<>
              <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #E8E0E4' }}>
                <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>Occasion</span>
              </div>
              {OCCASIONS.map(occ => (
                <SubItem key={occ} label={occ} selected={occasion === occ} onClick={() => setOccasion(occasion === occ ? '' : occ)} />
              ))}
              <ApplyBtn onClick={() => { doSearch(); close(); }} />
            </>)}
          </Chip>

          {/* PRICE CHIP */}
          <Chip label={priceLabel} active={!!(minPrice || maxPrice)} onClear={() => { setMinPrice(''); setMaxPrice(''); doSearch(); }}>
            {({ close }) => (
              <div style={{ padding: '16px', width: '260px' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1218', marginBottom: '14px', textAlign: 'center' }}>Price</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
                  <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                    style={{ flex: 1, border: '1.5px solid #E8E0E4', padding: '9px 12px', fontSize: '13px', outline: 'none', borderRadius: '8px', color: '#1A1218', boxSizing: 'border-box' }} />
                  <span style={{ color: '#7A6E72' }}>to</span>
                  <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                    style={{ flex: 1, border: '1.5px solid #E8E0E4', padding: '9px 12px', fontSize: '13px', outline: 'none', borderRadius: '8px', color: '#1A1218', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {[
                    { label: 'Under 5k', min: '', max: '5000' },
                    { label: '5k–10k', min: '5000', max: '10000' },
                    { label: '10k–20k', min: '10000', max: '20000' },
                    { label: 'Above 20k', min: '20000', max: '' },
                  ].map(r => (
                    <button key={r.label} onClick={() => { setMinPrice(r.min); setMaxPrice(r.max); }}
                      style={{ padding: '5px 12px', fontSize: '11px', cursor: 'pointer', border: '1px solid #E8E0E4', background: 'white', color: '#7A6E72', borderRadius: '20px' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { doSearch(); close(); }}
                  style={{ width: '100%', background: '#1A1218', color: 'white', border: 'none', padding: '11px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px', fontWeight: 500 }}>
                  Search
                </button>
              </div>
            )}
          </Chip>

          {/* SIZE CHIP */}
          <Chip label={sizeLabel} active={selectedSizes.length > 0} onClear={() => { setSelectedSizes([]); doSearch({ selectedSizes: [] }); }}>
            {({ close }) => (
              <div style={{ padding: '16px' }}>
                <p style={{ fontSize: '13px', color: '#7A6E72', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Select Size</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  {SIZES.map(size => (
                    <button key={size}
                      onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                      style={{ width: '50px', height: '46px', border: '1.5px solid', fontSize: '14px', cursor: 'pointer', borderRadius: '8px', fontWeight: selectedSizes.includes(size) ? 600 : 400, background: selectedSizes.includes(size) ? '#B5485A' : 'white', color: selectedSizes.includes(size) ? 'white' : '#1A1218', borderColor: selectedSizes.includes(size) ? '#B5485A' : '#E8E0E4' }}>
                      {size}
                    </button>
                  ))}
                </div>
                <button onClick={() => { doSearch(); close(); }}
                  style={{ width: '100%', background: '#1A1218', color: 'white', border: 'none', padding: '11px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px' }}>
                  Apply
                </button>
              </div>
            )}
          </Chip>

          {/* CONDITION CHIP */}
          <Chip label={conditionLabel} active={!!minCondition} onClear={() => { setMinCondition(''); doSearch({ minCondition: '' }); }}>
            {({ close }) => (
              <div style={{ padding: '8px 0', minWidth: '220px' }}>
                <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #E8E0E4' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7A6E72' }}>Minimum Condition</span>
                </div>
                {CONDITIONS.map(c => (
                  <SubItem key={c.value} label={c.label} selected={minCondition === String(c.value)}
                    onClick={() => setMinCondition(minCondition === String(c.value) ? '' : String(c.value))} />
                ))}
                <ApplyBtn onClick={() => { doSearch(); close(); }} />
              </div>
            )}
          </Chip>

          {/* DATE CHIP */}
          <Chip label={dateLabel} active={!!startDate} onClear={() => { setStartDate(''); setEndDate(''); }}>
            {({ close }) => (
              <div style={{ padding: '16px', width: '240px' }}>
                <p style={{ fontSize: '13px', color: '#7A6E72', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>Available Dates</p>
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ fontSize: '11px', color: '#7A6E72', marginBottom: '4px' }}>Start Date</p>
                  <input type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', border: '1.5px solid #E8E0E4', padding: '9px', fontSize: '13px', outline: 'none', borderRadius: '8px', color: '#1A1218', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ fontSize: '11px', color: '#7A6E72', marginBottom: '4px' }}>End Date</p>
                  <input type="date" value={endDate} min={startDate || today} onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', border: '1.5px solid #E8E0E4', padding: '9px', fontSize: '13px', outline: 'none', borderRadius: '8px', color: '#1A1218', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => { doSearch(); close(); }}
                  style={{ width: '100%', background: '#1A1218', color: 'white', border: 'none', padding: '11px', fontSize: '13px', cursor: 'pointer', borderRadius: '8px' }}>
                  Search
                </button>
              </div>
            )}
          </Chip>

          <div style={{ width: '1px', height: '28px', background: '#E8E0E4', margin: '0 2px' }} />

          <button onClick={() => doSearch()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', fontSize: '13px', cursor: 'pointer', background: '#1A1218', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 500 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            Apply Filters
          </button>

          {hasFilters && (
            <button onClick={clearAll} style={{ padding: '8px 16px', fontSize: '12px', cursor: 'pointer', border: '1.5px solid #E8E0E4', background: 'white', color: '#B5485A', borderRadius: '20px', fontWeight: 500 }}>
              Clear All ×
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '24px 5%', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', fontWeight: 600, color: '#1A1218' }}>
            {loading ? 'Searching...' : `${dresses.length} Dress${dresses.length !== 1 ? 'es' : ''} Found`}
          </h1>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '280px', background: '#E8E0E4', animation: 'pulse 1.5s infinite' }} />
                <div style={{ padding: '12px' }}>
                  <div style={{ height: '12px', background: '#E8E0E4', width: '75%', marginBottom: '8px', borderRadius: '4px' }} />
                  <div style={{ height: '12px', background: '#E8E0E4', width: '50%', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && dresses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', opacity: 0.15, marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#1A1218', marginBottom: '8px' }}>No Dresses Found</h3>
            <p style={{ color: '#7A6E72', fontSize: '13px', marginBottom: '24px' }}>Try adjusting your location, age, or occasion filters</p>
            <button onClick={clearAll} style={{ border: '1px solid #B5485A', color: '#B5485A', background: 'white', padding: '12px 32px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px' }}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Dress Cards */}
        {!loading && dresses.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {dresses.map(dress => {
              const src = getImageUrl(dress);
              return (
                <Link key={dress.D_id} href={`/dress/${dress.D_id}`} style={{
                  textDecoration: 'none', display: 'block', background: 'white',
                  borderRadius: '10px', border: '1px solid #E8E0E4', overflow: 'hidden',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(181,72,90,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ position: 'relative', background: '#F5E6E9', aspectRatio: '3/4', overflow: 'hidden' }}>
                    {src ? (
                      <img src={src} alt={dress.Title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/placeholder-dress.png';
                        }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', opacity: 0.2 }}>👗</div>
                    )}

                    {/* Price + Rating badge */}
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', color: 'white', padding: '4px 10px', fontSize: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Rs.{dress.RentPrice?.toLocaleString()}/day
                      {dress.Rating > 0 && <span><span style={{ color: '#C9A96E' }}>★</span> {dress.Rating.toFixed(1)}</span>}
                    </div>

                    {/* Gender badge */}
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: dress.Gender === 'Female' ? '#B5485A' : '#1A1218', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '4px' }}>
                      {dress.Gender}
                    </div>

                    {/* Condition badge */}
                    {dress.Condition && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: dress.Condition >= 9 ? '#3B6D11' : dress.Condition >= 7 ? '#854F0B' : '#7A2535',
                        color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600,
                      }}>
                        {dress.Condition}/10
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '12px' }}>
                    {dress.Occasion && (
                      <p style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#C9A96E', marginBottom: '4px' }}>
                        {dress.Occasion}
                      </p>
                    )}
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', fontWeight: 500, color: '#1A1218', lineHeight: 1.3, marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {dress.Title}
                    </h3>

                    {/* City & Area / Location */}
                    {dress.City && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#7A6E72', marginBottom: '6px' }}>
                        <span>📍</span>
                        <span style={{ fontWeight: 500, color: '#1A1218' }}>{dress.City}</span>
                        {dress.Location && <span>({dress.Location})</span>}
                      </div>
                    )}

                    {/* Dress Age */}
                    {dress.AgeInMonths !== undefined && dress.AgeInMonths !== null && (
                      <div style={{ fontSize: '11px', color: '#854F0B', marginBottom: '8px', fontWeight: 500 }}>
                        ✨ {formatDressAge(dress.AgeInMonths)}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: dress.Gender === 'Female' ? '#F5E6E9' : '#E8EEF4', color: '#1A1218' }}>
                        {dress.Gender}
                      </span>
                      {dress.Occasion && (
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '3px', background: '#F5EDD8', color: '#1A1218' }}>
                          {dress.Occasion}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  );
}
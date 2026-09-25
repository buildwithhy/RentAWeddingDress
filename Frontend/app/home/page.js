'use client';
import Link from 'next/link';

// ============================================================================
// PAGE: Landing & Home Page (/home)
// DESCRIPTION:
//   Hero showcase, Category navigation links, and How It Works guide.
// ============================================================================

export default function HomePage() {

  const StepCard = ({ icon, title, desc, width = 'auto' }) => (
    <div style={{ textAlign: 'center', width }}>
      {/* Icon Circle */}
      <div style={{
        width: '90px',
        height: '90px',
        margin: '0 auto 30px',
        borderRadius: '50%',
        background: '#EBDADA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img
          src={icon}
          alt=""
          style={{
            width: '38px',
            height: '38px',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: '18px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: '#2F4F4F',
        marginBottom: '18px'
      }}>
        {title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: '15px',
        color: '#7A6E72',
        lineHeight: 1.8,
        maxWidth: '320px',
        margin: '0 auto'
      }}>
        {desc}
      </p>
    </div>
  );

  return (
    <div>

      {/* ───────────────── HERO SECTION ───────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '92vh',
        backgroundImage: `url('/images/Hero.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
      }}>

        {/* Cinematic Dark Left Gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(30,15,5,0.85) 0%, rgba(30,15,5,0.6) 35%, rgba(30,15,5,0.25) 55%, transparent 75%)',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 5%',
        }}>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(50px, 6vw, 82px)',
            fontWeight: 500,
            color: 'white',
            lineHeight: 1.05,
            marginBottom: '28px',
          }}>
            Forget the rules <br />
            If you like it – Rent it
          </h1>

          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.85)',
            maxWidth: '480px',
            lineHeight: 1.7,
            marginBottom: '40px'
          }}>
            Premium bridal, groom & formal wear available on rent.
            Wear the best. Return the rest.
          </p>

          <Link href="/browse" style={{
            background: 'white',
            color: '#1A1218',
            padding: '16px 44px',
            textDecoration: 'none',
            fontSize: '12px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: 500
          }}>
            Browse Dresses
          </Link>

        </div>

        {/* Circular BOOK NOW
        <div style={{
          position: 'absolute',
          right: '70px',
          bottom: '110px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: '1px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '11px',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          BOOK NOW
        </div> */}

      </section>

      {/* ───────────────── CATEGORIES ───────────────── */}
      <section style={{ padding: '80px 5%', background: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '40px',
              fontWeight: 500,
              marginBottom: '12px'
            }}>
              Explore Categories
            </h2>
            <p style={{ color: '#7A6E72' }}>
              Find your perfect look for every occasion
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
            gap: '24px'
          }}>

            {[
              { name: 'Bridal', img: '/images/Bridal.png' },
              { name: 'Groom', img: '/images/Groom.png' },
              { name: 'Formal', img: '/images/Formal.png' },
            ].map(item => (
              <Link key={item.name} href="/browse" style={{
                position: 'relative',
                height: '380px',
                overflow: 'hidden',
                textDecoration: 'none'
              }}>
                <img
                  src={item.img}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)'
                }} />

                <h3 style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '24px',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '30px',
                  color: 'white'
                }}>
                  {item.name}
                </h3>
              </Link>
            ))}

          </div>
        </div>
      </section>

      {/* ───────────────── HOW IT WORKS ───────────────── */}
      <section style={{
        padding: '120px 5%',
        background: '#F5F5F5'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '100px' }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '46px',
              fontWeight: 500,
              color: '#1A1218'
            }}>
              How it works
            </h2>
          </div>

          {/* First Row (Grid 3) */}
          <div className="how-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '60px',
            textAlign: 'center'
          }}>
            {[
              {
                icon: '/icons/hanger.webp',
                title: 'PICK A DATE',
                desc: 'Choose when and for how long you would like to rent the outfit of your choice.'
              },
              {
                icon: '/icons/dress.webp',
                title: 'BOOK YOUR OUTFIT',
                desc: 'Browse through our vast collection of beautiful designer ensembles and find your perfect style.'
              },
              {
                icon: '/icons/tag.avif',
                title: 'GET THE PERFECT FIT',
                desc: 'Get a perfectly tailored outfit to your size.'
              }
            ].map((step, index) => (
              <StepCard
                key={index}
                icon={step.icon}
                title={step.title}
                desc={step.desc}
              />
            ))}
          </div>

          {/* Second Row Centered (Flex 2) */}
          <div className="how-row2" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '60px',
            marginTop: '60px'
          }}>
            {[
              {
                icon: '/icons/truck.webp',
                title: 'GET FREE DELIVERY & LAUNDRY',
                desc: 'We provide quality dry cleaning and fast delivery.'
              },
              {
                icon: '/icons/box.webp',
                title: 'FEEL AMAZING',
                desc: "Feel absolutely amazing every time you Rent It!"
              }
            ].map((step, index) => (
              <StepCard
                key={index}
                icon={step.icon}
                title={step.title}
                desc={step.desc}
                width="300px"
              />
            ))}
          </div>

        </div>

        {/* Responsive */}
        <style>{`
          @media (max-width: 900px) {
            .how-grid {
              grid-template-columns: 1fr !important;
              gap: 50px !important;
            }
            .how-row2 {
              flex-direction: column !important;
              align-items: center !important;
              gap: 50px !important;
            }
          }
        `}</style>
      </section>

    </div>
  );
}
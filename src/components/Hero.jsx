import './Hero.css'

const accent = '#b45309'

const IconSearchHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
    <path d="M8.5 11.5 11 9.3l2.5 2.2v3h-5z" />
  </svg>
)

const IconShieldCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
    <path d="m10 15 1.5 1.5L15 13" />
  </svg>
)

const IconKey = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="14" r="4" />
    <path d="m11 11 9-9" />
    <path d="m16 6 3 3M18 4l3 3" />
  </svg>
)

const features = [
  { icon: <IconSearchHome />, title: 'Smart Search', body: 'Find the right home with AI precision' },
  { icon: <IconShieldCheck />, title: 'Verified Homes', body: 'Trusted listings. Thoroughly verified.' },
  { icon: <IconCalendar />, title: 'Easy Visits', body: 'Schedule, visit & compare with ease' },
  { icon: <IconKey />, title: 'Hassle-free Closing', body: 'End-to-end support till you get the keys' },
]

export default function Hero() {
  return (
    <section className="hero">
      <img
        src="/Skyline.png"
        alt=""
        className="hero__skyline"
        aria-hidden="true"
      />

      <img
        src="/india-map.png"
        alt="India"
        className="hero__map"
        aria-hidden="true"
      />

      <div className="hero__content">
        <h1 className="hero__title">
          <span className="hero__title-line">
            Home, In The Age of <span className="hero__title-accent">AI</span>
          </span>
        </h1>

        <p className="hero__subtitle">
          First end-to-end guided real estate platform
        </p>

        <div className="hero__features">
          {features.map((f) => (
            <article key={f.title} className="feature">
              <div className="feature__icon">{f.icon}</div>
              <h3 className="feature__title">{f.title}</h3>
              <p className="feature__body">{f.body}</p>
            </article>
          ))}
        </div>

        <span className="hero__pill">
          <svg className="hero__pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
            <circle cx="12" cy="12" r="3.2" />
          </svg>
          <span className="hero__pill-text">Coming Soon</span>
        </span>
      </div>
    </section>
  )
}

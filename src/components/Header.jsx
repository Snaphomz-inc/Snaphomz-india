import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <a href="/" className="header__brand" aria-label="Snaphomz home">
        <img src="/logo.png" alt="Snaphomz" className="header__logo" />
      </a>
    </header>
  )
}

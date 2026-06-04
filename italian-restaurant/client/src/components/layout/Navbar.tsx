import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Cart from '@/components/features/Cart';
import SkipLink from '@/components/ui/SkipLink';
import useThrottle from '@/hooks/useThrottle';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

const navLinks = [
  { path: '/', label: 'Inicio' },
  { path: '/menu', label: 'Menú' },
  { path: '/reservation', label: 'Reservar' },
  { path: '/about', label: 'Quiénes Somos' },
  { path: '/contact', label: 'Contacto' },
];

const NavLinks = memo(function NavLinks({
  pathname,
  onClick,
}: {
  pathname: string;
  onClick?: () => void;
}) {
  return (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          onClick={onClick}
          aria-current={pathname === link.path ? 'page' : undefined}
          className={`relative font-body text-sm uppercase tracking-wider transition-colors duration-200 
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite 
                     focus-visible:ring-offset-2 focus-visible:ring-offset-noche-negro rounded px-2 py-1
                     ${pathname === link.path
                       ? 'text-dorado-aceite'
                       : 'text-bianco-mozzarella hover:text-dorado-aceite'
                     }`}
        >
          {link.label}
          {pathname === link.path && (
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-dorado-aceite" aria-hidden="true" />
          )}
        </Link>
      ))}
    </>
  );
});

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollRef = useRef(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { items } = useCart();
  const { user, logout } = useAuth();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useKeyboardNavigation(mobileMenuRef, {
    trapFocus: isOpen,
    onEscape: () => setIsOpen(false),
  });

  const handleScroll = useThrottle(() => {
    const currentScroll = window.scrollY;
    if (currentScroll > 80) {
      setIsHidden(currentScroll > lastScrollRef.current && currentScroll > 200);
    } else {
      setIsHidden(false);
    }
    lastScrollRef.current = currentScroll;
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);
  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <>
      <SkipLink href="#main-content" />
      <nav
        aria-label="Main navigation"
        className={`bg-noche-negro/95 backdrop-blur-md text-white sticky top-0 z-50 shadow-lg transition-transform duration-300 ${
          isHidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link
              to="/"
              className="flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite rounded"
              aria-label="La Dolce Vita - Home"
            >
              <span className="text-3xl" aria-hidden="true">🍕</span>
              <div>
                <h1 className="font-display text-xl font-bold text-dorado-aceite">
                  La Dolce Vita
                </h1>
                <p className="text-xs text-bianco-mozzarella opacity-70 -mt-1">
                  Restaurante Italiano
                </p>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-8" role="menubar" aria-label="Main navigation">
              <NavLinks pathname={location.pathname} />
            </div>

            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={toggleSearch}
                className="p-2 hover:text-dorado-aceite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite rounded"
                aria-label="Buscar"
                aria-expanded={isSearchOpen}
                aria-controls="nav-search"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button
                className="relative p-2 hover:text-dorado-aceite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite rounded"
                aria-label="Notificaciones"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-rosso-pomodoro rounded-full" aria-hidden="true" />
              </button>

              <button
                onClick={openCart}
                className="relative p-2 hover:text-dorado-aceite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite rounded"
                aria-label={`Carrito, ${itemCount} articoli`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rosso-pomodoro text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold" aria-hidden="true">
                    {itemCount}
                  </span>
                )}
              </button>

              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    aria-label="Menu perfil usuario"
                  >
                    <div className="w-8 h-8 rounded-full bg-dorado-aceite flex items-center justify-center text-sm font-bold text-noche-negro" aria-hidden="true">
                      {user.name.charAt(0)}
                    </div>
                    <svg className={`h-4 w-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProfileOpen && (
                    <div role="menu" aria-label="Perfil usuario" className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-lg rounded-xl shadow-3d-lg py-2 animate-scale-in z-50 border border-white/20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-bold text-noche-negro text-sm">{user.name}</p>
                        <p className="text-xs text-tierra-marron">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-noche-negro hover:bg-dorado-aceite/10 transition-colors"
                      >
                        <span className="text-lg" aria-hidden="true">👤</span>
                        Mi Perfil
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          role="menuitem"
                          onClick={() => { logout(); setIsProfileOpen(false); }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-rosso-pomodoro hover:bg-rosso-pomodoro/10 transition-colors"
                        >
                          <span className="text-lg" aria-hidden="true">🚪</span>
                          Salir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-dorado-aceite text-noche-negro px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>

            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-bianco-mozzarella hover:text-dorado-aceite transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite rounded"
              aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {isSearchOpen && (
            <div id="nav-search" className="hidden md:block pb-4 animate-fade-in">
              <div className="relative">
                <label htmlFor="nav-search-input" className="sr-only">Buscar platos, bebidas...</label>
                <input
                  id="nav-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar platos, bebidas..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-dorado-aceite"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50" aria-hidden="true">🔍</span>
              </div>
            </div>
          )}
        </div>

        {isOpen && (
          <div
            id="mobile-menu"
            ref={mobileMenuRef}
            className="md:hidden bg-noche-negro/95 backdrop-blur-md border-t border-gray-700"
            role="menu"
            aria-label="Menu mobile"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              <NavLinks pathname={location.pathname} onClick={() => setIsOpen(false)} />
              <Link
                to="/checkout"
                onClick={() => setIsOpen(false)}
                role="menuitem"
                className="flex items-center py-3 px-4 text-bianco-mozzarella hover:bg-gray-800 rounded-lg"
              >
                🛒 Carrito
                {itemCount > 0 && (
                  <span className="ml-2 bg-rosso-pomodoro text-white text-xs rounded-full px-2 py-0.5" aria-label={`${itemCount} articoli`}>
                    {itemCount}
                  </span>
                )}
              </Link>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    role="menuitem"
                    className="block py-3 px-4 text-bianco-mozzarella hover:bg-gray-800 rounded-lg"
                  >
                     👤 Perfil
                  </Link>
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    role="menuitem"
                    className="w-full text-left py-3 px-4 text-rosso-pomodoro hover:bg-gray-800 rounded-lg"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="block py-3 px-4 bg-dorado-aceite text-noche-negro rounded-lg font-bold text-center"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <Cart isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
}

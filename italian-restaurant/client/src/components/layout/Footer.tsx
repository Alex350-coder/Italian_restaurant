import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-noche-negro to-noche-negro/95 text-bianco-mozzarella relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-dorado-aceite/30 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🍕</span>
              <div>
                <h3 className="font-display text-xl font-bold text-dorado-aceite">
                  La Dolce Vita
                </h3>
                <p className="text-xs text-bianco-mozzarella/50">Restaurante Italiano</p>
              </div>
            </div>
            <p className="text-sm text-bianco-mozzarella/60 leading-relaxed">
              Auténtica cocina italiana desde 1985. Ingredientes frescos,
              recetas de la tradición, una experiencia única.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold text-dorado-aceite mb-5 relative inline-block">
              Horarios
              <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-dorado-aceite to-dorado-aceite/20" />
            </h4>
            <ul className="space-y-2.5 text-sm text-bianco-mozzarella/60">
              <li className="flex justify-between">
                <span>Lun - Vie</span>
                <span>12:00 - 23:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sábado</span>
                <span>11:00 - 00:00</span>
              </li>
              <li className="flex justify-between">
                <span>Domingo</span>
                <span>11:00 - 22:00</span>
              </li>
              <li className="pt-3 text-dorado-aceite/80 text-xs font-semibold border-t border-white/10 mt-3">
                Almuerzo: 12:00 - 15:00
              </li>
              <li className="text-dorado-aceite/80 text-xs font-semibold">
                Cena: 19:00 - 23:00
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold text-dorado-aceite mb-5 relative inline-block">
              Contacto
              <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-dorado-aceite to-dorado-aceite/20" />
            </h4>
            <ul className="space-y-3 text-sm text-bianco-mozzarella/60">
              <li className="flex items-center gap-2">
                <span className="text-base" aria-hidden="true">📍</span>
                <span>Via Roma 42, Milano</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-base" aria-hidden="true">📞</span>
                <a href="tel:+390212345678" className="hover:text-dorado-aceite transition-colors">
                  +39 02 1234 5678
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-base" aria-hidden="true">✉️</span>
                <a href="mailto:info@ladolcevita.it" className="hover:text-dorado-aceite transition-colors">
                  info@ladolcevita.it
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold text-dorado-aceite mb-5 relative inline-block">
              Enlaces
              <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-dorado-aceite to-dorado-aceite/20" />
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/menu" className="text-bianco-mozzarella/60 hover:text-dorado-aceite transition-colors">
                  El Menú
                </Link>
              </li>
              <li>
                <Link to="/reservation" className="text-bianco-mozzarella/60 hover:text-dorado-aceite transition-colors">
                  Reserva una Mesa
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-bianco-mozzarella/60 hover:text-dorado-aceite transition-colors">
                  Quiénes Somos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-bianco-mozzarella/60 hover:text-dorado-aceite transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>

            <div className="mt-8">
              <h4 className="font-display text-lg font-semibold text-dorado-aceite mb-4">
                Síguenos
              </h4>
              <div className="flex gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-dorado-aceite/20 border border-white/10 flex items-center justify-center text-lg hover:scale-110 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-dorado-aceite/20 border border-white/10 flex items-center justify-center text-lg hover:scale-110 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://tripadvisor.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-dorado-aceite/20 border border-white/10 flex items-center justify-center text-lg hover:scale-110 transition-all duration-300"
                  aria-label="TripAdvisor"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.006 8.28c-3.584 0-6.48 2.904-6.48 6.48 0 3.576 2.896 6.48 6.48 6.48 3.584 0 6.48-2.904 6.48-6.48 0-3.576-2.896-6.48-6.48-6.48zM3.672 2.28C1.644 2.28 0 3.924 0 5.952c0 2.028 1.644 3.672 3.672 3.672 2.028 0 3.672-1.644 3.672-3.672 0-2.028-1.644-3.672-3.672-3.672zm16.656 0c-2.028 0-3.672 1.644-3.672 3.672 0 2.028 1.644 3.672 3.672 3.672 2.028 0 3.672-1.644 3.672-3.672 0-2.028-1.644-3.672-3.672-3.672z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-bianco-mozzarella/40">
            © {new Date().getFullYear()} La Dolce Vita. Todos los derechos reservados.
          </p>
          <p className="text-sm text-bianco-mozzarella/40 italic">
            "La vida es demasiado corta para comer mal"
          </p>
        </div>
      </div>
    </footer>
  );
}

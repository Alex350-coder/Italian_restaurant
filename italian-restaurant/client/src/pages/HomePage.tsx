import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import RestaurantScene from '@/3d/RestaurantScene';
import WineBottle from '@/3d/WineBottle';
import FloatingIngredients from '@/3d/FloatingIngredients';
import ReviewCard from '@/components/features/ReviewCard';
import Parallax from '@/components/ui/Parallax';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import TextReveal from '@/components/ui/TextReveal';
import BackToTop from '@/components/ui/BackToTop';
import ScrollProgress from '@/components/ui/ScrollProgress';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useAnnounce } from '@/hooks/useAnnounce';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { useFeaturedItems } from '@/hooks/useMenu';

// Fallback dishes en caso de error
const fallbackDishes = [
  {
    id: '1',
    name: 'Margherita DOP',
    description: 'Tomate San Marzano, mozzarella de bufala, albahaca fresca',
    price: 12.50,
    image: '🍕',
    alt: 'Pizza Margherita DOP con tomate San Marzano y mozzarella de bufala',
    category: 'pizza',
  },
  {
    id: '2',
    name: 'Spaghetti Carbonara',
    description: 'Guanciale, pecorino romano, huevos y pimienta negra',
    price: 15.00,
    image: '🍝',
    alt: 'Spaghetti a la Carbonara tradicional',
    category: 'pasta',
  },
  {
    id: '3',
    name: 'Ossobuco alla Milanese',
    description: 'Osobuco de ternera con gremolata y risotto al azafrán',
    price: 28.00,
    image: '🥩',
    alt: 'Ossobuco a la milanésa con risotto azafrán',
    category: 'meat',
  },
  {
    id: '4',
    name: 'Tiramisù della Casa',
    description: 'El clásico tiramisù con mascarpone y café espresso',
    price: 8.50,
    image: '🍰',
    alt: 'Tiramisù de la casa con mascarpone y café espresso',
    category: 'desserts',
  },
];

const testimonials = [
  {
    name: 'Giulia M.',
    avatar: 'G',
    rating: 5,
    comment: '¡Una experiencia culinaria fantástica! La pasta fresca es imbatible. El personal es amable y profesional.',
    date: 'Hace 2 semanas',
  },
  {
    name: 'Marco T.',
    avatar: 'M',
    rating: 5,
    comment: 'El mejor restaurante italiano de Milán. La Margherita DOP es perfecta y los vinos son excepcionales.',
    date: 'Hace 1 mes',
  },
  {
    name: 'Elena R.',
    avatar: 'E',
    rating: 4,
    comment: 'Atmósfera mágica y comida deliciosa. ¡El tiramisù es el mejor que he probado!',
    date: 'Hace 3 semanas',
  },
];

function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Sphere args={[1, 100, 200]} scale={2.2}>
        <MeshDistortMaterial
          color="#C41E3A"
          attach="material"
          distort={0.3}
          speed={1.5}
          roughness={0.2}
        />
      </Sphere>
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
    </>
  );
}

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

export default function HomePage() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { announce } = useAnnounce();
  const { items: featuredItems, loading: loadingFeatured } = useFeaturedItems();

  const { ref: dishesRef, isVisible: dishesVisible } = useScrollAnimation();
  const { ref: experienceRef, isVisible: experienceVisible } = useScrollAnimation();
  const { ref: featuresRef, isVisible: featuresVisible } = useScrollAnimation();
  const { ref: testimonialsRef, isVisible: testimonialsVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  // Usar items del backend o fallback si hay error
  const dishesToDisplay = featuredItems.length > 0 
    ? featuredItems.map(item => ({
        ...item,
        image: getCategoryEmoji(item.category),
        alt: item.description,
      }))
    : fallbackDishes;

  function getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      'appetizers': '🥗',
      'pasta': '🍝',
      'pizza': '🍕',
      'risotto': '🍚',
      'meat': '🥩',
      'seafood': '🐟',
      'salads': '🥗',
      'desserts': '🍰',
      'beverages': '🍷',
      'wine': '🍷',
    };
    return emojiMap[category] || '🍽️';
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
      announce('Suscripción al boletín completada con éxito');
    }
  };

  const getAnimationClass = (isVisible: boolean) => {
    if (prefersReducedMotion) {
      return 'opacity-100 translate-y-0';
    }
    return `transition-all duration-700 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
    }`;
  };

  return (
    <div className="bg-crema dark:bg-dark-bg transition-colors duration-300">
      <ScrollProgress />
      <FloatingIngredients />

      <section className="relative min-h-[90vh] flex items-center overflow-hidden" aria-labelledby="hero-heading">
        <div className="absolute inset-0 bg-gradient-to-br from-noche-negro via-noche-negro/95 to-rosso-pomodoro/20" aria-hidden="true" />

        <Parallax speed={0.2} className="absolute inset-0">
          <div className="absolute top-20 left-10 w-64 h-64 bg-dorado-aceite/10 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-rosso-pomodoro/10 rounded-full blur-3xl" aria-hidden="true" />
        </Parallax>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-dorado-aceite font-body uppercase tracking-[0.3em] text-sm animate-fade-in">
              Desde 1985 — Milán, Italia
            </p>
            <TextReveal as="h1" id="hero-heading" splitBy="words" className="font-display text-5xl md:text-7xl font-bold text-dorado-aceite leading-tight">
              La Dolce Vita
            </TextReveal>
            <p className="text-bianco-mozzarella/80 text-lg leading-relaxed max-w-md animate-fade-in">
              Descubre los sabores auténticos de Italia. Ingredientes frescos,
              recetas de la tradición, pasión en cada plato.
            </p>
            <div className="flex flex-wrap gap-4 pt-4 animate-slide-up" role="group" aria-label="Acciones principales">
              <Link
                to="/menu"
                className="btn-primary text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-noche-negro"
              >
                Descubre el Menú
              </Link>
              <Link
                to="/reservation"
                className="btn-outline text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-noche-negro"
              >
                Reserva una Mesa
              </Link>
            </div>
          </div>

          <Parallax speed={0.15} direction="up" className="h-[400px] md:h-[500px] hidden md:block">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <Suspense fallback={null}>
                <HeroScene />
              </Suspense>
            </Canvas>
            <VisuallyHidden>Escena 3D interactiva del restaurante con esfera animada</VisuallyHidden>
          </Parallax>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-crema dark:from-dark-bg to-transparent" aria-hidden="true" />
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-labelledby="dishes-heading">
        <div ref={dishesRef} className={getAnimationClass(dishesVisible)}>
          <div className="text-center mb-16">
            <p className="text-dorado-aceite font-body uppercase tracking-[0.2em] text-sm mb-3">
              Los Más Populares
            </p>
            <TextReveal as="h2" id="dishes-heading" splitBy="words" className="section-title">
              Platos Destacados
            </TextReveal>
            <p className="section-subtitle max-w-2xl mx-auto">
              Una selección de nuestros platos más apreciados, preparados cada día
              con ingredientes frescos y amor por la tradición italiana.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8" role="list" aria-label="Platos destacados">
            {loadingFeatured ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dorado-aceite"></div>
              </div>
            ) : (
              dishesToDisplay.map((dish, index) => (
                <article
                  key={dish.id}
                  role="listitem"
                  className="card group cursor-pointer"
                  style={{
                    animationDelay: prefersReducedMotion ? '0s' : `${index * 0.1}s`,
                    opacity: dishesVisible || prefersReducedMotion ? 1 : 0,
                    transform: dishesVisible || prefersReducedMotion ? 'translateY(0)' : 'translateY(20px)',
                    transition: prefersReducedMotion ? 'none' : `all 0.5s ease ${index * 0.1}s`,
                  }}
                >
                  <div className="h-48 bg-gradient-to-br from-bianco-mozzarella to-dorado-aceite/10 flex items-center justify-center text-8xl group-hover:scale-110 transition-transform duration-500">
                    <img
                      src={`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">${dish.image}</text></svg>`}
                      alt={dish.alt}
                      className="w-20 h-20"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-body uppercase tracking-wider text-verde-basilico font-semibold">
                      {dish.category}
                    </span>
                    <h3 className="font-display text-xl font-bold text-noche-negro dark:text-white mt-1">
                      {dish.name}
                    </h3>
                    <p className="text-tierra-marron/70 dark:text-dark-muted text-sm mt-2 leading-relaxed">
                      {dish.description}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-2xl font-bold text-rosso-pomodoro" aria-label={`Precio: ${dish.price.toFixed(2)} euros`}>
                        €{dish.price.toFixed(2)}
                      </span>
                      <Link
                        to="/menu"
                        className="text-dorado-aceite text-sm font-semibold hover:text-rosso-pomodoro transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite rounded"
                        aria-label={`Ordenar ${dish.name}`}
                      >
                        Ordenar →
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link to="/menu" className="btn-outline inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite">
              Ver Menú Completo
            </Link>
          </div>
        </div>
      </section>

      <section
        ref={experienceRef}
        className={`py-20 bg-crema dark:bg-dark-bg transition-all duration-700 ${
          experienceVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-labelledby="experience-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Parallax speed={0.1} direction="left">
              <div className="h-[400px] rounded-2xl overflow-hidden shadow-xl">
                <RestaurantScene />
              </div>
              <VisuallyHidden>Escena 3D del interior del restaurante La Dolce Vita</VisuallyHidden>
            </Parallax>
            <div className="space-y-6">
              <p className="text-dorado-aceite font-body uppercase tracking-[0.2em] text-sm">
                Nuestro Ambiente
              </p>
              <TextReveal as="h2" id="experience-heading" splitBy="words" className="font-display text-4xl font-bold text-noche-negro dark:text-white">
                Una Experiencia Sensorial
              </TextReveal>
              <p className="text-tierra-marron dark:text-dark-muted leading-relaxed">
                Nuestro restaurante ofrece un ambiente cálido y acogedor, perfecto
                para una cena romántica, un almuerzo de trabajo o una velada en familia.
                Cada detalle está pensado para hacer tu experiencia inolvidable.
              </p>
              <div className="grid grid-cols-2 gap-4" role="list" aria-label="Características del restaurante">
                <div className="bg-white dark:bg-dark-card rounded-lg p-4 text-center shadow-md transition-colors" role="listitem">
                  <span className="text-3xl block mb-2" aria-hidden="true">🕯️</span>
                  <p className="font-semibold text-sm text-noche-negro dark:text-white">Atmósfera Íntima</p>
                </div>
                <div className="bg-white dark:bg-dark-card rounded-lg p-4 text-center shadow-md transition-colors" role="listitem">
                  <span className="text-3xl block mb-2" aria-hidden="true">🌿</span>
                  <p className="font-semibold text-sm text-noche-negro dark:text-white">Terraza Verde</p>
                </div>
                <div className="bg-white dark:bg-dark-card rounded-lg p-4 text-center shadow-md transition-colors" role="listitem">
                  <span className="text-3xl block mb-2" aria-hidden="true">🎵</span>
                  <p className="font-semibold text-sm text-noche-negro dark:text-white">Música en Vivo</p>
                </div>
                <div className="bg-white dark:bg-dark-card rounded-lg p-4 text-center shadow-md transition-colors" role="listitem">
                  <span className="text-3xl block mb-2" aria-hidden="true">🍷</span>
                  <p className="font-semibold text-sm text-noche-negro dark:text-white">Bar de Vinos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={featuresRef}
        className={`py-20 bg-noche-negro dark:bg-dark-surface text-white transition-all duration-700 ${
          featuresVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-labelledby="features-heading"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="features-heading" className="sr-only">Nuestras especialidades</h2>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <Parallax speed={0.1}>
                <div className="h-[200px]">
                  <WineBottle />
                </div>
              </Parallax>
              <h3 className="font-display text-2xl font-bold text-dorado-aceite">
                Vinos Seleccionados
              </h3>
              <p className="text-bianco-mozzarella/70 leading-relaxed">
                Una bodega con más de 200 etiquetas italianas, de las regiones más
                prestigiosas de Italia.
              </p>
              <div className="text-4xl font-bold text-dorado-aceite" aria-label="Más de 200 etiquetas en bodega">
                <AnimatedCounter end={200} suffix="+" />
              </div>
              <p className="text-bianco-mozzarella/50 text-sm">Etiquetas en bodega</p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl py-12" aria-hidden="true">👨‍🍳</div>
              <h3 className="font-display text-2xl font-bold text-dorado-aceite">
                Chef de Excelencia
              </h3>
              <p className="text-bianco-mozzarella/70 leading-relaxed">
                Nuestro chef aporta 30 años de experiencia desde Toscana,
                con pasión por la autenticidad.
              </p>
              <div className="text-4xl font-bold text-dorado-aceite" aria-label="Más de 30 años de experiencia">
                <AnimatedCounter end={30} suffix="+" />
              </div>
              <p className="text-bianco-mozzarella/50 text-sm">Años de experiencia</p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl py-12" aria-hidden="true">🌿</div>
              <h3 className="font-display text-2xl font-bold text-dorado-aceite">
                Ingredientes Frescos
              </h3>
              <p className="text-bianco-mozzarella/70 leading-relaxed">
                Directamente del mercado y de nuestros proveedores de confianza,
                cada día frescura garantizada.
              </p>
              <div className="text-4xl font-bold text-dorado-aceite" aria-label="100% frescura garantizada">
                <AnimatedCounter end={100} suffix="%" />
              </div>
              <p className="text-bianco-mozzarella/50 text-sm">Frescura garantizada</p>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={testimonialsRef}
        className={`py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-700 ${
          testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        aria-labelledby="testimonials-heading"
      >
        <div className="text-center mb-16">
          <p className="text-dorado-aceite font-body uppercase tracking-[0.2em] text-sm mb-3">
            Lo Que Dicen de Nosotros
          </p>
          <TextReveal as="h2" id="testimonials-heading" splitBy="words" className="section-title">
            Testimonios
          </TextReveal>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Reseñas de clientes">
          {testimonials.map((t, i) => (
            <div role="listitem" key={i}>
              <ReviewCard {...t} />
            </div>
          ))}
        </div>
      </section>

      <section
        ref={ctaRef}
        className={`py-20 px-4 sm:px-6 lg:px-8 transition-all duration-700 ${
          ctaVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-labelledby="location-heading"
      >
        <div className="max-w-4xl mx-auto">
          <Parallax speed={0.05}>
            <div className="bg-gradient-to-br from-noche-negro to-rosso-pomodoro/30 rounded-2xl p-8 md:p-12 text-center space-y-6">
              <h2 id="location-heading" className="font-display text-3xl md:text-4xl font-bold text-white">
                Encuéntranos fácilmente
              </h2>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl h-64 flex items-center justify-center border border-white/20" role="img" aria-label="Mapa del restaurante La Dolce Vita, Via Roma 42, Milán">
                <div className="text-center space-y-2">
                  <span className="text-5xl block" aria-hidden="true">🗺️</span>
                  <p className="text-bianco-mozzarella">Via Roma 42, Milán</p>
                  <p className="text-bianco-mozzarella/60 text-sm">Mapa interactivo</p>
                </div>
              </div>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-dorado-aceite text-noche-negro px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Abrir Google Maps para obtener indicaciones al restaurante"
              >
                Obtener Indicaciones
              </a>
            </div>
          </Parallax>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-rosso-pomodoro to-red-900 text-white" aria-labelledby="reservation-heading">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <TextReveal as="h2" id="reservation-heading" splitBy="words" className="font-display text-4xl md:text-5xl font-bold">
            Reserva tu Noche
          </TextReveal>
          <p className="text-bianco-mozzarella/90 text-lg max-w-2xl mx-auto">
            Reserva tu mesa para una experiencia culinaria inolvidable.
            Te esperamos para regalarte un momento especial.
          </p>
          <Link
            to="/reservation"
            className="inline-block bg-dorado-aceite text-noche-negro px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-500 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Reservar Ahora
          </Link>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-dark-card transition-colors" aria-labelledby="newsletter-heading">
        <div className="max-w-xl mx-auto px-4 text-center space-y-6">
          <h2 id="newsletter-heading" className="font-display text-3xl font-bold text-noche-negro dark:text-white">
            Mantente Informado
          </h2>
          <p className="text-tierra-marron dark:text-dark-muted">
            Suscríbete a nuestro boletín para ofertas exclusivas, nuevos platos y eventos especiales.
          </p>
          {subscribed ? (
            <div className="bg-verde-basilico/10 rounded-xl p-6 animate-fade-in" role="status" aria-live="polite">
              <p className="text-verde-basilico font-semibold">¡Gracias por suscribirte!</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-3 max-w-md mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">Tu correo electrónico</label>
              <input
                id="newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Tu correo electrónico"
                required
                aria-required="true"
                className="input-field flex-grow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
              />
              <button
                type="submit"
                className="btn-primary whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
              >
                Suscribirse
              </button>
            </form>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}

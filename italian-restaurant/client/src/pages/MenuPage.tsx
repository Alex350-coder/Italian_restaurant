import { useState, useMemo, useCallback, useRef } from 'react';
import MenuItem from '@/components/features/MenuItem';
import MenuFilter from '@/components/features/MenuFilter';
import useDebounce, { useDebouncedCallback } from '@/hooks/useDebounce';
import useThrottle from '@/hooks/useThrottle';
import useVirtualScroll from '@/hooks/useVirtualScroll';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useAnnounce } from '@/hooks/useAnnounce';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import VisuallyHidden from '@/components/ui/VisuallyHidden';
import { useMenuItems } from '@/hooks/useMenu';

const categories = [
  { id: 'all', label: 'Todos', emoji: '🍽️' },
  { id: 'antipasti', label: 'Entradas', emoji: '🥗' },
  { id: 'primi', label: 'Principales', emoji: '🍝' },
  { id: 'pizza', label: 'Pizza', emoji: '🍕' },
  { id: 'secondi', label: 'Segundos', emoji: '🥩' },
  { id: 'dolci', label: 'Postres', emoji: '🍰' },
  { id: 'bevande', label: 'Bebidas', emoji: '🍷' },
];

const dbToItalianCategory: Record<string, string> = {
  appetizers: 'antipasti',
  pasta: 'primi',
  pizza: 'pizza',
  risotto: 'primi',
  meat: 'secondi',
  seafood: 'secondi',
  salads: 'antipasti',
  desserts: 'dolci',
  beverages: 'bevande',
  wine: 'bevande',
};

const ENRICHMENT_ITEMS = [
  { name: 'Bruschetta Classica', image: '🥖', popular: true },
  { name: 'Caprese', image: '🧀', popular: false },
  { name: 'Carpaccio di Manzo', image: '🥩', popular: true },
  { name: 'Spaghetti Carbonara', image: '🍝', popular: true },
  { name: "Penne all'Arrabbiata", image: '🌶️', popular: false },
  { name: 'Risotto ai Funghi Porcini', image: '🍄', popular: true },
  { name: 'Lasagna della Nonna', image: '🥘', popular: false },
  { name: 'Margherita DOP', image: '🍕', popular: true },
  { name: 'Quattro Stagioni', image: '🍕', popular: false },
  { name: 'Diavola', image: '🍕', popular: true },
  { name: 'Pizza ai Quattro Formaggi', image: '🍕', popular: false },
  { name: 'Ossobuco alla Milanese', image: '🥩', popular: true },
  { name: 'Branzino al Forno', image: '🐟', popular: false },
  { name: 'Pollo alla Parmigiana', image: '🍗', popular: false },
  { name: 'Tiramisù della Casa', image: '🍰', popular: true },
  { name: 'Panna Cotta', image: '🍮', popular: false },
  { name: 'Cannoli Siciliani', image: '🧁', popular: true },
  { name: 'Chianti Classico DOCG', image: '🍷', popular: false },
  { name: 'Prosecco DOC', image: '🥂', popular: false },
  { name: 'Limonata Fatta in Casa', image: '🍋', popular: false },
];

const enrichmentMap = new Map(ENRICHMENT_ITEMS.map(i => [i.name, { image: i.image, popular: i.popular }]));

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';
type ViewMode = 'grid' | 'list';

const VIRTUAL_THRESHOLD = 20;
const ITEM_HEIGHT = 280;

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [rawSearchTerm, setRawSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [visibleCount, setVisibleCount] = useState(12);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { announce } = useAnnounce();

  const { items: apiItems, loading, error } = useMenuItems();

  const searchTerm = useDebounce(rawSearchTerm, 300);
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setRawSearchTerm(value);
  }, 300);

  const enrichedItems = useMemo(() => {
    return apiItems.map(apiItem => {
      const enrichment = enrichmentMap.get(apiItem.name);
      return {
        id: apiItem.id,
        name: apiItem.name,
        description: apiItem.description,
        price: apiItem.price,
        image: enrichment?.image || '🍽️',
        category: dbToItalianCategory[apiItem.category] || apiItem.category,
        popular: enrichment?.popular || false,
      };
    });
  }, [apiItems]);

  const filteredItems = useMemo(() => {
    const items = enrichedItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    items.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        default: return 0;
      }
    });

    return items;
  }, [enrichedItems, activeCategory, searchTerm, sortBy]);

  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const useVirtual = viewMode === 'grid' && filteredItems.length > VIRTUAL_THRESHOLD;

  const virtualScroll = useVirtualScroll({
    itemCount: filteredItems.length,
    itemHeight: ITEM_HEIGHT,
    containerHeight: typeof window !== 'undefined' ? window.innerHeight - 200 : 800,
    overscan: 3,
  });

  const handleScroll = useThrottle(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 300) {
      setVisibleCount((prev) => Math.min(prev + 8, filteredItems.length));
    }
  }, 200);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearch(e.target.value);
  }, [debouncedSetSearch]);

  const handleCategoryChange = useCallback(
    (category: string) => {
      setActiveCategory(category);
      const label = categories.find((c) => c.id === category)?.label || category;
      announce(`Categoría seleccionada: ${label}`);
    },
    [announce]
  );

  useKeyboardNavigation(gridRef, {
    trapFocus: false,
  });

  return (
    <div className="bg-crema min-h-screen">
      <section className="bg-gradient-to-br from-noche-negro to-rosso-pomodoro/30 py-20 px-4" aria-labelledby="menu-heading">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-dorado-aceite font-body uppercase tracking-[0.3em] text-sm mb-3">
            Nuestra Selección
          </p>
          <h1 id="menu-heading" className="font-display text-5xl md:text-6xl font-bold text-white mb-4">
            El Menú
          </h1>
          <p className="text-bianco-mozzarella/80 text-lg max-w-2xl mx-auto">
            Cada plato cuenta una historia de Italia. Descubre nuestros sabores
            auténticos preparados con pasión e ingredientes genuinos.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8" aria-label="Filtri e ricerca menu">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow">
              <label htmlFor="menu-search" className="sr-only">Buscar en el menú</label>
              <input
                id="menu-search"
                type="text"
                placeholder="Buscar en el menú..."
                onChange={handleSearchChange}
                className="input-field pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
                aria-describedby="search-results-count"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true">🔍</span>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="sort-select" className="sr-only">Ordenar por</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="input-field w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
              >
                <option value="name-asc">Nombre A-Z</option>
                <option value="name-desc">Nombre Z-A</option>
                <option value="price-asc">Precio ↑</option>
                <option value="price-desc">Precio ↓</option>
              </select>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden" role="radiogroup" aria-label="Modalità di visualizzazione">
                <button
                  onClick={() => setViewMode('grid')}
                  role="radio"
                  aria-checked={viewMode === 'grid'}
                  aria-label="Vista de cuadrícula"
                  className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite ${
                    viewMode === 'grid' ? 'bg-rosso-pomodoro text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  role="radio"
                  aria-checked={viewMode === 'list'}
                  aria-label="Vista de lista"
                  className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite ${
                    viewMode === 'list' ? 'bg-rosso-pomodoro text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center" aria-label="Categorie menu">
        <MenuFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </section>

      <VisuallyHidden aria-live="polite" id="search-results-count">
        {filteredItems.length} platos encontrados
      </VisuallyHidden>

      <section
        ref={containerRef}
        onScroll={handleScroll}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 overflow-y-auto"
        style={useVirtual ? { height: 'calc(100vh - 200px)' } : undefined}
        aria-labelledby="menu-results-heading"
      >
        <h2 id="menu-results-heading" className="sr-only">Resultados del menú</h2>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse" role="status" aria-label="Cargando menú">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-8 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16" role="alert">
            <span className="text-6xl block" aria-hidden="true">😔</span>
            <p className="text-tierra-marron mt-4 text-lg">No pudimos cargar el menú.</p>
            <p className="text-tierra-marron/70 text-sm mt-2">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-6 bg-dorado-aceite text-noche-negro px-6 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
              Intentar de nuevo
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16" role="status">
            <span className="text-6xl block" aria-hidden="true">🍽️</span>
            <p className="text-tierra-marron mt-4 text-lg">
              No se encontró ningún plato para esta búsqueda.
            </p>
            <p className="text-tierra-marron/70 text-sm mt-2">
              Intenta cambiar los filtros o el término de búsqueda.
            </p>
          </div>
        ) : useVirtual ? (
          <div className="relative" style={{ height: virtualScroll.totalHeight }} role="list" aria-label="Menú virtual">
            {virtualScroll.visibleItems.map(({ index, style }) => (
              <div key={filteredItems[index].id} style={style} role="listitem">
                <div className="p-3">
                  <MenuItem item={filteredItems[index]} />
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Menú">
            {visibleItems.map((item, index) => (
              <div
                role="listitem"
                key={item.id}
                style={{
                  animationDelay: prefersReducedMotion ? '0s' : `${index * 0.05}s`,
                  opacity: prefersReducedMotion ? 1 : undefined,
                  transition: prefersReducedMotion ? 'none' : `opacity 0.3s ease ${index * 0.05}s`,
                }}
              >
                <MenuItem item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4" role="list" aria-label="Menú">
            {visibleItems.map((item) => (
              <div key={item.id} role="listitem" className="card flex items-center gap-4 p-4">
                <div className="text-4xl flex-shrink-0" aria-hidden="true">{item.image}</div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-noche-negro">{item.name}</h3>
                    {item.popular && (
                      <span className="text-xs bg-rosso-pomodoro text-white px-2 py-0.5 rounded-full" aria-label="Plato popular">Popular</span>
                    )}
                  </div>
                  <p className="text-sm text-tierra-marron/70 mt-1">{item.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xl font-bold text-rosso-pomodoro" aria-label={`Precio: ${item.price.toFixed(2)} euros`}>€{item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && !useVirtual && visibleCount < filteredItems.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount((prev) => Math.min(prev + 8, filteredItems.length))}
              className="btn-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
              aria-label={`Cargar más platos. ${filteredItems.length - visibleItems.length} platos restantes`}
            >
              Cargar Más ({filteredItems.length - visibleItems.length} restantes)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

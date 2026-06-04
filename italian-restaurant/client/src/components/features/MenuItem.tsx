import { useState, useRef } from 'react';
import { useCart } from '@/context/CartContext';

interface MenuItemProps {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    popular: boolean;
  };
}

export default function MenuItem({ item }: MenuItemProps) {
  const { addItem, items } = useCart();
  const inCart = items.some((i) => i.id === item.id);
  const [isAdding, setIsAdding] = useState(false);
  const [flyAnimation, setFlyAnimation] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotateX(-y * 6);
    setRotateY(x * 6);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleAdd = () => {
    if (isAdding) return;

    setIsAdding(true);
    setFlyAnimation(true);

    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });

    setTimeout(() => {
      setFlyAnimation(false);
    }, 800);

    setTimeout(() => {
      setIsAdding(false);
    }, 1200);
  };

  return (
    <div
      ref={cardRef}
      className="card group flex flex-col h-full relative transition-all duration-500"
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        boxShadow: `${rotateY * -1.5}px ${rotateX * 1.5}px 20px rgba(0,0,0,0.1)`,
      }}
      onMouseEnter={handleMouseMove}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative h-48 bg-gradient-to-br from-bianco-mozzarella via-bianco-mozzarella to-dorado-aceite/20 flex items-center justify-center overflow-hidden">
        <span className="text-7xl transition-all duration-500 group-hover:scale-125 group-hover:brightness-110 group-hover:rotate-6">
          {item.image}
        </span>

        {flyAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-4xl animate-fly-to-cart">{item.image}</span>
          </div>
        )}

        {item.popular && (
          <span className="absolute top-3 left-3 bg-rosso-pomodoro text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            ⭐ Popular
          </span>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-noche-negro/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <span className="text-xs font-body uppercase tracking-wider text-verde-basilico font-semibold">
          {item.category}
        </span>

        <h3 className="font-display text-lg font-bold text-noche-negro dark:text-white mt-1">
          {item.name}
        </h3>

        <p className="text-tierra-marron/70 dark:text-dark-muted text-sm mt-2 leading-relaxed flex-grow">
          {item.description}
        </p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-dark-border">
          <span className="text-xl font-bold text-rosso-pomodoro">
            €{item.price.toFixed(2)}
          </span>

          <button
            ref={buttonRef}
            onClick={handleAdd}
            disabled={isAdding}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 overflow-hidden ${
              inCart
                ? 'bg-verde-basilico text-white hover:bg-green-700 shadow-glow-green'
                : 'bg-dorado-aceite text-noche-negro hover:bg-yellow-500 shadow-glow-gold'
            } active:scale-95 disabled:opacity-70`}
          >
            {isAdding ? (
              <>
                <span className="animate-spin">✓</span>
                ¡Agregado!
              </>
            ) : inCart ? (
              <>
                <span>✓</span>
                Agregar
              </>
            ) : (
              <>
                <span>+</span>
                Agregar
              </>
            )}

            {isAdding && (
              <span className="absolute inset-0 bg-verde-basilico/20 animate-ping" />
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes flyToCart {
          0% {
            transform: scale(1) translate(0, 0);
            opacity: 1;
          }
          50% {
            transform: scale(0.5) translate(100px, -100px);
            opacity: 0.8;
          }
          100% {
            transform: scale(0.2) translate(200px, -200px);
            opacity: 0;
          }
        }
        .animate-fly-to-cart {
          animation: flyToCart 0.8s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

import { useRef, useEffect, useState } from 'react';

interface Category {
  id: string;
  label: string;
  emoji: string;
}

interface MenuFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
}

export default function MenuFilter({ categories, activeCategory, onCategoryChange }: MenuFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (containerRef.current && indicatorRef.current) {
      const activeButton = containerRef.current.querySelector(`[data-category="${activeCategory}"]`);
      if (activeButton) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        setIndicatorStyle({
          left: buttonRect.left - containerRect.left,
          width: buttonRect.width,
        });
      }
    }
  }, [activeCategory]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1 bg-white rounded-full p-1 shadow-md">
      <div
        ref={indicatorRef}
        className="absolute top-1 h-[calc(100%-8px)] bg-rosso-pomodoro rounded-full transition-all duration-300 ease-out"
        style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px` }}
      />
      {categories.map((cat) => (
        <button
          key={cat.id}
          data-category={cat.id}
          onClick={() => onCategoryChange(cat.id)}
          className={`relative z-10 flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
            activeCategory === cat.id
              ? 'text-white'
              : 'text-noche-negro hover:text-rosso-pomodoro'
          }`}
        >
          <span>{cat.emoji}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}

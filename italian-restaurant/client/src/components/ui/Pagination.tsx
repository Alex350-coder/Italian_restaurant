import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useRef } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  const navRef = useRef<HTMLElement>(null);

  useKeyboardNavigation(navRef, {
    onArrowLeft: () => {
      if (currentPage > 1) onPageChange(currentPage - 1);
    },
    onArrowRight: () => {
      if (currentPage < totalPages) onPageChange(currentPage + 1);
    },
  });

  const getVisiblePages = () => {
    const delta = 2;
    const pages: (number | string)[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav
      ref={navRef}
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1 ${className}`}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors
                   text-tierra-marron hover:bg-bianco-mozzarella disabled:opacity-50 
                   disabled:cursor-not-allowed focus-visible:outline-none 
                   focus-visible:ring-2 focus-visible:ring-dorado-aceite"
        aria-label="Pagina precedente"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {getVisiblePages().map((page, index) =>
        typeof page === 'string' ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 py-2 text-sm text-gray-400"
            aria-hidden="true"
          >
            {page}
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite
                       ${currentPage === page
                         ? 'bg-rosso-pomodoro text-white shadow-warm'
                         : 'text-tierra-marron hover:bg-bianco-mozzarella'
                       }`}
            aria-label={`Pagina ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg text-sm font-medium transition-colors
                   text-tierra-marron hover:bg-bianco-mozzarella disabled:opacity-50 
                   disabled:cursor-not-allowed focus-visible:outline-none 
                   focus-visible:ring-2 focus-visible:ring-dorado-aceite"
        aria-label="Pagina successiva"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}

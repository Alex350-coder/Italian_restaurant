import { useState, ReactNode } from 'react';
import { generateId } from '@/utils/a11y';

interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        if (!allowMultiple) next.clear();
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-2 ${className}`} role="presentation">
      {items.map((item) => {
        const isOpen = openItems.has(item.id);
        const headerId = generateId(`accordion-header-${item.id}`);
        const panelId = generateId(`accordion-panel-${item.id}`);

        return (
          <div
            key={item.id}
            className="border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden"
          >
            <h3>
              <button
                id={headerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left 
                           font-medium text-noche-negro dark:text-white 
                           hover:bg-bianco-mozzarella/50 dark:hover:bg-dark-card
                           transition-colors focus-visible:outline-none 
                           focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-dorado-aceite"
              >
                <span>{item.title}</span>
                <svg
                  className={`w-5 h-5 text-tierra-marron dark:text-dark-muted transition-transform duration-200
                             ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className="px-4 pb-4 text-tierra-marron dark:text-dark-muted"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

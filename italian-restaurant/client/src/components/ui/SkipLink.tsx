interface SkipLinkProps {
  href?: string;
  label?: string;
}

export default function SkipLink({
  href = '#main-content',
  label = 'Vai al contenuto principale',
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] 
                 focus:bg-dorado-aceite focus:text-noche-negro focus:px-4 focus:py-2 
                 focus:rounded-lg focus:font-bold focus:shadow-lg focus:outline-none 
                 focus:ring-2 focus:ring-rosso-pomodoro focus:ring-offset-2
                 focus:transition-all"
      tabIndex={0}
    >
      {label}
    </a>
  );
}

let idCounter = 0;

export function generateId(prefix: string = 'a11y'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

interface AriaPropsOptions {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  live?: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  busy?: boolean;
  expanded?: boolean;
  selected?: boolean;
  current?: 'page' | 'step' | 'date' | 'time' | 'true' | 'false';
  hasPopup?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog' | 'true' | 'false';
  controls?: string;
  owns?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: 'grammar' | 'spelling' | 'true' | 'false';
}

export function getAriaProps(options: AriaPropsOptions): Record<string, string | boolean | undefined> {
  const props: Record<string, string | boolean | undefined> = {};

  if (options.label) props['aria-label'] = options.label;
  if (options.labelledBy) props['aria-labelledby'] = options.labelledBy;
  if (options.describedBy) props['aria-describedby'] = options.describedBy;
  if (options.live) props['aria-live'] = options.live;
  if (options.atomic !== undefined) props['aria-atomic'] = options.atomic;
  if (options.busy !== undefined) props['aria-busy'] = options.busy;
  if (options.expanded !== undefined) props['aria-expanded'] = options.expanded;
  if (options.selected !== undefined) props['aria-selected'] = options.selected;
  if (options.current) props['aria-current'] = options.current;
  if (options.hasPopup) props['aria-haspopup'] = options.hasPopup;
  if (options.controls) props['aria-controls'] = options.controls;
  if (options.owns) props['aria-owns'] = options.owns;
  if (options.required !== undefined) props['aria-required'] = options.required;
  if (options.disabled !== undefined) props['aria-disabled'] = options.disabled;
  if (options.invalid) props['aria-invalid'] = options.invalid;

  return props;
}

let announceTimeout: ReturnType<typeof setTimeout> | null = null;

export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (announceTimeout) clearTimeout(announceTimeout);

  const existing = document.getElementById('a11y-live-region');
  if (existing) existing.remove();

  const region = document.createElement('div');
  region.id = 'a11y-live-region';
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
  region.className = 'sr-only';
  document.body.appendChild(region);

  announceTimeout = setTimeout(() => {
    region.textContent = message;
  }, 100);

  setTimeout(() => {
    if (region.parentNode) region.remove();
  }, 10000);
}

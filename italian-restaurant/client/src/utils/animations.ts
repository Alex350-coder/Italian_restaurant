export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
}

export function fadeIn(element: HTMLElement, config: AnimationConfig = {}) {
  const { duration = 300, delay = 0, easing = 'ease-out' } = config;
  element.animate(
    [
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration, delay, easing, fill: 'forwards' }
  );
}

export function fadeOut(element: HTMLElement, config: AnimationConfig = {}) {
  const { duration = 300, delay = 0, easing = 'ease-in' } = config;
  return element.animate(
    [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-10px)' },
    ],
    { duration, delay, easing, fill: 'forwards' }
  );
}

export function slideUp(element: HTMLElement, config: AnimationConfig = {}) {
  const { duration = 400, delay = 0, easing = 'cubic-bezier(0.16, 1, 0.3, 1)' } = config;
  element.animate(
    [
      { opacity: 0, transform: 'translateY(40px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration, delay, easing, fill: 'forwards' }
  );
}

export function slideDown(element: HTMLElement, config: AnimationConfig = {}) {
  const { duration = 400, delay = 0, easing = 'cubic-bezier(0.16, 1, 0.3, 1)' } = config;
  element.animate(
    [
      { opacity: 0, transform: 'translateY(-40px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration, delay, easing, fill: 'forwards' }
  );
}

export function scaleIn(element: HTMLElement, config: AnimationConfig = {}) {
  const { duration = 300, delay = 0, easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)' } = config;
  element.animate(
    [
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    { duration, delay, easing, fill: 'forwards' }
  );
}

export function observeOnScroll(
  element: HTMLElement,
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, ...options }
  );

  observer.observe(element);
  return () => observer.disconnect();
}

export function staggerChildren(
  parent: HTMLElement,
  animation: (el: HTMLElement, delay: number) => void,
  staggerMs: number = 50
) {
  const children = Array.from(parent.children) as HTMLElement[];
  children.forEach((child, index) => {
    animation(child, index * staggerMs);
  });
}

export function spring(
  from: number,
  to: number,
  config: { stiffness?: number; damping?: number; mass?: number } = {}
): { value: number; done: boolean }[] {
  const { stiffness = 100, damping = 10, mass = 1 } = config;
  const frames: { value: number; done: boolean }[] = [];

  let velocity = 0;
  let position = from;
  const target = to;
  const dt = 1 / 60;

  for (let i = 0; i < 300; i++) {
    const displacement = position - target;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    velocity += acceleration * dt;
    position += velocity * dt;

    frames.push({
      value: position,
      done: Math.abs(velocity) < 0.001 && Math.abs(position - target) < 0.001,
    });

    if (frames[frames.length - 1].done) break;
  }

  return frames;
}

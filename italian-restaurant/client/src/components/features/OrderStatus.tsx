type StatusType = 'confirmed' | 'preparing' | 'ready' | 'delivered';

interface OrderStatusProps {
  currentStatus: StatusType;
}

const steps: { key: StatusType; label: string; icon: string }[] = [
  { key: 'confirmed', label: 'Confirmado', icon: '✓' },
  { key: 'preparing', label: 'En Preparación', icon: '👨‍🍳' },
  { key: 'ready', label: 'Listo', icon: '📦' },
  { key: 'delivered', label: 'Entregado', icon: '🚗' },
];

export default function OrderStatus({ currentStatus }: OrderStatusProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStatus);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="relative mb-8">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-rosso-pomodoro to-verde-basilico rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between relative">
          {steps.map((step, i) => {
            const isActive = i <= currentIndex;
            return (
              <div key={step.key} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                    isActive
                      ? 'bg-rosso-pomodoro text-white scale-110 shadow-warm'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isActive ? '✓' : step.icon}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold text-center ${
                    isActive ? 'text-noche-negro' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-center text-sm text-tierra-marron">
        Estado actual: <strong>{steps[currentIndex].label}</strong>
      </p>
    </div>
  );
}

import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

type OrderStatusType = 'confirmed' | 'preparing' | 'ready' | 'delivered';

const statusSteps: { key: OrderStatusType; label: string; icon: string; time: string }[] = [
  { key: 'confirmed', label: 'Confirmado', icon: '✓', time: '19:30' },
  { key: 'preparing', label: 'En Preparación', icon: '👨‍🍳', time: '19:35' },
  { key: 'ready', label: 'Listo', icon: '📦', time: '20:05' },
  { key: 'delivered', label: 'Entregado', icon: '🚗', time: '20:20' },
];

const statusMessages: Record<OrderStatusType, string> = {
  confirmed: 'Tu pedido ha sido confirmado. ¡Empezamos a prepararlo!',
  preparing: 'Nuestro chef está preparando tu pedido con cuidado.',
  ready: 'Tu pedido está listo y a la espera de entrega.',
  delivered: 'Tu pedido ha sido entregado. ¡Buen provecho!',
};

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [currentStatus, setCurrentStatus] = useState<OrderStatusType>('confirmed');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStatus('preparing');
      setProgress(33);
    }, 2000);

    const timer2 = setTimeout(() => {
      setCurrentStatus('ready');
      setProgress(66);
    }, 5000);

    const timer3 = setTimeout(() => {
      setCurrentStatus('delivered');
      setProgress(100);
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const currentStepIndex = statusSteps.findIndex((s) => s.key === currentStatus);

  return (
    <div className="bg-crema min-h-screen">
      <section className="bg-gradient-to-br from-noche-negro to-verde-basilico/30 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white">
            Rastrea tu Pedido
          </h1>
          <p className="text-bianco-mozzarella/80 mt-2">
            Pedido #{id || '1234'}
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-noche-negro">
                Estado del Pedido
              </h2>
              <p className="text-tierra-marron mt-1">{statusMessages[currentStatus]}</p>
            </div>
            <div className="text-4xl">{statusSteps[currentStepIndex].icon}</div>
          </div>

          <div className="relative mb-12">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-rosso-pomodoro to-verde-basilico rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between relative">
              {statusSteps.map((s, i) => (
                <div key={s.key} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      i <= currentStepIndex
                        ? 'bg-rosso-pomodoro text-white scale-110'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {i <= currentStepIndex ? '✓' : i + 1}
                  </div>
                  <span className={`mt-2 text-xs font-semibold text-center ${
                    i <= currentStepIndex ? 'text-noche-negro' : 'text-gray-400'
                  }`}>
                    {s.label}
                  </span>
                  {i <= currentStepIndex && (
                    <span className="text-xs text-tierra-marron mt-1">{s.time}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-bianco-mozzarella/50 rounded-lg p-4 border border-dorado-aceite/20">
            <h3 className="font-display font-bold text-noche-negro mb-3">Detalles del Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-tierra-marron">Pedido #</span>
                <span className="font-semibold">{id || '1234'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tierra-marron">Fecha</span>
                <span className="font-semibold">{new Date().toLocaleDateString('es-ES')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tierra-marron">Tiempo estimado</span>
                <span className="font-semibold">30-45 minutos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-tierra-marron">Total</span>
                <span className="font-semibold text-rosso-pomodoro">€31.50</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-tierra-marron text-sm">
            ¿Necesitas ayuda? Llama al restaurante al{' '}
            <a href="tel:+390212345678" className="text-rosso-pomodoro font-semibold hover:underline">
              +39 02 1234 5678
            </a>
          </p>
          <Link to="/menu" className="btn-outline inline-block">
            Pedir de Nuevo
          </Link>
        </div>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useAnnounce } from '@/hooks/useAnnounce';
import api from '@/services/api';

const steps = ['shipping', 'payment', 'confirm'] as const;

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { announce } = useAnnounce();

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirm'>('shipping');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [orderId, setOrderId] = useState('');

  const [shipping, setShipping] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    notes: '',
  });

  const [payment, setPayment] = useState({
    method: 'card',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
  });

  const deliveryFee = 3.5;
  const grandTotal = total + deliveryFee;

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPayment({ ...payment, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setApiError('');
    announce('Procesando pedido');
    try {
      const res = await api.post('/orders', {
        items: items.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
        notes: shipping.notes || undefined,
      });
      const createdOrderId = res.data?.data?.order?.id;
      if (createdOrderId) {
        setOrderId(createdOrderId);
      }
      setOrderPlaced(true);
      clearCart();
      announce('¡Pedido confirmado con éxito!', 'assertive');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Error al crear el pedido. Inténtalo de nuevo.';
      setApiError(msg);
      announce(msg, 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center px-4">
        <div className="max-w-lg text-center space-y-6">
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center space-y-4 animate-fade-in">
              <div className="text-8xl animate-float">🎉</div>
              <div className="flex gap-2 justify-center">
                {['🍕', '🍝', '🥩', '🍰', '🍷'].map((emoji, i) => (
                  <span
                    key={i}
                    className="text-4xl animate-slide-up"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-noche-negro">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-tierra-marron text-lg">
            ¡Gracias, {shipping.name}! Tu pedido{orderId ? ` #${orderId.slice(0, 8)}` : ''} ha sido recibido.
          </p>
          <p className="text-tierra-marron/70">
            Recibirás una confirmación en {shipping.email}. Tiempo de entrega estimado: 30-45 minutos.
          </p>
          <div className="flex gap-4 justify-center">
            {orderId && (
              <Link to={`/order-tracking/${orderId}`} className="btn-primary">
                Rastrear Pedido
              </Link>
            )}
            <Link to="/menu" className="btn-outline">
              Continuar Pidiendo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <span className="text-8xl block">🛒</span>
          <h2 className="font-display text-3xl font-bold text-noche-negro">Carrito vacío</h2>
          <p className="text-tierra-marron">¡Agrega algo delicioso del menú!</p>
          <Link to="/menu" className="btn-primary inline-block">Ver el Menú</Link>
        </div>
      </div>
    );
  }

  const stepIndex = steps.indexOf(step);

  return (
    <div className="bg-crema min-h-screen">
      <section className="bg-gradient-to-br from-noche-negro to-rosso-pomodoro/30 py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white">Checkout</h1>
          <p className="text-bianco-mozzarella/80 mt-2">Completa tu pedido en pocos pasos</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center mb-8">
          {(['shipping', 'payment', 'confirm'] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => i < stepIndex && setStep(s)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step === s
                    ? 'bg-rosso-pomodoro text-white scale-110'
                    : i < stepIndex
                    ? 'bg-verde-basilico text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < stepIndex ? '✓' : i + 1}
              </button>
              <span className={`ml-2 text-sm font-semibold hidden sm:inline ${step === s ? 'text-noche-negro' : 'text-gray-400'}`}>
                {s === 'shipping' ? 'Envío' : s === 'payment' ? 'Pago' : 'Confirmación'}
              </span>
              {i < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-3" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 'shipping' && (
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 animate-fade-in">
                <h2 className="font-display text-2xl font-bold text-noche-negro">Información de Envío</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-noche-negro mb-1">Nombre Completo</label>
                    <input name="name" value={shipping.name} onChange={handleShippingChange} className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-noche-negro mb-1">Email</label>
                    <input name="email" type="email" value={shipping.email} onChange={handleShippingChange} className="input-field" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-noche-negro mb-1">Teléfono</label>
                  <input name="phone" type="tel" value={shipping.phone} onChange={handleShippingChange} className="input-field" required placeholder="+39 333 123 4567" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-noche-negro mb-1">Dirección</label>
                  <input name="address" value={shipping.address} onChange={handleShippingChange} className="input-field" required placeholder="Via Roma 42" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-noche-negro mb-1">Ciudad</label>
                    <input name="city" value={shipping.city} onChange={handleShippingChange} className="input-field" required placeholder="Milano" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-noche-negro mb-1">Código Postal</label>
                    <input name="zip" value={shipping.zip} onChange={handleShippingChange} className="input-field" required placeholder="20121" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-noche-negro mb-1">Notas</label>
                  <textarea name="notes" value={shipping.notes} onChange={handleShippingChange} rows={2} className="input-field resize-none" placeholder="Timbre, alergias, etc." />
                </div>
                <button onClick={() => setStep('payment')} className="btn-primary w-full">Proceder al Pago</button>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 animate-fade-in">
                <h2 className="font-display text-2xl font-bold text-noche-negro">Método de Pago</h2>
                <select name="method" value={payment.method} onChange={handlePaymentChange} className="input-field">
                  <option value="card">Tarjeta de Crédito/Débito</option>
                  <option value="cash">Efectivo contra Entrega</option>
                  <option value="applepay">Apple Pay</option>
                  <option value="googlepay">Google Pay</option>
                </select>
                {payment.method === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-noche-negro mb-1">Número de Tarjeta</label>
                      <input name="cardNumber" value={payment.cardNumber} onChange={handlePaymentChange} className="input-field" placeholder="4242 4242 4242 4242" maxLength={19} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-noche-negro mb-1">Vencimiento</label>
                        <input name="expiry" value={payment.expiry} onChange={handlePaymentChange} className="input-field" placeholder="MM/YY" maxLength={5} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-noche-negro mb-1">CVV</label>
                        <input name="cvv" value={payment.cvv} onChange={handlePaymentChange} className="input-field" placeholder="123" maxLength={4} type="password" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-noche-negro mb-1">Nombre en la Tarjeta</label>
                      <input name="cardName" value={payment.cardName} onChange={handlePaymentChange} className="input-field" placeholder="MARIO ROSSI" />
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <button onClick={() => setStep('shipping')} className="btn-outline flex-1">Atrás</button>
                  <button onClick={() => setStep('confirm')} className="btn-primary flex-1">Revisar Pedido</button>
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-bold text-noche-negro">Resumen del Pedido</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-crema rounded-lg">
                      <span className="text-3xl">{item.image}</span>
                      <div className="flex-grow">
                        <p className="font-bold text-noche-negro">{item.name}</p>
                        <p className="text-sm text-tierra-marron">x{item.quantity}</p>
                      </div>
                      <p className="font-bold text-rosso-pomodoro">€{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-tierra-marron">Envío a</span>
                    <span>{shipping.address}, {shipping.city}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-tierra-marron">Pago</span>
                    <span>{payment.method === 'card' ? `Tarjeta ****${payment.cardNumber.slice(-4)}` : payment.method}</span>
                  </div>
                </div>
                {apiError && (
                  <div className="bg-rosso-pomodoro/10 border border-rosso-pomodoro/20 rounded-lg p-4 text-rosso-pomodoro text-sm font-medium" role="alert">
                    {apiError}
                  </div>
                )}
                <div className="flex gap-4">
                  <button onClick={() => setStep('payment')} className="btn-outline flex-1">Atrás</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary flex-1">
                    {isSubmitting ? 'Procesando...' : `Pagar €${grandTotal.toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 space-y-4">
              <h3 className="font-display text-xl font-bold text-noche-negro">Resumen</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-tierra-marron">Subtotal ({items.length} artículos)</span>
                  <span className="font-semibold">€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tierra-marron">Entrega</span>
                  <span className="font-semibold">€{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-display font-bold text-lg">Total</span>
                  <span className="font-display font-bold text-lg text-rosso-pomodoro">€{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

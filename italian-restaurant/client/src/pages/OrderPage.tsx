import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAnnounce } from '@/hooks/useAnnounce';
import { generateId } from '@/utils/a11y';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function OrderPage() {
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    notes: '',
    paymentMethod: 'card',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const { announce } = useAnnounce();

  const deliveryFee = 3.50;
  const grandTotal = total + deliveryFee;

  const nameId = generateId('order-name');
  const emailId = generateId('order-email');
  const phoneId = generateId('order-phone');
  const addressId = generateId('order-address');
  const notesId = generateId('order-notes');
  const paymentId = generateId('order-payment');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Il nome è obbligatorio';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Inserisci un\'email valida';
    if (!formData.phone.trim() || formData.phone.length < 8) newErrors.phone = 'Inserisci un numero di telefono valido';
    if (!formData.address.trim()) newErrors.address = 'L\'indirizzo è obbligatorio';

    setErrors(newErrors);

    const errorMessages = Object.values(newErrors);
    if (errorMessages.length > 0) {
      announce(`Errori nel modulo: ${errorMessages.join('. ')}`, 'assertive');
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');
    announce('Elaborazione ordine in corso');
    try {
      await api.post('/orders', {
        items: items.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
        })),
        notes: formData.notes || undefined,
      });
      setOrderPlaced(true);
      clearCart();
      announce('Ordine confermato con successo!', 'assertive');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Errore durante la creazione dell\'ordine';
      setApiError(msg);
      announce(msg, 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6" role="status" aria-live="polite">
          <div className="text-8xl" aria-hidden="true">✅</div>
          <h1 className="font-display text-4xl font-bold text-noche-negro">
            Ordine Confermato!
          </h1>
          <p className="text-tierra-marron text-lg">
            Grazie, {formData.name}! Il tuo ordine è stato ricevuto.
            Riceverai una conferma a {formData.email}.
          </p>
          <p className="text-sm text-tierra-marron/70">
            Tempo di consegna stimato: 30-45 minuti
          </p>
          <Link to="/menu" className="btn-primary inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite">
            Continua a Ordinare
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-crema min-h-screen">
      <section className="bg-gradient-to-br from-noche-negro to-rosso-pomodoro/30 py-16 px-4" aria-labelledby="order-heading">
        <div className="max-w-7xl mx-auto text-center">
          <h1 id="order-heading" className="font-display text-4xl md:text-5xl font-bold text-white">
            Il Tuo Ordine
          </h1>
          <p className="text-bianco-mozzarella/80 mt-2">
            Completa il tuo ordine per ritiro o consegna
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-label="Dettagli ordine">
        {items.length === 0 ? (
          <div className="text-center py-16 space-y-4" role="status">
            <span className="text-8xl" aria-hidden="true">🛒</span>
            <h2 className="font-display text-3xl font-bold text-noche-negro">
              Il carrello è vuoto
            </h2>
            <p className="text-tierra-marron">
              Dai un'occhiata al nostro menu e aggiungi qualcosa di buono!
            </p>
            <Link to="/menu" className="btn-primary inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite">
              Vedi il Menu
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="font-display text-2xl font-bold text-noche-negro mb-6">
                  Articoli nel Carrello
                </h2>

                <div className="space-y-4" role="list" aria-label="Articoli nel carrello">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      role="listitem"
                      className="flex items-center gap-4 p-4 bg-crema rounded-lg"
                    >
                      <div className="text-4xl" aria-hidden="true">{item.image}</div>
                      <div className="flex-grow">
                        <h3 className="font-display font-bold text-noche-negro">
                          {item.name}
                        </h3>
                        <p className="text-sm text-tierra-marron/70">
                          €{item.price.toFixed(2)} ciascuno
                        </p>
                      </div>
                      <div className="flex items-center gap-2" role="group" aria-label={`Quantità di ${item.name}: ${item.quantity}`}>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, Math.max(0, item.quantity - 1))
                          }
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
                          aria-label={`Riduci quantità di ${item.name}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold" aria-label={`${item.quantity} nel carrello`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
                          aria-label={`Aumenta quantità di ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="font-bold text-rosso-pomodoro" aria-label={`Totale: €${(item.price * item.quantity).toFixed(2)}`}>
                          €{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          removeItem(item.id);
                          announce(`${item.name} rimosso dal carrello`);
                        }}
                        className="text-gray-400 hover:text-rosso-pomodoro transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite rounded"
                        aria-label={`Rimuovi ${item.name} dal carrello`}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    clearCart();
                    announce('Carrello svuotato');
                  }}
                  className="mt-4 text-sm text-rosso-pomodoro hover:text-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite rounded"
                >
                  Svuota il carrello
                </button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                <h2 className="font-display text-2xl font-bold text-noche-negro mb-6" id="order-summary-heading">
                  Riepilogo
                </h2>

                <div className="space-y-3 mb-6" role="group" aria-labelledby="order-summary-heading">
                  <div className="flex justify-between text-sm">
                    <span className="text-tierra-marron">Subtotale</span>
                    <span className="font-semibold">€{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-tierra-marron">Consegna</span>
                    <span className="font-semibold">€{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-display text-lg font-bold">Totale</span>
                    <span className="font-display text-lg font-bold text-rosso-pomodoro" aria-label={`Totale ordine: €${grandTotal.toFixed(2)}`}>
                      €{grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-label="Dati di consegna">
                  <div>
                    <label htmlFor={nameId} className="block text-sm font-semibold text-noche-negro mb-1">
                      Nome Completo <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id={nameId}
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      aria-required="true"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? `${nameId}-error` : undefined}
                      className={`input-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite ${errors.name ? 'border-red-500 ring-red-500' : ''}`}
                      placeholder="Mario Rossi"
                    />
                    {errors.name && (
                      <p id={`${nameId}-error`} className="text-red-600 text-sm mt-1" role="alert">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={emailId} className="block text-sm font-semibold text-noche-negro mb-1">
                      Email <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id={emailId}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      aria-required="true"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? `${emailId}-error` : undefined}
                      className={`input-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite ${errors.email ? 'border-red-500 ring-red-500' : ''}`}
                      placeholder="mario@email.com"
                    />
                    {errors.email && (
                      <p id={`${emailId}-error`} className="text-red-600 text-sm mt-1" role="alert">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={phoneId} className="block text-sm font-semibold text-noche-negro mb-1">
                      Telefono <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id={phoneId}
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      aria-required="true"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? `${phoneId}-error` : undefined}
                      className={`input-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite ${errors.phone ? 'border-red-500 ring-red-500' : ''}`}
                      placeholder="+39 333 123 4567"
                    />
                    {errors.phone && (
                      <p id={`${phoneId}-error`} className="text-red-600 text-sm mt-1" role="alert">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={addressId} className="block text-sm font-semibold text-noche-negro mb-1">
                      Indirizzo di Consegna <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id={addressId}
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      aria-required="true"
                      aria-invalid={!!errors.address}
                      aria-describedby={errors.address ? `${addressId}-error` : undefined}
                      className={`input-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite ${errors.address ? 'border-red-500 ring-red-500' : ''}`}
                      placeholder="Via Roma 42, Milano"
                    />
                    {errors.address && (
                      <p id={`${addressId}-error`} className="text-red-600 text-sm mt-1" role="alert">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={notesId} className="block text-sm font-semibold text-noche-negro mb-1">
                      Note
                    </label>
                    <textarea
                      id={notesId}
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      className="input-field resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
                      placeholder="Allergie, preferenze, citofono..."
                      aria-describedby={`${notesId}-hint`}
                    />
                    <p id={`${notesId}-hint`} className="text-xs text-tierra-marron/70 mt-1">
                      Eventuali allergie o istruzioni particolari per la consegna
                    </p>
                  </div>

                  <div>
                    <label htmlFor={paymentId} className="block text-sm font-semibold text-noche-negro mb-1">
                      Metodo di Pagamento
                    </label>
                    <select
                      id={paymentId}
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="input-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
                    >
                      <option value="card">Carta di Credito/Debito</option>
                      <option value="cash">Contanti alla Consegna</option>
                      <option value="applepay">Apple Pay</option>
                      <option value="googlepay">Google Pay</option>
                    </select>
                  </div>

                  {apiError && (
                    <div className="bg-rosso-pomodoro/10 border border-rosso-pomodoro/20 rounded-lg p-4 text-rosso-pomodoro text-sm font-medium" role="alert">
                      {apiError}
                    </div>
                  )}

                  <div
                    role="progressbar"
                    aria-valuenow={isSubmitting ? 50 : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Stato dell'ordine"
                    className="sr-only"
                  >
                    {isSubmitting ? 'Elaborazione ordine...' : 'Pronto per confermare'}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? 'Elaborazione...' : 'Conferma Ordine'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

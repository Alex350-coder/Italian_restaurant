import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnnounce } from '@/hooks/useAnnounce';
import { generateId } from '@/utils/a11y';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const timeSlots = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

const partyOptions = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

export default function ReservationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
    occasion: 'none',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [apiError, setApiError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { announce } = useAnnounce();

  const today = new Date().toISOString().split('T')[0];

  const nameId = generateId('res-name');
  const emailId = generateId('res-email');
  const phoneId = generateId('res-phone');
  const dateId = generateId('res-date');
  const timeId = generateId('res-time');
  const guestsId = generateId('res-guests');
  const occasionId = generateId('res-occasion');
  const notesId = generateId('res-notes');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Introduce un email válido';
    if (!formData.phone.trim() || formData.phone.length < 8) newErrors.phone = 'Introduce un número de teléfono válido';
    if (!formData.date) newErrors.date = 'Selecciona una fecha';
    if (!formData.time) newErrors.time = 'Selecciona un horario';

    setErrors(newErrors);

    const errorMessages = Object.values(newErrors);
    if (errorMessages.length > 0) {
      announce(`Errores en el formulario: ${errorMessages.join('. ')}`, 'assertive');
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');
    announce('Reservando');
    try {
      await api.post('/reservations', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        reservation_date: formData.date,
        reservation_time: formData.time,
        party_size: Number(formData.guests),
        occasion: formData.occasion === 'none' ? undefined : formData.occasion,
        notes: formData.notes || undefined,
      });
      setReserved(true);
      announce('¡Reserva confirmada con éxito!', 'assertive');
    } catch {
      setApiError('Error al crear la reserva. Inténtalo de nuevo.');
      announce('Error al crear la reserva', 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (reserved) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-6" role="status" aria-live="polite">
          <div className="text-8xl" aria-hidden="true">🎉</div>
          <h1 className="font-display text-4xl font-bold text-noche-negro">
            ¡Reserva Confirmada!
          </h1>
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-3" aria-label="Detalles de la reserva">
            <p className="text-tierra-marron">
              <strong>Nombre:</strong> {formData.name}
            </p>
            <p className="text-tierra-marron">
              <strong>Fecha:</strong> {formData.date}
            </p>
            <p className="text-tierra-marron">
              <strong>Hora:</strong> {formData.time}
            </p>
            <p className="text-tierra-marron">
              <strong>Invitados:</strong> {formData.guests}
            </p>
          </div>
          <p className="text-tierra-marron/70 text-sm">
            Se ha enviado una confirmación a {formData.email}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/profile')}
              className="btn-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
            >
              Mis Reservas
            </button>
            <button
              onClick={() => {
                setReserved(false);
                setFormData({
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: '',
                  date: '',
                  time: '',
                  guests: '2',
                  occasion: 'none',
                  notes: '',
                });
              }}
              className="btn-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
            >
              Nueva Reserva
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-crema min-h-screen">
      <section className="bg-gradient-to-br from-noche-negro to-verde-basilico/30 py-20 px-4" aria-labelledby="reservation-heading">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-dorado-aceite font-body uppercase tracking-[0.3em] text-sm mb-3">
            Reserva tu Momento
          </p>
          <h1 id="reservation-heading" className="font-display text-5xl md:text-6xl font-bold text-white mb-4">
            Reserva una Mesa
          </h1>
          <p className="text-bianco-mozzarella/80 text-lg max-w-2xl mx-auto">
            Asegura tu lugar para una experiencia culinaria inolvidable.
            Te esperamos con calidez y profesionalidad.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12" aria-label="Formulario de reserva">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6 text-noche-negro" noValidate>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor={nameId} className="block text-sm font-semibold text-noche-negro mb-2">
                Nombre Completo <span aria-hidden="true">*</span>
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
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-noche-negro placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200 ${errors.name ? 'border-red-500 ring-red-500' : ''}`}
                placeholder="Mario Rossi"
              />
              {errors.name && (
                <p id={`${nameId}-error`} className="text-red-600 text-sm mt-1" role="alert">{errors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor={emailId} className="block text-sm font-semibold text-noche-negro mb-2">
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
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-noche-negro placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-500 ring-red-500' : ''}`}
                placeholder="mario@email.com"
              />
              {errors.email && (
                <p id={`${emailId}-error`} className="text-red-600 text-sm mt-1" role="alert">{errors.email}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor={phoneId} className="block text-sm font-semibold text-noche-negro mb-2">
              Teléfono <span aria-hidden="true">*</span>
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
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-noche-negro placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200 ${errors.phone ? 'border-red-500 ring-red-500' : ''}`}
              placeholder="+39 333 123 4567"
            />
            {errors.phone && (
              <p id={`${phoneId}-error`} className="text-red-600 text-sm mt-1" role="alert">{errors.phone}</p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label htmlFor={dateId} className="block text-sm font-semibold text-noche-negro mb-2">
                Fecha <span aria-hidden="true">*</span>
              </label>
              <input
                id={dateId}
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={today}
                required
                aria-required="true"
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? `${dateId}-error` : `${dateId}-hint`}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-noche-negro placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200 ${errors.date ? 'border-red-500 ring-red-500' : ''}`}
              />
              {errors.date ? (
                <p id={`${dateId}-error`} className="text-red-600 text-sm mt-1" role="alert">{errors.date}</p>
              ) : (
                <p id={`${dateId}-hint`} className="text-xs text-tierra-marron/70 mt-1">
                  Selecciona la fecha de la reserva
                </p>
              )}
            </div>
            <div>
              <label htmlFor={timeId} className="block text-sm font-semibold text-noche-negro mb-2">
                Hora <span aria-hidden="true">*</span>
              </label>
              <select
                id={timeId}
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                aria-required="true"
                aria-invalid={!!errors.time}
                aria-describedby={errors.time ? `${timeId}-error` : undefined}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-noche-negro placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200 ${errors.time ? 'border-red-500 ring-red-500' : ''}`}
              >
                <option value="">Selecciona hora</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {errors.time && (
                <p id={`${timeId}-error`} className="text-red-600 text-sm mt-1" role="alert">{errors.time}</p>
              )}
            </div>
            <div>
              <label htmlFor={guestsId} className="block text-sm font-semibold text-noche-negro mb-2">
                Invitados <span aria-hidden="true">*</span>
              </label>
              <select
                id={guestsId}
                name="guests"
                value={formData.guests}
                onChange={handleChange}
                aria-describedby={`${guestsId}-hint`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-noche-negro placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200"
              >
                {partyOptions.map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'persona' : 'personas'}
                  </option>
                ))}
              </select>
              <p id={`${guestsId}-hint`} className="text-xs text-tierra-marron/70 mt-1">
                Para grupos mayores a 8, contactar directamente
              </p>
            </div>
          </div>

          <div>
            <label htmlFor={occasionId} className="block text-sm font-semibold text-noche-negro mb-2">
              Ocasión Especial
            </label>
            <select
              id={occasionId}
              name="occasion"
              value={formData.occasion}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-noche-negro placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200"
            >
              <option value="none">Ninguna</option>
              <option value="birthday">Cumpleaños</option>
              <option value="anniversary">Aniversario</option>
              <option value="business">Cena de Trabajo</option>
              <option value="date">Cita Romántica</option>
              <option value="celebration">Celebración</option>
            </select>
          </div>

          <div>
            <label htmlFor={notesId} className="block text-sm font-semibold text-noche-negro mb-2">
              Notas Adicionales
            </label>
            <textarea
              id={notesId}
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-noche-negro placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Alergias alimentarias, preferencias de asiento, necesidades especiales..."
              aria-describedby={`${notesId}-hint`}
            />
            <p id={`${notesId}-hint`} className="text-xs text-tierra-marron/70 mt-1">
              Incluye posibles alergias alimentarias o necesidades especiales
            </p>
          </div>

          <div className="bg-bianco-mozzarella/50 rounded-xl p-4 border border-dorado-aceite/20 text-noche-negro" aria-labelledby="policy-heading">
            <h3 id="policy-heading" className="font-display font-bold text-noche-negro mb-2">
              <span aria-hidden="true">📋</span> Política de Reservas
            </h3>
            <ul className="text-sm text-tierra-marron space-y-1 list-disc list-inside">
              <li>La mesa se mantiene por 15 minutos desde la hora reservada</li>
              <li>Para cancelaciones, avisar con al menos 2 horas de anticipación</li>
              <li>Para grupos mayores a 8 personas, contactar directamente</li>
              <li>La confirmación se enviará por correo</li>
            </ul>
          </div>

          {apiError && (
            <div className="bg-rosso-pomodoro/10 border border-rosso-pomodoro/20 rounded-lg p-4 text-rosso-pomodoro text-sm font-medium" role="alert">
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-secondary w-full text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dorado-aceite"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Reservando...' : 'Confirmar Reserva'}
          </button>
        </form>
      </section>
    </div>
  );
}

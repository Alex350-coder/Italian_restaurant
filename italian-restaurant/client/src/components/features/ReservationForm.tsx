import { useState } from 'react';

const timeSlots = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
];

const partyOptions = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

const occasions = [
  { value: 'none', label: 'Ninguna' },
  { value: 'birthday', label: '🎂 Cumpleaños' },
  { value: 'anniversary', label: '💕 Aniversario' },
  { value: 'business', label: '💼 Cena de Negocios' },
  { value: 'date', label: '🌹 Cita Romántica' },
  { value: 'celebration', label: '🎉 Celebración' },
];

interface ReservationFormProps {
  onSubmit?: (data: ReservationData) => void;
}

export interface ReservationData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  occasion: string;
  notes: string;
}

export default function ReservationForm({ onSubmit }: ReservationFormProps) {
  const [formData, setFormData] = useState<ReservationData>({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    occasion: 'none',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    onSubmit?.(formData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-noche-negro mb-2">Nombre Completo *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Mario Rossi"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-noche-negro mb-2">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="mario@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-noche-negro mb-2">Teléfono *</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="input-field"
          placeholder="+39 333 123 4567"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-noche-negro mb-2">Fecha *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={today}
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-noche-negro mb-2">Hora *</label>
          <select name="time" value={formData.time} onChange={handleChange} required className="input-field">
            <option value="">Seleccionar hora</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-noche-negro mb-2">Invitados *</label>
          <select name="guests" value={formData.guests} onChange={handleChange} className="input-field">
            {partyOptions.map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'persona' : 'persone'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-noche-negro mb-2">Ocasión Especial</label>
        <select name="occasion" value={formData.occasion} onChange={handleChange} className="input-field">
          {occasions.map((occ) => (
            <option key={occ.value} value={occ.value}>{occ.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-noche-negro mb-2">Solicitudes Especiales</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="input-field resize-none"
          placeholder="Allergie, preferenze di seduta, bisogni speciali..."
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-secondary w-full text-lg"
      >
        {isSubmitting ? 'Reservando...' : 'Confirmar Reserva'}
      </button>
    </form>
  );
}

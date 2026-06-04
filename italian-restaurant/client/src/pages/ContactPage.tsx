import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSent(true);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-crema min-h-screen">
      <section className="bg-gradient-to-br from-noche-negro to-dorado-aceite/20 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-dorado-aceite font-body uppercase tracking-[0.3em] text-sm mb-3">
            Hablemos
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-4">
            Contacto
          </h1>
          <p className="text-bianco-mozzarella/80 text-lg max-w-2xl mx-auto">
            ¿Tienes preguntas, quieres hacer una reserva especial o simplemente
            saludar? Estamos aquí para ti.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-noche-negro mb-6">
                Información
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-rosso-pomodoro/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    📍
                  </div>
                  <div>
                    <h3 className="font-bold text-noche-negro">Dirección</h3>
                    <p className="text-tierra-marron">
                      Via Roma 42<br />
                      20121 Milano, Italia
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-verde-basilico/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    📞
                  </div>
                  <div>
                    <h3 className="font-bold text-noche-negro">Teléfono</h3>
                    <a
                      href="tel:+390212345678"
                      className="text-tierra-marron hover:text-rosso-pomodoro transition-colors"
                    >
                      +39 02 1234 5678
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-dorado-aceite/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    ✉️
                  </div>
                  <div>
                    <h3 className="font-bold text-noche-negro">Email</h3>
                    <a
                      href="mailto:info@ladolcevita.it"
                      className="text-tierra-marron hover:text-rosso-pomodoro transition-colors"
                    >
                      info@ladolcevita.it
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-tierra-marron/10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    🕐
                  </div>
                  <div>
                    <h3 className="font-bold text-noche-negro">Horarios</h3>
                    <div className="text-tierra-marron space-y-1">
                      <p>Lun - Vie: 12:00 - 23:00</p>
                      <p>Sábado: 11:00 - 00:00</p>
                      <p>Domingo: 11:00 - 22:00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-display text-xl font-bold text-noche-negro mb-4">
                Dónde Estamos
              </h3>
              <div className="bg-bianco-mozzarella rounded-lg h-64 flex items-center justify-center border border-dorado-aceite/20">
                <div className="text-center space-y-2">
                  <span className="text-5xl block">🗺️</span>
                  <p className="text-tierra-marron text-sm">
                    Mapa interactivo
                  </p>
                  <p className="text-tierra-marron/50 text-xs">
                    Via Roma 42, Milano
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="font-display text-3xl font-bold text-noche-negro mb-6">
                Escríbenos
              </h2>

              {sent ? (
                <div className="text-center py-12 space-y-4">
                  <span className="text-6xl block">✅</span>
                  <h3 className="font-display text-2xl font-bold text-verde-basilico">
                    ¡Mensaje Enviado!
                  </h3>
                  <p className="text-tierra-marron">
                    Te responderemos lo antes posible. ¡Gracias por escribirnos!
                  </p>
                  <button
                    onClick={() => {
                      setSent(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="btn-outline"
                  >
                    Enviar Otro Mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-noche-negro mb-1.5">
                        Nome *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="input-field"
                        placeholder="Mario"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-noche-negro mb-1.5">
                        Email *
                      </label>
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
                    <label className="block text-sm font-semibold text-noche-negro mb-1.5">
                      Asunto *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Selecciona un asunto</option>
                      <option value="reservation">Reserva</option>
                      <option value="event">Evento Especial</option>
                      <option value="feedback">Comentarios</option>
                      <option value="catering">Catering</option>
                      <option value="collaboration">Colaboración</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-noche-negro mb-1.5">
                      Mensaje *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="input-field resize-none"
                      placeholder="¿Cómo podemos ayudarte?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full text-lg"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

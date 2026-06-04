import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    const pwdErrors: string[] = [];
    if (form.password.length < 12) pwdErrors.push('12 caracteres');
    if (!/[A-Z]/.test(form.password)) pwdErrors.push('una mayúscula');
    if (!/[a-z]/.test(form.password)) pwdErrors.push('una minúscula');
    if (!/\d/.test(form.password)) pwdErrors.push('un número');
    if (!/[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]/.test(form.password)) pwdErrors.push('un carácter especial');
    if (pwdErrors.length > 0) {
      setError(`La contraseña debe tener: ${pwdErrors.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err: any) {
      const details = err.response?.data?.details;
      const msg = details?.length ? details.join('. ') : err.response?.data?.error;
      setError(msg || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crema flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🍕</span>
            <span className="font-display text-2xl font-bold text-gradient-gold">La Dolce Vita</span>
          </Link>
          <h1 className="font-display text-4xl font-bold text-noche-negro">Crear Cuenta</h1>
          <p className="text-tierra-marron/70 mt-2">Únete a la experiencia italiana</p>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-3d-gold p-8 border border-dorado-aceite/20
                        transform-gpu perspective-1000 hover:shadow-3d-gold-lg transition-all duration-500">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rosso-pomodoro/10 border border-rosso-pomodoro/20 rounded-lg p-4 text-rosso-pomodoro text-sm font-medium" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-noche-negro mb-1.5">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-noche-negro
                         focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent
                         transition-all duration-200 hover:border-dorado-aceite/50"
                placeholder="Mario Rossi"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-noche-negro mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-noche-negro
                         focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent
                         transition-all duration-200 hover:border-dorado-aceite/50"
                placeholder="tucorreo@ejemplo.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-noche-negro mb-1.5">
                  Contraseña
                </label>
                <span className="text-xs text-tierra-marron/50">12+ chars</span>
              </div>
              <input
                id="password"
                type="password"
                required
                minLength={12}
                title="Mínimo 12 caracteres, con mayúscula, minúscula, número y carácter especial"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-noche-negro
                         focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent
                         transition-all duration-200 hover:border-dorado-aceite/50"
                placeholder="Mayúscula + minúscula + número + símbolo"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-semibold text-noche-negro mb-1.5">
                Confirmar Contraseña
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-noche-negro
                         focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent
                         transition-all duration-200 hover:border-dorado-aceite/50"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="glow-gold"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Crear Cuenta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-tierra-marron/70">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-dorado-aceite font-semibold hover:text-rosso-pomodoro transition-colors">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err: any) {
      const data = err.response?.data;
      let msg = data?.error || 'Error al iniciar sesión';
      if (data?.remainingAttempts) {
        msg += ` (${data.remainingAttempts} intentos restantes)`;
      }
      setError(msg);
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
          <h1 className="font-display text-4xl font-bold text-noche-negro">Bienvenido</h1>
          <p className="text-tierra-marron/70 mt-2">Inicia sesión para continuar</p>
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
              <label htmlFor="password" className="block text-sm font-semibold text-noche-negro mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-noche-negro
                         focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent
                         transition-all duration-200 hover:border-dorado-aceite/50"
                placeholder="tu contraseña"
              />
            </div>

            <Button
              type="submit"
              variant="glow-gold"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-tierra-marron/70">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-dorado-aceite font-semibold hover:text-rosso-pomodoro transition-colors">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

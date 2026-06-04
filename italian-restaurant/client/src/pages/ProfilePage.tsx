import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import Button from '@/components/ui/Button';

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  items?: { name: string; quantity: number; subtotal: number }[];
}

interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  notes?: string;
}

const statusColors: Record<string, string> = {
  delivered: 'bg-verde-basilico text-white',
  confirmed: 'bg-dorado-aceite text-noche-negro',
  pending: 'bg-gray-300 text-gray-700',
  preparing: 'bg-blue-500 text-white',
  ready: 'bg-verde-basilico text-white',
  cancelled: 'bg-rosso-pomodoro text-white',
  completed: 'bg-verde-basilico text-white',
  no_show: 'bg-rosso-pomodoro text-white',
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations' | 'favorites' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, reservationsRes] = await Promise.all([
          api.get('/orders'),
          api.get('/reservations'),
        ]);
        setOrders(ordersRes.data.data.orders);
        setReservations(reservationsRes.data.data.reservations);
      } catch {
        setOrders([]);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.put('/auth/profile', profileData);
      await refreshUser();
      const savedUser = res.data?.data?.user;
      if (savedUser) {
        setProfileData({
          name: savedUser.name || '',
          email: savedUser.email || '',
          phone: savedUser.phone || '',
          address: profileData.address,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'orders' as const, label: 'Pedidos', icon: '📦' },
    { id: 'reservations' as const, label: 'Reservas', icon: '📅' },
    { id: 'settings' as const, label: 'Configuración', icon: '⚙️' },
  ];

  const statusLabel: Record<string, string> = {
    delivered: 'Entregado',
    confirmed: 'Confirmada',
    pending: 'Pendiente',
    preparing: 'Preparando',
    ready: 'Listo',
    cancelled: 'Cancelado',
    completed: 'Completada',
    no_show: 'No asistió',
  };

  return (
    <div className="bg-crema min-h-screen">
      <section className="bg-gradient-to-br from-noche-negro to-dorado-aceite/20 py-16 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <div className="w-20 h-20 bg-dorado-aceite rounded-full flex items-center justify-center text-4xl font-display font-bold text-noche-negro shadow-lg">
            {(user?.name || 'U').charAt(0)}
          </div>
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white">{user?.name || 'Usuario'}</h1>
            <p className="text-bianco-mozzarella/70">{user?.email}</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-rosso-pomodoro text-rosso-pomodoro'
                  : 'border-transparent text-gray-500 hover:text-noche-negro'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'orders' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-noche-negro mb-4">Historial de Pedidos</h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-dorado-aceite border-t-transparent rounded-full mx-auto" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <span className="text-5xl block mb-4">🍽️</span>
                <p className="text-tierra-marron">No tienes pedidos aún</p>
                <Link to="/menu" className="btn-primary inline-block mt-4">Ver Menú</Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-lg transition-shadow">
                  <div className="text-3xl">📦</div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-noche-negro">Pedido #{order.id.slice(0, 8)}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[order.status] || 'bg-gray-300 text-gray-700'}`}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </div>
                    {order.items && (
                      <p className="text-sm text-tierra-marron mt-1">
                        {order.items.map((i) => i.name).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-tierra-marron/60 mt-1">
                      {new Date(order.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rosso-pomodoro">€{Number(order.total).toFixed(2)}</p>
                    <Link to={`/order-tracking/${order.id}`} className="text-xs text-dorado-aceite hover:underline mt-1 block">
                      Rastrear →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-noche-negro mb-4">Tus Reservas</h2>
              <Link to="/reservation" className="btn-primary text-sm">Nueva Reserva</Link>
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-dorado-aceite border-t-transparent rounded-full mx-auto" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <span className="text-5xl block mb-4">📅</span>
                <p className="text-tierra-marron">No tienes reservas aún</p>
                <Link to="/reservation" className="btn-primary inline-block mt-4">Reservar Mesa</Link>
              </div>
            ) : (
              reservations.map((res) => (
                <div key={res.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-lg transition-shadow">
                  <div className="text-3xl">📅</div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-noche-negro">
                        {new Date(res.reservation_date).toLocaleDateString('es-ES')} a las {res.reservation_time}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[res.status] || 'bg-gray-300 text-gray-700'}`}>
                        {statusLabel[res.status] || res.status}
                      </span>
                    </div>
                    <p className="text-sm text-tierra-marron mt-1">{res.party_size} comensales{res.notes ? ` — ${res.notes}` : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-xl animate-fade-in">
            <h2 className="font-display text-2xl font-bold text-noche-negro mb-6">Configuración del Perfil</h2>
            <form onSubmit={handleSaveProfile} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-noche-negro mb-1">Nombre</label>
                <input
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-noche-negro mb-1">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-noche-negro mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-noche-negro mb-1">Dirección</label>
                <input
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dorado-aceite focus:border-transparent transition-all duration-200"
                />
              </div>
              {saved && (
                <div className="bg-verde-basilico/10 text-verde-basilico px-4 py-2 rounded-lg text-sm font-medium">
                  Cambios guardados correctamente
                </div>
              )}
              <Button type="submit" variant="primary" size="lg" loading={saving} className="w-full">
                Guardar Cambios
              </Button>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

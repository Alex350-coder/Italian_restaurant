import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, total, removeItem, updateQuantity } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-noche-negro/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display text-xl font-bold text-noche-negro">
            Carrito ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-noche-negro transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <span className="text-6xl block">🛒</span>
              <p className="text-tierra-marron font-semibold">El carrito está vacío</p>
              <Link to="/menu" onClick={onClose} className="btn-primary inline-block text-sm">
                Ver el Menú
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-crema rounded-lg animate-fade-in"
                >
                  <span className="text-3xl">{item.image}</span>
                  <div className="flex-grow">
                    <h3 className="font-bold text-sm text-noche-negro">{item.name}</h3>
                    <p className="text-xs text-tierra-marron">€{item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="font-bold text-sm text-rosso-pomodoro">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-gray-400 hover:text-rosso-pomodoro transition-colors"
                    >
                       Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-tierra-marron">Subtotal</span>
                <span className="font-semibold">€{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-tierra-marron">Entrega</span>
                <span className="font-semibold">€3.50</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-display font-bold text-lg">Total</span>
                <span className="font-display font-bold text-lg text-rosso-pomodoro">
                  €{(total + 3.5).toFixed(2)}
                </span>
              </div>
            </div>
            <Link
              to="/checkout"
              onClick={onClose}
              className="btn-primary w-full text-center block"
            >
              Ir al Pago
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

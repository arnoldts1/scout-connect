import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('scout-cart') || '[]');
    setCartItems(cart);
  }, []);

  const updateQuantity = (index, delta) => {
    const newCart = [...cartItems];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    setCartItems(newCart);
    localStorage.setItem('scout-cart', JSON.stringify(newCart));
  };

  const removeItem = (index) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    localStorage.setItem('scout-cart', JSON.stringify(newCart));
    toast.success('Item removed');
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.setItem('scout-cart', '[]');
    toast.success('Cart cleared');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Shopping Cart</h1>
        </div>
        {cartItems.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500">
            Clear All
          </Button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <ShoppingCart className="w-20 h-20 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-6 text-center">
            Browse the marketplace and add items to your cart
          </p>
          <Button onClick={() => navigate(createPageUrl('Marketplace'))} className="bg-orange-500 hover:bg-orange-600">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Button>
        </div>
      ) : (
        <>
          <div className="p-4 space-y-4 pb-40">
            {cartItems.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-xl border p-4 flex gap-4">
                <Link to={createPageUrl(`ProductDetail?id=${item.productId}`)}>
                  <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{item.title}</h3>
                  <p className="text-orange-600 font-bold mt-1">
                    {item.price?.toLocaleString()} RWF
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Section */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Subtotal ({cartItems.length} items)</span>
              <span className="text-xl font-bold text-orange-600">{subtotal.toLocaleString()} RWF</span>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12">
              Proceed to Checkout
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
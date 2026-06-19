import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingCart, Heart, Share2, MapPin, User,
  MessageCircle, ChevronLeft, ChevronRight, Plus, Minus, Check, Phone, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CONDITION_COLORS = {
  new: 'bg-green-100 text-green-700',
  like_new: 'bg-blue-100 text-blue-700',
  good: 'bg-yellow-100 text-yellow-700',
  fair: 'bg-orange-100 text-orange-700'
};

export default function ProductDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId,
  });

  const { data: seller } = useQuery({
    queryKey: ['seller', product?.seller_id],
    queryFn: async () => {
      if (product?.seller_id === 'admin') return { full_name: 'Scout Store', avatar: null };
      const users = await base44.entities.User.filter({ id: product?.seller_id });
      return users[0];
    },
    enabled: !!product?.seller_id,
  });

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('scout-cart') || '[]');
    const existingIndex = cart.findIndex(item => item.productId === productId);
    
    if (existingIndex >= 0) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        productId,
        title: product.title,
        price: product.price,
        image: product.thumbnail || product.images?.[0],
        quantity
      });
    }
    
    localStorage.setItem('scout-cart', JSON.stringify(cart));
    toast.success('Added to cart!');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const handleRequestDonation = async () => {
    if (!user) {
      toast.error('Please log in to request donations');
      return;
    }
    
    setIsRequesting(true);
    try {
      // Create an order for the donation
      await base44.entities.Order.create({
        product_id: product.id,
        product_title: product.title,
        buyer_id: user.id,
        buyer_name: user.full_name,
        seller_id: product.seller_id,
        price: 0,
        delivery_method: 'pickup',
        status: 'pending',
        notes: 'Donation request'
      });

      // Notify the seller
      await base44.entities.Notification.create({
        user_id: product.seller_id,
        type: 'order',
        title: 'Donation Request',
        message: `${user.full_name} requested your donation: ${product.title}`,
        actor_id: user.id,
        actor_name: user.full_name,
        actor_avatar: user.avatar,
        reference_id: product.id,
        reference_type: 'product',
        is_read: false
      });

      toast.success('Donation requested! The seller will be notified.');
      navigate(createPageUrl('Marketplace'));
    } catch (error) {
      toast.error('Failed to request donation');
    } finally {
      setIsRequesting(false);
    }
  };

  if (!product) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const images = product.thumbnail 
    ? [product.thumbnail, ...(product.images || [])]
    : product.images || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 scout-bg-pattern">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
          <Link to={createPageUrl('Cart')}>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative bg-white dark:bg-gray-900">
        <div className="aspect-square">
          {images.length > 0 ? (
            <img 
              src={images[currentImageIndex]} 
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-6xl">
              📦
            </div>
          )}
        </div>
        
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrentImageIndex(i => i > 0 ? i - 1 : images.length - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentImageIndex(i => i < images.length - 1 ? i + 1 : 0)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    idx === currentImageIndex ? "bg-orange-500" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {product.is_donation && (
          <Badge className="absolute top-4 left-4 bg-green-500 text-white">Free Donation</Badge>
        )}
      </div>

      {/* Product Info */}
      <div className="bg-white dark:bg-gray-900 p-4 border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{product.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={CONDITION_COLORS[product.condition]}>{product.condition}</Badge>
              <Badge variant="outline">{product.category}</Badge>
            </div>
          </div>
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border",
              isWishlisted ? "bg-red-50 border-red-200" : "bg-gray-50"
            )}
          >
            <Heart className={cn("w-5 h-5", isWishlisted && "fill-red-500 text-red-500")} />
          </button>
        </div>

        <p className="text-2xl font-bold text-orange-600 mt-4">
          {product.is_donation ? 'FREE' : `${product.price?.toLocaleString()} RWF`}
        </p>

        {product.location && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {product.location}
          </p>
        )}
      </div>

      {/* Description */}
      {product.description && (
        <div className="bg-white dark:bg-gray-900 p-4 border-b">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-600 dark:text-gray-400">{product.description}</p>
        </div>
      )}

      {/* Seller */}
      <div className="bg-white dark:bg-gray-900 p-4 border-b pb-24">
        <h3 className="font-semibold mb-3">Seller</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={seller?.avatar} />
              <AvatarFallback>{seller?.full_name?.charAt(0) || 'S'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{seller?.full_name || product.seller_name}</p>
              <p className="text-sm text-gray-500">Seller</p>
            </div>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="flex gap-2 mt-4">
          {product.seller_phone && (
            <a href={`tel:${product.seller_phone}`} className="flex-1">
              <Button variant="outline" className="w-full">
                <Phone className="w-4 h-4 mr-2" /> Call
              </Button>
            </a>
          )}
          {product.seller_whatsapp && (
            <a 
              href={`https://wa.me/${product.seller_whatsapp.replace(/[^0-9]/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full bg-green-500 hover:bg-green-600">
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
            </a>
          )}
          {!product.seller_phone && !product.seller_whatsapp && (
            <Button variant="outline" className="w-full">
              <MessageCircle className="w-4 h-4 mr-2" /> Contact via App
            </Button>
          )}
        </div>
      </div>

      {/* Quantity & Add to Cart */}
      {!product.is_donation && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t p-4 flex items-center gap-4 z-20">
          <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-full px-2">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={addToCart} className="flex-1 bg-orange-500 hover:bg-orange-600 h-12">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart • {(product.price * quantity).toLocaleString()} RWF
          </Button>
        </div>
      )}

      {product.is_donation && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t p-4 z-20">
          <Button 
            onClick={handleRequestDonation}
            disabled={isRequesting}
            className="w-full bg-green-500 hover:bg-green-600 h-12"
          >
            {isRequesting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            {isRequesting ? 'Requesting...' : 'Request This Donation'}
          </Button>
        </div>
      )}
    </div>
  );
}
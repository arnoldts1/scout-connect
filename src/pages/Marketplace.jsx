import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Search, Plus, Filter, Heart, MapPin,
  Tag, Gift, Wrench, ChevronRight, ShoppingCart, CalendarClock } from
'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';

const CATEGORIES = [
{ id: 'all', label: 'All', icon: '🛒' },
{ id: 'uniforms', label: 'Uniforms', icon: '👕' },
{ id: 'tents', label: 'Tents', icon: '⛺' },
{ id: 'ropes', label: 'Ropes', icon: '🪢' },
{ id: 'compasses', label: 'Compasses', icon: '🧭' },
{ id: 'camping_gear', label: 'Camping', icon: '🏕️' },
{ id: 'books', label: 'Books', icon: '📚' }];


const CONDITION_COLORS = {
  new: 'bg-green-100 text-green-700',
  like_new: 'bg-blue-100 text-blue-700',
  good: 'bg-yellow-100 text-yellow-700',
  fair: 'bg-orange-100 text-orange-700'
};

export default function Marketplace() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get('tab') || 'buy');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('scout-cart') || '[]');
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
        // Continue gracefully - marketplace shows public items
      }
    };
    fetchUser();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ status: 'approved' }, '-created_date')
  });

  const { data: tutorials = [] } = useQuery({
    queryKey: ['diy-tutorials'],
    queryFn: () => base44.entities.DIYTutorial.filter({ status: 'published' })
  });

  const { data: myProducts = [] } = useQuery({
    queryKey: ['my-products', user?.id],
    queryFn: () => base44.entities.Product.filter({ seller_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: rentals = [] } = useQuery({
    queryKey: ['rental-listings'],
    queryFn: () => base44.entities.RentalListing.filter({ status: 'available' }, '-created_date'),
    enabled: activeTab === 'rent'
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesDonation = activeTab === 'donate' ? p.is_donation : !p.is_donation;
    return matchesSearch && matchesCategory && matchesDonation;
  });

  const filteredRentals = rentals.filter((r) => {
    const matchesSearch = (r.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-7 h-7" />
                Marketplace
              </h1>
              <p className="text-orange-100 mt-1">Buy, sell, donate, and rent scout gear</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to={createPageUrl('Cart')} className="relative">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 &&
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-orange-600 rounded-full text-xs flex items-center justify-center font-bold">
                      {cartCount}
                    </span>
                  }
                </Button>
              </Link>
              {activeTab === 'rent' ?
              <Button
                onClick={() => navigate(createPageUrl('PostRental'))}
                className="bg-white text-teal-600 hover:bg-teal-50">

                  <Plus className="w-4 h-4 mr-2" /> Post Rental
                </Button> :

              <Button
                onClick={() => navigate(createPageUrl('SellProduct'))}
                className="bg-white text-orange-600 hover:bg-orange-50">

                  <Plus className="w-4 h-4 mr-2" /> Sell Item
                </Button>
              }
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('buy')}
              className={cn(
                "px-4 py-2 rounded-full font-medium transition-colors",
                activeTab === 'buy' ? "bg-white text-orange-600" : "bg-white/20 text-white"
              )}>

              <ShoppingBag className="w-4 h-4 inline mr-2" /> Buy/Sell
            </button>
            <button
              onClick={() => setActiveTab('donate')}
              className={cn(
                "px-4 py-2 rounded-full font-medium transition-colors",
                activeTab === 'donate' ? "bg-white text-orange-600" : "bg-white/20 text-white"
              )}>

              <Gift className="w-4 h-4 inline mr-2" /> Donations
            </button>
            <button
              onClick={() => setActiveTab('rent')}
              className={cn(
                "px-4 py-2 rounded-full font-medium transition-colors",
                activeTab === 'rent' ? "bg-white text-teal-600" : "bg-white/20 text-white"
              )}>

              <CalendarClock className="w-4 h-4 inline mr-2" /> Rent
            </button>
            <button
              onClick={() => setActiveTab('diy')}
              className={cn(
                "px-4 py-2 rounded-full font-medium transition-colors",
                activeTab === 'diy' ? "bg-white text-orange-600" : "bg-white/20 text-white"
              )}>

              <Wrench className="w-4 h-4 inline mr-2" /> DIY
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {(activeTab === 'buy' || activeTab === 'donate') &&
        <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full" />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {CATEGORIES.map((cat) =>
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors",
                activeCategory === cat.id ?
                "bg-orange-500 text-white" :
                "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}>
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
            )}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) =>
            <Link
              key={product.id}
              to={createPageUrl(`ProductDetail?id=${product.id}`)}
              className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border hover:shadow-lg transition-all">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                    {product.thumbnail || product.images?.[0] ?
                <img src={product.thumbnail || product.images[0]} alt={product.title} className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center text-4xl">
                        {CATEGORIES.find((c) => c.id === product.category)?.icon || '📦'}
                      </div>
                }
                    {product.is_donation &&
                <Badge className="absolute top-2 left-2 bg-green-500">Free</Badge>
                }
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">{product.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-bold text-orange-600">
                        {product.is_donation ? 'Donation' : `${product.price?.toLocaleString()} RWF`}
                      </p>
                      <Badge className={cn("text-xs", CONDITION_COLORS[product.condition])}>
                        {product.condition}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {product.location || 'Rwanda'}
                    </p>
                  </div>
                </Link>
            )}
            </div>
            





































            {filteredProducts.length === 0 &&
          <div className="text-center py-16">
                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-semibold text-lg">No products found</h3>
                <p className="text-gray-500">Be the first to list an item!</p>
              </div>
          }
          </>
        }

        {/* Rent */}
        {activeTab === 'rent' &&
        <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search rentals..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-full" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {CATEGORIES.map((cat) =>
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors",
            activeCategory === cat.id ? "bg-teal-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300")}>
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
            )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRentals.map((rental) =>
            <div key={rental.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border hover:shadow-lg transition-all">
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                    {rental.images?.[0] ?
                <img src={rental.images[0]} alt={rental.title} className="w-full h-full object-cover" /> :

                <div className="w-full h-full flex items-center justify-center text-4xl">
                        {CATEGORIES.find((c) => c.id === rental.category)?.icon || '📦'}
                      </div>
                }
                    <Badge className="absolute top-2 left-2 bg-teal-500 text-white">For Rent</Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">{rental.title}</h3>
                    <p className="font-bold text-teal-600 mt-1">{rental.price_per_day?.toLocaleString()} RWF/day</p>
                    {rental.deposit > 0 &&
                <p className="text-xs text-gray-400">Deposit: {rental.deposit?.toLocaleString()} RWF</p>
                }
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {rental.location || 'Rwanda'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge className={cn("text-xs", CONDITION_COLORS[rental.condition])}>{rental.condition}</Badge>
                    </div>
                    {rental.owner_phone &&
                <a href={`tel:${rental.owner_phone}`}
                className="mt-2 block text-center text-xs py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium">
                        📞 Contact Owner
                      </a>
                }
                  </div>
                </div>
            )}
            </div>

            {filteredRentals.length === 0 &&
          <div className="text-center py-16">
                <CalendarClock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="font-semibold text-lg">No rentals listed yet</h3>
                <p className="text-gray-500 mb-4">Be the first to offer equipment for rent!</p>
                <Button onClick={() => navigate(createPageUrl('PostRental'))} className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" /> Post Rental
                </Button>
              </div>
          }
          </>
        }

        {/* DIY Tutorials */}
        {activeTab === 'diy' &&
        <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="w-5 h-5" /> DIY Scout Gear Tutorials
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {tutorials.map((tutorial) =>
            <Link
              key={tutorial.id}
              to={createPageUrl(`DIYTutorial?id=${tutorial.id}`)}
              className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border hover:shadow-lg transition-all flex">

                  <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    {tutorial.cover_image ?
                <img src={tutorial.cover_image} alt={tutorial.title} className="w-full h-full object-cover" /> :

                <div className="w-full h-full flex items-center justify-center text-3xl">🔧</div>
                }
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="font-medium mb-1">{tutorial.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{tutorial.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <Badge>{tutorial.difficulty}</Badge>
                      <span>~{tutorial.estimated_cost?.toLocaleString()} RWF</span>
                    </div>
                  </div>
                </Link>
            )}
            </div>
          </div>
        }
      </div>
    </div>);

}

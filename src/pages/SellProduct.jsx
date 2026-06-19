import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Loader2, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'uniforms', label: 'Uniforms' },
  { id: 'tents', label: 'Tents' },
  { id: 'ropes', label: 'Ropes' },
  { id: 'compasses', label: 'Compasses' },
  { id: 'camping_gear', label: 'Camping Gear' },
  { id: 'badges', label: 'Badges' },
  { id: 'books', label: 'Books' },
  { id: 'other', label: 'Other' },
];

export default function SellProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [thumbnail, setThumbnail] = useState('');
  const thumbnailInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'good',
    price: '',
    location: '',
    is_donation: false,
    seller_phone: '',
    seller_whatsapp: '',
    book_type: '',
    download_url: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setImages(prev => [...prev, file_url]);
      }
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setThumbnail(file_url);
    } catch (error) {
      toast.error('Failed to upload thumbnail');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.seller_phone) {
      toast.error('Please fill in required fields including phone number');
      return;
    }

    // Validate book requirements
    if (formData.category === 'books') {
      if (!formData.book_type) {
        toast.error('Please select whether this is a soft copy or hard copy book');
        return;
      }
      if (formData.book_type === 'soft_copy' && !formData.download_url) {
        toast.error('Please provide a download URL for the soft copy book');
        return;
      }
    }

    if (!user) {
      toast.error('Please log in to list a product');
      return;
    }

    setIsSubmitting(true);
    try {
      // Verified users and admins get auto-approved
      const autoApprove = (user?.is_verified) || (user?.role === 'admin');
      
      const productData = {
        ...formData,
        price: formData.is_donation ? 0 : parseFloat(formData.price) || 0,
        images,
        thumbnail,
        seller_id: user.id,
        seller_name: user.full_name,
        status: autoApprove ? 'approved' : 'pending'
      };
      
      // Remove book fields if not a book
      if (formData.category !== 'books') {
        delete productData.book_type;
        delete productData.download_url;
      }
      
      await base44.entities.Product.create(productData);

      toast.success('Product listed! Awaiting approval.');
      navigate(createPageUrl('Marketplace'));
    } catch (error) {
      toast.error('Failed to list product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative">
      {/* Scout Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 5 L55 20 L70 20 L58 30 L63 45 L50 35 L37 45 L42 30 L30 20 L45 20 Z' fill='%23059669'/%3E%3C/svg%3E"), url("https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Emblème_Scout_Association_du_Rwanda.svg/1200px-Emblème_Scout_Association_du_Rwanda.svg.png")`,
        backgroundSize: '80px 80px, 200px 200px',
        backgroundPosition: '0 0, 100px 100px',
        backgroundRepeat: 'repeat'
      }} />
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Sell or Donate Item</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thumbnail */}
          <div>
            <Label>Cover Image *</Label>
            <div className="mt-2">
              {thumbnail ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setThumbnail('')}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-orange-500 transition-colors"
                >
                  {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Upload cover image</span>
                    </>
                  )}
                </button>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Additional Images */}
          <div>
            <Label>Additional Photos</Label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-orange-500 transition-colors"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 text-gray-400" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What are you selling?"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your item..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Category */}
          <div>
            <Label>Category *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div>
            <Label>Condition</Label>
            <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="like_new">Like New</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Book Type - Only show when category is books */}
          {formData.category === 'books' && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div>
                <Label>Book Type *</Label>
                <Select 
                  value={formData.book_type || ''} 
                  onValueChange={(v) => setFormData({ ...formData, book_type: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select book type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hard_copy">Hard Copy (Physical Book)</SelectItem>
                    <SelectItem value="soft_copy">Soft Copy (Digital/PDF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.book_type === 'soft_copy' && (
                <div>
                  <Label>Download URL *</Label>
                  <Input
                    value={formData.download_url || ''}
                    onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                    placeholder="https://drive.google.com/... or other download link"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide a link where buyers can download the book (Google Drive, Dropbox, etc.)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Donation Toggle */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl">
            <div>
              <p className="font-medium">This is a donation</p>
              <p className="text-sm text-gray-500">Give this item for free</p>
            </div>
            <Switch
              checked={formData.is_donation}
              onCheckedChange={(checked) => setFormData({ ...formData, is_donation: checked })}
            />
          </div>

          {/* Price */}
          {!formData.is_donation && (
            <div>
              <Label>Price (RWF)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
            </div>
          )}

          {/* Location */}
          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Your location"
              className="mt-1"
            />
          </div>

          {/* Contact Information */}
          <div className="p-4 bg-white dark:bg-gray-900 rounded-xl space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" /> Contact Information
            </h3>
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={formData.seller_phone}
                onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })}
                placeholder="+250 7XX XXX XXX"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp Number
              </Label>
              <Input
                value={formData.seller_whatsapp}
                onChange={(e) => setFormData({ ...formData, seller_whatsapp: e.target.value })}
                placeholder="+250 7XX XXX XXX (optional)"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 h-12"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {formData.is_donation ? 'Donate Item' : 'List for Sale'}
          </Button>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CreditCard, Download, Search, CheckCircle, Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ScoutCardPreview, { ICYICIRO_MAP } from '@/components/cards/ScoutCardPreview';

const ICYICIRO_OPTIONS = [
  { value: 'inkesha', label: 'Inkesha' },
  { value: 'ingenzi', label: 'Ingenzi' },
  { value: 'abahizi', label: 'Abahizi' },
  { value: 'abatoni', label: 'Abatoni' },
];

export default function ScoutCardGenerator() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScout, setSelectedScout] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const cardRef = useRef(null);
  const sigInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Load verified payments to know who's eligible
  const { data: verifiedPayments = [] } = useQuery({
    queryKey: ['verified-payments'],
    queryFn: () => base44.entities.RevenuePayment.filter({ status: 'verified' }, '-created_date', 500),
  });

  // Load all users
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-for-cards'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  // Only show users who have at least one verified payment
  const eligibleUserIds = [...new Set(verifiedPayments.map(p => p.submitter_id).filter(Boolean))];
  const eligibleUsers = allUsers.filter(u => eligibleUserIds.includes(u.id));

  const filteredUsers = eligibleUsers.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.scout_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectScout = (scout) => {
    setSelectedScout(scout);
    setCardData({
      full_name: scout.full_name || '',
      scout_id: scout.scout_id || '',
      dob: scout.dob || '',
      location: scout.location || '',
      icyiciro: scout.icyiciro || 'abahizi',
      avatar: scout.avatar || '',
    });
  };

  const handleCardDataChange = (field, value) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSignature(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSignatureUrl(file_url);
      toast.success('Signature uploaded');
    } catch {
      toast.error('Failed to upload signature');
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL('image/png');
      // CR80 card: 88.9mm × 50.8mm
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [88.9, 50.8] });
      pdf.addImage(imgData, 'PNG', 0, 0, 88.9, 50.8);
      pdf.save(`scout-card-${cardData.scout_id || cardData.full_name || 'card'}.pdf`);
      toast.success('Card downloaded!');
    } catch (err) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scout Card Generator</h1>
          <p className="text-sm text-gray-500">Generate ID cards for scouts with verified revenue payments</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Scout Selection */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-semibold mb-3 text-gray-800 dark:text-white">Select Scout</h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email or Scout ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {eligibleUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No scouts with verified payments found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredUsers.map(scout => (
                  <button
                    key={scout.id}
                    onClick={() => handleSelectScout(scout)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedScout?.id === scout.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={scout.avatar} />
                      <AvatarFallback>{scout.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{scout.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{scout.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {scout.scout_id && (
                        <span className="text-xs font-mono text-gray-500">{scout.scout_id}</span>
                      )}
                      <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                        <CheckCircle className="w-2.5 h-2.5 mr-1" />
                        Paid
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Signature Upload */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-semibold mb-3 text-gray-800 dark:text-white">Signature (Optional)</h2>
            <input ref={sigInputRef} type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
            {signatureUrl ? (
              <div className="flex items-center gap-3">
                <img src={signatureUrl} alt="sig" className="h-10 object-contain border rounded" />
                <Button variant="ghost" size="sm" onClick={() => setSignatureUrl('')}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => sigInputRef.current?.click()} disabled={isUploadingSignature} className="w-full">
                {isUploadingSignature ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload Signature Image
              </Button>
            )}
          </div>
        </div>

        {/* Right: Card Editor + Preview */}
        <div className="space-y-4">
          {cardData ? (
            <>
              {/* Editable Fields */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                <h2 className="font-semibold text-gray-800 dark:text-white">Card Details</h2>
                <div>
                  <Label className="text-xs text-gray-500">Full Name</Label>
                  <Input value={cardData.full_name} onChange={e => handleCardDataChange('full_name', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Scout ID</Label>
                  <Input value={cardData.scout_id} onChange={e => handleCardDataChange('scout_id', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Date of Birth (D.O.B)</Label>
                  <Input type="date" value={cardData.dob} onChange={e => handleCardDataChange('dob', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Address / Location</Label>
                  <Input value={cardData.location} onChange={e => handleCardDataChange('location', e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Icyiciro (Level)</Label>
                  <Select value={cardData.icyiciro} onValueChange={v => handleCardDataChange('icyiciro', v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICYICIRO_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="font-semibold mb-3 text-gray-800 dark:text-white">Card Preview</h2>
                <div className="flex justify-center">
                  <ScoutCardPreview ref={cardRef} scout={cardData} signatureUrl={signatureUrl} />
                </div>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating PDF...</>
                    : <><Download className="w-4 h-4 mr-2" />Download PDF Card</>
                  }
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-400">
              <CreditCard className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a scout from the list to generate their card</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

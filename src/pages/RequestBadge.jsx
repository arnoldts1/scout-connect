import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RequestBadge() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestType, setRequestType] = useState('personal');
  const [selectedBadge, setSelectedBadge] = useState('');
  const [reason, setReason] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        navigate(createPageUrl('Home'));
      }
    };
    fetchUser();
  }, []);

  const { data: badges = [] } = useQuery({
    queryKey: ['all-badges'],
    queryFn: () => base44.entities.Badge.list(),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['user-units'],
    queryFn: () => base44.entities.Unit.list(),
    enabled: requestType === 'unit',
  });

  const { data: clans = [] } = useQuery({
    queryKey: ['user-clans'],
    queryFn: () => base44.entities.Clan.list(),
    enabled: requestType === 'clan',
  });

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setEvidenceUrls([...evidenceUrls, ...urls]);
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !selectedBadge) return;

    setIsSubmitting(true);
    try {
      const badge = badges.find(b => b.id === selectedBadge);
      
      await base44.entities.BadgeRequest.create({
        requester_id: user.id,
        requester_name: user.full_name,
        badge_id: selectedBadge,
        badge_name: badge?.name,
        request_type: requestType,
        reason,
        evidence_urls: evidenceUrls,
        status: 'pending'
      });

      toast.success('Badge request submitted for review');
      navigate(createPageUrl('Badges'));
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request Badge</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="space-y-4">
            <div>
              <Label>Request Type</Label>
              <RadioGroup value={requestType} onValueChange={setRequestType} className="mt-2 flex gap-4">
                <label className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer flex-1",
                  requestType === 'personal' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200"
                )}>
                  <RadioGroupItem value="personal" />
                  <span className="text-sm font-medium">For Myself</span>
                </label>
                <label className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer flex-1",
                  requestType === 'unit' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200"
                )}>
                  <RadioGroupItem value="unit" />
                  <span className="text-sm font-medium">For Unit</span>
                </label>
                <label className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer flex-1",
                  requestType === 'clan' ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "border-gray-200"
                )}>
                  <RadioGroupItem value="clan" />
                  <span className="text-sm font-medium">For Clan</span>
                </label>
              </RadioGroup>
            </div>

            <div>
              <Label>Select Badge *</Label>
              <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose a badge" />
                </SelectTrigger>
                <SelectContent>
                  {badges.map(badge => (
                    <SelectItem key={badge.id} value={badge.id}>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        {badge.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Why do you deserve this badge? *</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your achievements and why you should receive this badge..."
                rows={4}
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label>Evidence (Photos/Documents)</Label>
              <div className="mt-1.5">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-500">Upload supporting files</span>
                    </>
                  )}
                </label>
              </div>
              {evidenceUrls.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {evidenceUrls.map((url, idx) => (
                    <img key={idx} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl"
          disabled={!selectedBadge || !reason.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</>
          ) : (
            <>Submit Request</>
          )}
        </Button>
      </form>
    </div>
  );
}
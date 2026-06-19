import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CampTemplateSelector({ onAutofill }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('camp_templates')
        .select('*')
        .eq('is_trending', true)
        .order('created_date', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofill = (template) => {
    try {
      const templateData = template.template_data || {};
      onAutofill(templateData);
      setOpen(false);
      toast.success(`Autofilled with "${template.name}" template`);
    } catch (error) {
      console.error('Error autofilling:', error);
      toast.error('Failed to autofill template');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Trending Camps
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Camp Template</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p className="text-sm">No trending camps available</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleAutofill(template)}
                className="w-full p-4 border rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  {template.icon && (
                    <span className="text-2xl">{template.icon}</span>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DeleteCampDialog({ campId, campTitle, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== campTitle) {
      toast.error('Camp name does not match');
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Deleting camp plan:', campId);
      const { data, error } = await supabase
        .from('camp_plans')
        .delete()
        .eq('id', campId)
        .select();

      console.log('Delete response:', { data, error });

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      console.log('Delete successful, calling onDeleted callback');
      toast.success('Camp plan deleted successfully');
      setOpen(false);
      setConfirmText('');

      // Wait a moment for toast to show, then navigate
      setTimeout(() => {
        onDeleted?.();
      }, 500);
    } catch (error) {
      console.error('Error deleting camp:', error);
      toast.error(`Failed to delete camp: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete Camp Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. All camp details, schedules, and layouts will be permanently deleted.
          </p>

          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-2">
              To confirm, type the camp name:
            </p>
            <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-3">
              "{campTitle}"
            </p>
            <Input
              placeholder="Type camp name to confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={confirmText !== campTitle || isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

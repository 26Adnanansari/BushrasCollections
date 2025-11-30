import { formatDistanceToNow } from 'date-fns';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraftIndicatorProps {
  lastSaved: string | null;
  onClear: () => void;
}

export function DraftIndicator({ lastSaved, onClear }: DraftIndicatorProps) {
  if (!lastSaved) return null;

  const timeAgo = formatDistanceToNow(new Date(lastSaved), { addSuffix: true });

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
      <Save className="h-4 w-4 text-green-500" />
      <span>Draft saved {timeAgo}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-6 px-2 ml-2"
      >
        <X className="h-3 w-3" />
        Clear draft
      </Button>
    </div>
  );
}

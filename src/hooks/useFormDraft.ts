import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFormDraftOptions<T> {
  formId: string;
  initialData: T;
  expiryHours?: number;
}

interface FormDraftState<T> {
  data: T;
  lastSaved: number;
}

export function useFormDraft<T>({ formId, initialData, expiryHours = 24 }: UseFormDraftOptions<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const { toast } = useToast();

  const STORAGE_KEY = `form_draft_${formId}`;

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: FormDraftState<T> = JSON.parse(saved);
        const now = Date.now();
        const expiryTime = expiryHours * 60 * 60 * 1000;

        if (now - parsed.lastSaved < expiryTime) {
          setFormData(parsed.data);
          setLastSaved(new Date(parsed.lastSaved));
          setHasDraft(true);

          toast({
            title: "Draft Restored",
            description: `Restored your unsaved changes from ${new Date(parsed.lastSaved).toLocaleTimeString()}`,
            duration: 4000,
          });
        } else {
          // Expired
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [STORAGE_KEY, expiryHours, toast]);

  // Save draft with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      // Don't save if it matches initial data exactly (empty form)
      if (JSON.stringify(formData) === JSON.stringify(initialData)) {
        return;
      }

      const state: FormDraftState<T> = {
        data: formData,
        lastSaved: Date.now()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setLastSaved(new Date());
      setHasDraft(true);
    }, 1000); // 1 second debounce

    return () => clearTimeout(handler);
  }, [formData, STORAGE_KEY, initialData]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(initialData);
    setLastSaved(null);
    setHasDraft(false);
  }, [STORAGE_KEY, initialData]);

  return {
    formData,
    setFormData,
    lastSaved,
    hasDraft,
    clearDraft
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFormDraftOptions<T> {
  formId: string;
  initialData?: T;
  defaultValues?: T;
  expiryHours?: number;
  enabled?: boolean;
}

export function useFormDraft<T>({ formId, initialData, defaultValues, expiryHours = 24, enabled = true }: UseFormDraftOptions<T>) {
  const dataToUse = initialData || defaultValues;
  if (!dataToUse) {
    throw new Error("Either initialData or defaultValues must be provided");
  }

  const [formData, setFormData] = useState<T>(dataToUse);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const { toast } = useToast();

  const STORAGE_KEY = `form_draft_${formId}`;

  const loadDraft = useCallback(() => {
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

          return parsed.data;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  }, [STORAGE_KEY, expiryHours, toast]);

  const saveDraft = useCallback((data: T) => {
    if (!enabled) return;

    // Don't save if it matches initial data exactly
    if (JSON.stringify(data) === JSON.stringify(dataToUse)) {
      return;
    }

    const state: FormDraftState<T> = {
      data,
      lastSaved: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setLastSaved(new Date());
    setHasDraft(true);
  }, [STORAGE_KEY, dataToUse, enabled]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(dataToUse);
    setLastSaved(null);
    setHasDraft(false);
  }, [STORAGE_KEY, dataToUse]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (enabled) {
      loadDraft();
    }
  }, [enabled, loadDraft]);

  return {
    formData,
    setFormData,
    lastSaved,
    hasDraft,
    clearDraft,
    loadDraft,
    saveDraft
  };
}

import { useEffect, useState, useCallback } from 'react';

interface UseFormDraftOptions<T> {
  formId: string;
  defaultValues: T;
  enabled?: boolean;
}

interface DraftState {
  lastSaved: string | null;
  isDirty: boolean;
}

export function useFormDraft<T extends Record<string, any>>({
  formId,
  defaultValues,
  enabled = true,
}: UseFormDraftOptions<T>) {
  const [draftState, setDraftState] = useState<DraftState>({
    lastSaved: null,
    isDirty: false,
  });

  const draftKey = `draft_${formId}`;

  // Load draft from localStorage
  const loadDraft = useCallback((): T | null => {
    if (!enabled) return null;
    
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDraftState({
          lastSaved: parsed.timestamp,
          isDirty: false,
        });
        return parsed.data;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  }, [draftKey, enabled]);

  // Save draft to localStorage
  const saveDraft = useCallback((data: T) => {
    if (!enabled) return;
    
    try {
      const timestamp = new Date().toISOString();
      localStorage.setItem(draftKey, JSON.stringify({
        data,
        timestamp,
      }));
      setDraftState({
        lastSaved: timestamp,
        isDirty: true,
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [draftKey, enabled]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (!enabled) return;
    
    try {
      localStorage.removeItem(draftKey);
      setDraftState({
        lastSaved: null,
        isDirty: false,
      });
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [draftKey, enabled]);

  // Auto-save immediately on every change
  const autoSave = useCallback((data: T) => {
    saveDraft(data);
  }, [saveDraft]);

  // Warning on navigate away
  useEffect(() => {
    if (!enabled || !draftState.isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, draftState.isDirty]);

  return {
    loadDraft,
    saveDraft: autoSave,
    clearDraft,
    draftState,
    hasDraft: !!draftState.lastSaved,
  };
}

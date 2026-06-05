import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  whatsappNumber: string | null;
  globalSizeChartUrl: string | null;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    whatsappNumber: null,
    globalSizeChartUrl: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['whatsapp_number', 'global_size_chart']);

        if (error) throw error;

        const newSettings: SiteSettings = {
          whatsappNumber: null,
          globalSizeChartUrl: null,
        };

        if (data) {
          const waDoc = data.find(d => d.key === 'whatsapp_number');
          if (waDoc && waDoc.value && waDoc.value.number) {
            newSettings.whatsappNumber = waDoc.value.number;
          }

          const scDoc = data.find(d => d.key === 'global_size_chart');
          if (scDoc && scDoc.value && scDoc.value.url) {
            newSettings.globalSizeChartUrl = scDoc.value.url;
          }
        }

        setSettings(newSettings);
      } catch (err) {
        console.error('Error fetching site settings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { ...settings, loading };
}

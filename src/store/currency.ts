import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/integrations/supabase/client";

interface CurrencyState {
  code: string;
  symbol: string;
  rate: number; // 1 PKR = x Foreign Currency
  isAuto: boolean;
  setCurrency: (code: string, symbol: string, rate: number) => void;
  setAuto: (isAuto: boolean) => void;
  initialize: (countryCode?: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      code: 'PKR',
      symbol: 'Rs.',
      rate: 1, // Base is PKR
      isAuto: true,

      setCurrency: (code, symbol, rate) => set({ code, symbol, rate }),
      
      setAuto: (isAuto) => set({ isAuto }),

      initialize: async (countryCode) => {
        const { isAuto, code: currentCode } = get();
        
        // If not auto, respect their manual override
        if (!isAuto) return;

        try {
            // First check if auto-currency is globally enabled by Admin
            const { data: settingsData } = await supabase.from('site_settings').select('value').eq('key', 'auto_currency').single();
            if (settingsData && settingsData.value?.enabled === false) {
                // Admin disabled auto-currency completely
                set({ code: 'PKR', symbol: 'Rs.', rate: 1, isAuto: false });
                return;
            }

            // A map of country codes to currencies
            const countryToCurrency: Record<string, { code: string, symbol: string }> = {
                // US / Canada
                'US': { code: 'USD', symbol: '$' },
                'CA': { code: 'CAD', symbol: 'CA$' },
                
                // Europe
                'GB': { code: 'GBP', symbol: '£' },
                'FR': { code: 'EUR', symbol: '€' },
                'DE': { code: 'EUR', symbol: '€' },
                'IT': { code: 'EUR', symbol: '€' },
                'ES': { code: 'EUR', symbol: '€' },
                'NL': { code: 'EUR', symbol: '€' },
                
                // Middle East
                'AE': { code: 'AED', symbol: 'ﺩ.ﺇ' },
                'SA': { code: 'SAR', symbol: '﷼' },
                'QA': { code: 'QAR', symbol: '﷼' },
                'KW': { code: 'KWD', symbol: 'د.ك' },
                'OM': { code: 'OMR', symbol: 'ر.ع.' },
                'BH': { code: 'BHD', symbol: '.د.ب' },
                
                // Oceania
                'AU': { code: 'AUD', symbol: 'A$' },
                'NZ': { code: 'NZD', symbol: 'NZ$' }
            };

            const loc = countryCode || localStorage.getItem('visitor_country_code');
            
            // If visitor is in a mapped country, get exchange rates
            if (loc && countryToCurrency[loc]) {
                const targetCurrency = countryToCurrency[loc];
                
                // Fetch real-time exchange rates (Base PKR)
                // Use a free API like open.er-api.com
                const res = await fetch('https://open.er-api.com/v6/latest/PKR');
                const data = await res.json();

                if (data && data.rates && data.rates[targetCurrency.code]) {
                    set({ 
                        code: targetCurrency.code, 
                        symbol: targetCurrency.symbol, 
                        rate: data.rates[targetCurrency.code] 
                    });
                    return;
                }
            }

            // Fallback to PKR if API fails or country is unknown/Pakistan
            set({ code: 'PKR', symbol: 'Rs.', rate: 1 });

        } catch (error) {
            console.error("Currency initialization failed", error);
            // Fallback safely to PKR
            set({ code: 'PKR', symbol: 'Rs.', rate: 1 });
        }
      }
    }),
    {
      name: "currency-storage",
    }
  )
);

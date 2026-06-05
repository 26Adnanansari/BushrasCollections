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
            const { data: settingsData } = await supabase.from('site_settings').select('value').eq('key', 'auto_currency').maybeSingle();
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

            let detectedCountry = countryCode || localStorage.getItem('visitor_country_code');
            
            // If we don't have location yet (e.g. adblocker blocked ipwhois), fetch from GeoJS
            if (!detectedCountry) {
              try {
                  const geoRes = await fetch('https://get.geojs.io/v1/ip/country.json');
                  const geoData = await geoRes.json();
                  detectedCountry = geoData.country;
              } catch (e) {
                  console.warn("GeoJS fetch failed", e);
              }
            }

            // If visitor is in a mapped country, get exchange rates
            if (detectedCountry && countryToCurrency[detectedCountry]) {
                const targetCurrency = countryToCurrency[detectedCountry];
                
                try {
                    // Try Open-source Authentic Fawaz API (hosted on jsDelivr CDN - unblockable)
                    const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/pkr.json');
                    const data = await res.json();
                    const rateKey = targetCurrency.code.toLowerCase();

                    if (data && data.pkr && data.pkr[rateKey]) {
                        set({ 
                            code: targetCurrency.code, 
                            symbol: targetCurrency.symbol, 
                            rate: data.pkr[rateKey] 
                        });
                        return;
                    }
                } catch (e) {
                    console.warn("Fawaz API failed, trying fallback...", e);
                    // Fallback to open.er-api.com
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
            }

            // Fallback to PKR if APIs fail or country is unknown/Pakistan
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

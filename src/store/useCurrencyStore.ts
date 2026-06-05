import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CurrencyState {
  currency: string;
  symbol: string;
  exchangeRate: number;
  isLoading: boolean;
  setCurrency: (currency: string, symbol: string, rate: number) => void;
  fetchCurrencyRates: () => Promise<void>;
}

// Map Country Codes to Currency & Symbol
const countryToCurrencyMap: Record<string, { code: string, symbol: string }> = {
  US: { code: 'USD', symbol: '$' },
  GB: { code: 'GBP', symbol: '£' },
  AE: { code: 'AED', symbol: 'د.إ' },
  CA: { code: 'CAD', symbol: 'C$' },
  AU: { code: 'AUD', symbol: 'A$' },
  EU: { code: 'EUR', symbol: '€' },
  SA: { code: 'SAR', symbol: '﷼' },
  PK: { code: 'PKR', symbol: 'Rs' },
  IN: { code: 'INR', symbol: '₹' },
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'PKR',
      symbol: 'Rs',
      exchangeRate: 1, // Default PKR to PKR
      isLoading: false,

      setCurrency: (currency, symbol, rate) => set({ currency, symbol, exchangeRate: rate }),

      fetchCurrencyRates: async () => {
        // Only run if not already loading
        if (get().isLoading) return;
        set({ isLoading: true });

        try {
          // 1. Get Country Code from IP
          let targetCurrencyCode = 'PKR';
          let targetSymbol = 'Rs';
          
          try {
            const geoRes = await fetch('https://get.geojs.io/v1/ip/country.json');
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const countryCode = geoData.country;
              
              if (countryToCurrencyMap[countryCode]) {
                targetCurrencyCode = countryToCurrencyMap[countryCode].code;
                targetSymbol = countryToCurrencyMap[countryCode].symbol;
              }
            }
          } catch (geoErr) {
            console.warn('Could not fetch location data, defaulting to PKR/last saved.', geoErr);
            // If geo fails, keep the current currency (which might be user-selected or PKR)
            targetCurrencyCode = get().currency;
            targetSymbol = get().symbol;
          }

          // 2. Fetch Exchange Rates against PKR
          // We use the fallback jsdelivr API which returns rates for 1 PKR
          // e.g. { "date": "...", "pkr": { "usd": 0.0036, "gbp": 0.0028, ... } }
          const ratesRes = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/pkr.json');
          if (ratesRes.ok) {
            const ratesData = await ratesRes.json();
            const rates = ratesData.pkr;

            if (targetCurrencyCode === 'PKR') {
              set({ currency: 'PKR', symbol: 'Rs', exchangeRate: 1, isLoading: false });
            } else {
              const rateKey = targetCurrencyCode.toLowerCase();
              if (rates && rates[rateKey]) {
                set({ 
                  currency: targetCurrencyCode, 
                  symbol: targetSymbol, 
                  exchangeRate: rates[rateKey],
                  isLoading: false 
                });
              } else {
                set({ isLoading: false });
              }
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Error fetching currency rates:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'currency-storage',
      // Only persist selected currency, refetch rates on load to stay updated
      partialize: (state) => ({ currency: state.currency, symbol: state.symbol }),
    }
  )
);

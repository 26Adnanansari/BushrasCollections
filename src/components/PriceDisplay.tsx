import { useCurrencyStore } from "@/store/currency";

interface PriceDisplayProps {
  amount: number;
  className?: string;
  hideSymbol?: boolean; // Sometimes just the number is needed
}

export const PriceDisplay = ({ amount, className, hideSymbol = false }: PriceDisplayProps) => {
  const { code, symbol, rate } = useCurrencyStore();

  if (amount === 0 || amount === undefined || isNaN(amount)) {
    return <span className={className}>{!hideSymbol && symbol} 0</span>;
  }

  // Convert PKR -> Foreign Currency
  const convertedAmount = amount * rate;

  return (
    <span className={className}>
      {hideSymbol ? "" : `${code === 'PKR' ? 'PKR' : symbol} `}
      {convertedAmount.toLocaleString(undefined, { 
        minimumFractionDigits: code === 'PKR' ? 0 : 2, 
        maximumFractionDigits: code === 'PKR' ? 0 : 2 
      })}
    </span>
  );
};

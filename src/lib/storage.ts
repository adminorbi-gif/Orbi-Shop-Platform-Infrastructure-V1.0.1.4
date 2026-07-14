// Moved to DB
import { convertPrice, getActiveCurrency, formatCurrencyValue } from "./currency";

type CurrencyFormatOptions = {
  compact?: boolean;
  showDecimals?: boolean;
};

export const formatCurrency = (amount: number, options: CurrencyFormatOptions = {}) => {
  const targetCurrency = getActiveCurrency();
  const converted = convertPrice(amount, "TZS", targetCurrency);
  return formatCurrencyValue(converted, targetCurrency, {
    compact: options.compact,
    showDecimals: options.showDecimals,
  });
};


export const getCouponsLocal = () => {
  try {
    const data = localStorage.getItem('orbishop_coupons');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveCouponsLocal = (coupons: any[]) => {
  localStorage.setItem('orbishop_coupons', JSON.stringify(coupons));
};

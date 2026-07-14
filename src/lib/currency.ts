import { useState, useEffect } from "react";

export const SUPPORTED_CURRENCIES = [
  { code: "TZS", symbol: "TZS", name: "Tanzanian Shilling", flag: "🇹🇿" },
  { code: "USD", symbol: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "KES", symbol: "KES", name: "Kenyan Shilling", flag: "🇰🇪" },
  { code: "UGX", symbol: "UGX", name: "Ugandan Shilling", flag: "🇺🇬" },
  { code: "RWF", symbol: "RWF", name: "Rwandan Franc", flag: "🇷🇼" },
];

// FX rates relative to TZS as the base
export const FX_RATES: Record<string, number> = {
  TZS: 1.0,
  USD: 2600.0,  // 1 USD = 2600 TZS
  KES: 20.0,    // 1 KES = 20 TZS
  UGX: 0.7,     // 1 UGX = 0.7 TZS
  RWF: 2.0,     // 1 RWF = 2 TZS
};

export function detectUserCurrency(): string {
  const saved = localStorage.getItem("orbishop_user_currency");
  if (saved) return saved;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Nairobi")) return "KES";
    if (tz.includes("Kampala")) return "UGX";
    if (tz.includes("Kigali")) return "RWF";
    if (tz.includes("Dar_es_Salaam")) return "TZS";
  } catch (e) {
    // ignore
  }
  return "TZS";
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  TZ: "TZS",
  KE: "KES",
  UG: "UGX",
  RW: "RWF",
  US: "USD",
};

/**
 * Performs asynchronous background IP address detection to find precision currency.
 * Using a timeout ensures we never block rendering or wait indefinitely.
 */
export function initializeIPCurrencyDetection() {
  const saved = localStorage.getItem("orbishop_user_currency");
  if (saved) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  fetch("https://ipapi.co/json/", { signal: controller.signal })
    .then((res) => res.json())
    .then((data) => {
      clearTimeout(timeoutId);
      if (data && data.country_code) {
        const country = data.country_code.toUpperCase();
        const detected = COUNTRY_TO_CURRENCY[country];
        if (detected) {
          setActiveCurrency(detected);
        }
      }
    })
    .catch(() => {
      // Secondary fallback endpoint
      const altController = new AbortController();
      const altTimeoutId = setTimeout(() => altController.abort(), 2500);
      fetch("https://ip-api.com/json/", { signal: altController.signal })
        .then((res) => res.json())
        .then((data) => {
          clearTimeout(altTimeoutId);
          if (data && data.countryCode) {
            const country = data.countryCode.toUpperCase();
            const detected = COUNTRY_TO_CURRENCY[country];
            if (detected) {
              setActiveCurrency(detected);
            }
          }
        })
        .catch(() => {
          // Keep current timezone fallback
        });
    });
}

let currentCurrency = detectUserCurrency();
const listeners = new Set<(c: string) => void>();

export function getActiveCurrency(): string {
  return currentCurrency;
}

export function setActiveCurrency(currency: string) {
  if (currentCurrency === currency) return;
  currentCurrency = currency;
  localStorage.setItem("orbishop_user_currency", currency);
  listeners.forEach((l) => l(currency));
}

export function useUserCurrency(): string {
  const [currency, setCurrency] = useState(currentCurrency);
  useEffect(() => {
    const l = (c: string) => setCurrency(c);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return currency;
}

/**
 * Normalizes and converts a price from product currency to user target currency.
 */
export function convertPrice(amount: number, fromCurrency: string = "TZS", toCurrency: string = "TZS"): number {
  const cleanFrom = (fromCurrency || "TZS").toUpperCase();
  const cleanTo = (toCurrency || "TZS").toUpperCase();
  
  if (cleanFrom === cleanTo) return amount;
  
  const fromRate = FX_RATES[cleanFrom] || 1.0;
  const toRate = FX_RATES[cleanTo] || 1.0;
  
  const amountInTzs = amount * fromRate;
  return amountInTzs / toRate;
}

/**
 * Formats a currency amount elegantly for UI display.
 */
export function formatCurrencyValue(amount: number, currencyCode: string = "TZS", options: { compact?: boolean; showDecimals?: boolean } = {}): string {
  const val = Number.isFinite(amount) ? amount : 0;
  const { compact = false, showDecimals = false } = options;
  const code = (currencyCode || "TZS").toUpperCase();

  const formatNumber = (num: number, dec: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    }).format(num);

  // Decimals are appropriate for USD but not for TZS, KES, UGX, RWF
  const defaultDecimals = code === "USD" ? (showDecimals ? 2 : 2) : (showDecimals ? 2 : 0);

  if (compact) {
    const abs = Math.abs(val);
    let compactValue = "";
    if (abs >= 1_000_000_000) {
      compactValue = `${formatNumber(val / 1_000_000_000, 1)}B`;
    } else if (abs >= 1_000_000) {
      compactValue = `${formatNumber(val / 1_000_000, 1)}M`;
    } else if (abs >= 100_000) {
      compactValue = `${formatNumber(val / 1_000, 0)}K`;
    } else {
      compactValue = formatNumber(val, defaultDecimals);
    }
    return `${code} ${compactValue}`;
  }

  return `${code} ${formatNumber(val, defaultDecimals)}`;
}

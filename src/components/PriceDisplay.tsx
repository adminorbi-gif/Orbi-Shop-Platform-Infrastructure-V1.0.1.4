import React from "react";
import { useUserCurrency, convertPrice } from "../lib/currency";

interface PriceDisplayProps {
  amount: number;
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  colorClass?: string;
  showDecimals?: boolean;
  compact?: boolean;
  truncate?: boolean;
  hidePrefix?: boolean;
  fromCurrency?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  amount,
  className = "",
  size,
  colorClass = "text-slate-900",
  showDecimals = false,
  compact = false,
  truncate = true,
  hidePrefix = false,
  fromCurrency = "TZS",
}) => {
  const targetCurrency = useUserCurrency();
  const rawVal = typeof amount === "number" ? amount : Number(amount) || 0;
  
  // Normalize price using FX conversion
  const val = convertPrice(rawVal, fromCurrency, targetCurrency);
  const shouldCompact = compact === true;

  // Decide if we should show decimals based on currency (e.g., USD has decimals, TZS/KES/RWF typically don't in clean UI)
  const isUsd = targetCurrency === "USD";
  const finalShowDecimals = isUsd ? true : showDecimals;

  const displayValue = shouldCompact
    ? Math.abs(val) >= 1_000_000_000
      ? val / 1_000_000_000
      : Math.abs(val) >= 1_000_000
        ? val / 1_000_000
        : val
    : val;
    
  const compactSuffix = shouldCompact
    ? Math.abs(val) >= 1_000_000_000
      ? "B"
      : Math.abs(val) >= 1_000_000
        ? "M"
        : ""
    : "";

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: finalShowDecimals ? 2 : 0,
    maximumFractionDigits: shouldCompact ? 1 : finalShowDecimals ? 2 : 0,
  }).format(displayValue);

  const parts = formatted.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1] || "00";
  const mainDisplay = shouldCompact ? formatted : integerPart;

  // Dynamic font sizing override based on character length of integerPart (e.g. "1,200,000" is length 9)
  const length = integerPart.length;
  let fontScaleStyle: React.CSSProperties = {};
  if (length > 6) {
    const scale = Math.max(0.64, 1 - 0.045 * (length - 6));
    fontScaleStyle = { fontSize: `${scale}em` };
  }

  // Tailwind size configurations
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
    "4xl": "text-4xl",
  };

  const selectedSizeClass = size ? sizeClasses[size] : "";

  return (
    <span
      title={`${targetCurrency} ${new Intl.NumberFormat("en-US", { minimumFractionDigits: finalShowDecimals ? 2 : 0, maximumFractionDigits: finalShowDecimals ? 2 : 0 }).format(val)}`}
      className={`font-money font-[800] tabular-nums tracking-tight inline-flex min-w-0 max-w-full items-baseline flex-nowrap whitespace-nowrap select-text ${colorClass} ${selectedSizeClass} ${className} transition-all`}
      style={{ 
        fontVariantNumeric: "tabular-nums",
        userSelect: "text",
        WebkitUserSelect: "text",
      }}
    >
      <span
        className="inline-flex items-baseline flex-nowrap"
        style={fontScaleStyle}
      >
        {!hidePrefix && (
          <span className="text-[0.75em] font-black mr-0.5 opacity-70 select-none shrink-0">{targetCurrency}</span>
        )}
        <span className={truncate ? "min-w-0 overflow-hidden text-ellipsis" : "min-w-0 overflow-visible"}>
          {mainDisplay}{compactSuffix}
        </span>
        {!shouldCompact && finalShowDecimals && (
          <span className="text-[0.65em] font-extrabold opacity-60">.{decimalPart}</span>
        )}
      </span>
    </span>
  );
};


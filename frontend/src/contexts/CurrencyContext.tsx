import { createContext, useContext, useState } from "react";

export type CurrencyCode = "MZN" | "USD" | "EUR" | "BRL" | "GBP";

export const CURRENCIES: Record<
  CurrencyCode,
  { label: string; symbol: string; locale: string }
> = {
  MZN: { label: "Metical (MZN)", symbol: "MT", locale: "pt-MZ" },
  USD: { label: "Dólar (USD)", symbol: "$", locale: "en-US" },
  EUR: { label: "Euro (EUR)", symbol: "€", locale: "pt-PT" },
  BRL: { label: "Real (BRL)", symbol: "R$", locale: "pt-BR" },
  GBP: { label: "Libra (GBP)", symbol: "£", locale: "en-GB" },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatCurrency: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined,
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return (localStorage.getItem("app-currency") as CurrencyCode) || "MZN";
  });

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem("app-currency", c);
  };

  const formatCurrency = (value: number): string => {
    const { locale } = CURRENCIES[currency];
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(value);
    } catch {
      const { symbol } = CURRENCIES[currency];
      return `${symbol} ${value.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
};

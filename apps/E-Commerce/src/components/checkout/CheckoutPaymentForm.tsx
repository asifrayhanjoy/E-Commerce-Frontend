"use client";

import { useState, type FormEvent } from "react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  Smartphone,
} from "lucide-react";

export type CheckoutGateway =
  | "STRIPE_CARD"
  | "BANK_TRANSFER"
  | "BKASH"
  | "NAGAD";

type CheckoutPaymentFormProps = {
  method: CheckoutGateway;
  merchantNumber?: string;
  bankDetails?: unknown;
  isSubmitting: boolean;
  onSubmit: (details: Record<string, unknown>) => void;
};

const getCardBrand = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (/^4/.test(digits)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "MASTERCARD";
  if (/^3[47]/.test(digits)) return "AMEX";
  if (/^(6011|65)/.test(digits)) return "DISCOVER";
  return "OTHER";
};

const isValidCardNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
};

const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const getBankDetailRows = (details: unknown) => {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return [];
  }

  const hiddenKey = /(secret|password|token|private|pin|credential)/i;
  return Object.entries(details as Record<string, unknown>)
    .filter(
      ([key, value]) =>
        !hiddenKey.test(key) &&
        ["string", "number"].includes(typeof value) &&
        String(value).trim().length > 0
    )
    .map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim(),
      value: String(value),
    }));
};

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function CheckoutPaymentForm({
  method,
  merchantNumber,
  bankDetails,
  isSubmitting,
  onSubmit,
}: CheckoutPaymentFormProps) {
  const [cardholder, setCardholder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountLast4, setAccountLast4] = useState("");
  const [reference, setReference] = useState("");
  const [walletNumber, setWalletNumber] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [walletStep, setWalletStep] = useState<"details" | "verification">(
    "details"
  );
  const [validationMessage, setValidationMessage] = useState("");

  const brand = getCardBrand(cardNumber);
  const bankRows = getBankDetailRows(bankDetails);

  const submitCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationMessage("");
    const digits = cardNumber.replace(/\D/g, "");
    const [monthText, yearText] = expiry.split("/");
    const month = Number(monthText);
    const year = Number(yearText);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const expired =
      Number.isFinite(year) &&
      (year < currentYear || (year === currentYear && month < now.getMonth() + 1));

    if (cardholder.trim().length < 2) {
      setValidationMessage("Enter the cardholder name.");
      return;
    }
    if (!isValidCardNumber(digits)) {
      setValidationMessage("Enter a valid card number.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry) || month < 1 || month > 12 || expired) {
      setValidationMessage("Enter a valid, unexpired MM/YY date.");
      return;
    }
    if (!/^\d{3,4}$/.test(cvc)) {
      setValidationMessage("Enter the card security code.");
      return;
    }

    onSubmit({
      cardLast4: digits.slice(-4),
      cardBrand: brand,
    });
  };

  const submitBankTransfer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationMessage("");
    if (
      bankName.trim().length < 2 ||
      accountLast4.length !== 4 ||
      !/^\d{4}$/.test(accountLast4) ||
      !/^[A-Za-z0-9][A-Za-z0-9-]{3,63}$/.test(reference.trim())
    ) {
      setValidationMessage("Enter the bank name, account last four digits, and a valid reference.");
      return;
    }
    onSubmit({ bankName: bankName.trim(), accountLast4, reference: reference.trim() });
  };

  const submitWallet = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationMessage("");
    if (walletStep === "details") {
      if (!/^01[3-9]\d{8}$/.test(walletNumber)) {
        setValidationMessage("Enter a valid 11-digit Bangladesh mobile number.");
        return;
      }
      setWalletStep("verification");
      return;
    }
    if (!/^\d{4}$/.test(demoCode)) {
      setValidationMessage("Enter the four-digit demo confirmation code.");
      return;
    }
    onSubmit({ walletNumber });
  };

  if (method === "STRIPE_CARD") {
    return (
      <form onSubmit={submitCard} className="auth-form space-y-5">
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <CreditCard className="mt-0.5 size-5 shrink-0 text-blue-700" />
          <div>
            <p className="text-sm font-bold text-slate-900">Card checkout demo</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Never enter real card data. Card number, expiry, and CVC stay in this browser; Demo Mode blocks the final submission without storing or charging a card.
            </p>
          </div>
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          Cardholder name
          <input
            autoComplete="cc-name"
            className={inputClassName}
            maxLength={100}
            onChange={(event) => setCardholder(event.target.value)}
            placeholder="Name on card"
            value={cardholder}
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Card number
          <span className="relative block">
            <input
              autoComplete="cc-number"
              className={`${inputClassName} pr-24`}
              inputMode="numeric"
              maxLength={23}
              onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold tracking-widest text-slate-400">
              {brand}
            </span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Expiry
            <input
              autoComplete="cc-exp"
              className={inputClassName}
              inputMode="numeric"
              maxLength={5}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
              }}
              placeholder="MM/YY"
              value={expiry}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            CVC
            <input
              autoComplete="cc-csc"
              className={inputClassName}
              inputMode="numeric"
              maxLength={4}
              onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="•••"
              value={cvc}
            />
          </label>
        </div>

        {validationMessage && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {validationMessage}
          </p>
        )}

        <button
          className="cta-shine flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b0f19] px-5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          <LockKeyhole className="size-4" />
          {isSubmitting ? "Checking securely..." : "Pay Now"}
        </button>
      </form>
    );
  }

  if (method === "BANK_TRANSFER") {
    return (
      <form onSubmit={submitBankTransfer} className="auth-form space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-950">
            <Banknote className="size-5" />
            Company bank details
          </div>
          {bankRows.length > 0 ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {bankRows.map((row) => (
                <div key={row.label} className="rounded-xl bg-white/80 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {row.label}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Bank transfer details have not been configured. Contact support before transferring.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Your bank name
            <input
              className={inputClassName}
              maxLength={80}
              onChange={(event) => setBankName(event.target.value)}
              placeholder="Bank name"
              value={bankName}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Account last four digits
            <input
              className={inputClassName}
              inputMode="numeric"
              maxLength={4}
              onChange={(event) => setAccountLast4(event.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              value={accountLast4}
            />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">
          Transfer reference
          <input
            className={inputClassName}
            maxLength={64}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Transaction reference"
            value={reference}
          />
        </label>
        <p className="text-xs leading-5 text-slate-500">
          Do not enter a full account or card number. Only the last four digits are submitted.
        </p>

        {validationMessage && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {validationMessage}
          </p>
        )}

        <button
          className="cta-shine flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b0f19] px-5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          <LockKeyhole className="size-4" />
          {isSubmitting ? "Checking securely..." : "Submit Bank Transfer"}
        </button>
      </form>
    );
  }

  const walletColor =
    method === "BKASH"
      ? "border-pink-400/30 bg-[#3a152e]"
      : "border-orange-400/30 bg-[#3a2411]";
  const walletBrand = method === "BKASH" ? "bKash" : "Nagad";

  return (
    <form onSubmit={submitWallet} className="auth-form space-y-5">
      <div className={`rounded-2xl border p-5 ${walletColor}`}>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white text-slate-800 shadow-sm">
            <Smartphone className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-950">{walletBrand} mobile wallet</p>
            <p className="mt-1 text-xs font-medium text-slate-600">
              Merchant number: {merchantNumber || "Not configured"}
            </p>
          </div>
        </div>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        Bangladesh mobile number
        <input
          autoComplete="tel"
          className={inputClassName}
          inputMode="numeric"
          maxLength={11}
          onChange={(event) => setWalletNumber(event.target.value.replace(/\D/g, "").slice(0, 11))}
          placeholder="01XXXXXXXXX"
          value={walletNumber}
        />
      </label>

      {walletStep === "details" ? (
        <button
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-slate-50"
          onClick={() => {
            if (/^01[3-9]\d{8}$/.test(walletNumber)) {
              setValidationMessage("");
              setWalletStep("verification");
            } else {
              setValidationMessage("Enter a valid 11-digit Bangladesh mobile number.");
            }
          }}
          type="button"
        >
          Continue to demo verification
        </button>
      ) : (
        <label className="block text-sm font-semibold text-slate-700">
          Demo confirmation code
          <input
            className={inputClassName}
            inputMode="numeric"
            maxLength={4}
            onChange={(event) => setDemoCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="4 digits"
            value={demoCode}
          />
          <span className="mt-2 block text-xs font-medium leading-5 text-slate-500">
            Simulation only. Never enter a real wallet PIN or OTP; this code stays in your browser.
          </span>
        </label>
      )}

      {validationMessage && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {validationMessage}
        </p>
      )}

      <button
        className="cta-shine flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0b0f19] px-5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        disabled={isSubmitting || walletStep !== "verification"}
        type="submit"
      >
        <LockKeyhole className="size-4" />
        {isSubmitting ? "Checking securely..." : `Confirm ${walletBrand} Payment`}
      </button>

      {walletStep === "verification" && (
        <button
          className="w-full py-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          onClick={() => {
            setWalletStep("details");
            setDemoCode("");
            setValidationMessage("");
          }}
          type="button"
        >
          Edit mobile number
        </button>
      )}
      <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="size-4" />
        No wallet PIN or OTP is sent to the server.
      </div>
    </form>
  );
}

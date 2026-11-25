export const USD_INR_RATE = 83.25;

export const PAIRS = [
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
  "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "EURCHF", "XAUUSD", "XAGUSD",
];

export const SESSIONS = [
  { value: "sydney", label: "Sydney" },
  { value: "tokyo", label: "Tokyo" },
  { value: "london", label: "London" },
  { value: "newyork", label: "New York" },
  { value: "overlap", label: "London/NY Overlap" },
];

export const TAGS = [
  "breakout", "trend", "reversal", "range", "news",
  "scalp", "swing", "s/r", "supply/demand", "fibonacci",
];

export const EMOTIONS = [
  "calm", "confident", "disciplined", "fomo", "greedy", "fearful", "impatient", "revenge",
];

export function sessionLabel(v) {
  return SESSIONS.find((s) => s.value === v)?.label || v;
}

export function formatMoney(usd, currency, { signed = false, compact = false } = {}) {
  if (usd == null || Number.isNaN(Number(usd))) return "—";
  const val = currency === "INR" ? Number(usd) * USD_INR_RATE : Number(usd);
  const sym = currency === "INR" ? "₹" : "$";
  const dec = currency === "INR" ? 0 : 2;
  const abs = Math.abs(val);
  let num;
  if (compact && abs >= 1000000) num = (abs / 1e6).toFixed(1) + "M";
  else if (compact && abs >= 1000) num = (abs / 1e3).toFixed(1) + "k";
  else num = abs.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const sign = signed ? (val < 0 ? "−" : "+") : val < 0 ? "−" : "";
  return `${sign}${sym}${num}`;
}

export function pnlClass(usd) {
  if (usd == null) return "text-muted-foreground";
  return usd > 0 ? "text-profit" : usd < 0 ? "text-loss" : "text-muted-foreground";
}

export function formatPips(p) {
  if (p == null) return "—";
  return `${p > 0 ? "+" : ""}${p.toFixed(1)}`;
}

export function formatR(r) {
  if (r == null) return "—";
  return `${r > 0 ? "+" : ""}${r.toFixed(2)}R`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

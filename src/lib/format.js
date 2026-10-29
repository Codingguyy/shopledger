export const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n ?? 0);
export const num = (n) => new Intl.NumberFormat("en-IN").format(n ?? 0);
export const fmtDate = (d) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(d));
export const fmtTime = (d) => new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).format(new Date(d));
export const TYPE_LABEL = { purchase: "Purchase in", sale: "Sale out", return: "Return", adjustment: "Adjustment" };

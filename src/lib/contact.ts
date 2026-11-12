/** Public Kheja_Link inquiries line confirmed by the owner. */
export const RAPH_CONTACT = {
  name: "Raph",
  telephone: "+254710655709",
  displayTelephone: "+254 710 655 709",
  whatsapp: "254710655709",
} as const;

export function toTelephoneHref(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) return `tel:+254${digits.slice(1)}`;
  if (/^254[17]\d{8}$/.test(digits)) return `tel:+${digits}`;
  if (/^[17]\d{8}$/.test(digits)) return `tel:+254${digits}`;
  if (trimmed.startsWith("+") && /^\+\d{8,15}$/.test(`+${digits}`)) return `tel:+${digits}`;
  return null;
}

export function toWhatsAppHref(phone: string, message: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `254${digits.slice(1)}`;
  if (/^[17]\d{8}$/.test(digits)) digits = `254${digits}`;
  if (!/^254[17]\d{8}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

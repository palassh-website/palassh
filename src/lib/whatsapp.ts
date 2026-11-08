export const OFFICIAL_WHATSAPP_NUMBER = "917710942605";
export const OFFICIAL_WHATSAPP_DISPLAY = "+91 77109 42605";

export const DEFAULT_WHATSAPP_MESSAGE = `Welcome to PALASSH! 
Thank you for contacting us.

How can we help you today?

1 New Enquiry
2 Services / Pricing
3 Talk to Team

Please reply with your query and our team will get back to you shortly.`;

/**
 * Builds a standardized wa.me URL with properly encoded message and phone number.
 */
export function getWhatsAppUrl(
  message: string = DEFAULT_WHATSAPP_MESSAGE,
  phone: string = OFFICIAL_WHATSAPP_NUMBER
): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}


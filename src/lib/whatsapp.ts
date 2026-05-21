export const WHATSAPP_NUMBER = '212679797906'; // Format: country code without + and then number

export const getWhatsAppUrl = (message: string) => {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

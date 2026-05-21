import { getWhatsAppUrl } from '../lib/whatsapp';
import { MessageCircle } from 'lucide-react';

export function FloatingWhatsApp() {
  return (
    <a
      href={getWhatsAppUrl('السلام عليكم، أود الاستفسار عن خدماتكم.')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-110 transition-all duration-300 flex items-center justify-center animate-bounce-slow"
      title="تواصل معنا عبر واتساب"
    >
      <MessageCircle className="w-8 h-8" />
      <span className="absolute -top-1 -left-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
      </span>
    </a>
  );
}

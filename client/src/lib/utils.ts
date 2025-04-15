import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatWhatsAppNumber(number: string): string {
  if (number.length === 11) {
    return `(${number.slice(0, 2)}) ${number.slice(2, 7)}-${number.slice(7)}`;
  } else if (number.length === 10) {
    return `(${number.slice(0, 2)}) ${number.slice(2, 6)}-${number.slice(6)}`;
  }
  return number;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function createWhatsAppLink(phoneNumber: string, message?: string): string {
  const formattedNumber = phoneNumber.replace(/\D/g, '');
  const baseUrl = `https://wa.me/55${formattedNumber}`;
  
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  
  return baseUrl;
}

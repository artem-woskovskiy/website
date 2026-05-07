export const locales = ['ru', 'en', 'pl'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';

export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
  pl: 'Polski',
};

export const localeFlags: Record<Locale, string> = {
  ru: '🇷🇺',
  en: '🇬🇧',
  pl: '🇵🇱',
};

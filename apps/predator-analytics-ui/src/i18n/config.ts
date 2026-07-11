import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uk from './locales/uk.json';
import adminUk from './locales/admin-uk.json';
import adminEn from './locales/admin-en.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uk: {
        translation: uk.translation,
        hud: (uk as any).hud || {},
        admin: adminUk
      },
      en: {
        translation: {},
        hud: (en as any).hud || {},
        admin: adminEn
      }
    },
    lng: 'uk',
    fallbackLng: 'uk',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

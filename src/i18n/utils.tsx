import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export const useAppTranslation = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUserSettings } = useAuth();

  // Change language and update user settings
  const changeLanguage = async (lang: 'en' | 'id') => {
    try {
      // Change i18n language immediately
      await i18n.changeLanguage(lang);

      // Update user settings if user is logged in
      if (user) {
        await updateUserSettings({
          ...user.settings,
          language: lang
        });
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Auto-sync with user preferences
  React.useEffect(() => {
    if (user?.settings?.language) {
      i18n.changeLanguage(user.settings.language);
    }
  }, [user?.settings?.language]);

  return { t, changeLanguage, currentLanguage: i18n.language as 'en' | 'id' };
};
import cs from '../../../translations/cs.json';
import zhCN from '../../../translations/zh-CN.json';

import MessageFormat, { MessageFunction } from '@messageformat/core';
import { getStringSettingsValue } from './settings/settingsTools';
import { setMomentLocale } from './locales/supportedLocales';

const translations = {
  en: {},
  cs,
  'zh-CN': zhCN,
};
const supportedLanguages = Object.keys(translations);



const compiledMessages: Partial<Record<string, Record<string, MessageFunction<'string'>>>> = {};

const defaultLanguage = 'en';

export function getSelectedLanguage(): string {
  const borwserLanguage = getBrowserLanguage();
  const selectedLanguage = getStringSettingsValue('localization.language', borwserLanguage);

  if (!supportedLanguages.includes(selectedLanguage)) {
    // Set moment.js localization for default language / 为默认语言设置moment.js本地化
    setMomentLocale(defaultLanguage);
    return defaultLanguage;
  }

  // Set moment.js localization / 设置moment.js的本地化
  setMomentLocale(selectedLanguage);

  return selectedLanguage;
}

export function getBrowserLanguage(): string {
  return 'en';
  // if (typeof window !== 'undefined') {
  //   return (
  //     (navigator.languages && navigator.languages[0]).slice(0, 2) || navigator.language.slice(0, 2) || defaultLanguage
  //   );
  // }
  // return defaultLanguage;
}

type TranslateOptions = {
  defaultMessage: string;
  values?: Record<string, unknown>;
};

function getTranslation(key: string, defaultMessage: string, language: string) {
  const selectedTranslations = translations[language] ?? {};
  const translation = selectedTranslations[key];

  if (!translation) {
    // console.warn(`Translation not found for key: ${key}. For language: ${language}`);
    return defaultMessage;
  }

  return translation;
}

export function _t(key: string, options: TranslateOptions): string {
  const { defaultMessage, values } = options;

  const selectedLanguage = getSelectedLanguage();

  if (!compiledMessages[selectedLanguage]) {
    compiledMessages[selectedLanguage] = {};
  }

  if (!compiledMessages[selectedLanguage][key]) {
    const translation = getTranslation(key, defaultMessage, selectedLanguage);
    const complied = new MessageFormat(selectedLanguage).compile(translation);
    compiledMessages[selectedLanguage][key] = complied;
  }

  const compliledTranslation = compiledMessages[selectedLanguage][key];

  return compliledTranslation(values ?? {});
}

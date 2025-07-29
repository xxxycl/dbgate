/**
 * Supported Language Configuration / 支持的语言配置
 *
 * This file centrally manages all supported languages and their corresponding moment.js localizations
 * 这个文件集中管理所有支持的语言和对应的moment.js本地化
 *
 * When adding new languages, only this file needs to be modified
 * 添加新语言时只需要修改这个文件
 */

import moment from 'moment';

// Import all supported moment.js locale packages / 导入所有支持的moment.js本地化包
// Note: These must be static imports, cannot be dynamic / 注意：这些必须是静态导入，不能动态导入
import 'moment/locale/zh-cn';  // Simplified Chinese / 简体中文
// import 'moment/locale/cs';     // Czech / 捷克语
// import 'moment/locale/ja';     // Japanese / 日语
// import 'moment/locale/ko';     // Korean / 韩语
// import 'moment/locale/fr';     // French / 法语
// import 'moment/locale/de';     // German / 德语
// import 'moment/locale/es';     // Spanish / 西班牙语
// import 'moment/locale/pt';     // Portuguese / 葡萄牙语
// import 'moment/locale/ru';     // Russian / 俄语

/**
 * Supported language configuration / 支持的语言配置
 * key: Language code in translation files / 翻译文件中的语言代码
 * value: moment.js locale code / moment.js 本地化代码
 */
export const SUPPORTED_LOCALES: Record<string, string> = {
  'en': 'en',           // English / 英语
  'zh-CN': 'zh-cn',     // Simplified Chinese / 简体中文
  // 'cs': 'cs',           // Czech / 捷克语
  // 'ja': 'ja',           // Japanese / 日语
  // 'ko': 'ko',           // Korean / 韩语
  // 'fr': 'fr',           // French / 法语
  // 'de': 'de',           // German / 德语
  // 'es': 'es',           // Spanish / 西班牙语
  // 'pt': 'pt',           // Portuguese / 葡萄牙语
  // 'ru': 'ru',           // Russian / 俄语
};

/**
 * Get moment.js locale code from language code / 根据语言代码获取moment.js本地化代码
 */
export function getMomentLocale(languageCode: string): string {
  // 1. Direct match / 直接匹配
  if (SUPPORTED_LOCALES[languageCode]) {
    return SUPPORTED_LOCALES[languageCode];
  }

  // 2. Convert to lowercase / 转换为小写
  const lowerCode = languageCode.toLowerCase();
  if (SUPPORTED_LOCALES[lowerCode]) {
    return SUPPORTED_LOCALES[lowerCode];
  }

  // 3. Extract main language code / 提取主语言代码
  const mainLanguage = languageCode.split('-')[0].toLowerCase();
  const matchedKey = Object.keys(SUPPORTED_LOCALES).find(key =>
    key.toLowerCase().startsWith(mainLanguage)
  );

  if (matchedKey) {
    return SUPPORTED_LOCALES[matchedKey];
  }

  // 4. Default to English / 默认英语
  return 'en';
}

/**
 * Set moment.js localization / 设置moment.js本地化
 */
export function setMomentLocale(languageCode: string): void {
  const momentLocale = getMomentLocale(languageCode);
  moment.locale(momentLocale);

  // Debug info in development environment / 开发环境调试信息
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Locales] Language: ${languageCode} -> Moment locale: ${momentLocale}`);
    console.log(`[Locales] Available moment locales:`, moment.locales());
  }
}

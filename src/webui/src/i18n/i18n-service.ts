import zhCN from "./zh-CN.js";
import enUS from "./en-US.js";
import urPK from "./ur-PK.js";
import ruRU from "./ru-RU.js";

/** Тип словаря языка — сопоставляет ключи перевода со строками */
export type LanguageDictionary = Record<string, string>;

/** Поддерживаемые коды языков */
export type SupportedLanguage = "zh-CN" | "en-US" | "ur-PK" | "ru-RU";

/** Все доступные языковые ресурсы */
export type LanguageResources = Record<SupportedLanguage, LanguageDictionary>;

/** Параметры перевода для интерполяции строк */
export type TranslationParams = Record<string, string | number>;

/**
 * I18nService - Сервис интернационализации
 * Управляет переключением языков, поиском переводов и их сохранением.
 */
export class I18nService {
  static STORAGE_KEY: string = "language";
  static DEFAULT_LANG: SupportedLanguage = "ru-RU"; // Русский по умолчанию
  static currentLang: SupportedLanguage = "ru-RU";

  // Ресурсы переводов
  static resources: LanguageResources = {
    "zh-CN": zhCN as LanguageDictionary,
    "en-US": enUS as LanguageDictionary,
    "ur-PK": urPK as LanguageDictionary,
    "ru-RU": ruRU as LanguageDictionary,
  };

  // Инициализация
  static init(): void {
    const savedLang = localStorage.getItem(this.STORAGE_KEY);
    if (savedLang && this.resources[savedLang as SupportedLanguage]) {
      this.currentLang = savedLang as SupportedLanguage;
    } else {
      // Автоопределение
      const navLang = navigator.language;
      if (navLang.startsWith("zh")) {
        this.currentLang = "zh-CN";
      } else if (navLang.startsWith("en")) {
        this.currentLang = "en-US";
      } else if (navLang.startsWith("ur")) {
        this.currentLang = "ur-PK";
      } else {
        // Если язык не распознан или это русский/СНГ — используем дефолт
        this.currentLang = this.DEFAULT_LANG;
      }
    }
    this.applyLanguage();
  }

  /**
   * Установить текущий язык и сохранить в хранилище
   * @param lang Код поддерживаемого языка
   */
  static setLanguage(lang: SupportedLanguage): void {
    if (this.resources[lang]) {
      this.currentLang = lang;
      localStorage.setItem(this.STORAGE_KEY, lang);
      this.applyLanguage();
    }
  }

  /**
   * Перевести ключ с опциональными параметрами
   * @param key Ключ перевода (например, 'app.name')
   * @param params Пары ключ-значение для подстановки
   * @returns Переведенная строка или сам ключ, если перевод не найден
   */
  static t(key: string, params: TranslationParams = {}): string {
    const dict =
      this.resources[this.currentLang] || this.resources[this.DEFAULT_LANG];
    let text = dict[key] || key;

    // Замена параметров: {name} -> значение
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
    return text;
  }

  // Применить перевод ко всем элементам [data-i18n]
  static applyLanguage(): void {
    // Направление текста
    if (this.currentLang === "ur-PK") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }

    // Обновление атрибута lang в HTML
    document.documentElement.lang = this.currentLang;

    const selectors = [
      "[data-i18n]",
      "[data-i18n-placeholder]",
      "[data-i18n-label]",
      "[data-i18n-headline]",
      "[data-i18n-helper]",
      "[data-i18n-description]",
    ];
    const elements = document.querySelectorAll(selectors.join(","));

    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) {
        el.textContent = this.t(key);
      }

      const attrs = [
        "placeholder",
        "label",
        "headline",
        "helper",
        "description",
      ];
      attrs.forEach((attr) => {
        const k = el.getAttribute(`data-i18n-${attr}`);
        if (k) {
          el.setAttribute(attr, this.t(k));
        }
      });
    });

    // Генерация события для реакции компонентов
    window.dispatchEvent(
      new CustomEvent("language-changed", { detail: this.currentLang }),
    );
  }
}

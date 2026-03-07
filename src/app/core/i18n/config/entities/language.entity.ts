/**
 * Entidad que representa un idioma disponible en la aplicación
 */
export interface LanguageEntity {
    /** Código ISO del idioma (ej: 'es', 'en') */
    code: string;
    /** Nombre del idioma en su idioma nativo */
    name: string;
    /** Emoji de la bandera del país */
    flag: string;
    /** Indica si está activo/disponible */
    active?: boolean;
}

/**
 * Entidad para configuración de traducción
 */
export interface TranslationConfigEntity {
    /** Idioma por defecto */
    defaultLanguage: string;
    /** Idiomas disponibles */
    availableLanguages: LanguageEntity[];
    /** Ruta base de los archivos de traducción */
    assetsPath: string;
    /** Extensión de los archivos */
    fileExtension: string;
    /** Clave para almacenamiento local */
    storageKey: string;
}

/**
 * Entidad para el estado de carga de traducciones
 */
export interface TranslationLoadStateEntity {
    /** Idioma que se está cargando */
    language: string;
    /** Estado de la carga */
    loading: boolean;
    /** Error si ocurrió */
    error?: string;
    /** Timestamp de la última carga */
    lastLoaded?: Date;
}

/**
 * Entidad para parámetros de traducción
 */
export interface TranslationParamsEntity {
    [key: string]: string | number | boolean | Date;
}

/**
 * Entidad genérica para configuraciones de i18n
 * Permite definir configuraciones tipadas para cualquier página o componente
 */

/**
 * Tipo genérico que convierte las claves de un objeto de configuración i18n
 * en un objeto con valores string (traducciones resueltas)
 *
 * @template T - Tipo del objeto de configuración i18n
 *
 * @example
 * ```typescript
 * // Configuración
 * const config = {
 *   i18n: {
 *     title: 'page.title',
 *     subtitle: 'page.subtitle'
 *   }
 * };
 *
 * // Tipo resuelto automáticamente
 * type ResolvedTexts = ResolvedI18nTexts<typeof config>;
 * // Resultado: { title: string; subtitle: string; }
 * ```
 */
export type ResolvedI18nTexts<T extends I18nConfigEntity> = {
    readonly [K in keyof T['i18n']]: string;
};

/**
 * Interfaz base para configuraciones de i18n
 * Define la estructura mínima que debe tener cualquier configuración
 */
export interface I18nConfigEntity {
    /** Mapeo de claves locales a claves de traducción globales */
    i18n: Record<string, string>;
    /** Configuración opcional de página */
    page?: {
        title?: string;
        description?: string;
        [key: string]: unknown;
    };
    /** Configuración opcional de API */
    api?: {
        endpoints?: Record<string, string>;
        [key: string]: unknown;
    };
    /** Configuraciones adicionales */
    [key: string]: unknown;
}

/**
 * Tipo helper para extraer solo las claves de i18n de una configuración
 */
export type I18nKeys<T extends I18nConfigEntity> = keyof T['i18n'];

/**
 * Tipo helper para extraer los valores de traducción de una configuración
 */
export type I18nValues<T extends I18nConfigEntity> = T['i18n'][keyof T['i18n']];

/**
 * Interfaz para el estado de carga de traducciones
 */
export interface I18nLoadingStateEntity {
    /** Indica si las traducciones están cargando */
    loading: boolean;
    /** Error si ocurrió durante la carga */
    error?: string;
    /** Timestamp de la última carga exitosa */
    lastLoaded?: Date;
}

/**
 * Tipo para parámetros de traducción dinámicos
 */
export type I18nParamsEntity = Record<string, string | number | boolean | Date>;

/**
 * Interfaz para configuración de namespace de traducciones
 */
export interface I18nNamespaceConfigEntity {
    /** Namespace principal */
    namespace: string;
    /** Prefijo para las claves */
    prefix?: string;
    /** Configuración de fallback */
    fallback?: string;
}

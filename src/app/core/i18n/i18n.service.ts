import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { I18N_CONSTANTS } from './config';

/**
 * Interfaz que define la estructura de una opción de idioma
 * @deprecated Use LanguageEntity from config instead
 */
export interface LanguageOption {
    /** Código del idioma (ej: 'es', 'en') */
    readonly code: string;
    /** Nombre del idioma (ej: 'Español', 'English') */
    readonly name: string;
    /** Emoji de la bandera del país */
    readonly flag: string;
}

/**
 * Interfaz genérica para configuraciones de i18n
 * @deprecated Use I18nConfigEntity from @core/entities instead
 */
export interface I18nConfig {
    readonly i18n: Record<string, string>;
}

/**
 * Tipo genérico para textos resueltos basado en una configuración
 * @deprecated Use ResolvedI18nTexts from @core/entities instead
 */
export type ResolvedTexts<T extends I18nConfig> = {
    [K in keyof T['i18n']]: string;
};

/**
 * Servicio de internacionalización (i18n) que gestiona los idiomas y traducciones
 * de la aplicación siguiendo el principio de responsabilidad única de SOLID.
 *
 * @example
 * ```typescript
 * constructor(private i18nService: I18nService) {}
 *
 * // Cambiar idioma
 * this.i18nService.setLanguage('en');
 *
 * // Obtener traducción
 * const text = this.i18nService.translateInstant('common.loading');
 * ```
 */
@Injectable({
    providedIn: 'root',
})
export class I18nService {
    /** Subject privado para manejar el estado del idioma actual */
    private readonly currentLanguageSubject = new BehaviorSubject<string>(
        I18N_CONSTANTS.DEFAULT_LANGUAGE
    );

    /** Observable público para suscribirse a cambios de idioma */
    public readonly currentLanguage$ = this.currentLanguageSubject.asObservable();

    /** Lista de idiomas disponibles en la aplicación */
    public readonly availableLanguages: readonly LanguageOption[] =
        I18N_CONSTANTS.AVAILABLE_LANGUAGES;

    /**
     * Constructor del servicio de i18n
     * @param translateService - Servicio de ngx-translate para manejar las traducciones
     */
    constructor(private readonly translateService: TranslateService) {
        this.initializeLanguage();
    }

    /**
     * Inicializa el idioma de la aplicación basándose en:
     * 1. Idioma guardado en localStorage
     * 2. Idioma del navegador
     * 3. Idioma por defecto (español)
     *
     * @private
     */
    private initializeLanguage(): void {
        const savedLanguage = this.getSavedLanguage();
        const browserLanguage = this.getBrowserLanguage();

        const defaultLanguage =
            savedLanguage ||
            (this.isValidLanguage(browserLanguage) ? browserLanguage : I18N_CONSTANTS.DEFAULT_LANGUAGE);

        this.setLanguage(defaultLanguage);
    }

    /**
     * Cambia el idioma activo de la aplicación
     *
     * @param languageCode - Código del idioma a establecer (ej: 'es', 'en')
     *
     * @example
     * ```typescript
     * this.i18nService.setLanguage('en'); // Cambia a inglés
     * ```
     */
    public setLanguage(languageCode: string): void {
        if (!this.isValidLanguage(languageCode)) {
            return;
        }

        this.translateService.use(languageCode).subscribe({
            next: () => {
                this.updateCurrentLanguage(languageCode);
                this.saveLanguagePreference(languageCode);
            },
            error: () => { },
        });
    }

    /**
     * Obtiene el código del idioma actual
     *
     * @returns El código del idioma actualmente seleccionado
     *
     * @example
     * ```typescript
     * const currentLang = this.i18nService.getCurrentLanguage(); // 'es'
     * ```
     */
    public getCurrentLanguage(): string {
        return this.currentLanguageSubject.value;
    }

    /**
     * Obtiene una traducción como Observable (reactiva)
     *
     * @param key - Clave de traducción (ej: 'common.loading')
     * @param params - Parámetros opcionales para interpolación
     * @returns Observable con el texto traducido
     *
     * @example
     * ```typescript
     * this.i18nService.translate('common.loading').subscribe(text => {
     *   console.log(text); // 'Cargando...'
     * });
     * ```
     */
    public translate(key: string, params?: Record<string, unknown>): Observable<string> {
        return this.translateService.get(key, params);
    }

    /**
     * Obtiene una traducción de forma síncrona (instantánea)
     *
     * @param key - Clave de traducción (ej: 'common.loading')
     * @param params - Parámetros opcionales para interpolación
     * @returns El texto traducido
     *
     * @example
     * ```typescript
     * const text = this.i18nService.translateInstant('common.loading'); // 'Cargando...'
     * ```
     */
    public translateInstant(key: string, params?: Record<string, unknown>): string {
        return this.translateService.instant(key, params);
    }

    /**
     * Obtiene el nombre completo de un idioma por su código
     *
     * @param code - Código del idioma (ej: 'es', 'en')
     * @returns El nombre del idioma o el código si no se encuentra
     *
     * @example
     * ```typescript
     * const name = this.i18nService.getLanguageName('es'); // 'Español'
     * ```
     */
    public getLanguageName(code: string): string {
        const language = this.availableLanguages.find(lang => lang.code === code);
        return language?.name ?? code;
    }

    /**
     * Valida si un código de idioma es soportado por la aplicación
     *
     * @param languageCode - Código del idioma a validar
     * @returns true si el idioma es válido, false en caso contrario
     * @private
     */
    private isValidLanguage(languageCode: string): boolean {
        return this.availableLanguages.some(lang => lang.code === languageCode);
    }

    /**
     * Obtiene el idioma guardado en localStorage
     *
     * @returns El código del idioma guardado o null si no existe
     * @private
     */
    private getSavedLanguage(): string | null {
        return localStorage.getItem(I18N_CONSTANTS.STORAGE_KEY);
    }

    /**
     * Obtiene el idioma preferido del navegador
     *
     * @returns El código del idioma del navegador
     * @private
     */
    private getBrowserLanguage(): string {
        return navigator.language.split('-')[0];
    }

    /**
     * Actualiza el idioma actual en el subject
     *
     * @param languageCode - Código del nuevo idioma
     * @private
     */
    private updateCurrentLanguage(languageCode: string): void {
        this.currentLanguageSubject.next(languageCode);
    }

    /**
     * Guarda la preferencia de idioma en localStorage
     *
     * @param languageCode - Código del idioma a guardar
     * @private
     */
    private saveLanguagePreference(languageCode: string): void {
        localStorage.setItem(I18N_CONSTANTS.STORAGE_KEY, languageCode);
    }

    /**
     * Resuelve todas las traducciones de una configuración de i18n de una sola vez
     * Utiliza forkJoin para hacer todas las llamadas de traducción en paralelo
     *
     * @template T - Tipo de la configuración que extiende I18nConfig
     * @param config - Configuración con las claves de traducción
     * @returns Observable con todas las traducciones resueltas
     *
     * @example
     * ```typescript
     * const config = { i18n: { title: 'page.title', subtitle: 'page.subtitle' } };
     *
     * this.i18nService.resolveTexts(config).subscribe(texts => {
     *   console.log(texts.title); // 'Mi Título'
     *   console.log(texts.subtitle); // 'Mi Subtítulo'
     * });
     * ```
     */
    public resolveTexts<T extends I18nConfig>(config: T): Observable<ResolvedTexts<T>> {
        const translationKeys = Object.keys(config.i18n) as Array<keyof T['i18n']>;

        // Crear un objeto con observables para cada traducción
        const translationObservables = translationKeys.reduce(
            (acc, key) => {
                const translationKey = config.i18n[key as string];
                acc[key] = this.translate(translationKey);
                return acc;
            },
            {} as Record<keyof T['i18n'], Observable<string>>
        );

        // Resolver todas las traducciones en paralelo
        return forkJoin(translationObservables) as Observable<ResolvedTexts<T>>;
    }

    /**
     * Obtiene un Observable que se actualiza automáticamente cuando cambia el idioma
     * Resuelve todas las traducciones cada vez que el idioma cambia
     *
     * @template T - Tipo de la configuración que extiende I18nConfig
     * @param config - Configuración con las claves de traducción
     * @returns Observable que emite las traducciones resueltas cada vez que cambia el idioma
     *
     * @example
     * ```typescript
     * const config = { i18n: { title: 'page.title', subtitle: 'page.subtitle' } };
     *
     * this.i18nService.getReactiveTexts(config).subscribe(texts => {
     *   this.texts = texts; // Se actualiza automáticamente al cambiar idioma
     * });
     * ```
     */
    public getReactiveTexts<T extends I18nConfig>(config: T): Observable<ResolvedTexts<T>> {
        return this.currentLanguage$.pipe(switchMap(() => this.resolveTexts(config)));
    }

    /**
     * Método de conveniencia para resolver textos de forma síncrona (una sola vez)
     * Útil cuando no necesitas reactividad al cambio de idioma
     *
     * @template T - Tipo de la configuración que extiende I18nConfig
     * @param config - Configuración con las claves de traducción
     * @returns Promise con las traducciones resueltas
     *
     * @example
     * ```typescript
     * const config = { i18n: { title: 'page.title', subtitle: 'page.subtitle' } };
     *
     * const texts = await this.i18nService.resolveTextsOnce(config);
     * console.log(texts.title); // 'Mi Título'
     * ```
     */
    public async resolveTextsOnce<T extends I18nConfig>(config: T): Promise<ResolvedTexts<T>> {
        return this.resolveTexts(config).toPromise() as Promise<ResolvedTexts<T>>;
    }
}

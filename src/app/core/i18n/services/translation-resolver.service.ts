import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { I18nConfigEntity, I18nParamsEntity } from '../config';
import { I18nService } from '../i18n.service';

/**
 * Servicio especializado en resolver traducciones de configuraciones i18n
 * Proporciona métodos optimizados para resolver múltiples traducciones de forma eficiente
 */
@Injectable({
    providedIn: 'root',
})
export class TranslationResolverService {
    constructor(private readonly i18nService: I18nService) { }

    /**
     * Resuelve todas las traducciones de una configuración i18n
     *
     * @param config - Configuración i18n a resolver
     * @param params - Parámetros opcionales para las traducciones
     * @returns Observable con todas las traducciones resueltas
     *
     * @example
     * ```typescript
     * const config = {
     *   i18n: {
     *     title: 'page.title',
     *     subtitle: 'page.subtitle'
     *   }
     * };
     *
     * this.resolver.resolveConfig(config).subscribe(resolved => {
     *   console.log(resolved.title); // "Mi Título"
     *   console.log(resolved.subtitle); // "Mi Subtítulo"
     * });
     * ```
     */
    public resolveConfig<T extends I18nConfigEntity>(
        config: T,
        params?: I18nParamsEntity
    ): Observable<Record<keyof T['i18n'], string>> {
        const translationKeys = Object.keys(config.i18n) as Array<keyof T['i18n']>;

        if (translationKeys.length === 0) {
            return of({} as Record<keyof T['i18n'], string>);
        }

        // Crear observables para cada traducción
        const translationObservables = translationKeys.reduce(
            (acc, key) => {
                const translationKey = (config.i18n as Record<string, string>)[key as string];
                acc[key] = this.i18nService.translate(translationKey, params).pipe(
                    catchError(() => of(translationKey)) // Fallback al key original si falla
                );
                return acc;
            },
            {} as Record<keyof T['i18n'], Observable<string>>
        );

        // Combinar todos los observables
        return forkJoin(translationObservables);
    }

    /**
     * Resuelve una traducción específica de forma síncrona
     *
     * @param key - Clave de traducción
     * @param params - Parámetros opcionales
     * @returns Traducción resuelta o la clave original si no se encuentra
     */
    public resolveInstant(key: string, params?: I18nParamsEntity): string {
        return this.i18nService.translateInstant(key, params);
    }

    /**
     * Resuelve múltiples traducciones de forma síncrona
     *
     * @param keys - Array de claves de traducción
     * @param params - Parámetros opcionales
     * @returns Objeto con las traducciones resueltas
     */
    public resolveMultipleInstant(keys: string[], params?: I18nParamsEntity): Record<string, string> {
        return keys.reduce(
            (acc, key) => {
                acc[key] = this.resolveInstant(key, params);
                return acc;
            },
            {} as Record<string, string>
        );
    }

    /**
     * Resuelve traducciones con namespace
     *
     * @param namespace - Namespace de las traducciones
     * @param keys - Claves dentro del namespace
     * @param params - Parámetros opcionales
     * @returns Observable con las traducciones resueltas
     */
    public resolveNamespace(
        namespace: string,
        keys: string[],
        params?: I18nParamsEntity
    ): Observable<Record<string, string>> {
        const namespacedKeys = keys.map(key => `${namespace}.${key}`);

        const translationObservables = keys.reduce(
            (acc, key, index) => {
                const namespacedKey = namespacedKeys[index];
                acc[key] = this.i18nService
                    .translate(namespacedKey, params)
                    .pipe(catchError(() => of(namespacedKey)));
                return acc;
            },
            {} as Record<string, Observable<string>>
        );

        return forkJoin(translationObservables);
    }

    /**
     * Verifica si una clave de traducción existe
     *
     * @param key - Clave a verificar
     * @returns true si la clave existe, false en caso contrario
     */
    public hasTranslation(key: string): boolean {
        const translation = this.i18nService.translateInstant(key);
        return translation !== key; // Si devuelve la misma clave, no existe la traducción
    }

    /**
     * Obtiene todas las traducciones disponibles para un prefijo
     *
     * @param prefix - Prefijo de las claves (ej: 'common', 'errors')
     * @returns Observable con todas las traducciones del prefijo
     */
    public getTranslationsByPrefix(): Observable<Record<string, string>> {
        // Esta implementación dependería de cómo ngx-translate expone las traducciones
        // Por ahora, devolvemos un observable vacío
        return of({});
    }

    /**
     * Resuelve traducciones con interpolación de parámetros complejos
     *
     * @param key - Clave de traducción
     * @param params - Parámetros para interpolación
     * @returns Observable con la traducción resuelta
     */
    public resolveWithComplexParams(
        key: string,
        params: Record<string, unknown>
    ): Observable<string> {
        return this.i18nService.translate(key, params);
    }

    /**
     * Resuelve traducciones con fallback a múltiples idiomas
     *
     * @param key - Clave de traducción
     * @param fallbackLanguages - Idiomas de fallback en orden de preferencia
     * @param params - Parámetros opcionales
     * @returns Observable con la traducción resuelta
     */
    public resolveWithFallback(
        key: string,
        fallbackLanguages: string[],
        params?: I18nParamsEntity
    ): Observable<string> {
        // const currentLang = this.i18nService.getCurrentLanguage();

        // Intentar con el idioma actual primero
        return this.i18nService.translate(key, params).pipe(
            catchError(() => {
                // Si falla, intentar con los idiomas de fallback
                return this.tryFallbackLanguages(key, fallbackLanguages, params);
            })
        );
    }

    /**
     * Intenta resolver una traducción con idiomas de fallback
     *
     * @param key - Clave de traducción
     * @param fallbackLanguages - Idiomas de fallback
     * @param params - Parámetros opcionales
     * @returns Observable con la traducción resuelta
     * @private
     */
    private tryFallbackLanguages(
        key: string,
        fallbackLanguages: string[],
        params?: I18nParamsEntity
    ): Observable<string> {
        if (fallbackLanguages.length === 0) {
            return of(key); // Devolver la clave original si no hay más fallbacks
        }

        const [firstFallback, ...remainingFallbacks] = fallbackLanguages;
        const originalLang = this.i18nService.getCurrentLanguage();

        // Cambiar temporalmente al idioma de fallback
        this.i18nService.setLanguage(firstFallback);

        return this.i18nService.translate(key, params).pipe(
            map(translation => {
                // Restaurar el idioma original
                this.i18nService.setLanguage(originalLang);
                return translation;
            }),
            catchError(() => {
                // Restaurar el idioma original y probar el siguiente fallback
                this.i18nService.setLanguage(originalLang);
                return this.tryFallbackLanguages(key, remainingFallbacks, params);
            })
        );
    }
}

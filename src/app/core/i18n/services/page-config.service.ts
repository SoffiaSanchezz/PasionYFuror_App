import { Injectable } from '@angular/core';
import { ErrorHandlerService } from '@shared/services/error-handler/error-handler.service';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PageConfig } from '../config';
import { I18nService } from '../i18n.service';

/**
 * Interfaz que extiende PageConfig con textos resueltos/traducidos
 * Utilizada para proporcionar configuraciones con traducciones ya procesadas
 */
export interface ResolvedPageConfig extends PageConfig {
    /** Textos traducidos indexados por clave de configuración */
    resolvedTexts?: Record<string, string>;
}

/**
 * Servicio para gestionar configuraciones de página y sus traducciones.
 * Implementa el patrón Repository para configuraciones de página y
 * proporciona funcionalidad de resolución de traducciones.
 *
 * Responsabilidades:
 * - Cargar configuraciones de página dinámicamente
 * - Cachear configuraciones para mejorar rendimiento
 * - Resolver traducciones de configuraciones
 * - Gestionar el estado actual de configuración
 *
 * @example
 * ```typescript
 * constructor(private pageConfigService: I18nPageConfigService) {}
 *
 * ngOnInit() {
 *   this.pageConfigService.loadConfig('example-page')
 *     .subscribe(config => {
 *       this.pageTitle = config.resolvedTexts?.title || 'Default Title';
 *     });
 * }
 * ```
 */
@Injectable({
    providedIn: 'root',
})
export class I18nPageConfigService {
    // Subjects privados para manejar el estado interno
    private readonly currentConfigSubject = new BehaviorSubject<PageConfig | null>(null);
    private readonly configCache = new Map<string, PageConfig>();

    /**
     * Observable que emite la configuración actual de la página
     * Se actualiza automáticamente cuando cambia la configuración
     */
    public readonly currentConfig$ = this.currentConfigSubject.asObservable();

    /**
     * Observable que emite la configuración resuelta con traducciones
     * Combina la configuración actual con las traducciones del idioma activo
     */
    public readonly resolvedConfig$: Observable<ResolvedPageConfig | null> = combineLatest([
        this.currentConfig$,
        this.i18nService.currentLanguage$,
    ]).pipe(
        switchMap(([config]) => {
            if (!config) return [null];
            return this.resolveConfigTexts(config);
        })
    );

    constructor(
        private readonly i18nService: I18nService,
        private readonly errorHandler: ErrorHandlerService
    ) { }

    /**
     * Carga una configuración de página específica
     *
     * @param configPath - Ruta o identificador de la configuración
     * @returns Observable con la configuración cargada
     * @public
     *
     * @example
     * ```typescript
     * this.pageConfigService.loadConfig('user-profile')
     *   .subscribe(config => console.log('Config loaded:', config));
     * ```
     */
    public loadConfig(configPath: string): Observable<PageConfig> {
        // Verificar caché primero
        const cachedConfig = this.configCache.get(configPath);
        if (cachedConfig) {
            this.setCurrentConfig(cachedConfig);
            return of(cachedConfig);
        }

        // Simular carga de configuración (en una implementación real, esto vendría de un servicio HTTP)
        return new Observable<PageConfig>(observer => {
            try {
                // Aquí iría la lógica real de carga de configuración
                const mockConfig: PageConfig = {
                    id: configPath,
                    title: `config.${configPath}.title`,
                    description: `config.${configPath}.description`,
                    routes: {
                        path: `/${configPath}`,
                        title: `routes.${configPath}.title`,
                    },
                };

                this.cacheConfig(configPath, mockConfig);
                this.setCurrentConfig(mockConfig);
                observer.next(mockConfig);
                observer.complete();
            } catch (error) {
                this.handleConfigLoadError();
                observer.error(error);
            }
        });
    }

    /**
     * Obtiene la configuración actual sin suscribirse a cambios
     *
     * @returns La configuración actual o null si no hay ninguna cargada
     * @public
     */
    public getCurrentConfig(): PageConfig | null {
        return this.currentConfigSubject.value;
    }

    /**
     * Establece una nueva configuración como actual
     *
     * @param config - Nueva configuración a establecer
     * @public
     */
    public setCurrentConfig(config: PageConfig): void {
        this.currentConfigSubject.next(config);
    }

    /**
     * Resuelve las traducciones de una configuración
     *
     * @param config - Configuración a resolver
     * @returns Observable con la configuración resuelta
     * @private
     */
    private resolveConfigTexts(config: PageConfig): Observable<ResolvedPageConfig> {
        const resolvedTexts: Record<string, string> = {};

        // Resolver título
        if (config.title) {
            resolvedTexts['title'] = this.i18nService.translateInstant(config.title);
        }

        // Resolver descripción
        if (config.description) {
            resolvedTexts['description'] = this.i18nService.translateInstant(config.description);
        }

        // Resolver rutas
        if (config.routes?.title) {
            resolvedTexts['routeTitle'] = this.i18nService.translateInstant(config.routes.title);
        }

        const resolvedConfig: ResolvedPageConfig = {
            ...config,
            resolvedTexts,
        };

        return of(resolvedConfig);
    }

    /**
     * Cachea una configuración cargada para futuras consultas
     *
     * @param configPath - Ruta de la configuración
     * @param config - Configuración a cachear
     * @private
     */
    private cacheConfig(configPath: string, config: PageConfig): void {
        this.configCache.set(configPath, config);
    }

    /**
     * Maneja errores durante la carga de configuración
     *
     * @param configPath - Ruta de la configuración que falló
     * @param error - Error ocurrido durante la carga
     * @private
     */
    private handleConfigLoadError(): void {
        // Log error silently or send to logging service
        // In production, this could be sent to a logging service
    }

    /**
     * Obtiene un texto resuelto desde la configuración actual
     *
     * @param key - Clave del texto a obtener
     * @returns El texto resuelto o una cadena vacía si no se encuentra
     * @public
     */
    public getResolvedText(key: string): string {
        const config = this.getCurrentConfig();
        if (!config) return '';

        // Aquí iría la lógica para obtener el texto resuelto
        // Por ahora, devolvemos la traducción directa
        return this.i18nService.translateInstant(key);
    }

    /**
     * Limpia la caché de configuraciones
     *
     * @public
     */
    public clearCache(): void {
        this.configCache.clear();
    }

    /**
     * Obtiene el tamaño actual de la caché
     *
     * @returns Número de configuraciones en caché
     * @public
     */
    public getCacheSize(): number {
        return this.configCache.size;
    }
}

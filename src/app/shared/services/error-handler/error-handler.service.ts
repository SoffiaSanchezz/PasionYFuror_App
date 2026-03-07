import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';

/**
 * Tipos de errores que puede manejar la aplicación
 */
export enum ErrorType {
    NETWORK = 'NETWORK',
    VALIDATION = 'VALIDATION',
    CONFIG = 'CONFIG',
    I18N = 'I18N',
    UNKNOWN = 'UNKNOWN',
}

/**
 * Interfaz para errores estructurados de la aplicación
 */
export interface AppError {
    /** Tipo de error */
    type: ErrorType;
    /** Código de error único */
    code: string;
    /** Mensaje descriptivo del error */
    message: string;
    /** Error original (opcional) */
    originalError?: unknown;
    /** Contexto adicional del error */
    context?: Record<string, unknown>;
    /** Timestamp del error */
    timestamp: Date;
}

/**
 * Servicio centralizado para el manejo de errores en la aplicación.
 * Proporciona métodos para crear, registrar y manejar errores de forma consistente.
 *
 * @example
 * ```typescript
 * constructor(private errorHandler: ErrorHandlerService) {}
 *
 * // Crear y lanzar un error
 * this.errorHandler.throwError(
 *   ErrorType.CONFIG,
 *   'CONFIG_LOAD_FAILED',
 *   'Failed to load configuration',
 *   originalError,
 *   { configPath: './config/app.config' }
 * );
 *
 * // Manejar error en Observable
 * return this.http.get('/api/data').pipe(
 *   catchError(error => this.errorHandler.handleError(
 *     ErrorType.NETWORK,
 *     'API_REQUEST_FAILED',
 *     'Failed to fetch data',
 *     error
 *   ))
 * );
 * ```
 */
@Injectable({
    providedIn: 'root',
})
export class ErrorHandlerService {
    /**
     * Crea y lanza un error estructurado
     *
     * @param type - Tipo de error
     * @param code - Código único del error
     * @param message - Mensaje descriptivo
     * @param originalError - Error original (opcional)
     * @param context - Contexto adicional (opcional)
     * @throws {AppError} Error estructurado
     *
     * @example
     * ```typescript
     * this.errorHandler.throwError(
     *   ErrorType.CONFIG,
     *   'CONFIG_NOT_FOUND',
     *   'Configuration file not found',
     *   error,
     *   { path: configPath }
     * );
     * ```
     */
    public throwError(
        type: ErrorType,
        code: string,
        message: string,
        originalError?: unknown,
        context?: Record<string, unknown>
    ): never {
        const appError = this.createError(type, code, message, originalError, context);
        this.logError(appError);
        throw appError;
    }

    /**
     * Maneja un error y retorna un Observable que emite el error
     * Útil para usar con el operador catchError de RxJS
     *
     * @param type - Tipo de error
     * @param code - Código único del error
     * @param message - Mensaje descriptivo
     * @param originalError - Error original (opcional)
     * @param context - Contexto adicional (opcional)
     * @returns Observable que emite el error
     *
     * @example
     * ```typescript
     * return this.http.get('/api/data').pipe(
     *   catchError(error => this.errorHandler.handleError(
     *     ErrorType.NETWORK,
     *     'API_FETCH_FAILED',
     *     'Failed to fetch data from API',
     *     error
     *   ))
     * );
     * ```
     */
    public handleError(
        type: ErrorType,
        code: string,
        message: string,
        originalError?: unknown,
        context?: Record<string, unknown>
    ): Observable<never> {
        const appError = this.createError(type, code, message, originalError, context);
        this.logError(appError);
        return throwError(() => appError);
    }

    /**
     * Crea un objeto de error estructurado
     *
     * @param type - Tipo de error
     * @param code - Código único del error
     * @param message - Mensaje descriptivo
     * @param originalError - Error original (opcional)
     * @param context - Contexto adicional (opcional)
     * @returns Objeto de error estructurado
     * @private
     */
    private createError(
        type: ErrorType,
        code: string,
        message: string,
        originalError?: unknown,
        context?: Record<string, unknown>
    ): AppError {
        return {
            type,
            code,
            message,
            originalError,
            context,
            timestamp: new Date(),
        };
    }

    /**
     * Registra el error según el entorno (desarrollo vs producción)
     * En desarrollo: console.error con detalles completos
     * En producción: envío a servicio de logging (implementar según necesidades)
     *
     * @param error - Error a registrar
     * @public
     */
    public logError(error: AppError): void {
        // En desarrollo, almacenar error para debugging
        if (this.isDevelopment()) {
            // Store error for debugging purposes
            // In a real application, this could be sent to a development logging service
            this.storeErrorForDebugging(error);
        } else {
            // En producción, enviar a servicio de logging
            this.sendToLoggingService();
        }
    }

    /**
     * Almacena el error para debugging en desarrollo
     * @param error - Error a almacenar
     * @private
     */
    private storeErrorForDebugging(error: AppError): void {
        // In development, you could store errors in localStorage, IndexedDB, or send to dev logging service
        // For now, we'll just store it silently
        if (typeof window !== 'undefined' && window.localStorage) {
            const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            errors.push({
                ...error,
                timestamp: error.timestamp.toISOString(),
            });
            // Keep only last 50 errors
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }
            localStorage.setItem('app_errors', JSON.stringify(errors));
        }
    }

    /**
     * Determina si la aplicación está en modo desarrollo
     *
     * @returns true si está en desarrollo, false en producción
     * @private
     */
    private isDevelopment(): boolean {
        // Implementar lógica para detectar entorno
        // Por ejemplo, usando environment.production
        return !this.isProduction();
    }

    /**
     * Determina si la aplicación está en modo producción
     *
     * @returns true si está en producción, false en desarrollo
     * @private
     */
    private isProduction(): boolean {
        // Implementar lógica para detectar entorno de producción
        // Por ejemplo: return environment.production;
        return false; // Por ahora, siempre desarrollo
    }

    /**
     * Envía el error a un servicio de logging externo (producción)
     * Implementar según las necesidades específicas (Sentry, LogRocket, etc.)
     *
     * @param error - Error a enviar
     * @private
     */
    private sendToLoggingService(): void {
        // Implementar envío a servicio de logging
        // Ejemplos:
        // - Sentry.captureException(error);
        // - this.http.post('/api/logs', error).subscribe();
        // - LogRocket.captureException(error);
        // Por ahora, almacenar que se enviaría a un servicio de logging
        // In production, this would actually send to a logging service
    }
}

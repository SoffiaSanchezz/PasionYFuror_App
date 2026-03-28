import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
    HttpParams,
    HttpStatusCode,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiConfig } from '@shared/services/api/api.config';
import { environment } from '../../../../environments/environment';
import { Observable, catchError, map, throwError } from 'rxjs';

// Tipos para el API Service
type ApiResponse<T = unknown> = T;
type ApiRequestData = any;

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    constructor(private http: HttpClient) {}

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': ApiConfig.contentType,
        });
    }

    public get<T = unknown>(url: string, params?: HttpParams): Observable<ApiResponse<T>> {
        return this.http.get<ApiResponse<T>>(`${environment.apiUrl}/${url}`, { headers: this.getHeaders(), params }).pipe(
            catchError((error: HttpErrorResponse) => this.errorHandler(error)),
            map((response: ApiResponse<T>) => response)
        );
    }

    public getBlob(url: string, params?: HttpParams): Observable<Blob> {
        return this.http.get(`${environment.apiUrl}/${url}`, {
            headers: this.getHeaders(),
            params,
            responseType: 'blob'
        }).pipe(
            catchError((error: HttpErrorResponse) => this.errorHandler(error))
        );
    }

    public post<T = unknown>(
        url: string,
        data: ApiRequestData,
        params?: HttpParams
    ): Observable<ApiResponse<T>> {
        return this.http.post<ApiResponse<T>>(`${environment.apiUrl}/${url}`, data, { headers: this.getHeaders(), params }).pipe(
            catchError((error: HttpErrorResponse) => this.errorHandler(error)),
            map((response: ApiResponse<T>) => response)
        );
    }

    public put<T = unknown>(url: string, data: ApiRequestData): Observable<ApiResponse<T>> {
        return this.http.put<ApiResponse<T>>(`${environment.apiUrl}/${url}`, data, { headers: this.getHeaders() }).pipe(
            catchError((error: HttpErrorResponse) => this.errorHandler(error)),
            map((response: ApiResponse<T>) => response)
        );
    }

    public patch<T = unknown>(url: string, data: ApiRequestData): Observable<ApiResponse<T>> {
        return this.http.patch<ApiResponse<T>>(`${environment.apiUrl}/${url}`, data, { headers: this.getHeaders() }).pipe(
            catchError((error: HttpErrorResponse) => this.errorHandler(error)),
            map((response: ApiResponse<T>) => response)
        );
    }

    public delete<T = unknown>(url: string, params?: HttpParams): Observable<ApiResponse<T>> {
        return this.http.delete<ApiResponse<T>>(`${environment.apiUrl}/${url}`, { headers: this.getHeaders(), params }).pipe(
            catchError((error: HttpErrorResponse) => this.errorHandler(error)),
            map((response: ApiResponse<T>) => response)
        );
    }

    private errorHandler(error: HttpErrorResponse) {
        let errorMessage = 'Ocurrió un error inesperado';
        
        if (error.error instanceof ErrorEvent) {
            // Error del lado del cliente
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Error del lado del servidor (400, 500, etc)
            console.error('API Error:', error);
            
            // Si el backend envió un mensaje de error estructurado
            if (error.error) {
                if (typeof error.error === 'string') {
                    errorMessage = error.error;
                } else if (error.error.message) {
                    errorMessage = error.error.message;
                } else if (error.error.error) {
                    errorMessage = error.error.error;
                } else if (error.error.errors) {
                    // Si hay múltiples errores de validación, los concatenamos
                    errorMessage = Object.values(error.error.errors).join(', ');
                }
            }
        }
        
        // Retornamos el mensaje para que el suscriptor pueda mostrarlo
        return throwError(() => errorMessage);
    }
}

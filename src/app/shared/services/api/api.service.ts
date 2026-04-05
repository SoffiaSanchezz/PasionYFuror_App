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
import { SessionProviderService } from '@shared/services/session/session-provider.service';

// Tipos para el API Service
type ApiResponse<T = unknown> = T;
type ApiRequestData = any;

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    constructor(
        private http: HttpClient,
        private session: SessionProviderService
    ) {}

    private getHeaders(): HttpHeaders {
        const token = this.session.getInformationToken();
        const headers: Record<string, string> = {
            'Content-Type': ApiConfig.contentType,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return new HttpHeaders(headers);
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
        console.error('API Error:', error.status, error.message, error.error);
        return throwError(() => error);
    }
}

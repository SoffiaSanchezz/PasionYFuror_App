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
import { SessionProviderService } from '../session/session-provider.service';

// Tipos para el API Service
type ApiResponse<T = unknown> = T;
type ApiRequestData = any;

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    public reqHeader!: HttpHeaders;
    constructor(
        private http: HttpClient,
        private readonly sessionProvider: SessionProviderService
    ) {
        this.updateHeaders();
    }

    private updateHeaders(): void {
        const token = this.sessionProvider.getInformationToken();
        const headers: Record<string, string> = {
            'Content-Type': ApiConfig.contentType,
        };

        if (token) {
            headers['Authorization'] = `${ApiConfig.carry} ${token}`;
        }

        this.reqHeader = new HttpHeaders(headers);
    }

    public get<T = unknown>(url: string, params?: HttpParams): Observable<ApiResponse<T>> {
        return this.http.get<ApiResponse<T>>(`${environment.apiUrl}/${url}`, { headers: this.reqHeader, params }).pipe(
            catchError((error: HttpErrorResponse) => {
                return this.errorHandler(error);
            }),
            map((response: ApiResponse<T>) => response)
        );
    }

    public post<T = unknown>(
        url: string,
        data: ApiRequestData,
        params?: HttpParams
    ): Observable<ApiResponse<T>> {
        return this.http.post<ApiResponse<T>>(`${environment.apiUrl}/${url}`, data, { headers: this.reqHeader, params }).pipe(
            catchError((error: HttpErrorResponse) => {
                return this.errorHandler(error);
            }),
            map((response: ApiResponse<T>) => response)
        );
    }

    public put<T = unknown>(url: string, data: ApiRequestData): Observable<ApiResponse<T>> {
        return this.http.put<ApiResponse<T>>(`${environment.apiUrl}/${url}`, data, { headers: this.reqHeader }).pipe(
            catchError((error: HttpErrorResponse) => {
                return this.errorHandler(error);
            }),
            map((response: ApiResponse<T>) => response)
        );
    }

    public patch<T = unknown>(url: string, data: ApiRequestData): Observable<ApiResponse<T>> {
        return this.http.patch<ApiResponse<T>>(`${environment.apiUrl}/${url}`, data, { headers: this.reqHeader }).pipe(
            catchError((error: HttpErrorResponse) => {
                return this.errorHandler(error);
            }),
            map((response: ApiResponse<T>) => response)
        );
    }

    public delete<T = unknown>(url: string, params?: HttpParams): Observable<ApiResponse<T>> {
        return this.http.delete<ApiResponse<T>>(`${environment.apiUrl}/${url}`, { headers: this.reqHeader, params }).pipe(
            catchError((error: HttpErrorResponse) => {
                return this.errorHandler(error);
            }),
            map((response: ApiResponse<T>) => response)
        );
    }

    private errorHandler(error: HttpErrorResponse) {
        switch (error.status) {
            case HttpStatusCode.BadRequest:
                return throwError(() => new HttpErrorResponse({ error }));
            case HttpStatusCode.InternalServerError:
                return throwError(() => new Error(ApiConfig.internalServerError));
            case HttpStatusCode.NotFound:
                return throwError(() => new Error(ApiConfig.NotFound));
            case HttpStatusCode.Unauthorized:
                return throwError(() => new Error(ApiConfig.Unauthorized));
            default:
                return throwError(() => new Error(ApiConfig.unknownError));
        }
    }
}

import { Injectable } from '@angular/core';

export interface UserInfo {
    id: number | string;
    nombre: string;
    apellido: string;
    rol: string;
    fullName?: string;
    [key: string]: any;
}

@Injectable({
    providedIn: 'root',
})
export class SessionProviderService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'user_info';

    constructor() { }

    /**
     * Get authentication token from storage
     */
    getInformationToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Set authentication token in storage
     */
    setInformationToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    /**
     * Remove authentication token from storage
     */
    removeInformationToken(): void {
        localStorage.removeItem(this.TOKEN_KEY);
    }

    /**
     * Get user information from storage
     */
    getUserInfo<T = UserInfo>(): T | null {
        const userInfo = localStorage.getItem(this.USER_KEY);
        return userInfo ? JSON.parse(userInfo) : null;
    }

    /**
     * Set user information in storage
     */
    setUserInfo(userInfo: UserInfo | Record<string, unknown>): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
    }

    /**
     * Get the user's name
     */
    getUserName(): string {
        const userInfo = this.getUserInfo();
        return userInfo?.fullName || userInfo?.nombre || '';
    }

    /**
     * Get the user's role
     */
    getUserRole(): string {
        const userInfo = this.getUserInfo();
        return userInfo?.rol || '';
    }

    /**
     * Remove user information from storage
     */
    removeUserInfo(): void {
        localStorage.removeItem(this.USER_KEY);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getInformationToken();
    }

    /**
     * Clear all session data
     */
    clearSession(): void {
        this.removeInformationToken();
        this.removeUserInfo();
    }
}

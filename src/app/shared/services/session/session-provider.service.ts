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
        try {
            return localStorage.getItem(this.TOKEN_KEY);
        } catch (e) {
            console.warn('Storage access blocked:', e);
            return null;
        }
    }

    /**
     * Set authentication token in storage
     */
    setInformationToken(token: string): void {
        try {
            localStorage.setItem(this.TOKEN_KEY, token);
        } catch (e) {
            console.error('Failed to save token to storage:', e);
        }
    }

    /**
     * Remove authentication token from storage
     */
    removeInformationToken(): void {
        try {
            localStorage.removeItem(this.TOKEN_KEY);
        } catch (e) {
            console.error('Failed to remove token from storage:', e);
        }
    }

    /**
     * Get user information from storage
     */
    getUserInfo<T = UserInfo>(): T | null {
        try {
            const userInfo = localStorage.getItem(this.USER_KEY);
            return userInfo ? JSON.parse(userInfo) : null;
        } catch (e) {
            console.warn('Storage access blocked:', e);
            return null;
        }
    }

    /**
     * Set user information in storage
     */
    setUserInfo(userInfo: UserInfo | Record<string, unknown>): void {
        try {
            localStorage.setItem(this.USER_KEY, JSON.stringify(userInfo));
        } catch (e) {
            console.error('Failed to save user info to storage:', e);
        }
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
        try {
            localStorage.removeItem(this.USER_KEY);
        } catch (e) {
            console.error('Failed to remove user info from storage:', e);
        }
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

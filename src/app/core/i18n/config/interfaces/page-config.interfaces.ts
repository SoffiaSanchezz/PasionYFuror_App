/**
 * Interfaces para configuración de páginas y componentes con soporte i18n
 */

export interface I18nConfig {
    namespace: string;
    keys: Record<string, string>;
}

export interface RouteConfig {
    path: string;
    title: string;
    breadcrumbs?: string[];
    meta?: {
        description?: string;
        keywords?: string[];
    };
}

export interface ApiConfig {
    endpoints: Record<string, string>;
    baseUrl?: string;
    timeout?: number;
    retries?: number;
}

export interface UiConfig {
    theme?: string;
    layout?: 'default' | 'sidebar' | 'fullwidth';
    showHeader?: boolean;
    showFooter?: boolean;
    showSidebar?: boolean;
    animations?: boolean;
}

export interface PageConfig {
    id?: string;
    title?: string;
    description?: string;
    i18n?: Record<string, string>;
    routes?: RouteConfig;
    api?: ApiConfig;
    ui?: UiConfig;
    metadata?: {
        version: string;
        author?: string;
        lastModified?: string;
    };
}

export interface FeatureConfig extends PageConfig {
    feature: string;
    pages: Record<string, PageConfig>;
}

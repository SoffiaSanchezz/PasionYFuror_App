import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TRANSLATE_HTTP_LOADER_CONFIG } from '@ngx-translate/http-loader';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';

import { routes } from './app.routes';
import { customNavAnimation } from './shared/animations/nav-animation';
import { ServiceProviderModule } from './core/service-provider/service-provider.module';
import { ApiService } from './shared/services/api/api.service';
import { I18nService } from './core/i18n/i18n.service';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Factory function for TranslateHttpLoader
export function createTranslateLoader() {
    return new TranslateHttpLoader();
}

// Player factory for ngx-lottie
export function playerFactory() {
    return player;
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes),
        provideHttpClient(withFetch(), withInterceptorsFromDi()),
        provideAnimations(),
        importProvidersFrom(
            IonicModule.forRoot({
                navAnimation: customNavAnimation,
                mode: 'md'
            }),
            ServiceProviderModule,
            TranslateModule.forRoot({
                loader: {
                    provide: TranslateLoader,
                    useFactory: createTranslateLoader,
                },
            })
        ),
        ApiService,
        I18nService,
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
        provideLottieOptions({
            player: playerFactory,
        }),
        {
            provide: TRANSLATE_HTTP_LOADER_CONFIG,
            useValue: { prefix: './assets/i18n/', suffix: '.json' },
        },
    ]
};

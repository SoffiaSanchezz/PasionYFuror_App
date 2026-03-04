import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { I18N_PATHS } from './config';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, I18N_PATHS.ASSETS_PATH, I18N_PATHS.FILE_EXTENSION);
}

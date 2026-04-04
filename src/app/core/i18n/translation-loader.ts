import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function createTranslateLoader() {
    return new TranslateHttpLoader();
}

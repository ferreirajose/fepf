import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideEnvironmentNgxMask } from 'ngx-mask';

import { routes } from './app.routes';
import { FeatherIconsModule } from './shared/icons/feather-icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(FeatherIconsModule),
    provideEnvironmentNgxMask()
  ]
};

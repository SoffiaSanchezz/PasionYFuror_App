import { Routes } from '@angular/router';
import { PageNotFoundComponent } from '@shared/components/page-not-found/page-not-found.component';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./feature/dashboard/presentation/pages/home/home.page').then(m => m.HomePage),
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadChildren: () => import('./feature/auth/presentation/auth-feature.module').then(m => m.AuthFeatureModule),
    },
    {
        path: 'admin',
        loadChildren: () => import('./feature/admin/admin-feature.module').then(m => m.AdminFeatureModule),
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./feature/admin/dashboard/dashboard-feature.module').then(m => m.DashboardFeatureModule),
    },
    {
        path: '**',
        component: PageNotFoundComponent,
    },
];

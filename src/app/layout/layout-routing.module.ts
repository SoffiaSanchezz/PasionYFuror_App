import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from '@shared/components/page-not-found/page-not-found.component';


const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        loadChildren: () => import('../feature/auth/presentation/auth-feature.module').then(m => m.AuthFeatureModule),
    },
    {
        path: 'admin',
        loadChildren: () => import('../feature/admin/admin-feature.module').then(m => m.AdminFeatureModule),
    },
    {
        path: 'dashboard',
        loadChildren: () => import('../feature/dashboard/dashboard-feature.module').then(m => m.DashboardFeatureModule),
    },
    {
        path: '**',
        component: PageNotFoundComponent,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class LayoutRoutingModule { }

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

// Feature Auth
import { AuthRepository } from '../../feature/auth/core/repositories/auth.repository';
import { AuthImplementationRepository } from '../../feature/auth/data/repositories/auth-implementation.repository';

@NgModule({
    providers: [
        { provide: AuthRepository, useClass: AuthImplementationRepository },
    ],
    imports: [CommonModule, HttpClientModule],
})
export class ServiceProviderModule { }

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../core/repositories/auth.repository';
import { LoginResponseEntity } from '../../core/entities/login-response.entity';
import { LoginRequestEntity } from '../../core/entities/login-information.entity';
import { ApiService } from '@shared/services/api/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthImplementationRepository extends AuthRepository {
  constructor(private api: ApiService) {
    super();
  }

  authenticateUser(credentials: LoginRequestEntity): Observable<LoginResponseEntity> {
    return this.api.post<LoginResponseEntity>('auth/login', credentials);
  }
}

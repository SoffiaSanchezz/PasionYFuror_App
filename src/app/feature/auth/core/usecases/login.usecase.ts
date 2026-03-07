import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UseCase } from '@core/base/use-case';
import { LoginResponseEntity } from '@auth-core/entities/login-response.entity';
import { LoginRequestEntity } from '@auth-core/entities/login-information.entity';
import { AuthRepository } from '@auth-core/repositories/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class LoginUseCase implements UseCase<LoginRequestEntity, LoginResponseEntity> {
  constructor(private authRepository: AuthRepository) {}

  execute(params: LoginRequestEntity): Observable<LoginResponseEntity> {
    return this.authRepository.authenticateUser(params);
  }
}

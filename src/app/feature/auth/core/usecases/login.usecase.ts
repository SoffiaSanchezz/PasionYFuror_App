import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UseCase } from '@core/base/use-case';
import { UserEntity } from '@auth-core/entities/user.entity';
import { AuthRepository } from '@auth-core/repositories/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class LoginUseCase implements UseCase<any, UserEntity> {
  constructor(private repository: AuthRepository) {}

  execute(params: any): Observable<UserEntity> {
    return this.repository.login(params);
  }
}

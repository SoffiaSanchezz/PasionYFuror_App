import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../core/repositories/auth.repository';
import { UserEntity } from '../../core/entities/user.entity';
import { ApiService } from '@shared/services/api/api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthImplementationRepository extends AuthRepository {
  constructor(private api: ApiService) {
    super();
  }

  login(credentials: any): Observable<UserEntity> {
    // Aquí podrías usar mappers si la respuesta de la API no coincide con UserEntity
    return this.api.post<UserEntity>('auth/login', credentials);
  }
}

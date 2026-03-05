import { Observable } from 'rxjs';
import { UserEntity } from '../entities/user.entity';

export abstract class AuthRepository {
  abstract login(credentials: any): Observable<UserEntity>;
}

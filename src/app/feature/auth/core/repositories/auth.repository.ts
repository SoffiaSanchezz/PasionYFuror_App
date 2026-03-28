import { Observable } from 'rxjs';
import { LoginResponseEntity } from '../entities/login-response.entity';
import { LoginRequestEntity } from '../entities/login-information.entity';

export abstract class AuthRepository {
  abstract authenticateUser(credentials: LoginRequestEntity): Observable<LoginResponseEntity>;
}

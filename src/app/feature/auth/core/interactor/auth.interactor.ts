import { Injectable } from "@angular/core";
import { LoginUseCase } from "../usecases/login.usecase";
import { AuthRepository } from "../repositories/auth.repository";
import { LoginResponseEntity } from "../entities/login-response.entity";
import { LoginRequestEntity } from "../entities/login-information.entity";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class AuthInteractor {
    private loginUseCase: LoginUseCase;

    constructor(readonly authRepository: AuthRepository) {
        this.loginUseCase = new LoginUseCase(authRepository);
    }

    public authenticateUser(params: LoginRequestEntity): Observable<LoginResponseEntity> {
        return this.loginUseCase.execute(params);
    }
}

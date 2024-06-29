import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

@Injectable()
export class AtGuard extends AuthGuard('jwt'){
    constructor(private reflector: Reflector){
        super()
    } 

    handleRequest(err:any, user:any) {
        if (err || !user) {
          throw err || new ForbiddenException();
        }
        return user;
      }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.getAllAndOverride("isPublic",[
            context.getHandler(),
            context.getClass()
        ])

        if (isPublic) return true
        return super.canActivate(context)
    }
}
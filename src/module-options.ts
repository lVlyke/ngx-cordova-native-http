import { HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

export type InterceptCallback = (req: HttpRequest<any>) => boolean | Observable<boolean>;

export interface ModuleOptions {

    intercept?: boolean | InterceptCallback;
}
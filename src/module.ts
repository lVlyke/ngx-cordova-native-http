import { NgModule, ModuleWithProviders } from "@angular/core";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { NativeInterceptor } from "./services/interceptors/native-interceptor";
import { NativeHttpClient } from "./services/native-http.service";

@NgModule({
    providers: [
        NativeHttpClient
    ]
})
export class NgxCordovaNativeHttpModule {

    public static forRoot(options?: NgxCordovaNativeHttpModule.Options): ModuleWithProviders {
        return {
            ngModule: NgxCordovaNativeHttpModule,
            providers: options.intercept ? [
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: NativeInterceptor,
                    multi: true
                }
            ] : []
        }
    }
}

export namespace NgxCordovaNativeHttpModule {

    export interface Options {
        intercept?: boolean;
    }
}
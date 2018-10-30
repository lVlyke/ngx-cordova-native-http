import { NgModule, ModuleWithProviders } from "@angular/core";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { NativeInterceptor } from "./services/interceptors/native-interceptor";
import { NativeHttpClient } from "./services/native-http.service";
import { ModuleOptions } from "./module-options";

@NgModule({
    providers: [
        NativeHttpClient
    ]
})
export class NgxCordovaNativeHttpModule {

    public static forRoot(options: ModuleOptions): ModuleWithProviders {
        return {
            ngModule: NgxCordovaNativeHttpModule,
            providers: [
                {
                    provide: "ModuleOptions",
                    useValue: options
                },
                ...(options.intercept ? [{
                    provide: HTTP_INTERCEPTORS,
                    useClass: NativeInterceptor,
                    multi: true
                }] : [])
            ]
        };
    }
}

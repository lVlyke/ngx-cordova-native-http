import { ModuleOptions } from './../../module-options';
import { NativeHttpRequestOptions, NativeHttpMethod, NativeHttpResponse } from "../native-http.service";;
import { Observable, of } from "rxjs";
import { Injectable, Inject } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpHeaders, HttpResponse, HttpParams } from "@angular/common/http";
import { NativeHttpClient } from "../native-http.service";
import { map, mergeMap } from "rxjs/operators";

@Injectable()
export class NativeInterceptor implements HttpInterceptor {

    constructor (
        private readonly nativeHttp: NativeHttpClient,
        @Inject("ModuleOptions") private options: ModuleOptions
        ) {}

    public static httpParams(params: { [param: string]: any }): HttpParams {
        return Object.keys(params).reduce((httpParams, paramName) => {
            return httpParams.set(paramName, String(params[paramName]));
        }, new HttpParams());
    }

    public intercept<T>(req: HttpRequest<T>, next: HttpHandler): Observable<HttpEvent<T>> {
        return of(this.options.intercept)
            .pipe(mergeMap((interceptOpt) => {
                if (interceptOpt instanceof Function) {
                    const callbackResult = interceptOpt(req);
                    if (callbackResult instanceof Observable) {
                        return callbackResult;
                    } else {
                        return of(callbackResult);
                    }
                } else {
                    return of(interceptOpt);
                }
            }))
            .pipe(mergeMap((shouldIntercept: boolean) => {
                if (shouldIntercept) {
                    return this.doIntercept(req);
                } else {
                    return next.handle(req);
                }
            }));
    }

    private doIntercept<T>(req: HttpRequest<T>): Observable<HttpEvent<T>> {
        return this.nativeHttp.request(<NativeHttpMethod>req.method, req.url, this.mapRequest(req))
            .pipe(map((response: NativeHttpResponse & { value?: T }) => new HttpResponse<T>({
                body: response.value,
                headers: new HttpHeaders(response.headers),
                status: response.status,
                url: response.url
            })));
    }

    private mapRequest(req: HttpRequest<any>): NativeHttpRequestOptions {
        return {
            responseType: req.responseType as any,
            fullResponse: true,
            data: req.body,
            params: this.mapParams(req.params),
            headers: this.mapHeaders(req.headers)
        };
    }

    private mapHeaders(headers: HttpHeaders): { [headerName: string]: string; } {
        return headers.keys().reduce((rawHeaders, headerName) => Object.assign(rawHeaders, {
            [headerName]: headers.get(headerName)
        }), {});
    }

    private mapParams(params: HttpParams): { [paramName: string]: string; } {
        return params.keys().reduce((rawParams, paramName) => Object.assign(rawParams, {
            [paramName]: params.get(paramName)
        }), {});
    }
}

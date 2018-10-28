import { NativeHttpRequestOptions, NativeHttpMethod, NativeHttpResponse } from "../native-http.service";;
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpHeaders, HttpResponse, HttpParams } from "@angular/common/http";
import { NativeHttpClient } from "../native-http.service";
import { map } from "rxjs/operators";

@Injectable()
export class NativeInterceptor implements HttpInterceptor {

    constructor (private nativeHttp: NativeHttpClient) {}

    public static httpParams(params: { [param: string]: any }): HttpParams {
        return Object.keys(params).reduce((httpParams, paramName) => {
            httpParams.set(paramName, String(params[paramName]));
            return httpParams;
        }, new HttpParams());
    }

    public intercept<T>(req: HttpRequest<T>, _next: HttpHandler): Observable<HttpEvent<T>> {
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

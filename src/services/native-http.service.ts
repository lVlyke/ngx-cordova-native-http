import { catchError, mergeMap, take } from "rxjs/operators";
import { Observable, of, throwError } from "rxjs";
import { Injectable, NgZone, Injector } from "@angular/core";
import { enterZone } from "../core/operators/enter-zone";

export const enum NativeHttpMethod {
    get = "get",
    post = "post",
    put = "put",
    patch = "patch",
    head = "head",
    delete = "delete",
    upload = "upload",
    download = "download"
}

export interface NativeHttpRequestOptions {
    data?: any;
    params?: { [param: string]: any };
    serializer?: "urlencoded" | "json" | "utf8";
    timeout?: number;
    headers?: { [header: string]: string };
    responseType?: "http" | "json" | "text" | "file";
    filePath?: string;
    name?: string;
    fullResponse?: boolean;
}

export namespace NativeHttpRequestOptions {

    export const Defaults: Readonly<NativeHttpRequestOptions> = {
        serializer: "utf8",
        responseType: "text"
    };
}

export interface NativeHttpResponse {
    status: number;
    data: any;
    url: string;
    headers?: { [header: string]: string };
}

declare var cordova: any;

@Injectable()
export class NativeHttpClient {

    public static getAuthHeader(id: string, secret: string): { "Authorization": string } {
        return cordova.plugin.http.getBasicAuthHeader(id, secret);
    }

    constructor(private injector: Injector) {}

    public request(method: NativeHttpMethod, url: string, options: NativeHttpRequestOptions): Observable<any> {
        options = this.options(options);
        const zone = this.injector.get(NgZone);

        return new Observable<any>(observer => cordova.plugin.http.sendRequest(
            url,
            Object.assign({ method }, options),
            (value: any) => observer.next(value),
            (error: any) => observer.error(error)
        )).pipe(
            take(1),
            enterZone(zone),
            catchError((response: {
                status: number;
                error: any;
                url: string;
                headers?: { [header: string]: string };
            }) => {
                return (() => {
                    switch (options.responseType) {
                        case "http":
                        case "file":
                        case "text": return throwError(response);
                        case "json": try {
                            return throwError(JSON.parse(response.error));
                        } catch (error) {
                            return throwError(response);
                        }
                        default: return throwError(`Unrecognized response type: "${options.responseType}".`);
                    }
                })().pipe(catchError((error) => {
                    if (options.fullResponse) {
                        return throwError(Object.assign(response, { value: error }));
                    } else {
                        return throwError(error);
                    }
                }));
            }),
            mergeMap((response: {
                status: number;
                data: any;
                url: string;
                headers?: { [header: string]: string };
            }) => {
                return (() => {
                    switch (options.responseType) {
                        case "http":
                        case "file": return of(response);
                        case "text": return of(response.data);
                        case "json": return of(JSON.parse(response.data));
                        default: return throwError(`Unrecognized response type: "${options.responseType}".`);
                    }
                })().pipe(mergeMap((value) => {
                    if (options.fullResponse) {
                        return of(Object.assign(response, { value }));
                    } else {
                        return of(value);
                    }
                }));
            })
        );
    }

    public delete(url: string, options: NativeHttpRequestOptions): Observable<any> {
        return this.request(NativeHttpMethod.delete, url, options);
    }

    public get(url: string, options: NativeHttpRequestOptions): Observable<any> {
        return this.request(NativeHttpMethod.get, url, options);
    }

    public head(url: string, options: NativeHttpRequestOptions): Observable<any> {
        return this.request(NativeHttpMethod.head, url, options);
    }

    public patch(url: string, data: any | null, options: NativeHttpRequestOptions): Observable<any> {
        return this.request(NativeHttpMethod.patch, url, Object.assign({ data }, options));
    }

    public post(url: string, data: any | null, options: NativeHttpRequestOptions): Observable<any> {
        return this.request(NativeHttpMethod.post, url, Object.assign({ data }, options));
    }

    public put(url: string, data: any | null, options: NativeHttpRequestOptions): Observable<any> {
        return this.request(NativeHttpMethod.put, url, Object.assign({ data }, options));
    }

    public upload(url: string, filePath: string, name: string, options: NativeHttpRequestOptions): Observable<any> {
        return this.request(NativeHttpMethod.upload, url, Object.assign({ filePath, name }, options));
    }

    public download(url: string, filePath: string, options: NativeHttpRequestOptions): Observable<any> {
        return this.request(NativeHttpMethod.download, url, Object.assign({ filePath }, options, { responseType: "file" }));
    }

    private options(options: NativeHttpRequestOptions = {}): NativeHttpRequestOptions {
        options = Object.assign({}, NativeHttpRequestOptions.Defaults, options);

        if (options.params) {
            for (const param in options.params) {
                if (options.params[param] !== null && options.params[param] !== undefined) {
                    options.params[param] = String(options.params[param]);
                } else {
                    delete options.params[param];
                }
            }
        }

        return options;
    }
}

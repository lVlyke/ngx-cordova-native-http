import { NgZone } from "@angular/core";
import { Observable } from "rxjs";

// Adapted from https://medium.com/@naveen.kr/rxjs-custom-pipeable-operator-to-run-asynchronous-callbacks-inside-angular-zone-a49bd71c0bf6
export function enterZone(zone: NgZone) {
  return <T>(source: Observable<T>) => new Observable<T>(observer =>
      source.subscribe({
        next: (x) => zone.run(() => observer.next(x)),
        error: (err) => zone.run(() => observer.error(err)),
        complete: () => zone.run(() => observer.complete())
    }));
}

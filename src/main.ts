import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";

import {AppModule} from "./app/app.module";

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

String.prototype.formatUnicorn = function (this: string, ...args : any[]): string {
  return this.replace(/{(\d+)}/g, (match, number) => {
    return typeof args[number] != 'undefined' ? args[number] : match;
  });
};

import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {App} from "./app";
import {DefaultContentProvider} from "./DefaultContentProvider";
import {Generator} from "./Generator";

@NgModule({
  declarations: [
    App
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [
    DefaultContentProvider,
    Generator
  ],
  bootstrap: [App]
})

export class AppModule {
}

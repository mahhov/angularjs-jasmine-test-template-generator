import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {App} from "./app";
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
    Generator
  ],
  bootstrap: [App]
})

export class AppModule {
}

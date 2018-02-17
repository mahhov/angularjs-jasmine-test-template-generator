import {Component} from "@angular/core";
import {Generator} from "./Generator";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})

export class App {
  fileContents: String;
  test: String;

  constructor(private generator: Generator) {
  }

  update(): void {
    this.test = this.generator.generateTemplate(this.fileContents);
  }
}

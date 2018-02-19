import {Component} from "@angular/core";
import {DefaultContentProvider} from "./DefaultContentProvider";
import {Generator} from "./Generator";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})

export class App {
  fileContents: string;
  test: string;

  constructor(private defaultContentProvider: DefaultContentProvider, private generator: Generator) {
    this.fileContents = defaultContentProvider.betterNavBarDirective();
    this.update();
  }

  update(): void {
    this.test = this.generator.generateTemplate(this.fileContents);
  }

  copy(): void {
    let output = document.getElementById('output');

    let range = window.document.createRange();
    range.selectNodeContents(output);

    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    document.execCommand('copy')
  }
}

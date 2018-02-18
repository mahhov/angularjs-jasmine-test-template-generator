import {Injectable} from "@angular/core";
import * as _ from "underscore";

@Injectable()
export class Generator {
  private declarationsRegexp: string = /function\((.*)\)/;
  private invocationsRegexpTemplate: string = '{0}{1}\\.\\w*\\(';
  private methodRegexp: string = /\.(\w*)/;
  private commaListTemplate: string = '{0}, {1}';
  private newlineListTemplate: string = '{0}\n{1}';
  private varDeclarationTemplate: string = 'var {0};';
  private quoteTemplate: string = "'{0}'";
  private provideBodyTemplate: string = "\t$provide.value('{0}', {0} = jasmine.createSpyObj('{0}', [{1}]));";
  private provideBodyConstTemplate: string = "\t$provide.value('{0}', {0} = {});";
  private providePrefix: string = 'beforeEach(module(function($provide) {';
  private provideSuffix: string = '}));';
  private provideTemplate: string = '{0}\n{1}\n{2}';
  private testTemplate: string = '{0}\n\n{1}';

  public generateTemplate(fileContents: string): string {
    if (!fileContents)
      return;

    let injections = this.getInjections(fileContents);

    if (!injections)
      return;

    let names = _.pluck(injections, 'name');
    let varDeclarationBody = _.reduce(names, (aggregate, name) => {
      return this.commaListTemplate.formatUnicorn(aggregate, name);
    });
    let varDeclaration = this.varDeclarationTemplate.formatUnicorn(varDeclarationBody);

    let provideBodyLines = _.map(injections, injection => {
      let quotedMethods = _.map(injection.methods, method => {
        return this.quoteTemplate.formatUnicorn(method);
      });
      if (!quotedMethods.length)
        return this.provideBodyConstTemplate.formatUnicorn(injection.name);
      let methodList = _.reduce(quotedMethods, (aggregate, method) => {
        return this.commaListTemplate.formatUnicorn(aggregate, method);
      });
      return this.provideBodyTemplate.formatUnicorn(injection.name, methodList);
    });
    let provideBody = _.reduce(provideBodyLines, (aggregate, line) => {
      return this.newlineListTemplate.formatUnicorn(aggregate, line);
    });
    let provide = this.provideTemplate.formatUnicorn(this.providePrefix, provideBody, this.provideSuffix);

    return this.testTemplate.formatUnicorn(varDeclaration, provide);
  }

  private getInjections(fileContents: string) {
    let declaration = fileContents.match(this.declarationsRegexp);

    if (!declaration || !declaration[1])
      return;

    let injections = _.map(declaration[1].split(', '), component => {
      return {name: component, methods: []};
    });

    _.each(injections, injection => {
      let regexp = RegExp(this.invocationsRegexpTemplate.formatUnicorn(injection.name[0] === '$' ? '\\' : '', injection.name), 'g');
      let invocations = fileContents.match(regexp);
      injection.methods = _.map(invocations, invocation => {
        return invocation.match(this.methodRegexp)[1];
      });
    });

    return injections;
  }
}

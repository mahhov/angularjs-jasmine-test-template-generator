import {Injectable} from "@angular/core";
import * as _ from "underscore";

@Injectable()
export class Generator {
  private readonly commaListTemplate: string = '{0}, {1}';
  private readonly newlineListTemplate: string = '{0}\n{1}';

  public generateTemplate(fileContents: string): string {
    let testTemplate: string = '{0}\n\n{1}';

    if (!fileContents)
      return;
    let injections = this.getInjections(fileContents);
    if (!injections)
      return;

    let provideDeclarations = this.getProvideDeclarations(injections);
    let provide = this.getProvideBody(injections);

    return testTemplate.formatUnicorn(provideDeclarations, provide);
  }

  private getInjections(fileContents: string) {
    let declarationsRegexp = /function\((.*)\)/;
    let invocationsRegexpTemplate: string = '{0}{1}\\.\\w*\\(';
    let methodRegexp = /\.(\w*)/;

    let declaration = fileContents.match(declarationsRegexp);

    if (!declaration || !declaration[1])
      return;

    let injections = _.map(declaration[1].split(', '), component => {
      return {name: component, methods: []};
    });

    _.each(injections, injection => {
      let regexp = RegExp(invocationsRegexpTemplate.formatUnicorn(injection.name[0] === '$' ? '\\' : '', injection.name), 'g');
      let invocations = fileContents.match(regexp);
      injection.methods = _.map(invocations, invocation => {
        return invocation.match(methodRegexp)[1];
      });
    });

    return injections;
  }

  private getProvideDeclarations(injections) {
    let provideDeclarationTemplate: string = 'var {0};';

    let names = _.pluck(injections, 'name');
    let provideDeclarationBody = _.reduce(names, (aggregate, name) => {
      return this.commaListTemplate.formatUnicorn(aggregate, name);
    });
    return provideDeclarationTemplate.formatUnicorn(provideDeclarationBody);
  }

  private getProvideBody(injections) {
    let quoteTemplate: string = "'{0}'";
    let provideBodyTemplate: string = "\t$provide.value('{0}', {0} = jasmine.createSpyObj('{0}', [{1}]));";
    let provideBodyConstTemplate: string = "\t$provide.value('{0}', {0} = {});";
    let provideTemplate: string = 'beforeEach(module(function($provide) {\n{0}\n}));';

    let provideBodyLines = _.map(injections, injection => {
      let quotedMethods = _.map(injection.methods, method => {
        return quoteTemplate.formatUnicorn(method);
      });
      if (!quotedMethods.length)
        return provideBodyConstTemplate.formatUnicorn(injection.name);
      let methodList = _.reduce(quotedMethods, (aggregate, method) => {
        return this.commaListTemplate.formatUnicorn(aggregate, method);
      });
      return provideBodyTemplate.formatUnicorn(injection.name, methodList);
    });
    let provideBody = _.reduce(provideBodyLines, (aggregate, line) => {
      return this.newlineListTemplate.formatUnicorn(aggregate, line);
    });
    return provideTemplate.formatUnicorn(provideBody);
  }
}

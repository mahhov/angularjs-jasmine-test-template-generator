import {Injectable} from "@angular/core";
import * as _ from "underscore";

@Injectable()
export class Generator {

  public generateTemplate(fileContents: String): string {
    let declarationsRegexp = /function\((.*)\)/;
    let invocationsRegexpTemplate = '{0}{1}\\.\\w*\\(';
    let methodRegexp = /\.(\w*)/;
    let commaListTemplate = '{0}, {1}';
    let newlineListTemplate = '{0}\n{1}';
    let varDeclarationTemplate = 'var {0};';
    let quoteTemplate = "'{0}'";
    let provideBodyTemplate = "\t$provide.value('{0}', {0} = jasmine.createSpyObj('{0}', [{1}]));";
    let provideBodyConstTemplate = "\t$provide.value('{0}', {0} = {});";
    let providePrefix = 'beforeEach(module(function($provide) {';
    let provideSuffix = '}));';
    let provideTemplate = '{0}\n{1}\n{2}';
    let testTemplate = '{0}\n\n{1}';

    if (!fileContents)
      return;

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

    let names = _.pluck(injections, 'name');
    let varDeclarationBody = _.reduce(names, (aggregate, name) => {
      return commaListTemplate.formatUnicorn(aggregate, name);
    });
    let varDeclaration = varDeclarationTemplate.formatUnicorn(varDeclarationBody);

    let provideBodyLines = _.map(injections, injection => {
      let quotedMethods = _.map(injection.methods, method => {
        return quoteTemplate.formatUnicorn(method);
      });
      if (!quotedMethods.length)
        return provideBodyConstTemplate.formatUnicorn(injection.name);
      let methodList = _.reduce(quotedMethods, (aggregate, method) => {
        return commaListTemplate.formatUnicorn(aggregate, method);
      });
      return provideBodyTemplate.formatUnicorn(injection.name, methodList);
    });
    let provideBody = _.reduce(provideBodyLines, (aggregate, line) => {
      return newlineListTemplate.formatUnicorn(aggregate, line);
    });
    let provide = provideTemplate.formatUnicorn(providePrefix, provideBody, provideSuffix);

    return testTemplate.formatUnicorn(varDeclaration, provide);
  }
}

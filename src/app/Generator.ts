import {Injectable} from "@angular/core";
import * as _ from "underscore";

@Injectable()
export class Generator {
  private readonly commaListTemplate: string = '{0}, {1}';
  private readonly newlineListTemplate: string = '{0}\n{1}';
  private readonly declarationTemplate: string = 'var {0};';

  public generateTemplate(fileContents: string): string {
    let testTemplate: string = "'use strict';\n\ndescribe('{0}', function () {\n\t{1}\n\t{2}\n\n{3}\n\n});";

    if (!fileContents)
      return;
    let injections = this.getInjections(fileContents);
    if (!injections)
      return;

    let provideDeclarations = this.getProvideDeclarations(injections);
    let provide = this.getProvideBody(injections);
    let promiseDeclarations = this.getPromiseDeclarations(injections);

    return testTemplate.formatUnicorn(injections.name, provideDeclarations, promiseDeclarations, provide);
  }

  private getInjections(fileContents: string) {
    let declarationsRegexp = /function\((.*)\)/;
    let serviceNameTemplate: string = '{0}{1}';
    let invocationsRegexpTemplate: string = '{0}\\.\\w*\\(';
    let promiseInvocationRegexpTemplate: string = '{0}\\.{1}\\([\\w, ]*\\)\\.then\\(';
    let methodRegexp = /\.(\w*)/;

    let declaration = fileContents.match(declarationsRegexp);

    if (!declaration || !declaration[1])
      return;

    let injections = _.map(declaration[1].split(', '), component => {
      return {name: component, methods: []};
    });

    _.each(injections, injection => {
      let serviceName = serviceNameTemplate.formatUnicorn(injection.name[0] === '$' ? '\\' : '', injection.name);
      let regexp = RegExp(invocationsRegexpTemplate.formatUnicorn(serviceName), 'g');
      let invocations = fileContents.match(regexp);

      injection.methods = _.map(invocations, invocation => {
        let method = invocation.match(methodRegexp)[1];
        let isPromise = !!fileContents.match(RegExp(promiseInvocationRegexpTemplate.formatUnicorn(serviceName, method)));
        return {name: method, isPromise: isPromise};
      });
    });

    injections.name = 'x';

    return injections;
  }

  private getProvideDeclarations(injections) {
    let names = _.pluck(injections, 'name');
    let declarationBody = _.reduce(names, (aggregate, name) => {
      return this.commaListTemplate.formatUnicorn(aggregate, name);
    });
    return this.declarationTemplate.formatUnicorn(declarationBody);
  }

  private getProvideBody(injections) {
    let quoteTemplate: string = "'{0}'";
    let provideBodyTemplate: string = "\t\t$provide.value('{0}', {0} = jasmine.createSpyObj('{0}', [{1}]));";
    let provideBodyConstTemplate: string = "\t\t$provide.value('{0}', {0} = {});";
    let provideTemplate: string = '\tbeforeEach(module(function($provide) {\n{0}\n\t}));';

    let provideBodyLines = _.map(injections, injection => {
      let quotedMethods = _.map(injection.methods, method => {
        return quoteTemplate.formatUnicorn(method.name);
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

  private getPromiseDeclarations(injections) {
    let deferTemplate: string = '{0}Defer';

    let promiseMethods = _.map(_.pluck(_.filter(_.flatten(_.pluck(injections, 'methods')), method => {
      return method.isPromise
    }), 'name'), name => {
      return deferTemplate.formatUnicorn(name);
    });

    let declarationBody = _.reduce(promiseMethods, (aggregate, method) => {
      return this.commaListTemplate.formatUnicorn(aggregate, metho);
    });

    return this.declarationTemplate.formatUnicorn(declarationBody);
  }
}


// todo uniques
// todo suport new line / whitespace trim

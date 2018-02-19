import {Injectable} from "@angular/core";
import * as _ from "underscore";

@Injectable()
export class Generator {
  private readonly commaListTemplate: string = '{0}, {1}';
  private readonly newlineListTemplate: string = '{0}\n{1}';
  private readonly declarationTemplate: string = 'var {0};';

  public generateTemplate(fileContents: string): string {
    let testTemplate: string = "'use strict';\n\ndescribe('{0}', function () {\n\t{1}\n\t{2}\n\n{3}\n\n{4}\n});";

    if (!fileContents)
      return;

    let injections = this.getInjections(fileContents);

    if (!injections)
      return;

    let promises = this.getPromises(injections);

    let provideDeclarations = this.getProvideDeclarations(injections);
    let provideBody = this.getProvideBody(injections);

    let promiseDeclarations = this.getPromiseDeclarations(promises);
    let promiseBody = this.getPromiseBody(promises);

    return testTemplate.formatUnicorn(injections.name, provideDeclarations, promiseDeclarations, provideBody, promiseBody);
  }

  private getInjections(fileContents: string) {
    let declarationsRegexp = /angular\.module\('(\w*).(\w*)'\).(\w*)\('(\w*)',\s*function\((.*)\)/;
    let moduleNameTemplate: string = '{0}.{1}';
    let serviceNameTemplate: string = '{0}{1}';
    let invocationsRegexpTemplate: string = '{0}\\.\\w*\\(';
    let promiseInvocationRegexpTemplate: string = '{0}\\.{1}\\([\\w, ]*\\)\\.then\\(';
    let methodRegexp = /\.(\w*)/;

    let declaration = fileContents.match(declarationsRegexp);

    if (!declaration || declaration.length < 6)
      return;

    let module = moduleNameTemplate.formatUnicorn(declaration[1], declaration[2]);
    let componentType = declaration[3];
    let name = declaration[4];
    let dependencies = declaration[5];

    let injections = _.map(dependencies.split(', '), component => {
      return {name: component, methods: []};
    });

    _.each(injections, injection => {
      let serviceName = serviceNameTemplate.formatUnicorn(injection.name[0] === '$' ? '\\' : '', injection.name);
      let regexp = RegExp(invocationsRegexpTemplate.formatUnicorn(serviceName), 'g');
      let invocations = fileContents.match(regexp);

      injection.methods = _.map(_.unique(invocations), invocation => {
        let method = invocation.match(methodRegexp)[1];
        let isPromise = !!fileContents.match(RegExp(promiseInvocationRegexpTemplate.formatUnicorn(serviceName, method)));
        return {name: method, isPromise: isPromise};
      });
    });

    injections.name = name;
    injections.module = module;
    injections.componentType = componentType;

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

  private getPromises(injections) {
    let deferTemplate: string = '{0}Defer';

    return _.flatten(_.map(injections, injection => {
      return _.map(_.filter(injection.methods, method => {
        return method.isPromise;
      }), method => {
        return {method: method.name, object: injection.name, defer: deferTemplate.formatUnicorn(method.name)};
      })
    }));
  }

  private getPromiseDeclarations(promises) {
    let declarationBody = _.reduce(_.pluck(promises, 'defer'), (aggregate, declaration) => {
      return this.commaListTemplate.formatUnicorn(aggregate, declaration);
    });

    return this.declarationTemplate.formatUnicorn(declarationBody);
  }

  private getPromiseBody(promises) {
    let promiseBodyTemplate: string = '\t\t{0} = $q.defer();\n\t\t{1}.{2}.and.returnValue({0}.promise);';
    let promiseTemplate: string = '\tbeforeEach(inject(function($q) {\n{0}\n\t}));';

    let promiseBodyLines = _.map(promises, promise => {
      return promiseBodyTemplate.formatUnicorn(promise.defer, promise.object, promise.method);
    });
    let promiseBody = _.reduce(promiseBodyLines, (aggregate, line) => {
      return this.newlineListTemplate.formatUnicorn(aggregate, line);
    });
    return promiseTemplate.formatUnicorn(promiseBody);
  }
}

// todo
// suport new line / whitespace trim
// module
// describes per method
// constructor based on service / ctrl / dir / factory

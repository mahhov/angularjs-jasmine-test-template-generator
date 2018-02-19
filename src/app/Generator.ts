import {Injectable} from "@angular/core";
import * as _ from "underscore";

@Injectable()
export class Generator {
  private readonly commaListTemplate: string = '{0}, {1}';
  private readonly newlineListTemplate: string = '{0}\n{1}';
  private readonly declarationTemplate: string = 'var {0};';

  public generateTemplate(fileContents: string): string {
    let testTemplate: string = "'use strict';\n\ndescribe('{0}', function () {\n\t{1}\n\t{2}\n\t{3}\n\n\t{4}\n\n{5}\n\n{6}\n\n{7}\n\n{8}\n});";

    if (!fileContents)
      return;

    let injections = this.getInjections(fileContents);

    if (!injections)
      return;

    let promises = this.getPromises(injections);
    let methods = this.getMethods(fileContents);

    let module = this.getModule(injections);
    let provideDeclarations = this.getProvideDeclarations(injections);
    let provideBody = this.getProvideBody(injections);
    let promiseDeclarations = this.getPromiseDeclarations(promises);
    let promiseBody = this.getPromiseBody(promises);
    let constructorDeclaration = this.getConstructorDeclaration(injections);
    let constructorBody = this.getConstructorBody(injections);
    let describes = this.getDescribes(methods);

    return testTemplate.formatUnicorn(injections.name, provideDeclarations, promiseDeclarations, constructorDeclaration, module, provideBody, promiseBody, constructorBody, describes);
  }

  private getInjections(fileContents: string) {
    let declarationRegexp = /angular\.module\('(\w*).(\w*)'\).(\w*)\('(\w*)',\s*function\((.*)\)/;
    let moduleNameTemplate: string = '{0}.{1}';
    let serviceNameTemplate: string = '{0}{1}';
    let invocationsRegexpTemplate: string = '{0}\\.\\w*\\(';
    let promiseInvocationRegexpTemplate: string = '{0}\\.{1}\\([\\w, ]*\\)\\.then\\(';
    let methodRegexp = /\.(\w*)/;

    let declaration = fileContents.match(declarationRegexp);

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

  private getMethods(fileContents: string) {
    let methodRegexp = /(this|scope)\.(\w*) = function/;
    let methodRegexpGlobal = RegExp(methodRegexp, 'g');

    let methods = fileContents.match(methodRegexpGlobal);

    return _.map(methods, method => {
      return method.match(methodRegexp)[2];
    });
  }

  private getModule(injections) {
    let moduleTemplate = "beforeEach(module('{0}'));";
    let directiveModuleTemplate = "beforeEach(module('{0}', 'template'));";

    return injections.componentType === 'directive' ? directiveModuleTemplate.formatUnicorn(injections.module) : moduleTemplate.formatUnicorn(injections.module);
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
    let provideTemplate: string = '\tbeforeEach(module(function ($provide) {\n{0}\n\t}));';

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

  private getPromiseDeclarations(promises) {
    let declarationBody = _.reduce(_.pluck(promises, 'defer'), (aggregate, declaration) => {
      return this.commaListTemplate.formatUnicorn(aggregate, declaration);
    });

    return this.declarationTemplate.formatUnicorn(declarationBody);
  }

  private getPromiseBody(promises) {
    let promiseBodyTemplate: string = '\t\t{0} = $q.defer();\n\t\t{1}.{2}.and.returnValue({0}.promise);';
    let promiseTemplate: string = '\tbeforeEach(inject(function ($q) {\n{0}\n\t}));';

    let promiseBodyLines = _.map(promises, promise => {
      return promiseBodyTemplate.formatUnicorn(promise.defer, promise.object, promise.method);
    });
    let promiseBody = _.reduce(promiseBodyLines, (aggregate, line) => {
      return this.newlineListTemplate.formatUnicorn(aggregate, line);
    });
    return promiseTemplate.formatUnicorn(promiseBody);
  }

  private getConstructorDeclaration(injections) {
    let constructorDeclarationTemplate: string = 'var {0};';
    return constructorDeclarationTemplate.formatUnicorn(injections.componentType === 'directive' || injections.componentType === 'controller' ? 'scope' : injections.name);
  }

  private getConstructorBody(injections) {
    let constructorBodyTemplate: string = '\tbeforeEach(inject(function (_{0}_) {\n\t\t{0} = _{0}_\n\t}));';
    let constructorControllerBodyTemplate: string = "\tbeforeEach(inject(function ($rootScope, $controller) {\n\t\tscope = $rotScope.$new();\n\t\t$controller('{0}', {\n\t\t\t$scope: scope\n\t\t});\n\t}));";
    let constructorDirectiveBodyTemplate: string = "\tbeforeEach(inject(function ($rootScope, $compile) {\n\t\tvar template = '<{0}></{0}>';\n\t\tvar directive = $compile(template)($rootScope);\n\t\t$rootScope.$digest();\n\t\tscope = directive.isolateScope()\n\t}));";

    switch (injections.componentType) {
      case 'directive':
        return constructorDirectiveBodyTemplate.formatUnicorn(injections.name);
        break;
      case 'controller':
        return constructorControllerBodyTemplate.formatUnicorn(injections.name);
      default:
        return constructorBodyTemplate.formatUnicorn(injections.name);
    }
  }

  private getDescribes(methods) {
    let describeTemplate: string = "\tdescribe('#{0}', function () {\n\t});";

    return _.reduce(_.map(methods, (method) => {
      return describeTemplate.formatUnicorn(method);
    }), (aggregate, describe) => {
      return '{0}\n\n{1}'.formatUnicorn(aggregate, describe);
    });
  }
}

// todo
// suport new line / whitespace trim
// directive constructor for template params

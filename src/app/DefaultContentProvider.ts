import {Injectable} from "@angular/core";

@Injectable()
export class DefaultContentProvider {
  public betterNavBarDirective(): string {
    return `
      angular.module('candyModule')
        .directive('chocolateDirective', function ($window, $cookieStore, syrupService, creamService, gingerbreadFactory) {
          return {
            restrict: 'E',
            replace: true,
            templateUrl: 'lala.html',
            scope: {
              param1: "=",
              param2: "="
            },
            controller: function ($scope, $state, $location, cakeService, cupcakeService) {
              $scope.cakeEaten = cakeService.eatCake();
              cupcakeService.bakeCupcake(gingerbreadFactory.cookie, syrupService.getChocolate());
            }
          };
        });`;
  }
}

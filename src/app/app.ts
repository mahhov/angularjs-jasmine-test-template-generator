import {Component} from "@angular/core";
import {Generator} from "./Generator";

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})

export class App {
  fileContents: string;
  test: string;

  constructor(private generator: Generator) {
    this.fileContents =
      `angular.module('CSSRedesign.common')
        .directive('betterNavBar', function ($window, $cookieStore, commonService, esignatureService, externalLinkService, sortPoliciesFactory, billingService) {
          return {
            restrict: 'E',
            replace: true,
            templateUrl: $window.UIC.sitePrefix + 'components/megamenu/navbar/betternavbar.html',
            scope: {
              chatdocid: "=",
              chatpagename: "="
            },
            controller: function ($scope, $state, $location, getCookieService, createloginIdCookie, liveChatService) {
              $scope.isLiveChatOpen = liveChatService.isLiveChatOpen;
      
              $scope.sitePrefix = (window.sitePrefix) ? window.sitePrefix : "";
              $scope.signOutUrl = externalLinkService.externalLink('UserSignout');
      
              $scope.initMenuItems = function () {
                $scope.menuItems = [
                  {text: 'Homepage', path: 'policysummary', disabled: false, gtm: 'CSS_Homepage_Menu_Click'},
                  {text: 'Policies', path: 'policydetails', disabled: false, gtm: 'CSS_Policies_Menu_Click'},
                  {text: 'Payments', path: 'billingsummary', disabled: false, gtm: 'CSS_Payments_Menu_Click'},
                  {text: 'Claims', path: 'claims', disabled: false, gtm: 'CSS_Claims_Menu_Click'},
                  {text: 'My Profile', path: 'editprofile', disabled: false, gtm: 'CSS_MyProfile_Menu_Click'},
                  {text: 'Help', path: 'contactus', disabled: false, gtm: 'CSS_Help_Menu_Click'}
                ];
              };
      
              $scope.initMenuItems();
      
              $scope.menuSelect = function (menu) {
                if (!menu.disabled) {
                  $scope.hideMenu();
                  $location.path(menu.path);
                }
              };
      
              $scope.selected = function (menu) {
                return $location.path() === '/' + menu.path;
              };
      
              $scope.hideMenu = function () {
                $('#main-header, #mainNav, .navbar-collapse').removeClass('openslide');
                $('.better-nav-bar .fixed-position .row').addClass('mobile-hidden');
              };
      
              $scope.eSignOrSignOut = function () {
                $scope.hideMenu();
                $cookieStore.remove('eSignInProgress');
      
                commonService.loggedInfo()
                  .then($scope.getEsignSummaryInfo)
                  .then(function (data) {
                    if ($scope.userHasEsignPackagesToSign(data)) {
                      $scope.showEsignModal();
                    } else {
                      $scope.signOut();
                    }
                  }).catch($scope.signOut);
              };
      
              $scope.getEsignSummaryInfo = function (policyResponse) {
                policyResponse = _.isArray(policyResponse) ? policyResponse[0] : policyResponse;
                var policyContractList = sortPoliciesFactory.getEsignatureServiceInput(policyResponse.policyList);
                return esignatureService.geteSignSummaryInfo({
                  "userId": window.userId,
                  "policyContractList": policyContractList,
                  "futurePolicyList": $scope.futurePolicyList,
                  "emailType": (window.emailType) ? window.emailType : 'N'
                });
              };
      
              $scope.userHasEsignPackagesToSign = function (data) {
                return angular.lowercase(data.transactionStatus) === 's' && angular.lowercase(data.isValid) === 'y' && !data.hasNonHoHPackages;
              };
      
              $scope.showEsignModal = function () {
                angular.element('#donealreadyModal').modal('show');
              };
      
              $scope.signOut = function () {
                window.onbeforeunload = null;
                getCookieService.getCookie('farmersSurveyCustinfo').then(function (data) {
                  createloginIdCookie.storeRememberCookie(data, 'farmersSurveyCustinfo');
                  $scope.setSignOutUrl();
                }, function () {
                  $scope.setSignOutUrl();
                });
              };
      
              $scope.setSignOutUrl = function () {
                window.location.href = $scope.signOutUrl;
              };
      
              $scope.disablePayments = function () {
                var paymentMenuItem = _.find($scope.menuItems, function (menuItem) {
                  return menuItem.path === 'billingsummary';
                });
                if (paymentMenuItem) {
                  paymentMenuItem.disabled = true;
                }
              };
      
              billingService.getHasNoSavedPayments().then(function (noSavedPayments) {
                if (noSavedPayments) {
                  $scope.disablePayments();
                }
              });
      
              billingService.isOnlyLifePolicy().then(function (result) {
                $scope.onlyLifePolicy = result;
              });
      
              $scope.$on('disableMenu', function () {
                _.each($scope.menuItems, function (item) {
                  item.disabled = true;
                });
                $scope.farmersLogoLinkDisabled = true;
              });
      
              $scope.$on('enableMenu', function () {
                $scope.initMenuItems();
                $scope.farmersLogoLinkDisabled = false;
                billingService.getHasNoSavedPayments().then(function (noSavedPayments) {
                  if (noSavedPayments) {
                    $scope.disablePayments();
                  }
                });
              });
            }
          };
        });`;
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

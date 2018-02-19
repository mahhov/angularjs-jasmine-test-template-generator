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
      `'use strict';

    angular.module('CSSRedesign.policySummary').directive('overviewCard',
        function($window, $filter, $state, $q, $cookieStore, policyService, recentBillingActivityService, imagesDefaultConstant, currencyFixFilter, formatDateFilter, billingService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/policy/summary/overviewcard.html',
                scope: {
                    billingAccount: '=',
                    isPlaPolicy: '=',
                    policyList: '=',
                    isBristolWest: '=',
                    isForemost: '=',
                    oneTimePayment: '=',
                    sysdate: '=',
                    billingMaintenance: '='
                },
                controller: function($scope, policyService, tagManagerService) {
                    $scope.init = function () {
                        $scope.siteprefix = (window.sitePrefix) ? window.sitePrefix : "";
                        $scope.futureOneTimePaymentLink = window.futureOneTimePayment;
                        $scope.isBillingShown = false;
                        $scope.noSavedPayments = false;
                        $scope.dunningLevelOver3 = false;
                        $scope.paymentPlanLabel = $scope.billingAccount && policyService.getPaymentPlanLabel($scope.billingAccount);
                    };

                    $scope.init();

                    _.each($scope.policyList, function(policy) {
                        policy.showImage = true;
                    });

                    var obj1, obj2;
                    var cookieCallingFunction = function(policy) {
                        if (!policy.forDisplay) {
                            obj1 = {
                                'userId': window.userId,
                                'policyContractnumber': policy.policyContractnumber
                            };
                            obj2 = {
                                'userId': window.userId,
                                'billingAccountNumber': policy.billingInformation.billingAccountNumber
                            };

                        }
                        if (policy.forDisplay) {
                            obj1 = {
                                'userId': window.userId,
                                'policyContractnumber': policy.policyContractnumber
                            };
                            obj2 = {
                                'userId': window.userId,
                                'billingAccountNumber': policy.billingAccountNumber
                            };
                        }

                        $cookieStore.put('policyContractnumber', obj1);
                        $cookieStore.put('billingAccountNumber', obj2);
                        var policyInfoData = {};
                        policyInfoData.policyState = policy.state;
                        $cookieStore.put('policyState', policyInfoData);

                    };

                    $scope.viewStatement = function(url) {
                        window.open(url, '_blank');
                    };

                    $scope.getIDCards = function(policy) {
                        cookieCallingFunction(policy);
                        $state.transitionTo('idcards');
                    };

                    //need to change this FUZZY to add the new images
                    $scope.getImageUrl = function (policy) {
                        if (policy.policyType && (policy.policyType.toUpperCase() === 'RENTERS' || policy.policyType.toUpperCase() === 'RENTER' || policy.policyType.toUpperCase() === 'RENT')) {
                            return imagesDefaultConstant.imagePathPolicy['RENT'];
                        }

                        if (policy.lineOfBusiness && (policy.lineOfBusiness.toUpperCase() === 'MEDIUM DUTY TRUCK')) {
                            return imagesDefaultConstant.imagePathPolicy['AUTO'];
                        }

                        if (policy.policySource && policy.policySource.toUpperCase() === 'FM') {
                            return imagesDefaultConstant.imagePathPolicy[policy.policyType.toUpperCase()];
                        }

                        if (policy && typeof policy.policyType === 'string') {
                            policy.showImage = imagesDefaultConstant.imagePathPolicy[policy.lineOfBusiness.toUpperCase()] === undefined ? false : true;
                            return imagesDefaultConstant.imagePathPolicy[policy.lineOfBusiness.toUpperCase()];
                        }
                    };

                    $scope.showGetID = function(policy) {
                        return policy.lineOfBusiness.toUpperCase() === 'AUTO';
                    };

                    $scope.showGetEvidence = function(policy) {
                        return policy.lineOfBusiness.toUpperCase() === 'HOME' && policy.policyType.toUpperCase() !== 'RENTERS';
                    };

                    $scope.getPolicyType = function(policy) {
                        return policyService.getPolicyType(policy);
                    };

                    // view bill
                    $scope.setBillingAccount = function() {
                        $window.UIC.billingAccountNav = $scope.billingAccount.billingAccountNumber;
                        $window.UIC.switchBillingAccountNav = false;
                        $state.transitionTo('billingstatements', {billingAccountInfo: $scope.billingAccount});
                    };

                    // pay bill
                    $scope.payBill = function() {
                        $scope.$emit('incrementXHRCounter');

                        tagManagerService.pushEvent({
                            event: 'synthetic-click',
                            cssAction: 'CSS_BillingSummary_PayBillbutton_Click'
                        });
                        $window.location.href = '#/billingsummary?acctNum=' + $scope.billingAccount.billingAccountNumber + '&viewState=paybill';
                    };

                    $scope.getPolicyDescription = function(policy) {
                        return policyService.getPolicyDescriptionLong(policy);
                    };

                    $scope.isPaymentDueShown = function() {
                        return policyService.isPaymentDueShown($scope.billingAccount) ? {"visibility": "visible"} : {"visibility": "hidden"};
                    };

                    $scope.setIsBillingShown = function() {
                        $scope.isBillingShown = false;
                        if($scope.billingMaintenance &&  $scope.billingMaintenance.isOnMaintenance  && $scope.noSavedPayments) {
                            $scope.isBillingShown = false;
                            return;
                        }
                        if ($scope.billingMaintenance && $scope.billingMaintenance.isOnMaintenance && !$scope.noSavedPayments) {
                            $scope.isBillingShown = true;
                            return;
                        }

                        if ($scope.billingAccount && policyService.checkAllowPayment($scope.billingAccount, null, $scope.sysdate)) {
                            for (var i = 0; i < $scope.policyList.length; i++) {
                                //TODO: remove after temp FED policies no longer exist
                                if ($scope.policyList[i].billingInformation) {
                                    $scope.isBillingShown = true;
                                    return;
                                }
                            }
                        }
                    };

                    $scope.checkPayFullEligibility = function () {
                        if(!$scope.billingAccount) {
                            return;
                        }
                        $scope.billingAccount.isEligibleAutoPay = false;
                        var eligibilityDate = new Date($filter('formatDate')($scope.billingAccount.payInFullPayByDate));
                        var sys_date = new Date($filter('formatDate')($scope.sysdate.split('T')[0]));
                        if ((sys_date <= eligibilityDate) && ($scope.billingAccount.payplanCode === 'A2' || $scope.billingAccount.payplanCode === 'B2' || $scope.billingAccount.payplanCode === 'B4') && $scope.billingAccount.payInFullAmount && $scope.billingAccount.payInFullAmount !== 0) {
                            $scope.billingAccount.isEligiblePayFull = true;
                        }
                    };

                    $scope.isTempFuturePolicy = function(policy) {
                        return policy && policy.billingInformation === null;
                    };

                    $scope.ViewPolicyDetails = function(policy) {
                        var transitionParams = {
                            userId: window.userId,
                            billingAccountNumber: policy.billingInformation ? policy.billingInformation.billingAccountNumber : null,
                            policyContractNumber: policy.policyContractnumber
                        };
                        $state.go('policydetails', transitionParams);
                    };

                    $scope.setNotifications = function() {
                        if (!$scope.billingAccount) {
                            return;
                        }
                        $scope.setBillingNotifications();
                        $scope.setPolicyNotification();
                    };

                    $scope.setBillingNotifications = function() {
                        var isY = function(billingField) {
                            return billingField && billingField.toLowerCase() === 'y';
                        };

                        var notifications = [];

                        // all possible notifications
                        var payDueDateFormatted = formatDateFilter($scope.billingAccount.paymentDueDate);
                        var paymentDueAmountFormatted = $scope.billingAccount.paymentDueAmount && currencyFixFilter($scope.billingAccount.paymentDueAmount.toString());
                        var scheduledPaymentAmountFormatted = $scope.billingAccount.scheduledPaymentAmount && currencyFixFilter($scope.billingAccount.scheduledPaymentAmount.toString());
                        var scheduledPaymentDateFormatted = $scope.billingAccount.scheduledPaymentDate && formatDateFilter($scope.billingAccount.scheduledPaymentDate.toString());
                        var recuringPaymentDueDateFormatted = $scope.billingAccount.recuringPaymentDueDate && formatDateFilter($scope.billingAccount.recuringPaymentDueDate);
                        var inactiveNotification = {
                            type: 'alert-danger',
                            icon: 'fa-exclamation-triangle',
                            header: 'This account is inactive. Please contact your agent.'
                        };
                        var nocNotification = {
                            type: 'alert-danger',
                            icon: 'fa-exclamation-triangle',
                            header: "To avoid cancellation, payment in the amount of " + paymentDueAmountFormatted + " for account " + $scope.billingAccount.billingAccountNumber + " is due by " + payDueDateFormatted
                        };
                        var ienNotification = {
                            type: 'alert-danger',
                            icon: 'fa-exclamation-triangle',
                            header: isY(
                                $scope.billingAccount.autoPaymentFlag) ? ('An Important Expiration Notice has been issued due to non-payment of the premium. This account is enrolled in an Automatic Pay Plan but the normal automatic payment will not occur. To maintain coverage beyond the expiration date, please pay the payment due, which consists of the amount past due and the current amount due for account ' + $scope.billingAccount.billingAccountNumber) : ('An Important Expiration Notice has been issued due to non-payment of the premium. To maintain coverage beyond the expiration date, please pay the payment due, which consists of the amount past due and the current amount due for account ' + $scope.billingAccount.billingAccountNumber)
                        };
                        var overdueNotification = {
                            type: 'alert-danger',
                            icon: 'fa-exclamation-triangle',
                            header: "Payment of " + paymentDueAmountFormatted + " for account " + $scope.billingAccount.billingAccountNumber + " was due on " + payDueDateFormatted
                        };
                        var autoPayStopNotification = {
                            type: 'alert-warning',
                            icon: 'fa-info-circle',
                            header: 'Automatic payment of ' + paymentDueAmountFormatted + ' has been stopped for this billing cycle.'
                        };
                        var autoPayNotification = {
                            type: 'alert-info',
                            icon: 'fa-info-circle',
                            header: 'Automatic payment of ' + paymentDueAmountFormatted + ' is scheduled for ' + recuringPaymentDueDateFormatted
                        };
                        var scheduledPayNotification = {
                            type: 'alert-info',
                            icon: 'fa-info-circle',
                            header: 'Your payment of ' + scheduledPaymentAmountFormatted + ' is scheduled for ' + scheduledPaymentDateFormatted
                        };
                        var mortgageNotification = {
                            type: 'alert-info',
                            icon: 'fa-info-circle',
                            header: "New Bill: " + paymentDueAmountFormatted + " for account " + $scope.billingAccount.billingAccountNumber + " due on " + payDueDateFormatted + " will be paid by your mortgage company"
                        };
                        var highDunningNotification = {
                            type: 'alert-danger',
                            icon: 'fa-exclamation-triangle',
                            header: "This account is past due. Payments can't be made online. Please contact your agent."
                        };

                        var systemDate = $scope.sysdate && new Date($scope.sysdate.split('T')[0]);
                        var paymentDate = $scope.billingAccount.paymentDueDate && new Date($scope.billingAccount.paymentDueDate);
                        var recuringDate = $scope.billingAccount.recuringPaymentDueDate && new Date($scope.billingAccount.recuringPaymentDueDate);
                        var scheduledPayDate = $scope.billingAccount.scheduledPaymentDate && new Date($scope.billingAccount.scheduledPaymentDate);
                        var paymentDueAmount = $scope.billingAccount.paymentDueAmount;

                        var dunningLevelGreater3 = parseInt($scope.billingAccount.dunningLevel, 10) > 3 && paymentDueAmount > 0;
                        var NOCFlag = isY($scope.billingAccount.NOCFlag) && paymentDueAmount > 0 && payDueDateFormatted !== "";
                        var IENFlag = isY($scope.billingAccount.IENFlag) && paymentDueAmount > 0;
                        var reinstatementFlag = isY($scope.billingAccount.reinstatementFlag);
                        var firstStatementFlag = isY($scope.billingAccount.FirstStatementGeneratorFlag);
                        var autoPayStopFlag = isY($scope.billingAccount.autoPaymentFlag) && isY($scope.billingAccount.isStopDraftProcessed) && recuringDate > systemDate && paymentDueAmount > 0;
                        var autoPayFlag = isY($scope.billingAccount.autoPaymentFlag) && !isY($scope.billingAccount.isStopDraftProcessed) && recuringDate > systemDate && paymentDueAmount > 0;
                        var scheduledPayFlag = isY($scope.billingAccount.scheduledPaymentFlag) && $scope.billingAccount.scheduledPaymentAmount > 0;
                        var mortgageFlag = isY($scope.billingAccount.mortgageeIndicator) && paymentDueAmount > 0 && payDueDateFormatted !== "";

                        $scope.showCurrentBalance = !(isY($scope.billingAccount.mortgageeIndicator) || $scope.billingAccount.isEligiblePayFull || $scope.billingAccount.payplanCode==='MT' || $scope.billingAccount.payplanCode==='AM');

                        if (policyService.isInactiveBilling($scope.billingAccount)) {
                            notifications.push(inactiveNotification);
                        }
                        if (dunningLevelGreater3) {
                            notifications.push(highDunningNotification);
                            $scope.dunningLevelOver3 = true;
                        } else if (NOCFlag) {
                            notifications.push(nocNotification);
                        } else if (IENFlag) {
                            notifications.push(ienNotification);
                        } else if (!reinstatementFlag || firstStatementFlag) {
                            if (autoPayStopFlag) {
                                notifications.push(autoPayStopNotification);
                            }
                            if (autoPayFlag && (!scheduledPayFlag || recuringDate < scheduledPayDate)) {
                                notifications.push(autoPayNotification);
                            } else if (scheduledPayFlag && (!autoPayFlag || scheduledPayDate <= recuringDate) && (!mortgageFlag || scheduledPayDate <= paymentDate)) {
                                notifications.push(scheduledPayNotification);
                            } else if (mortgageFlag && (!scheduledPayFlag || paymentDate < scheduledPayDate)) {
                                notifications.push(mortgageNotification);
                            } else if (paymentDate && paymentDate < systemDate && paymentDueAmount > 0) {
                                notifications.push(overdueNotification);
                            }
                        }

                        $scope.notifications = notifications;
                    };

                    $scope.setPolicyNotification = function() {
                        _.each($scope.policyList, function(policy) {
                            if (policyService.pendingCancellation(policy)) {
                                policy.notification = {
                                    type: 'alert-danger',
                                    icon: 'fa-exclamation-triangle',
                                    header: 'Your policy will be cancelled effective ' + formatDateFilter(policy.policyCancellationDate) + '. (Policy#: ' + policy.policyContractnumber + ')',
                                    message: 'If you have any questions that require immediate attention, please contact your agent or call us at <a class="phoneTag visible-xs" href="tel:1-855-878-3157">1-855-878-3157.</a><span style="white-space: nowrap" class="hidden-xs">1-855-878-3157.</span>'
                                };
                            } else if (policy.isFuturePolicy) {
                                policy.notification = {
                                    type: 'alert-info',
                                    icon: 'fa-info-circle',
                                    header: 'The coverage on this policy is going to be effective from ' + formatDateFilter(policy.policyEffectiveDate),
                                    message: 'If you have any questions that require immediate attention, please contact your agent or call us at <a class="phoneTag visible-xs" href="tel:1-855-878-3157">1-855-878-3157.</a><span style="white-space: nowrap" class="hidden-xs">1-855-878-3157.</span>'
                                };
                            } else if (policy.isLevy && policy.isLevy === 'Y') {
                                policy.notification = {
                                    type: 'alert-info',
                                    icon: 'fa-info-circle',
                                    header: 'Your new renewal offer is available.',
                                    message: '<a href="#/policydocuments?policyNum=' + policy.policyContractnumber + '">Click here to view your document.</a>'
                                };
                            }
                        });
                    };

                    $scope.setNotifications();
                    $scope.setIsBillingShown();
                    $scope.checkPayFullEligibility();

                    billingService.getHasNoSavedPayments().then(function(noSavedPayments) {
                        $scope.noSavedPayments = (noSavedPayments === true);
                        $scope.setIsBillingShown();
                    });

                    $scope.showPayBill = function() {
                        return (($scope.billingMaintenance && !$scope.noSavedPayments) || $scope.isBillingShown) && !$scope.dunningLevelOver3;
                    };
                }
            };
        });
    `;
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

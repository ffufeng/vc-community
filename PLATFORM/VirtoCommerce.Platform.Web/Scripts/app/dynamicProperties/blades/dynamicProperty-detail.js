﻿angular.module('platformWebApp')
.controller('platformWebApp.dynamicPropertyDetailController', ['$scope', 'platformWebApp.bladeNavigationService', 'platformWebApp.dialogService', 'platformWebApp.settings', 'platformWebApp.dynamicProperties.api', 'platformWebApp.dynamicProperties.dictionaryItemsApi', function ($scope, bladeNavigationService, dialogService, settings, dynamicPropertiesApi, dictionaryItemsApi) {
    var blade = $scope.blade;
    blade.headIcon = 'fa-plus-square-o';
    blade.title = 'platform.blades.dynamicProperty-detail.title';
    var localDictionaryValues = [];

    blade.refresh = function () {
        //Actualize displayed names to correspond to system languages
        settings.getValues({ id: 'VirtoCommerce.Core.General.Languages' }, function (languages) {
            blade.currentEntity = blade.isNew ? { valueType: 'ShortText', displayNames: [] } : blade.currentEntity;
            blade.currentEntity.displayNames = _.map(languages, function (x) {
                var retVal = { locale: x };
                var existName = _.find(blade.currentEntity.displayNames, function (y) { return y.locale.toLowerCase() == x.toLowerCase(); });
                if (angular.isDefined(existName)) {
                    retVal = existName;
                }
                return retVal;
            });
            blade.origEntity = blade.currentEntity;
            blade.currentEntity = angular.copy(blade.origEntity);
            blade.isLoading = false;
        });
    };


    $scope.arrayFlagValidator = function (value) {
        return !value || blade.currentEntity.valueType === 'ShortText' || blade.currentEntity.valueType === 'Integer' || blade.currentEntity.valueType === 'Decimal';
    };

    $scope.multilingualFlagValidator = function (value) {
        return !value || blade.currentEntity.valueType === 'ShortText' || blade.currentEntity.valueType === 'LongText' || blade.currentEntity.valueType === 'Html';
    };

    $scope.openChild = function (childType) {
        var newBlade = {
            id: "propertyChild",
            currentEntity: blade.currentEntity
        };

        switch (childType) {
            case 'valType':
                newBlade.controller = 'platformWebApp.propertyValueTypeController';
                newBlade.template = '$(Platform)/Scripts/app/dynamicProperties/blades/property-valueType.tpl.html';
                break;
            case 'dict':
                newBlade.isApiSave = !blade.isNew;
                newBlade.controller = 'platformWebApp.propertyDictionaryController';
                newBlade.template = '$(Platform)/Scripts/app/dynamicProperties/blades/property-dictionary.tpl.html';
                if (blade.isNew) {
                    newBlade.data = localDictionaryValues;
                    newBlade.onChangesConfirmedFn = function (data) {
                        localDictionaryValues = data;
                    }
                }
                break;
        }
        bladeNavigationService.showBlade(newBlade, blade);
        $scope.currentChild = childType;
    }

    $scope.setForm = function (form) {
        $scope.formScope = form;
    }

    function isDirty() {
        return !angular.equals(blade.currentEntity, blade.origEntity);
    };

    $scope.saveChanges = function () {
        if (blade.isNew) {
            dynamicPropertiesApi.save({ id: blade.objectType }, blade.currentEntity,
                function (data) {
                    blade.onChangesConfirmedFn(data);
                    // save dictionary items for new entity
                    if (data.isDictionary) {
                        dictionaryItemsApi.save({ id: blade.objectType, propertyId: data.id },
                            localDictionaryValues,
                            function () {
                                $scope.bladeClose();
                                blade.parentBlade.refresh();
                            },
                            function (error) { bladeNavigationService.setError('Error ' + error.status, blade); });
                    } else {
                        $scope.bladeClose();
                        blade.parentBlade.refresh();
                    }
                },
                function (error) { bladeNavigationService.setError('Error ' + error.status, blade); });
        } else {
            dynamicPropertiesApi.update({ id: blade.objectType, propertyId: blade.currentEntity.id }, blade.currentEntity,
                function () {
                    blade.refresh();
                    blade.parentBlade.refresh();
                },
                function (error) { bladeNavigationService.setError('Error ' + error.status, blade); });
        }
    };

    function deleteEntry() {
        var dialog = {
            id: "confirmDelete",
            title: "platform.dialogs.dynamic-property-delete.title",
            message: "platform.dialogs.dynamic-property-delete.message",
            callback: function (remove) {
                if (remove) {
                    dynamicPropertiesApi.delete({ id: blade.objectType, propertyId: blade.currentEntity.id },
                        function () {
                            $scope.bladeClose();
                            blade.parentBlade.refresh();
                        },
                        function (error) { bladeNavigationService.setError('Error ' + error.status, blade); });
                }
            }
        }
        dialogService.showConfirmationDialog(dialog);
    }

    if (!blade.isNew) {
        blade.toolbarCommands = [
        {
            name: "platform.commands.save", icon: 'fa fa-save',
            executeMethod: function () {
                $scope.saveChanges();
            },
            canExecuteMethod: function () {
                return isDirty() && $scope.formScope && $scope.formScope.$valid;
            },
            permission: 'platform:dynamic_properties:update'
        },
        {
            name: "platform.commands.reset", icon: 'fa fa-undo',
            executeMethod: function () {
                angular.copy(blade.origEntity, blade.currentEntity);
            },
            canExecuteMethod: function () {
                return isDirty();
            },
            permission: 'platform:dynamic_properties:update'
        },
        {
            name: "platform.commands.delete", icon: 'fa fa-trash-o',
            executeMethod: function () {
                deleteEntry();
            },
            canExecuteMethod: function () {
                return !isDirty() && !blade.isNew;
            },
            permission: 'platform:dynamic_properties:delete'
        }
        ];
    }

    // on load: 
    blade.refresh();
}]);
﻿angular.module('virtoCommerce.contentModule')
.controller('virtoCommerce.contentModule.editImageAssetController', ['$scope', 'platformWebApp.validators', 'platformWebApp.dialogService', 'platformWebApp.bladeNavigationService', 'virtoCommerce.contentModule.themes', 'FileUploader', function ($scope, validators, dialogService, bladeNavigationService, themes, FileUploader) {
    var blade = $scope.blade;

    $scope.validators = validators;
    var formScope;
    $scope.setForm = function (form) { formScope = form; }

    blade.initializeBlade = function () {
        if (!blade.newAsset) {
            themes.getAsset({ storeId: blade.choosenStoreId, themeId: blade.choosenThemeId, assetId: blade.choosenAssetId }, function (data) {
                blade.isLoading = false;

                data.content = "data:" + data.contentType + ";base64," + data.byteContent;

                blade.currentEntity = angular.copy(data);
                blade.origEntity = data;
            },
            function (error) { bladeNavigationService.setError('Error ' + error.status, $scope.blade); });

            $scope.blade.toolbarCommands = [
			{
			    name: "platform.commands.save", icon: 'fa fa-save',
			    executeMethod: function () {
			        blade.saveChanges();
			    },
			    canExecuteMethod: function () {
			        return isDirty() && formScope.$valid;
			    },
			    permission: 'content:update'
			},
			{
			    name: "platform.commands.reset", icon: 'fa fa-undo',
			    executeMethod: function () {
			        angular.copy(blade.origEntity, blade.currentEntity);
			    },
			    canExecuteMethod: function () {
			        return isDirty();
			    },
			    permission: 'content:update'
			},
			{
			    name: "platform.commands.delete", icon: 'fa fa-trash-o',
			    executeMethod: function () {
			        deleteEntry();
			    },
			    canExecuteMethod: function () {
			        return !isDirty();
			    },
			    permission: 'content:delete'
			}];
        }
        else {
            var data = angular.copy(blade.currentEntity);
            blade.origEntity = data;

            $scope.blade.toolbarCommands = [
			{
			    name: "platform.commands.save", icon: 'fa fa-save',
			    executeMethod: function () {
			        blade.saveChanges();
			    },
			    canExecuteMethod: function () {
			        return isDirty() && isCanSave();
			    },
			    permission: 'content:update'
			}];

            blade.isLoading = false;
        }
    }

    blade.check = function () {
        if (!angular.isUndefined(blade.currentEntity)) {
            if (blade.currentEntity.contentType === 'image/png' || blade.currentEntity.contentType === 'image/jpeg' || blade.currentEntity.contentType === 'image/bmp' || blade.currentEntity.contentType === 'image/gif') {
                return true;
            }
        }
        return false;
    }

    blade.getImage = function () {
        return blade.currentEntity.content;
    }

    blade.isImage = function () {
        if (!angular.isUndefined(blade.currentEntity)) {
            if (blade.currentEntity.contentType === 'image/png' ||
				blade.currentEntity.contentType === 'image/bmp' ||
				blade.currentEntity.contentType === 'image/gif' ||
				blade.currentEntity.contentType === 'image/jpeg') {

                return true;
            }
        }

        return false;
    }

    blade.saveChanges = function () {
        blade.isLoading = true;
        blade.currentEntity.id = blade.choosenFolder + '/' + blade.currentEntity.name;

        themes.updateAsset({ storeId: blade.choosenStoreId, themeId: blade.choosenThemeId }, blade.currentEntity, function () {
            blade.parentBlade.initialize();
            blade.choosenAssetId = blade.currentEntity.id;
            blade.title = blade.currentEntity.id;
            blade.subtitle = 'Edit asset';
            blade.newAsset = false;
            blade.initializeBlade();
        },
        function (error) { bladeNavigationService.setError('Error ' + error.status, $scope.blade); });
    };

    function isDirty() {
        return !angular.equals(blade.currentEntity, blade.origEntity);
    };

    function deleteEntry() {
        var dialog = {
            id: "confirmDelete",
            title: "content.dialogs.asset-delete.title",
            message: "content.dialogs.asset-delete.meessage",
            callback: function (remove) {
                if (remove) {
                    $scope.blade.isLoading = true;

                    themes.deleteAsset({ storeId: blade.choosenStoreId, themeId: blade.choosenThemeId, assetIds: blade.choosenAssetId }, function () {
                        $scope.bladeClose();
                        $scope.blade.parentBlade.initialize(true);
                    },
                    function (error) { bladeNavigationService.setError('Error ' + error.status, $scope.blade); });
                }
            }
        }
        dialogService.showConfirmationDialog(dialog);
    }

    function isCanSave() {
        if (!angular.isUndefined(blade.currentEntity)) {
            if (!angular.isUndefined(blade.currentEntity.id) && !angular.isUndefined(blade.currentEntity.assetUrl) && formScope.$valid) {
                return true;
            }
            return false;
        }
        else {
            return false;
        }
    }

    if (!$scope.uploader) {
        // create the uploader
        var uploader = $scope.uploader = new FileUploader({
            scope: $scope,
            headers: { Accept: 'application/json' },
            url: "api/platform/assets?folderUrl=themefile",
            autoUpload: true,
            removeAfterUpload: true
        });

        uploader.onSuccessItem = function (fileItem, image, status, headers) {
            //blade.currentEntity.content = image.content;
            blade.currentEntity.assetUrl = image[0].url;
            blade.currentEntity.contentType = image[0].mimeType;

            if (blade.newAsset) {
                blade.currentEntity.name = image[0].name;
                blade.currentEntity.id = blade.choosenFolder + '/' + image[0].name;
            }
        };

        uploader.onAfterAddingAll = function (addedItems) {
            bladeNavigationService.setError(null, blade);
        };

        uploader.onErrorItem = function (item, response, status, headers) {
            bladeNavigationService.setError(item._file.name + ' failed: ' + (response.message ? response.message : status), blade);
        };
    }

    blade.initializeBlade();

}]);


sap.ui.define([
    "jquery.sap.global",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "it/presales/app/roleselectionui/util/formatter",
    "sap/ui/model/Sorter",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment"
], function (jQuery, MessageBox, MessageToast, Controller, History, formatter, Sorter, Filter, Fragment) {
    "use strict";

    return Controller.extend("it.presales.app.roleselectionui.controller.BaseController", {

        __targetName: null,

        __MESSAGE_BOX_CHANNEL: "message_box",
        __MESSAGE_BOX_EVENT: "fired",

        __TOAST_ERROR: "error",
        __TOAST_INFO: "info",
        __TOAST_WARNING: "warning",
        __TOAST_SUCCESS: "success",

        _tableColumnsSettingsDialog: null,

        formatter: formatter,

        logger: null,

        onInit: async function () {
            if (this.__targetName !== undefined && this.__targetName !== null) {
                var targets = typeof this.__targetName === 'string' ? [this.__targetName] : this.__targetName;
                for (var i = 0; i < targets.length; i++) {
                    var oRoute = this.getRouter().getRoute(targets[i]);
                    if (oRoute) {
                        oRoute.attachPatternMatched(this._onRouteMatched, this);
                    }
                }
            }

            // init LocalStorage
            jQuery.sap.require("jquery.sap.storage");
            this.__storage = jQuery.sap.storage(jQuery.sap.storage.Type.local);

            // this.logger = this.getOwnerComponent().logger;

            this._onInit.apply(this);
        },

        _onInit: function () {
            // Do the magic
        },

        getURLParameter: function (parameterName) {
            const queryString = window.location.search,
                urlParams = new URLSearchParams(queryString);
            return urlParams.get(parameterName);
        },

        setAppBusy: function (bBusy) {
            this.getComponentModel().setProperty("/busy", bBusy);
        },

        setAppBlocked: function (bBusy) {
            this.getComponentModel().setProperty("/blocked", bBusy);
        },

        setBusy: function (bBusy, sPath = '/busy') {
            this.getComponentModel().setProperty(sPath, bBusy);
        },

        getRouter: function () {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        navTo: function (sRoute, mData, bReplace) {
            this.getRouter().navTo(sRoute, mData, bReplace);
        },

        _onRouteMatched: function (oEvent) {
            var args = oEvent.getParameters().arguments;
            var argsValues = [oEvent, oEvent.getParameters().name];
            for (var key in args) {
                if (args.hasOwnProperty(key)) {
                    var obj = args[key];
                    argsValues.push(obj);
                }
            }
            this.onRouteMatched.apply(this, argsValues);
        },

        onRouteMatched: function (oEvent, routeName) {
            //Do something here ;)
        },

        getComponentModel: function (modelName) {
            var component = this.getOwnerComponent();
            var model = modelName == null || modelName === undefined ? component.getModel() : component.getModel(modelName);
            return model;
        },

        /**
         * LocalStorage methods
         */
        addToStorage: function (id, data) {
            this.__storage.put(id, data);
        },

        getFromStorage: function (id) {
            return this.__storage.get(id);
        },

        clearStorage: function () {
            this.__storage.clear();
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Get the translation for sKey
         * @public
         * @param {string} sKey the translation key
         * @param {array} aParameters translation paramets (can be null)
         * @returns {string} The translation of sKey
         */
        getTranslation: function (sKey, aParameters) {
            if (aParameters === undefined || aParameters === null) {
                return this.getResourceBundle().getText(sKey);
            } else {
                return this.getResourceBundle().getText(sKey, aParameters);
            }

        },

        generateFragmentId: function (parent, child) {
            return Fragment.createId(parent, child);
        },

        getFragmentControlById: function (sFragmentId, sSelectListId) {
            const sID = this.generateFragmentId(sFragmentId, sSelectListId);
            return sap.ui.getCore().byId(sID);
        },

        /*******************************************************
         * EVENT BUS
         *******************************************************/

        sendEvent: function (channel, event, data) {
            sap.ui.getCore().getEventBus().publish(channel, event, data);
        },

        subscribe: function (channel, event, handler, listener) {
            sap.ui.getCore().getEventBus().subscribe(channel, event, handler, listener);
        },

        unSubscribe: function (channel, event, handler, listener) {
            sap.ui.getCore().getEventBus().unsubscribe(channel, event, handler, listener);
        },

        setLayout: function (sLayout) {
            this.getComponentModel().setProperty("/layout", sLayout);
        },

        /********************
         * ODATA V4 METHODS *
         ********************/
        callODataModelFunction: async function (options) {
            const { odataModel, params, functionPath, errorMessage } = options;
            const context = odataModel.bindContext(functionPath);
            for (const p in params) {
                context.setParameter(p, params[p]);
            }
            try {
                await context.execute();
                return context.getBoundContext().getObject();
            }
            catch (err) {
                console.error(errorMessage, err);
                throw err;
            }
        },

        _generateUuidv4: function () {
            return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        _getRandomInt: function (min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

    });
});
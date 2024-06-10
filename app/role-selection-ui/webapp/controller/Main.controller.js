sap.ui.define([
    "it/presales/app/roleselectionui/controller/BaseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
],
    function (BaseController,
        Filter,
        FilterOperator,
        MessageBox,
        Fragment) {
        "use strict";

        return BaseController.extend("it.presales.app.roleselectionui.controller.Main", {

            __targetName: "Main",

            _busyDialogCancelPressed: false,

            onRouteMatched: async function () {
                try {
                    const options = {
                        odataModel: this.getComponentModel("odata"),
                        params: {},
                        functionPath: "/getUserDetails(...)",
                        errorMessage: "Error calling getUserDetails action"
                    },
                    userDetails = await this.callODataModelFunction(options),
                    { firstname, lastname, email, name } = userDetails,
                    localModel = this.getComponentModel(),
                    user = {
                        initials: `${firstname[0].toUpperCase()}${lastname[0].toUpperCase()}`,
                        name: `${firstname} ${lastname}`
                    };

                    localModel.setProperty("/user", user);
                } catch (err) {
                    console.error("Error in route matched", err);
                }
            },

            onMainRolesSetListSelectionChange: function (event) {
                const selectedRole = event.getParameter("listItem").getBindingContext("odata").getObject(),
                    { id: mainRoleId, name: mainRoleName } = selectedRole,
                    localModel = this.getComponentModel(),
                    subRolesList = this._getSubRolesList(),
                    itemsBinding = subRolesList.getBinding("items"),
                    filters = [
                        new Filter(
                            "mainRole_id",
                            FilterOperator.EQ,
                            mainRoleId
                        )
                    ];

                itemsBinding.filter(filters);

                if (itemsBinding.isSuspended()) {
                    itemsBinding.resume();
                }

                localModel.setProperty("/mainRoleName", mainRoleName);
            },

            onSubRolesSetListSelectionChange: function (event) {
                const selectedRole = event.getParameter("listItem").getBindingContext("odata").getObject(),
                    { id: subRoleId, name: subRoleName } = selectedRole,
                    localModel = this.getComponentModel();

                localModel.setProperty("/subRoleSelected", true);
                localModel.setProperty("/subRoleName", subRoleName);
                localModel.setProperty("/subRoleId", subRoleId);
            },

            onAccessPortalButtonPress: async function (event) {
                const localModel = this.getComponentModel(),
                    subRoleId = localModel.getProperty("/subRoleId"),
                    options = {
                        odataModel: this.getComponentModel("odata"),
                        params: {
                            subRoleId
                        },
                        functionPath: "/updateUsersLists(...)",
                        errorMessage: "Error calling updateUsersLists action"
                    };

                try {
                    this._busyDialogCancelPressed = false;
                    this._openBusyDialog();
                    const result = await this.callODataModelFunction(options);
                    
                    const { status, message } = result;
                    
                    if (status === "error") {
                        this._closeBusyDialog();
                        MessageBox.error(
                            this.getTranslation("errorWhileSettingUserRolesMBText", [message]),
                            {
                                title: this.getTranslation("errorWhileSettingUserRolesMBTitle")
                            }
                        );
                        return;
                    }

                    if (!this._busyDialogCancelPressed) {
                        setTimeout(
                            function () {
                                this._closeBusyDialog();
                                // window.open(`https://temporary-work-zone.workzone.cfapps.eu10.hana.ondemand.com/site?selectedRole=${subRoleId}`, "_blank");
                                window.location.href = `https://temporary-work-zone.workzone.cfapps.eu10.hana.ondemand.com/site?selectedRole=${subRoleId}`;
                            }.bind(this),
                            200
                        )
                    }

                } catch (err) {
                    console.error("Error in onAccessPortalButtonPress", err);
                }
            },

            onBusyDialogClosed: function (event) {
                this._busyDialogCancelPressed = event.getParameter("cancelPressed");
            },

            /**************************
             * ANCHOR PRIVATE METHODS *
             **************************/
            _getSubRolesList: function () {
                const fragmentId = this.generateFragmentId(this.getView().getId(), "F02_MainPageContent");
                return this.getFragmentControlById(fragmentId, "subRolesList");
            },

            _openBusyDialog: async function () {
                // load BusyDialog fragment asynchronously
                if (!this._busyDialog) {
                    this._busyDialog = await Fragment.load({
                        name: "it.presales.app.roleselectionui.view.fragment.Common.BusyDialog",
                        controller: this
                    })
                    this.getView().addDependent(this._busyDialog);
                }

                this._busyDialog.open();
            },

            _closeBusyDialog: function () {
                this._busyDialog.close();
            }
        });
    });

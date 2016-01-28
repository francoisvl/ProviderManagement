jQuery.sap.require("sap.m.MessageBox");

sap.ui.core.mvc.Controller.extend("au.gov.humanservices.ccs.ProviderManagement.view.Detail", {

	onInit : function() {
		this.getView().setBusy(true);
		var oEventBus = this.getEventBus(); 
		oEventBus.subscribe("Component", "MetadataFailed", this.onMetadataFailed, this);
		oEventBus.subscribe("Master", "InitialLoadFinished", this.onMasterLoaded, this);

		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		this.oRoutingParams = {};
	},

	onMasterLoaded :  function (sChannel, sEvent) {
		this.getView().setBusy(false);
	},
	
	onMetadataFailed : function(){
		this.getView().setBusy(false);
        this.showEmptyView();	    
	},

	onRouteMatched : function(oEvent) {
	    var oParameters = oEvent.getParameters();
		if (oParameters.name === "enrolment") {
			if (oParameters.arguments.enrolmentEntity) {
				this.oRoutingParams.enrolmentEntity = oParameters.arguments.enrolmentEntity;
				this.oRoutingParams.tab = oParameters.arguments.tab;
			} else {
				this.getRouter().navTo("notfound", {}, true); // don't create a history entry
				return;
			}
			this.bindView("/" + this.oRoutingParams.enrolmentEntity);
			
    		var oIconTabBar = this.byId("idIconTabBar");
    // 		oIconTabBar.getItems().forEach(function(oItem) {
    // 		    if(oItem.getKey() !== "selfInfo"){
    // 				oItem.bindElement(oItem.getKey());
    // 		    }
    // 		});
    
    		// Specify the tab being focused
    		var sTabKey = this.oRoutingParams.tab;
    		if (oIconTabBar.getSelectedKey() !== sTabKey) {
    		    this.getEventBus().publish("Detail", "TabChanged", { sTabKey : sTabKey });
    			oIconTabBar.setSelectedKey(sTabKey);
    		    oIconTabBar.setExpanded(true);
    		} else {
    		    oIconTabBar.setExpanded(true);
    		}

    		this.getView().setBusy(false);
		}
	},

	bindView : function (sEntityPath) {
		this.byId("saveButton").setEnabled(false);

		var oView = this.getView();
// 		oView.bindElement(sEntityPath); 
        oView.setBindingContext(this.getModel().getContext(sEntityPath));
		this.addBindingEventListeners();

		var oData = this.getModel().getData(this.getContextPath());
		if (oData) {
    		this.setSelectedSegmentedButtons();
		}

	},

	addBindingEventListeners: function() {
		var oModel = this.getModel();
		if (!this.oBinding || (this.oBinding && this.oBinding.getPath() !== this.getContextPath())) {
			if (this.oBinding) {
				this.oBinding.destroy(); // clean up existing binding and event handlers
			}
			this.oBinding = new sap.ui.model.Binding(oModel, this.getContextPath(), oModel.getContext(this.getContextPath()));
			var showModelChanged = function() {
				this.oBinding.detachChange(showModelChanged, this);
				// // mark the entity as edited via status text
				// var property = oModel.getProperty(this.getContextPath() + "/Statustxt");
				// if (property) {
				// 	oModel.setProperty(this.getContextPath() + "/Statustxt", "Edited");
				// }
				this.byId("saveButton").setEnabled(true);
			};
			this.oBinding.attachChange(showModelChanged, this);

			this.oBinding.attachEventOnce("dataReceived", jQuery.proxy(function() {
				var oData = this.getModel().getData(this.getContextPath());
				if (!oData) {
					this.showEmptyView();
					this.fireDetailNotFound();
				} else {
            		this.setSelectedSegmentedButtons();
				}
			}, this));
		}
	},

	showEmptyView : function () {
		this.getRouter().navTo("notfound", {}, true); // don't create a history entry
	},

	fireDetailChanged : function (sEntityPath) {
		this.getEventBus().publish("Detail", "Changed", { sEntityPath : sEntityPath });
	},

	fireDetailNotFound : function () {
		this.getEventBus().publish("Detail", "NotFound");
	},

	cleanup: function() {
		if (this.oBinding) {
			this.oBinding.destroy();
			this.oBinding = null;
		}
	},

	onNavBack: function() {
		var oModel = this.getModel();
		if (oModel.hasPendingChanges() ||   // this seems not to cover created entries, only changes to existing entities!?
		    oModel.mChangeHandles[this.getContextPath().substr(1)]) {
		    var oBundle = this.getResourceBundle();
			sap.m.MessageBox.show(oBundle.getText("unsavedChangesMessage"), {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: oBundle.getText("unsavedChangesTitle"),
				actions: [sap.m.MessageBox.Action.CANCEL, sap.m.MessageBox.Action.OK],
				onClose: $.proxy(function(oAction) {
					if (oAction === sap.m.MessageBox.Action.OK) {
						this.cleanup();
						oModel.resetChanges();
						this.navHistoryBack();
					}
				}, this)
			});
		} else {
			this.cleanup();
			this.navHistoryBack();
		}
	},

	navHistoryBack: function() {
		window.history.go(-1);
	},

	openActionSheet: function() {
		if (!this._oActionSheet) {
			this._oActionSheet = new sap.m.ActionSheet({
				buttons: new sap.ushell.ui.footerbar.AddBookmarkButton()
			});
			this._oActionSheet.setShowCancelButton(true);
			this._oActionSheet.setPlacement(sap.m.PlacementType.Top);
		}
		
		this._oActionSheet.openBy(this.byId("actionButton"));
	},

    formatIsActive : function(bIsActive) {
        var oBundle = this.getResourceBundle();
        return bIsActive ? oBundle.getText("activeText") : oBundle.getText("inactiveText");
    },
    
    formatIsActiveState : function(bIsActive) {
        return bIsActive ? sap.ui.core.ValueState.Success : sap.ui.core.ValueState.Warning;
    },

    setSelectedSegmentedButtons : function() {
        var oData = this.getContextObject();
        this.byId("hoursMONSegmentedButton").setSelectedButton(this.byId(this.getHoursButtonId(oData.HoursMON, "MON")));
        this.byId("hoursTUESegmentedButton").setSelectedButton(this.byId(this.getHoursButtonId(oData.HoursTUE, "TUE")));
        this.byId("hoursWEDSegmentedButton").setSelectedButton(this.byId(this.getHoursButtonId(oData.HoursWED, "WED")));
        this.byId("hoursTHUSegmentedButton").setSelectedButton(this.byId(this.getHoursButtonId(oData.HoursTHU, "THU")));
        this.byId("hoursFRISegmentedButton").setSelectedButton(this.byId(this.getHoursButtonId(oData.HoursFRI, "FRI")));
        this.byId("hoursSATSegmentedButton").setSelectedButton(this.byId(this.getHoursButtonId(oData.HoursSAT, "SAT")));
        this.byId("hoursSUNSegmentedButton").setSelectedButton(this.byId(this.getHoursButtonId(oData.HoursSUN, "SUN")));
    },
    
    getHoursButtonId : function(nHours, sDay) {
        if (nHours <= 4000.0) {
            return "hours" + sDay + "4Button";
        }
        if (nHours <= 6000.0) {
            return "hours" + sDay + "6Button";
        }
        if (nHours <= 8000.0) {
            return "hours" + sDay + "8Button";
        }
    },

	getContextObject: function() {
		var oModel = this.getModel();
		return oModel.getProperty(this.getContextPath());
	},

	getContextPath: function() {
		var oContext = this.getView().getBindingContext();
		if (oContext) {
			return oContext.getPath();
		} else {
			return null;
		}
	},

	getModel: function() {
		return sap.ui.getCore().getModel();
	},

    getResourceBundle : function() {
        return sap.ui.getCore().getModel("i18n").getResourceBundle();
    },
    
	getEventBus : function () {
		return sap.ui.getCore().getEventBus();
	},

	getRouter : function () {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},
	
	onExit : function(oEvent){
	    var oEventBus = this.getEventBus();
    	oEventBus.unsubscribe("Master", "InitialLoadFinished", this.onMasterLoaded, this);
		oEventBus.unsubscribe("Component", "MetadataFailed", this.onMetadataFailed, this);
		if (this._oActionSheet) {
			this._oActionSheet.destroy();
			this._oActionSheet = null;
		}
	}
});
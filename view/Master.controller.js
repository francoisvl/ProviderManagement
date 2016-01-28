sap.ui.core.mvc.Controller.extend("au.gov.humanservices.ccs.ProviderManagement.view.Master", {

	onInit : function() {
		this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);
		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
		this.oRoutingParams = {};
		
		var oEventBus = this.getEventBus();
		var oList = this.byId("list");
	    oList.attachEventOnce("updateFinished", function() {
			this.selectFirstItem();
    		oEventBus.publish("Master", "InitialLoadFinished", {});
		}, this);
		
		oEventBus.subscribe("Detail", "TabChanged", this.onDetailTabChanged, this);
		oEventBus.subscribe("Detail", "Changed", this.onDetailChanged, this);
		oEventBus.subscribe("Detail", "NotFound", this.onNotFound, this);
	},

	onRoutePatternMatched : function(oEvent) {
	    var oParameters = oEvent.getParameters();
		if (oParameters.name === "home") {
			if (!sap.ui.Device.system.phone) {
			    // load the welcome page on non-phone devices (splitapp behaves like a
			    // single nav controller on phones, so the master list has to be shown first)
			    // note that this has to happen on the RoutePatternMatched event as this
			    // only traps a route actually being matched.
			    // intermediate RouteMatched events (such as "home" being loaded as a parent
			    // route of "enrolment", are not trapped by this event)
			    this.getRouter().navTo("welcome");
			}
		}
	},
	
	onRouteMatched : function(oEvent) {
	    var oParameters = oEvent.getParameters();
		if (oParameters.name === "home") {
			// nothing to be done yet
		}
	},

	onDetailTabChanged : function (sChanel, sEvent, oData) {
		this.sTab = oData.sTabKey;
	},
	
	onDetailChanged : function (sChanel, sEvent, oData) {
		this.byId("list").removeSelections();
	},

	onNotFound : function () {
		this.byId("list").removeSelections();
	},

	onSearch : function() {
		// Add search filter
		var filters = [];
		var searchString = this.byId("searchField").getValue();
		if (searchString && searchString.length > 0) {
			filters = [ new sap.ui.model.Filter("ChildName", sap.ui.model.FilterOperator.Contains, searchString) ];
		}
		// Update list binding
		var oBinding = this.byId("list").getBinding("items");
		oBinding.filter(filters);

	    oBinding.attachEventOnce("dataReceived", function() {
			this.selectFirstItem();
		}, this);
	},

	onSelect : function(oEvent) {
		// Get the list item either from the listItem parameter or from the event's
		// source itself (will depend on the device-dependent mode)
		this.showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
	},

    onAddButtonPress : function(oEvent) {
        var oNewEnrolmentContext = this.getModel().createEntry("EnrolmentSet");
        // this.aNewEnrolmentContext = this.aNewEnrolmentContext || [];
        // this.aNewEnrolmentContext.push(oNewEnrolmentContext);

        // navigate to enrolment to edit details
		this.getRouter().navTo("enrolment", {
			enrolmentEntity: oNewEnrolmentContext.getPath().substr(1), // no slashes permitted in route parameters
			tab: "selfInfo"
		});
		// change the new entity IsActive property, so enrolment save button is enabled
		this.getModel().setProperty(oNewEnrolmentContext.getPath() + "/IsActive", true);
    },
    
	selectFirstItem : function() {
		var oList = this.byId("list");
		var aItems = oList.getItems();
		if (aItems.length === 1) {
			oList.setSelectedItem(aItems[0], true);
            this.showDetail(aItems[0]);
		}
		else if (aItems.length === 0) {
    		this.getRouter().navTo("notfound");
		}
	},

	showDetail : function(oItem) {
		this.getRouter().navTo("enrolment", {
			enrolmentEntity: oItem.getBindingContext().getPath().substr(1), // no slashes permitted in route parameters
			tab: this.sTab
		});
	},
	
	formatDateYMD : function(oDate) {
	    if (!this.oFormatDateYMD) {
	        this.oFormatDateYMD = sap.ui.core.format.DateFormat.getInstance({
        	    pattern : "yyyy-MM-dd"
        	});
	    }
	    return this.oFormatDateYMD.format(oDate);
	},
	
	formatValidityPeriod : function(dValidSince, dValidUntil) {
	    return this.formatDateYMD(dValidSince) + " to " + this.formatDateYMD(dValidUntil);
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
		oEventBus.unsubscribe("Detail", "TabChanged", this.onDetailTabChanged, this);
		oEventBus.unsubscribe("Detail", "Changed", this.onDetailChanged, this);
		oEventBus.unsubscribe("Detail", "NotFound", this.onNotFound, this);
	}
});
jQuery.sap.declare("au.gov.humanservices.ccs.ProviderManagement.Component");

sap.ui.core.UIComponent.extend("au.gov.humanservices.ccs.ProviderManagement.Component", {
	metadata: {
		name: "Provider Management",
		version: "1.0",
		includes: [],
		dependencies: {
			libs: ["sap.m", "sap.ui.layout"],
			components: []
		},

		rootView: "au.gov.humanservices.ccs.ProviderManagement.view.App",

		config: {
			resourceBundle: "i18n/messageBundle.properties",
			serviceConfig: {
				name: "ZCCS_PROVIDER_SRV",
				serviceUrl: "/sap/opu/odata/sap/ZCCS_PROVIDER_SRV/"
			}
		},

		routing: {
			config: {
				routerClass: "sap.m.routing.Router",
				viewType: "XML",
				viewPath: "au.gov.humanservices.ccs.ProviderManagement.view",
				clearTarget: false,
				transition: "slide"
			},
			routes: [
				{
					pattern: ":all*:",
					name: "home",
					target: "home",
					subroutes: [
						{
							pattern: "welcome",
							name: "welcome",
							target: "welcome",
							subroutes: [
								{
									pattern: "enrolment/{enrolmentEntity}/:tab:",
									name: "enrolment",
									target: "enrolment"
                                }
                            ]
						},
						{
							pattern: "notfound",
							name: "notfound",
							target: "notfound"
                        }
					]
				}
			],
			targets: {
				home: {
					viewName: "Master",
					controlId: "idAppControl",
					controlAggregation: "masterPages"
				},
				welcome: {
					viewName: "Welcome",
					controlId: "idAppControl",
					controlAggregation: "detailPages"
				},
				enrolment: {
					viewName: "Detail",
					controlId: "idAppControl",
					controlAggregation: "detailPages"
				},
				notfound: {
					viewName: "NotFound",
					controlId: "idAppControl",
					controlAggregation: "detailPages"
				}
			}
		}
	},

	init: function() {
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

		var mConfig = this.getMetadata().getConfig();

		// Always use absolute paths relative to our own component
		// (relative paths will fail if running in the Fiori Launchpad)
		var oRootPath = jQuery.sap.getModulePath("au.gov.humanservices.ccs.ProviderManagement");

		// Set i18n model
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: [oRootPath, mConfig.resourceBundle].join("/")
		});
		this.setModel(i18nModel, "i18n");
        sap.ui.getCore().setModel(i18nModel, "i18n");

		var sServiceUrl = mConfig.serviceConfig.serviceUrl;

		//This code is only needed for testing the application when there is no local proxy available
		var bIsMocked = jQuery.sap.getUriParameters().get("responderOn") === "true";
		// Start the mock server for the domain model
		if (bIsMocked) {
			this._startMockServer(sServiceUrl);
		}

		// Create and set domain model to the component
		var oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
		oModel.attachMetadataFailed(function() {
			this.getEventBus().publish("Component", "MetadataFailed");
		}, this);
		// disable default count mode behaviour
		oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
		// enable two-way binding mode by default
		oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		this.setModel(oModel);
		sap.ui.getCore().setModel(oModel);

		// Set device model
		var oDeviceModel = new sap.ui.model.json.JSONModel({
			isTouch: sap.ui.Device.support.touch,
			isNoTouch: !sap.ui.Device.support.touch,
			isPhone: sap.ui.Device.system.phone,
			isNoPhone: !sap.ui.Device.system.phone,
			listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
			listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive"
		});
		oDeviceModel.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
		this.setModel(oDeviceModel, "device");
		sap.ui.getCore().setModel(oDeviceModel, "device");

		this.getRouter().initialize();
	},

	_startMockServer: function(sServiceUrl) {
		jQuery.sap.require("sap.ui.core.util.MockServer");
		var oMockServer = new sap.ui.core.util.MockServer({
			rootUri: sServiceUrl
		});

		var iDelay = +(jQuery.sap.getUriParameters().get("responderDelay") || 0);
		sap.ui.core.util.MockServer.config({
			autoRespondAfter: iDelay
		});

// 		oMockServer.simulate("model/metadata.xml", {
// 		    sMockdataBaseUrl : "model/",
// 		    bGenerateMissingMockData : false
// 	    });
		oMockServer.simulate("model/metadata.xml", "model/");
		oMockServer.start();

		sap.m.MessageToast.show("Running in demo mode with mock data.", {
			duration: 4000
		});
	},

	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	}
});
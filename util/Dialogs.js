jQuery.sap.declare("au.gov.humanservices.ccs.ProviderManagement.util.Dialogs");

au.gov.humanservices.ccs.ProviderManagement.util.Dialogs = {
	getMessagePopover: function(oController) {
		// prepare message popover dialog if not yet done
		if (!oController.getOwnerComponent()._dialogMessagePopover) {
			oController.getOwnerComponent()._dialogMessagePopover = sap.ui.xmlfragment("au.gov.humanservices.ccs.ProviderManagement.dialog.MessagePopover", oController);
			oController.getOwnerComponent()._dialogMessagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel());
		}
		// filter out messages without an actual message
		// 	var oFilter = new sap.ui.model.Filter("message", sap.ui.model.FilterOperator.NE, "");
		// 	if (oController.getOwnerComponent()._dialogMessagePopover.getBinding("items")) {
		// 		oController.getOwnerComponent()._dialogMessagePopover.getBinding("items").filter([oFilter]);
		// 	}
		// filter method only works in higher UI5 runtime, so take matters into our own hands...
		var aFilteredMessages = $.map(sap.ui.getCore().getMessageManager().getMessageModel().oData, function(oMessage) {
			if (oMessage.message) {
				return oMessage;
			}
		});
		sap.ui.getCore().getMessageManager().removeMessages(sap.ui.getCore().getMessageManager().getMessageModel().oData);
		sap.ui.getCore().getMessageManager().addMessages(aFilteredMessages);
		
		return oController.getOwnerComponent()._dialogMessagePopover;
	}
};
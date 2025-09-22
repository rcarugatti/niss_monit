/*global QUnit*/

sap.ui.define([
	"display/controller/DISP.controller"
], function (Controller) {
	"use strict";

	QUnit.module("DISP Controller");

	QUnit.test("I should test the DISP controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});

sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("display.controller.DISP", {
        onInit() {
            var oView = this.getView();
            var oODataModel = oView.getModel();
            if (!oODataModel) {
                oODataModel = sap.ui.core.Component.getOwnerComponentFor(oView)?.getModel();
            }
            if (!oODataModel) {
                console.error("ODataModel não está definido na View nem no Component.");
                return;
            }
            var oJSONModel = new sap.ui.model.json.JSONModel({ items: [] });
            oView.setModel(oJSONModel); // modelo default
            oODataModel.read("/ZC_AFIP_ITEM", {
                success: function(oData) {
                    var aItems = (oData.results || []).map(function(item, idx) {
                        // Todos os campos devem ser string para binding correto dos CheckBox
                        return {
                            IdAfip: item.IdAfip ? String(item.IdAfip) : "",
                            Flagmirofb60: (item.Flagmirofb60 === 1 || item.Flagmirofb60 === "1" || item.Flagmirofb60 === "X") ? "X" : "",
                            Ebeln: item.Ebeln ? String(item.Ebeln) : "",
                            Ebelp: item.Ebelp ? String(item.Ebelp) : "",
                            Diferenca: item.Diferenca ? String(item.Diferenca) : "",
                            MiroBelnr: item.MiroBelnr ? String(item.MiroBelnr) : "",
                            MiroGjahr: item.MiroGjahr ? String(item.MiroGjahr) : "",
                            Fb60Belnr: item.Fb60Belnr ? String(item.Fb60Belnr) : "",
                            Fb60Gjahr: item.Fb60Gjahr ? String(item.Fb60Gjahr) : "",
                            Flaglogs: item.Flaglogs ? String(item.Flaglogs) : "",
                            VersionAfip: item.VersionAfip ? String(item.VersionAfip) : "",
                            Flagestornar: (item.Flagestornar === 1 || item.Flagestornar === "1" || item.Flagestornar === "X") ? "X" : "",
                            Flagreprocessamento: (item.Flagreprocessamento === 1 || item.Flagreprocessamento === "1" || item.Flagreprocessamento === "X") ? "X" : ""
                        };
                    });
                    oJSONModel.setData({ items: aItems });
                    console.log("Dados finais carregados para o modelo:", aItems);
                },
                error: function(oError) {
                    console.error("Erro ao ler dados OData:", oError);
                }
            });
        },

        onIncluirOC: function() {
            var oView = this.getView();
            var oTable = oView.byId("afipTable");
            var oModel = oView.getModel(); // modelo default agora
            var aRows = oModel.getProperty("/items");
            var aSelected = oTable.getSelectedItems();
            var sIdAfip = "";
            if (aSelected.length > 0) {
                var oCtx = aSelected[0].getBindingContext(); // modelo default
                if (oCtx) {
                    sIdAfip = oCtx.getProperty("IdAfip");
                }
            }
            if (!this._oIncluirOCDialog) {
                sap.ui.core.Fragment.load({
                    name: "display.view.IncluirOC",
                    controller: this
                }).then(function(oDialog) {
                    oView.addDependent(oDialog);
                    this._oIncluirOCDialog = oDialog;
                    this._setIncluirOCTitle(sIdAfip);
                    oDialog.open();
                }.bind(this));
            } else {
                this._setIncluirOCTitle(sIdAfip);
                this._oIncluirOCDialog.open();
            }
        },

        _setIncluirOCTitle: function(sIdAfip) {
            if (this._oIncluirOCDialog) {
                var sTitle = "PO-";
                if (sIdAfip) {
                    sTitle += " - ID AFIP: " + sIdAfip;
                }
                this._oIncluirOCDialog.setTitle(sTitle);
            }
        },

        onConfirmarIncluirOC: function() {
            console.log("onConfirmarIncluirOC chamado");
            var oView = this.getView();
            var oTable = oView.byId("afipTable");
            var oModel = oView.getModel(); // modelo default agora
            if (!oModel) {
                sap.m.MessageToast.show("Modelo não está disponível.");
                return;
            }
            var aRows = oModel.getProperty("/items");
            var aSelected = oTable.getSelectedItems();
            if (aSelected.length === 0) {
                sap.m.MessageToast.show("Selecione uma linha para copiar.");
                return;
            }
            var oCtx = aSelected[0].getBindingContext(); // modelo default
            if (!oCtx) {
                sap.m.MessageToast.show("Contexto não encontrado.");
                return;
            }
            var oData = oCtx.getObject();
            // Pega valores dos inputs do fragmento
            var oDialog = this._oIncluirOCDialog;
            // Use this._oIncluirOCDialog.getContent()[0] para acessar o VBox e depois os Inputs
            var oVBox = this._oIncluirOCDialog.getContent()[0];
            var aVBoxItems = oVBox.getItems();
            var oInputEbeln = aVBoxItems[1]; // Input de Ebeln
            var oInputEbelp = aVBoxItems[3]; // Input de Ebelp
            var sEbeln = oInputEbeln ? oInputEbeln.getValue() : "";
            var sEbelp = oInputEbelp ? oInputEbelp.getValue() : "";
            console.log("Valor digitado em Ebeln:", sEbeln);
            // Cria novo objeto copiando todos os campos, mas sobrescrevendo Ebeln e Ebelp
            var oNovo = Object.assign({}, oData);
            oNovo.Ebeln = sEbeln !== "" ? sEbeln : '45000000010';
            oNovo.Ebelp = sEbelp !== "" ? sEbelp : '00010';
            // Adiciona ao modelo
            var aNewRows = aRows.slice();
            aNewRows.push(oNovo);
            oModel.setProperty("/items", aNewRows);
            oDialog.close();
        },

        onCancelarIncluirOC: function() {
            this._oIncluirOCDialog.close();
        },

        onSalvar: function() {
            var oView = this.getView();
            var oTable = oView.byId("afipTable");
            var oModel = oView.getModel();
            var aItems = oModel.getProperty("/items") || [];
            var aSelectedContexts = oTable.getSelectedItems().map(function(oItem) {
                return oItem.getBindingContext();
            });
            var aSelectedRows = aSelectedContexts.map(function(oCtx) {
                return oCtx ? oCtx.getObject() : null;
            }).filter(function(oRow) {
                // Troca para Flagestornar
                return oRow && (oRow.Flagestornar === "X" || oRow.Flagestornar === 1 || oRow.Flagestornar === "1");
            });

            if (aSelectedRows.length === 0) {
                sap.m.MessageToast.show("Nenhuma linha marcada com Estornar selecionada.");
                return;
            }

            aSelectedRows.forEach(function(oRow) {
                // Chamada AJAX para a API OData
                $.ajax({
                    url: "/sap/opu/odata/sap/API_SUPPLIERINVOICE_PROCESS_SRV/SomeEntitySet", // ajuste o EntitySet correto
                    method: "POST", // ou "GET" conforme a operação
                    contentType: "application/json",
                    data: JSON.stringify({
                        Ebeln: oRow.Ebeln,
                        Ebelp: oRow.Ebelp
                    }),
                    success: function(data) {
                        sap.m.MessageToast.show("API chamada com sucesso para Ebeln: " + oRow.Ebeln);
                    },
                    error: function(err) {
                        sap.m.MessageToast.show("Erro ao chamar API para Ebeln: " + oRow.Ebeln);
                    }
                });
            });
        },

        onCheckBoxSelect: function(oEvent) {
            var oCheckBox = oEvent.getSource();
            var bSelected = oCheckBox.getSelected();
            var oCtx = oCheckBox.getBindingContext();
            var sPath = oCtx.getPath();
            var sProp = oCheckBox.getId().includes("Flagestornar") ? "Flagestornar" : "Flagreprocessamento";
            var oModel = oCtx.getModel();
            // Atualiza o valor no modelo (X ou "")
            oModel.setProperty(sPath + "/" + sProp, bSelected ? "X" : "");
        },
    });
});
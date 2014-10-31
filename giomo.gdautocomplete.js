/**
	@author Diogo Giomo
	@since 22/10/2014
	
	references
				http://wiki.jqueryui.com/w/page/12138135/Widget%20factory
				http://jqueryui.com/autocomplete/
				
				
	options
		multiSelect
		columns
		reponseKey
		reponseKeyGrid
		buttonConfirmText
		buttonBackText
		keyView ****
		urlGetItensAutocomplete
		urlGetItensGrid
		
*/
(function( $ ) {
  $.widget( "giomo.gdautocomplete", {
 
    // These options will be used as defaults
    options: { 
	
	  
	},
 
    // Set up the widget
    _create: function() {
		this.element.addClass("gd-div-itens");
		$(this.element).parent().append(this._getButtons());
		this.$inputAutoComplete = $("<input>").addClass("gd-input-autocomplete");
	},
	
	_init : function(){
		var self = this;
		this.element.append(this.$inputAutoComplete);
		this.$inputAutoComplete.autocomplete({
			source: function( request, response ) {
				var dataToSend = {
					"idsNotIn" : self.getValues(),
					"term" : request.term,
					"searchType" : "VIEW"
				};
			    $.getJSON( self.options.urlGetItensAutocomplete, dataToSend, function(data){
			    	var itens = (self.options["reponseKey"] ? data[self.options["reponseKey"]] : data);
					response(itens);
				})
				.error(function(jqXhr, textStatus, error) {
					console.log("ERROR: " + textStatus + ", " + error);
				});;
			},
			minLength: 2,
			select: function(event, ui){				
				self.setValues([ui.item]);
			},
			close: function( event, ui ) {
				self.$inputAutoComplete.val("");
			},
			focus: function( event, ui ) {
				self.$inputAutoComplete.val(ui.item.label);
				return false;
				//event.stopImmediatePropagation();
				//event.stopPropagation();
			}
		});
	},
	
	_getDivSelectedItem : function(item){
		var $span = $("<span>").addClass("gd-selected-label").text(item.label);
		var $a = $("<a>").addClass("gd-selected-remove");
		this._addActionRemove($a);
		var $id = $("<identifier>").prop("id", item.value);
		var $div = $("<div>").addClass("gd-selected-item");
		$div.append($span);
		$div.append($a);			
		$div.append($id);			
		return $div;			
	},
	
	_getButtons : function(){
		var $div = $("<div>").addClass("gd-select-btn-container");
		var $btnSearch = $("<button class='gd-select-btn gd-select-btn-search'/>");
		var $btnClear =  $("<button class='gd-select-btn gd-select-btn-clear'/>");
		this._addActionSearch($btnSearch);
		this._addActionClear($btnClear);
		$div.append([$btnSearch, $btnClear]);
		$btnSearch.button({
			icons: {
				primary: "ui-icon-search"
			}
		});
		$btnClear.button({
			icons: {
				primary: "ui-icon-closethick"
			}
		});
		return $div;
	},
	
	_addActionSearch : function($el){
		var self = this;
		$el.unbind("click").bind("click", function(){
			self._openDialogSlickGrid();
			return false;
		});
	},
	
	_addActionClear : function($el){
		var self = this;
		$el.unbind("click").bind("click", function(){
			self.removeAll();
			return false;
		});
	},
	
	_addActionRemove : function($el){
		$el.unbind("click").bind("click",this._remove);
	},
	
	removeAll : function(){
		this.element.children().filter(".gd-selected-item").remove();
	},
	
	_remove : function(){
		$(this).parent().remove();
	},
	
	getValues : function(){
		var ids = [];
		var $itens = this.element.find(".gd-selected-item");
		$.each($itens, function(index, $item){
			ids.push($($item).find("identifier").prop("id"));
		});
		return ids;
	},
	
	setValues : function(items){
		if(!this.options.multiSelect){
			this.removeAll();
			if(items.length > 1){
				throw "Function setValues: multiSelect parameter is false, then there can not be a list of items to add the plugin.";
			}
		}
		items = this._verifyDuplicate(items);
		for(var i = 0; i< items.length; i++){
			$(this.element).append(this._getDivSelectedItem(items[i]));
		}	
	},
	
	_verifyDuplicate : function (itens){
		var idsAddx = this.getValues();
		var idsAdd = {};
		for(var i = 0; i < idsAddx.length; i++){
			id = idsAddx[i];
			idsAdd[id] = id;
		}
		//
		var itensx = [];
		for(var i = 0; i < itens.length; i++){
			id = itens[i].value;
			if(!idsAdd[id])
				itensx.push(itens[i]);
		}
		return itensx;
	},
	
	_openDialogSlickGrid : function(){
		var self = this;
		var $containerGrid = $("<div>").addClass("gd-slickgrid-container");
		var $inputSearch = $("<input>").addClass("gd-slickgrid-input-search");
		var $grid = $("<div>").addClass("gd-slickgrid-grid");
		var $pager = $("<div>").addClass("gd-slickgrid-grid-pager");
		
		$containerGrid.append($inputSearch);
		$containerGrid.append($grid);
		$containerGrid.append($pager);
		$containerGrid.dialog({
			height :"auto",
			width : 700,
			title : this.options.titleDialog,
			buttons: [
				{
					text    : self.options.buttonConfirmText,
					icons: { primary: "ui-icon-check" },
					click    : function() {
						var ids = grid.getSelectedRows();
						var itens = [];
						for(var i = 0; i < ids.length ; i++){
							var item = dataView.getItemByIdx(ids[i]);
							itens.push({"value" : item.id, "label" : item.keyView});
						}
						self.setValues(itens);
						$(this).dialog('close');
					}
				},
				{
					text    : self.options.buttonBackText,
					icons: { primary: "ui-icon-arrowreturnthick-1-w" },
					click    : function() {
						$(this).dialog('destroy').remove()
					}
				}
			] 
		});
		var grid;
		var columns = this.options.columns;

		var options = {
			enableCellNavigation: true,
			enableColumnReorder: false,
			forceFitColumns : true,
			multiSelect : this.options.multiSelect
		};
		// Create the DataView.
		var dataView = new Slick.Data.DataView();
		grid = new Slick.Grid($grid , dataView, columns, options);		
		grid.setSelectionModel(new Slick.RowSelectionModel());
		pager = new Slick.Controls.Pager(dataView, grid, $pager);
		this._addActionInputSearchGrid($inputSearch, dataView, grid);
	},
	
	_addActionInputSearchGrid : function($el, dataView, grid){
		var self = this;
		$el.keypress(function( event ) {
			if ( event.which == 13 ) {//Enter keypress 
				self._executeSearchGrid($el.val(), dataView, grid, self);
				event.preventDefault();
			 }
		});
	},
	
	_executeSearchGrid : function(term, dataView, grid, self){
		var dataToSend = {
			"idsNotIn" : self.getValues(),
			"term" : term,
			"searchType" : "GRID"
		};
	    $.getJSON( self.options.urlGetItensGrid, dataToSend, function(data){
			dataView.beginUpdate();
			
			dataView.setItems((self.options["reponseKeyGrid"] ? data[self.options["reponseKeyGrid"]] : data));
			
			dataView.endUpdate();
			grid.resizeCanvas();
		})
		.error(function(jqXhr, textStatus, error) {
			console.log("ERROR: " + textStatus + ", " + error);
		});
	}
	
  });
}( jQuery ) );
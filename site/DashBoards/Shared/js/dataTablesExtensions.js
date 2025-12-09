var _dataTables = [];

function registerAutoFilter(tableID, columnID, columnIndex) {
	for (let i = 0; i < _dataTables.length; i++) {
		if (_dataTables[i].tableID == 'tbl-' + tableID) {
			_dataTables[i].filterCols.push({
				tableID: 'tbl-' + tableID,
				columnIndex: columnIndex,
				dropdownID: 'tbl-' + tableID + '-' + columnID,
				anchorClassName: 'tbl-' + tableID + '-' + columnID + '-Filter',
				selectedAnchorClassName: 'tbl-' + tableID + '-' + columnID + '-SelectedFilter',
				current: ''
			});
			break;
		}
	}
}

function registerFeed(tableID) {
	_dataTables.push({
		tableID: 'tbl-' + tableID,
		dataTable: null,
		filterCols: [],
		initialised: false,
		feed: true
	});
}

function registerDataTable(tableID, defaultSortCol, defaultSortDirection) {
	var sortDir;
	if (defaultSortDirection == 0) {
		sortDir = 'asc';
	}
	else {
		sortDir = 'desc';
	}
	
	_dataTables.push({
		tableID: 'tbl-' + tableID,
		defaultSortCol: defaultSortCol,
		defaultSortDirection: sortDir,
		dataTable: null,
		filterCols: [],
		initialised: false,
		feed: false
	});
}

function initDataTable(item, index) {
	if (!item.initialised) {
		
		if (item.feed) {
			item.dataTable = $('#' + item.tableID).DataTable({
				customInitObj: item,
				searching: true,
				dom: 'Brtip',
				buttons: [
					'copyHtml5',
					'excelHtml5',
					'csvHtml5',
					'pdfHtml5'
				],
				ordering: false,
				paging: false,
				bInfo: false
				});
		}
		else {
			item.dataTable = $('#' + item.tableID).DataTable({
				customInitObj: item,
				searching: true,
				dom: 'Brtip',
				buttons: [
					'copyHtml5',
					'excelHtml5',
					'csvHtml5',
					'pdfHtml5'
				],
				order: [[ item.defaultSortCol, item.defaultSortDirection ]],
				initComplete: function(settings, json) {
						let filterCols = settings.oInit.customInitObj.filterCols;
						
						for (let i = 0; i < filterCols.length; i++)
						{
							let filterCol = filterCols[i];
							
							let column = this.api().column(filterCol.columnIndex);
							let dropdown = $('#' + filterCol.dropdownID);
							
							column.data().unique().sort().each( function ( d, j ) {
								dropdown.append( '<li><a class="' + filterCol.anchorClassName + '" href="#" data="'+d+'"> '+d+'</a></li>' );
								$('.' + filterCol.anchorClassName).click( function() { 
											$('.' + filterCol.selectedAnchorClassName).remove();
											$(this).prepend('<i class="fa fa-check ' + filterCol.selectedAnchorClassName + '" aria-hidden="true"></i>');
											
											var filter = $(this).attr('data');
											filterCol.current = filter;
											applyFilters();
										} )
							} );
						}
					}
				});
		};
		
		item.initialised = true;
	}
}

function applyFilters() {
	// Clear filters
	while ($.fn.dataTable.ext.search.length > 0) {
		$.fn.dataTable.ext.search.pop();
	}
	
	for (let i = 0; i < _dataTables.length; i++) {
		for (let j = 0; j < _dataTables[i].filterCols.length; j++) {
			if (_dataTables[i].filterCols[j].current.length > 0) {
				processFilter(_dataTables[i].filterCols[j]);
			}
		}
		
		_dataTables[i].dataTable.draw();
	}
}

function processFilter(filterCol) {
	$.fn.dataTable.ext.search.push(
		function (settings, data, dataIndex){
			if (settings.nTable.getAttribute('id') != filterCol.tableID) {
				return true; // does not apply to this tableID
			}
			
			return (data[filterCol.columnIndex] == filterCol.current) ? true : false;
		}
	);
}

function getDataTable(id) {
	for (let i = 0; i < _dataTables.length; i++) {
		if (_dataTables[i].tableID == id) {
			return _dataTables[i].dataTable;
			break;
		}
	}
}

function initNewDataTables() {
	_dataTables.forEach(initDataTable);
}

$(document).ready(function() {
	initNewDataTables();
} );
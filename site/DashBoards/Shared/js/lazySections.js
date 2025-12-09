var _webConnectorUrl = '';
var _applicationID = '37B3B141-1507-4C88-88E4-BB3148832BA9';
var _workflowProcessID = 0;
var _recordID = 0;
var _userID = 0;
var _username = '';

var _initialised = false;

function initialiseLazySections(webConnectorUrl, workflowProcessID, recordID, userID, username) {
	_webConnectorUrl = webConnectorUrl;
	_workflowProcessID = workflowProcessID;
	_recordID = recordID;
	_userID = userID;
	_username = username;
	_initialised = true;
}

$(document).ready(function() {
	$('#navbar').on('shown.bs.tab', function (e) { 
		if (!_initialised) return;
		
		var isLazyLoaded = e.target.dataset.lazy == "true";
		var isLoaded = false;
		
		if (isLazyLoaded) {
			isLoaded = e.target.dataset.loaded == "true";
			
			if (!isLoaded) {
				loadTab(e.target.dataset.section, e.target.hash)
				e.target.dataset.loaded = "true";
			}
			
		}
	})
});

function loadTab(section, target) {
	if (!_initialised) return;
	
	// 0 = Direct request; 1 = Route through JSONP; Must use JSONP for ActiveH snapshot to avoid CORS issues.
	var m = 1;
	
	if (m==0) {
		loadTabDirect(section, target);
	}
	else {
		loadTabWithJsonP(section, target);
	}
}

function loadTabDirect(section, target) {
	$.ajax({
		url: _webConnectorUrl + '/Workflow/' + _workflowProcessID,
		type: 'post',
		data: JSON.stringify({
			ProcessID: _workflowProcessID,
			Parameters: [{Name: '@SectionID', Value: section},
						{Name: '@RecordID', Value: _recordID},
						{Name: '@UserID', Value: _userID},
						{Name: '@Return_HTML', Value: ''},
						{Name: '@Return_Script', Value: ''}]
		}),
		headers: {
			"X-ActiveH-Application": _applicationID
		},
		contentType: 'application/json',
		dataType: 'json',
		success: function (data) {
			for (i = 0 ; i < data.Parameters.length ; i++) {
				if (data.Parameters[i].Name == '@Return_HTML') {
					$(target).html(data.Parameters[i].Value);
				}
				else if (data.Parameters[i].Name == '@Return_Script') {
					if (data.Parameters[i].Value.length > 0) {
						$('<script>')
							.attr('type', 'text/javascript')
							.text(data.Parameters[i].Value + ' initNewDataTables();')
							.appendTo('body');
					}
				}
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
			$(target).html(getErrorHtml(section, errorThrown));
		}
	});
}

function loadTabWithJsonP(section, target) {
	try {
		$.ajax({
			url: _webConnectorUrl + '/Shared/JSONPExec?' + 
					'application=' + _applicationID +
					'&username=' + encodeURIComponent(_username) + 
					'&method=POST' + 
					'&uri=/Workflow/' + _workflowProcessID +
					'&data=' + encodeURIComponent(JSON.stringify({
									ProcessID: _workflowProcessID,
									Parameters: [{Name: '@SectionID', Value: section},
												{Name: '@RecordID', Value: _recordID},
												{Name: '@UserID', Value: _userID},
												{Name: '@Return_HTML', Value: ''},
												{Name: '@Return_Script', Value: ''}]
								})),
			headers: {          
				Accept: 'application/json'
			},
			contentType: 'application/json',
			dataType: 'jsonp',
			timeout: 60000,
			success: function (data) {
				// using JSONP the real HTTP status code isn't returned,
				// but Web Connector will return an error object.
				
				if (hasOwnProperty(data, 'Code') && hasOwnProperty(data, 'Message') && hasOwnProperty(data, 'MoreInfo') && hasOwnProperty(data, 'Status')) {
					$(target).html(getErrorHtml(section, data.Message));
				}
				else {
					parsedData = JSON.parse(data.Data);
				
					for (i = 0 ; i < parsedData.Parameters.length ; i++) {
						if (parsedData.Parameters[i].Name == '@Return_HTML') {
							$(target).html(parsedData.Parameters[i].Value);
						}
						else if (parsedData.Parameters[i].Name == '@Return_Script') {
							if (parsedData.Parameters[i].Value.length > 0) {
								$('<script>')
									.attr('type', 'text/javascript')
									.text(parsedData.Parameters[i].Value + ' initNewDataTables();')
									.appendTo('body');
							}
						}
					}
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				$(target).html(getErrorHtml(section, errorThrown));
			}
		});
	}
	catch(err) {
		$(target).html(getErrorHtml(err.message));
	}
	
}

function hasOwnProperty(obj, prop) {
    var proto = obj.__proto__ || obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

function getErrorHtml(section, message) {
	return '<div class="panel panel-danger">' +
				'	<div class="panel-heading">' +
				'		<h3 class="panel-title">An error occurred loading the panel</h3>' +
				'	</div>' + 
				'	<div class="panel-body">' + message + '</div>' + 
				'	<div class="panel-footer">' + 
				'		<dl class="dl-horizontal">' + 
				'			<dt>Web Connector Address</dt><dd>' + _webConnectorUrl + '</dd>' + 
				'			<dt>Application ID</dt><dd>' + _applicationID + '</dd>' + 
				'			<dt>Workflow Process ID</dt><dd>' + _workflowProcessID + '</dd>' + 
				'			<dt>Record ID</dt><dd>' + _recordID + '</dd>' + 
				'			<dt>User ID</dt><dd>' + _userID + '</dd>' + 
				'			<dt>Section ID</dt><dd>' + section + '</dd>' +
				'		</dl>' + 
				'	</div>' + 
				'</div>'
}
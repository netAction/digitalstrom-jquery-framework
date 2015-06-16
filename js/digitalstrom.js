function rawCommand(func, data, callback) {
	var serverUrl = 'https://192.168.10.32:8080/json';

	$.ajax({
		url: serverUrl+func+'?callback=?',
		dataType: 'json',
		data: data,
		success: function( data ) {
			if(!data.ok) {
				logError('Error with func '+func+': '+data.message);
				if (data.message=='Application-Authentication failed') {
					localStorage.setItem('applicationToken','');
					logError('Application Token wrong.');
				}
				if (data.message=='Authentication failed' || data.message=="Missing parameter 'password'") {
					logError('Password wrong.');
				}
				return;
			}
			// in case of success:
			logError('Success with func '+func);
			callback(data.result);
		},
		error: function( data ) {
			logError('Special error with func: '+func);
		}
	});
}

function logError(message) {
	$('#error').append(message+'<br><br>');
}

// Standard request for everything except login
function request(func, data, callback) {
	if(!localStorage.applicationToken) {
		showLogin();
	} else {
		rawCommand('/system/loginApplication',
			{'loginToken': localStorage.applicationToken},
			function(result) {
				data.token = result.token;
				rawCommand(func, data, callback);
			}
		);
	}
}

function showLogin() {
	$('#login').show();
	$('#login-send').click(function(){
		login($('#login-name').val(),$('#login-password').val());
	});
}

function login(name, password) {
	// Do login
	rawCommand('/system/requestApplicationToken',{'applicationName':'FirstBlood'}, function(result) {
		var applicationToken = result.applicationToken;

		rawCommand('/system/login',{'user':name,'password':password},
			function(result) {
				sessionToken = result.token;
				rawCommand('/system/enableToken',{'applicationToken':applicationToken,'token':sessionToken},
					function(result) {
						localStorage.setItem('applicationToken', applicationToken);
						data.token = sessionToken;
						rawCommand(func, data, callback);
					}
				);
			}
		);
	});
}


function getAllInfo() {

	request('/apartment/getName', {}, function(result) {
		$('.container').append('<h3>Name: '+result.name+'</h3>')
	});
	request('/apartment/getConsumption', {}, function(result) {
		$('.container').append('<h3>Wohnung Verbrauch: '+result.consumption+'W</h3>')
	});
	request('/apartment/getStructure', {}, function(result) {
		var html = '<h3>Apartment Structure</h3><ul>';
		$.each(result.apartment.zones, function(index, zone) {
			html+='<li>Zone<ul>';
			html+='<li>id: '+zone.id+'</li>';
			if (zone.name) html+='<li>name: '+zone.name+'</li>';
			if (zone.isPresent) html+='<li>isPresent</li>';

			$.each(zone.devices, function(index, device) {
				html+='<li>Device<ul>';
				html+='<li>meterName: '+device.meterName+'</li>';
				html+='<li>hwInfo: '+device.hwInfo+'</li>';
				if (device.name) html+='<li>name: '+device.name+'</li>';
				if (device.id) html+='<li>id: '+device.id+'</li>';
				if (device.on) html+='<li>on</li>';
				html+="<li>Sensors (4:W, 6:10Wh)<ul>";
				$.each(device.sensors, function(index, sensor) {
					html+='<li>Sensor '+index+': '+sensor+'</li>';
				});
				html+='</ul>';
				html+='</ul></li>';
			});

		//$.each(zone.groups, function(index, group) {

			html+='</ul></li>';
		});
		html+='</ul>';
		$('.container').append(html);
	});

	request('/apartment/getCircuits', {}, function(result) {
		var html = '<h3>Meters</h3><ul>';
		$.each(result.circuits, function(index, circuit) {
			html+='<li>Circuit<ul>';
			if (circuit.name) html+='<li>name: '+circuit.name+'</li>';
			if (circuit.hwName) html+='<li>hwName: '+circuit.hwName+'</li>';
			if (circuit.dsid) html+='<li>dsid: '+circuit.dsid+'</li>';
			html+='</ul></li>';
		});
		html+='</ul>';
		$('.container').append(html);
	});

//			request('/device/turnOn', {'dsid':'303505d7f800004000030143'}, function(result) {
//				$('.container').append('<h3>Bad-Spiegel eingeschaltet</h3>');
//			});
//			request('/device/turnOff', {'dsid':'303505d7f800004000030143'}, function(result) {
//				$('.container').append('<h3>Bad-Spiegel ausgeschaltet</h3>');
//			});
	request('/circuit/getConsumption', {'id':'302ed89f43f00e4000005b11'}, function(result) {
		$('.container').append('<h3>Küche-Spielzimmer Leistung: '+result.consumption+' W</h3>');
	});


	request('/device/getSensorValue',
		{'dsid':'303505d7f800004000030143','sensorIndex':2},
		function(result) {
		$('.container').append('<h3>Bad-Spiegel Leistung: '+result.sensorValue+' W</h3>');
	});
	request('/device/getSensorValue',
		{'dsid':'303505d7f800004000030143','sensorIndex':4},
		function(result) {
		$('.container').append('<h3>Bad-Spiegel Energie: '+result.sensorValue+'0 Wh</h3>');
	});

} // getAllInfo

$(function() {
	request('/apartment/getDevices', {}, function(result) {
		$.each(result, function(index, device) {
			$('#switches').append(
				device.name+
				' <button class="btn btn-default" data-id="'+device.id+'" data-instruction="On">AN</button>'+
				' <button class="btn btn-default" data-id="'+device.id+'" data-instruction="Off">AUS</button>'+
				'<br><br>'
			);
		});

		$('#switches button').click(function() {
			var instruction = $(this).attr('data-instruction');
			var id = $(this).attr('data-id');

			request('/device/turn'+instruction, {'dsid':id}, function() {
			});
		});

	});

	getAllInfo();

});
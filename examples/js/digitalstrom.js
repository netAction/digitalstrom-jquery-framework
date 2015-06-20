function sendServer() {
	console.log("Send Digitalstrom server name to plugin.");
	// You could show a form here to let the user enter the server.
	$.digitalstrom.useServer('https://192.168.10.32:8080');
}
$(document).bind('dsNeedServer', sendServer);



function showLogin() {
	$('#login').show();
}
$('#login-send').click(function(){
	$.digitalstrom.useCredentials($('#login-name').val(),$('#login-password').val());
});

$(document).bind('dsNeedLogin', showLogin);




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



function switches() {
	$('#login').hide();


	$.digitalstrom.request('apartment/getDevices', {}, function(result) {
		console.log(result);
		$.each(result, function(index, device) {
			$('#switches').append(
				'<label>'+device.name+'</label>'+
				' <button class="btn btn-success" data-id="'+device.id+'" data-instruction="On">AN</button>'+
				' <button class="btn btn-danger" data-id="'+device.id+'" data-instruction="Off">AUS</button>'+
				'<br><br>'
			);
		});

		$('#switches button').click(function() {
			var instruction = $(this).attr('data-instruction');
			var id = $(this).attr('data-id');

			$.digitalstrom.request('device/turn'+instruction, {'dsid':id}, function() {
			});
		});

	});

}
$(document).bind('dsReady', switches);




$(function() {
	$.digitalstrom.init('Second Blood');
});

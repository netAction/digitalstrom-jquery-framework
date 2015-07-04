// Global handler for polling
var pollingHandle;

function sendServer(message, servername) {
	// message: "no server selected", "timeout", "error", "parsererror"

	// This function gives the correct server name to the plugin or calls init().
	// But if the settings look fine, we better cancel to avoid an endless loop:
	if (servername == 'https://192.168.10.32:8080') {
		$('h1').text('Could not access Digitalstrom server due to '+message+'.')
			.after('<p>Check if <a href="'+servername+'">'+servername+'</a> is available.</p>');
		return;
	}

	console.log("Send Digitalstrom server name to plugin.");
	// You could show a form here to let the user enter the server.
	$.digitalstrom.useServer('https://192.168.10.32:8080');
}
$(document).bind('dsNeedServer', function(event, message, servername) {
	clearInterval(pollingHandle);
	sendServer(message, servername);
});



function showLogin(message) {
	// messsage:
	// "No application token set"
	// "Application-Authentication failed" (token invalid)
	// "Missing parameter 'password'"
	// "Missing parameter 'user'"
	// "Authentication failed" (username and password invalid)

	$('#login').show();
}
$('#login-send').click(function(){
	$.digitalstrom.useCredentials($('#login-name').val(),$('#login-password').val());
});

$(document).bind('dsNeedLogin', function(event, message, data) {
	clearInterval(pollingHandle);
	showLogin(message);
});


function markActiveScenes() {
	$.digitalstrom.request('/property/query',
		{'query': '/apartment/zones/*(ZoneID, name)/groups/*(lastCalledScene)'},
		function(response) {
			$.each(response.zones, function(index, zone) {
				// Is this not the generic zone 0?
				if (!zone.name) return;

				// Un-emphasize scenes of this zone
				$('button[data-ZoneID='+zone.ZoneID+']').removeClass('btn-primary').addClass('btn-default');
				// Emphasize active scene of this zone
				$('button[data-ZoneID='+zone.ZoneID+'][data-sceneNumber='+zone.groups[1].lastCalledScene+']')
					.removeClass('btn-default').addClass('btn-primary');

				console.log(zone.name, zone.ZoneID, zone.groups[1].lastCalledScene, new Date().toUTCString() );
			});
	});
}


function start() {
	$('#login').hide();

	$.digitalstrom.request('/apartment/getName', {}, function(result) {
		$('h1, title').text(result.name);

	});

	$.digitalstrom.request('/property/query',
		{'query': '/apartment/zones/*(ZoneID,scenes,name)/groups/*(group)/scenes/*(scene,name)'},
		function(response) {

		$.each(response.zones, function(index, zone) {
			// Is this not the generic zone 0?
			if (!zone.name) return;

			$('#scenes').append(
				'<label>'+zone.name+'</label>'+
				' <button class="btn btn-default btn-block" data-ZoneID="'+zone.ZoneID+'" data-sceneNumber="0">Aus</button>'
			);

			$.each(zone.groups[1].scenes, function(index, scene) {
				$('#scenes').append(
					' <button class="btn btn-default btn-block" data-ZoneID="'+zone.ZoneID+'" data-sceneNumber="'+scene.scene+'">'+scene.name+'</button>'
				);
			});
			$('#scenes').append('<br><br>');
		});


		// Click a button
		$('#scenes button').click(function() {
			var ZoneID = $(this).attr('data-ZoneID');
			var sceneNumber = $(this).attr('data-sceneNumber');

			$.digitalstrom.request('zone/callScene', {'sceneNumber': sceneNumber, 'id': ZoneID}, function() {
				markActiveScenes();
			});
		});


		// Poll status every 10 seconds
		pollingHandle = setInterval(function() {
			markActiveScenes();
		}, 15000);
		markActiveScenes();

	});

} // getAllScenes



$(document).bind('dsReady', start);




$(function() {
	$.digitalstrom.init('Scene Application');
});

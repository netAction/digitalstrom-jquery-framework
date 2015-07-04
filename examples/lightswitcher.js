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
$(document).bind('dsNeedServer', function(event, message, servername) { sendServer(message, servername); });



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

$(document).bind('dsNeedLogin', function(event, message, data) { showLogin(message); });




function switches() {
	$('#login').hide();


	$.digitalstrom.request('apartment/getDevices', {}, function(result) {
		console.log(result);
		$.each(result, function(index, device) {
			$('#switches').append(
				'<label>'+device.name+'</label>'+
				' <button data-id="'+device.id+'" data-instruction="On">AN</button>'+
				' <button data-id="'+device.id+'" data-instruction="Off">AUS</button>'+
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
	$.digitalstrom.init('Lightswitcher');
});

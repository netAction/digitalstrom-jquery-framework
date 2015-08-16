/* ############################
	Digitalstrom jQuery Framework
	https://github.com/netAction/digitalstrom-jquery-framework
	2015 - MIT License - Thomas netAction Schmidt
	schmidt@netaction.de
	############################ */

(function( $ ) {

// Print important messages to console. If there is an element with class ds-message-log, append message
// Not public, only used inside this plugin.
function logMessage(message) {
	$('.ds-message-log').append(message+"\n");
	console.log('Digitalstrom: '+message);
}


// The Ajax call that is exclusively used for all communication to Digitalstrom server.
// Not public, only used inside this plugin.
function rawCommand(func, data, callback) {
	var url = localStorage.dsServername+'/json/'+func;

	$.ajax({
		url: url+'?callback=?',
		dataType: 'json',
		data: data,
		timeout: 3000,
		success: function( response ) {
			callback(response);
		},
		error: function(jqXHR,textStatus) {
			// textStatus: "timeout"
			// "error": SSL error, 404, server unavailable (we can't differ between these)
			// "abort"
			// "parsererror": wrong data type or no data received
			logMessage('dsNeedServer triggered as server not available due to ('+textStatus+') when trying: '+func);
			$(document).trigger('dsNeedServer', [textStatus, localStorage.dsServername]);
		},
	});
}


// Test if we can come back with stored application token.
// Not public, only used inside this plugin.
function subsequentLogin() {
	// get rid of the zombie token cookie:
	rawCommand('system/logout', {}, function() {
		if(!localStorage.dsApplicationToken) {
			logMessage('dsNeedLogin triggered as no application token set.');
			$(document).trigger('dsNeedLogin', 'No application token set');
			return;
		}

		// test token
		rawCommand('system/loginApplication',
			{'loginToken': localStorage.dsApplicationToken},
			function(response) {
				if ((!response.ok) && (response.message='Application-Authentication failed')) {
					localStorage.removeItem('dsApplicationToken');
					logMessage('dsNeedLogin triggered as application token is no longer valid.');
					$(document).trigger('dsNeedLogin', response.message);
					return;
				}
				logMessage('dsReady triggered, everything fine.');
				$(document).trigger('dsReady');
			}
		);

	});
}



// Now start with public plugin functions
$.digitalstrom = {
	// Usually run on document ready. Use this before all other digitalstrom functions.
	init : function(applicationName) {

		// localStorage.dsApplicationName shall contain
		// the name of this application stored as our name in Digitalstrom server:
		if (typeof applicationName === "undefined") {
			if (!localStorage.dsApplicationName) {
				localStorage.setItem('dsApplicationName', 'netAction');
			}
		} else {
			localStorage.setItem('dsApplicationName', applicationName);
		}

		this.applicationName = applicationName;

		// Server unknown?
		if(!localStorage.dsServername) {
			logMessage('dsNeedServer triggered. Server URL not provided.');
			$(document).trigger('dsNeedServer', ['no server selected', '']);
			return;
		}
		// Server available?
		rawCommand('system/version', {}, function(response) {
			logMessage('DS Server found at '+localStorage.dsServername+ ' with version '+response.result.version);
			subsequentLogin();
		});
	},


	// Tell Digitalstrom what server to use.
	useServer : function(url) {
			localStorage.setItem('dsServername',url);
			logMessage('Set server URL to '+url+'. Try to connect now...');
			this.init();
	},


	useCredentials : function(name, password) {
		rawCommand('system/logout', {}, function() {

			// Do login
			rawCommand('system/requestApplicationToken',{'applicationName': localStorage.dsApplicationName}, function(response) {

				var applicationToken = response.result.applicationToken;

				rawCommand('system/login', {'user':name,'password':password},
					function(response) {
						if (!response.ok) {
							logMessage('dsNeedLogin triggered as user unknown.');
							$(document).trigger('dsNeedLogin', response.message);
							return;
						}
						sessionToken = response.result.token;
						rawCommand('system/enableToken',{'applicationToken':applicationToken,'token':sessionToken},
							function(response) {
								localStorage.setItem('dsApplicationToken', applicationToken);
								logMessage('dsReady triggered. User '+name+' successfully logged in.');
								$(document).trigger('dsReady');
							}
						);
					}
				);
			});
		});
	},


	// Standard request after init completed (dsReady)
	// Receive sensor data and send commands to Digitalstrom devices.
	request : function(func, data, callback) {
		rawCommand('system/loginApplication',
			{'loginToken': localStorage.dsApplicationToken},
			function(response) {
				if ((!response.ok) && (response.message='Application-Authentication failed')) {
					// Caution: “Application-Authentication failed” will also show up when too many tokens are requested in short time.
					logMessage('dsNeedLogin triggered. Application-Authentication failed while trying to call '+func);
					$(document).trigger('dsNeedLogin', response.message);
					return;
				}

				// Add login token to parameters
				data.token = response.result.token;
				rawCommand(func, data, function(response) {
					if(!response.ok) {
						logMessage('Error with func '+func+': '+response.message);
						if (response.message=='Application-Authentication failed') {
							localStorage.setItem('applicationToken','');
							logMessage('Application Token wrong: '+ response.token);
						}
						if (response.message=='Authentication failed' || response.message=="Missing parameter 'password'") {
							logMessage('Password wrong.');
						}
						return;
					}
					// in case of success:
					logMessage('Success with func '+func);
					callback(response.result);
				});
			}
		);
	},

}


}( jQuery ));

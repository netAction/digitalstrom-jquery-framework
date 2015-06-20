/* ############################
	Digitalstrom jQuery Framework
	https://github.com/netAction/digitalstrom-jquery-framework
	2015 - MIT License - Thomas netAction Schmidt
	schmidt@netaction.de
	############################ */

(function( $ ) {

// Print important messages to console and if you like to elements with class ds-message-log.
// Not public, only used inside this plugin.
function logMessage(message) {
	$('.ds-message-log').append(message+"\n");
	console.log('Digitalstrom: '+message);
}


// The Ajax call that is exclusively used for all communication to Digitalstrom server.
// Not public, only used inside this plugin.
function rawCommand(func, data, callback) {
	var serverUrl = localStorage.dsServername+'/json/';

	$.ajax({
		url: serverUrl+func+'?callback=?',
		dataType: 'json',
		data: data,
		success: function( data ) {
			callback(data);
		},
		error: function() {
			logMessage('dsNeedServer triggered as server not available when trying: '+func);
			$(document).trigger('dsNeedServer');

		}
	});
}


// Test if we can come back with stored application token.
// Not public, only used inside this plugin.
function subsequentLogin() {
	// get rid of the zombie token cookie:
	rawCommand('system/logout', {}, function() {
		if(!localStorage.dsApplicationToken) {
			logMessage('dsNeedLogin triggered as user unknown.');
			$(document).trigger('dsNeedLogin');
			return;
		}

		// test token
		rawCommand('system/loginApplication',
			{'loginToken': localStorage.dsApplicationToken},
			function(result) {
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
			$(document).trigger('dsNeedServer');
			return;
		}
		// Server available?
		rawCommand('system/version', {}, function(data) {
			logMessage('DS Server found at '+localStorage.dsServername+ ' with version '+data.result.version);
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
			rawCommand('system/requestApplicationToken',{'applicationName': localStorage.dsApplicationName}, function(result) {

				var applicationToken = result.result.applicationToken;

				rawCommand('system/login', {'user':name,'password':password},
					function(result) {
						if (!result.ok) {
							logMessage('dsNeedLogin triggered as user unknown.');
							$(document).trigger('dsNeedLogin', result.message);
						}
						sessionToken = result.result.token;
						rawCommand('system/enableToken',{'applicationToken':applicationToken,'token':sessionToken},
							function(result) {
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
			function(result) {
				data.token = result.result.token;
				rawCommand(func, data, function(data) {
					if(!data.ok) {
						logMessage('Error with func '+func+': '+data.message);
						if (data.message=='Application-Authentication failed') {
							localStorage.setItem('applicationToken','');
							logMessage('Application Token wrong: '+ data.token);
						}
						if (data.message=='Authentication failed' || data.message=="Missing parameter 'password'") {
							logMessage('Password wrong.');
						}
						return;
					}
					// in case of success:
					logMessage('Success with func '+func);
					callback(data.result);
				});
			}
		);
	},

}


}( jQuery ));

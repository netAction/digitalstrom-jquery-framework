# Digitalstrom framework for jQuery

The Digitalstrom servers provide access via a JSON API. It allows web pages and apps to send lighting commands and request sensor data. This plugin does all the connection and authentification stuff for you. You can create a nice web page using jQuery in no time, and the plugin file manages the connection.

This plugin is designed to handle all possible troubles like *connection loss, timeout, SSL error, wrong server, broken server, missing credentials, wrong credentials* and so on. You just code some payload commands and provide the plugin with needed data in case of errors.



### [Demo](http://netaction.github.io/digitalstrom-jquery-framework/examples/bootstrap.html)

## Example application

Connect to Digitalstrom server. Ask user for password, validate session and get server name.

```html
<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8">
  </head>
  <body>
    <h1>Digitalstrom</h1>
    <pre class="ds-message-log"></pre>

    <script src="js/jquery-2.1.4.min.js"></script>
    <script src="../digitalstrom.jquery.js"></script>
    <script type="application/javascript">

    // When the plugin asks, tell where to find the server.
    function sendServer(message, servername) {
      // message: "no server selected", "timeout", "error", "parsererror"
      if (servername == 'https://192.168.10.32:8080') {
        $('h1').text('Could not access Digitalstrom server due to '+message+'.')
          .after('<p>Check if <a href="'+servername+'">'+servername+'</a> is available.</p>');
        return;
      }
      $.digitalstrom.useServer('https://192.168.10.32:8080');
    }
    $(document).bind('dsNeedServer', sendServer);

    // When the plugin asks, tell user name and password.
    function sendCredentials() {
      $.digitalstrom.useCredentials('dssadmin',prompt('password for dssadmin'));
    }
    $(document).bind('dsNeedLogin', sendCredentials);


    // And now start with the payload.
    function doStuff() {
      $.digitalstrom.request('/apartment/getName', {}, function(response) {
        $('h1').text('Name: '+response.name);
      });
    }
    $(document).bind('dsReady', doStuff);

    // On page ready initalize your page in Digitalstrom server under a name of your choice
    $(function() {
      $.digitalstrom.init( navigator.userAgent );
    });
    </script>
  </body>
</html>
```


## Functions

You contact this plugin using these four functions.

**$.digitalstrom.init**( applicationName )

* Call this after document ready.
* **parameter:** You will be known in Digitalstrom server under this name like “Thomas Tablet”.
* **triggered events:** dsNeedServer | dsNeedLogin | dsReady

---

**$.digitalstrom.useServer**( serverURL )

* Call this only after dsNeedServer.
* **parameter:** URL of the server like “https://192.168.10.32:8080”.
* **triggered events:** dsNeedServer | dsNeedLogin | dsReady

---

**$.digitalstrom.useCredentials**( name, password )

* Call this only after dsNeedLogin.
* **parameter:** name and password like “dssadmin”, “12345”.
* **triggered events:** dsNeedLogin | dsReady

---

**$.digitalstrom.request**( func, data, callback )

* Do the useful stuff. Receive sensor data and send commands to Digitalstrom devices. Call this only after dsReady.
* **parameter func:** string of the function without domain and parameters like “/device/getSensorValue”
* **parameter data:** object of parameters like “{'dsid':'303505d7f800004000030143','sensorIndex':2}”
* **parameter callback:** function called after request like “function(result) { $('#power').text(result.sensorValue); }”


## Events

This plugin triggers an event when ready or information needed.

**dsNeedServer**

When this plugin does not find the server or does not have any server name it will fire *dsNeedServer*. You can bind a function that displays an input asking for the URL. On submit it should call **$.digitalstrom.useServer**.

---

**dsNeedLogin**

When the name and password for the Digitalstrom server do not work or are unknown, this event will be triggered. You can bind a function that displays inputs asking for username and password. On submit it should call **$.digitalstrom.useCredentials**.

The user does not have to enter a name and password. It is also possible to authorize the connection from any other valid connection using *system/enableToken* command.

---

**dsReady**

After this event you can call **$.digitalstrom.request** whenever you like. Until one of the other two occur, than you have to wait for *dsReady* again.


## Storage

The Digitalstrom server sends a cookie on login. This is a cross domain cookie that can't be accessed from this plugin. We try to ignore it. For debugging it might be neccessary to delete it.

This plugin does not use any persistent variables in JavaScript or jQuery namespaces. The only storage is the *localStorage*. We have *localStorage.dsServername*, *localStorage.dsApplicationName* and *localStorage.dsApplicationToken*.

var socket = io.connect('http://localhost:8080');
socket.on('log', function(data) {
	log(data.text);
	socket.emit('my other event', {
		my : 'data'
	});
});

var worker;

$(document).ready(
		function() {
			$("#deployWorkerButton")
					.on(
							"click",
							function() {

								window.URL = window.URL || window.webkitURL;

								// "Server response", used in all examples
								var response = $('#webworkerArea').val();

								var blob;
								try {
									blob = new Blob([ response ]);
								} catch (e) { // Backwards-compatibility
									window.BlobBuilder = window.BlobBuilder
											|| window.WebKitBlobBuilder
											|| window.MozBlobBuilder;
									blob = new BlobBuilder();
									blob.append(response);
									blob = blob.getBlob();
								}
								worker = new Worker(URL.createObjectURL(blob));

								// Test, used in all examples:
								worker.onmessage = function(e) {
									if (e.data.type == 'log') {
										log('Webworker ' + e.data.text);
									}
									if (e.data.type == 'found') {
										log('Webworker: found result = '
												+ e.data.value);

										socket.emit('client-found-password', {
											value : e.data.value
										});
									}
								};
							});

			$("#startWorkerButton").on("click", function() {
				worker.postMessage('Start Working');
			});
		});

function log(message) {
	$('#log').append('</br>' + message);
}

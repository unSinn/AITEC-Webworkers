var socket = io.connect('http://localhost:8080');
var worker;

socket.on('log', function(data) {
	log("Node:" + data.text);
});

socket.on('clients-start-cracking', function(data) {
	$('#md5').val(data.pwmd5);
	if (worker) {
		log("Sending start-cracking to worker");
		worker.postMessage({
			cmd : 'start-cracking',
			pwmd5 : data.pwmd5
		});
	} else {
		log("Error: could not start cracking. Worker not deployed");
	}
});

$(document).ready(
		function() {
			$("#deployWorkerButton").on(
					"click",
					function() {

						window.URL = window.URL || window.webkitURL;

						// "Server response", used in all examples
						var response = $('#webWorkerArea').val();

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
								log('Webworker: ' + e.data.text);
							}
							if (e.data.type == 'found') {
								log('Webworker: found result = '
										+ e.data.password);

								socket.emit('client-found-password', {
									name : $('#cracker-name').val(),
									password : e.data.password
								});
							}
						};
						workerStatus("Deployed");
						crackingStatus("Idle");
						log("Worker deployed.");
					});
			$("#startWorkerButton").on("click", function() {
				var pwmd5 = $('#md5').val();
				worker.postMessage({
					cmd : 'start-cracking',
					pwmd5 : pwmd5
				});
			});

		});

function log(message) {
	$('#log').append('</br>' + message);
}

function workerStatus(message) {
	$('#workerStatus').text(message);
}

function crackingStatus(message) {
	$('#crackingStatus').text(message);
}
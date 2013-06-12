var socket = io.connect('http://localhost:8080');
var worker;

socket.on('log', function(data) {
    log("Node:" + data.text);
});

socket.on('clients-start-cracking', function(data) {
    $('#md5').val(data.pwmd5);
    startWorker(data.pwmd5);
});

socket.on('userlist', function(userlist) {
    $('#toplistTable tbody').empty();
    for ( var key in userlist) {
	user = userlist[key];
	time = '-';
	if (user.endtime) {
	    time = user.endtime - user.starttime ;
	}
	$('#toplistTable tbody').append('<tr><td>' + user.name + '</td><td>' + user.status + '</td> <td>' + time + '</td></tr>');
    }
});

$(document).ready(function() {
    $("#deployWorkerButton").on("click", function() {

	window.URL = window.URL || window.webkitURL;

	// "Server response", used in all
	// examples
	var response = $('#webWorkerArea').val();

	var blob;
	try {
	    blob = new Blob([ response ]);
	} catch (e) { // Backwards-compatibility
	    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
	    blob = new BlobBuilder();
	    blob.append(response);
	    blob = blob.getBlob();
	}

	try {
	    if (worker) {
		worker.terminate();
	    }
	    worker = new Worker(URL.createObjectURL(blob));

	    // Test, used in all examples:
	    worker.onmessage = function(e) {
		if (e.data.type == 'log') {
		    log('Webworker: ' + e.data.text);
		}
		if (e.data.type == 'found') {
		    log('Webworker: found result = ' + e.data.password);

		    socket.emit('client-found-password', {
			name : $('#cracker-name').val(),
			password : e.data.password
		    });
		    workerStatus("Deployed / Idle / Found a password");
		}
	    };
	    worker.onerror = function(e) {
		workerStatus("Error: " + e.message);
	    }
	    workerStatus("Deployed");
	    log("Worker deployed.");
	} catch (err) {
	    log(err.message);
	    workerStatus("Error: " + err.message);
	}
    });
    $("#startWorkerButton").on("click", function() {
	var pwmd5 = $('#md5').val();
	try {
	    startWorker(pwmd5)
	} catch (err) {
	    log(err.message);
	    workerStatus("Error: " + err.message);
	}
    });

});

function startWorker(pwmd5) {
    if (worker) {
	sendClientStartedCracking();
	log("Sending start-cracking to worker");
	log(document.location);
	worker.postMessage({
	    url : JSON.stringify(document.location),
	    cmd : 'start-cracking',
	    pwmd5 : pwmd5
	});
	workerStatus("Cracking...");
    } else {
	log("Error: could not start cracking. Worker not deployed");
    }

}

function sendClientStartedCracking() {
    socket.emit('client-started-cracking', {
	name : $('#cracker-name').val()
    });
}

function log(message) {
    $('#log').append('</br>' + message);
}

function workerStatus(message) {
    $('#workerStatus').text(message);
}
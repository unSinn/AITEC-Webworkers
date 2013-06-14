var socket = io.connect('http://localhost:8080');
var worker;
var lastSortList;
var webWorkerArea;
var crackerName;

socket.on('log', function(data) {
    console.log("Node:" + data.text);
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
	    time = user.endtime - user.starttime;
	}
	$('#toplistTable tbody').append('<tr><td>' + user.name + '</td><td>' + user.status + '</td> <td>' + time + '</td></tr>');
    }
    $("#toplistTable").stupidtable();
    $("#th-time").click();
});

$(document).ready(function() {

    loadStoredContent();

    $("#toplistTable").on('sortEnd', function(e) {
	lastSortList = e.target.config.sortList;
    });

    var editor = CodeMirror.fromTextArea(document.getElementById("webWorkerArea"), {
	lineNumbers : true,
	matchBrackets : true,
	continueComments : "Enter",
	extraKeys : {
	    "Ctrl-Q" : "toggleComment"
	}
    });

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
		    console.log('Webworker: ' + e.data.text);
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
	    console.log("Worker deployed.");
	} catch (err) {
		console.log(err.message);
	    workerStatus("Error: " + err.message);
	}
    });
    $("#startWorkerButton").on("click", function() {
	var pwmd5 = $('#md5').val();
	try {
	    startWorker(pwmd5)
	} catch (err) {
		workerStatus("Error: " + err.message);
		console.log(err.message);
	}
    });

});

$(window).bind('beforeunload', function() {
    localStorage.setItem('webWorkerArea', JSON.stringify($('#webWorkerArea').val()));
    localStorage.setItem('cracker-name', JSON.stringify($('#cracker-name').val()));
});

function loadStoredContent() {
    webWorkerArea = JSON.parse(localStorage.getItem('webWorkerArea'));
    if (webWorkerArea) {
	$('#webWorkerArea').val(webWorkerArea);
    }
    crackerName = JSON.parse(localStorage.getItem('cracker-name'));
    if (crackerName) {
	$('#cracker-name').val(crackerName);
    }
}

function startWorker(pwmd5) {
    if (worker) {
	sendClientStartedCracking();
	console.log("Sending start-cracking to worker");
	worker.postMessage({
	    url : JSON.stringify(document.location),
	    cmd : 'start-cracking',
	    pwmd5 : pwmd5
	});
	workerStatus("Cracking...");
    } else {
	console.log("Error: could not start cracking. Worker not deployed");
    }

}

function sendClientStartedCracking() {
    socket.emit('client-started-cracking', {
	name : $('#cracker-name').val()
    });
}

function workerStatus(message) {
    $('#workerStatus').text(message);
}
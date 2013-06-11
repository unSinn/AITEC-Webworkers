var socket = io.connect('http://localhost:8080');

socket.on('log', function(data) {
	log(data.text);
});

var worker;

$(document).ready(function() {

	$("#startCracking").on("click", function() {
		var adminpw = $('#admin-pw').val();
		var pwclear = $('#crack-pw').val();
		var pwmd5 = md5(pwclear);
		log("Starting to crack hash:" + pwmd5);

		socket.emit('admin-start-cracking', {
			adminpw : adminpw,
			pwclear: pwclear,
			pwmd5 : pwmd5
		});
	});
});

function log(message) {
	$('#log').append('</br>' + message);
}

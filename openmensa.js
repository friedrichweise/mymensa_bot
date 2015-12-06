var http = require('http');


exports.getCanteenByCity = function (chatID, city, callback) { 
	var result = [];
	canteensCall(function(response){
		for(i=0; i<response.length; i++) {
			var mensa = response[i];
			if(mensa.city.toLowerCase()==city.toLowerCase()) result.push(mensa);
		}
		return callback(chatID,result);
	});
}

exports.getMealsByID = function(chatID, canteenID, callback) {
	var result = [];
	mealsCall(canteenID,function(response){
		return callback(chatID, response);
	});
}
function mealsCall(canteenID, callback) {
	var path = '/api/v2/canteens/'+canteenID+'/days/'+getDateString()+'/meals';
	console.log(path);
	http.get({
        host: 'openmensa.org',
        path: path
    }, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var parsed = JSON.parse(body);
            callback(parsed);
        });
    });
}
function getDateString() {
	var today = new Date();
	return (today.getMonth()+1)+'-'+today.getDate()+'-'+today.getFullYear();
	//@testing
	//return "12-8-2015";
}



function canteensCall(callback) {
	http.get({
        host: 'openmensa.org',
        path: '/api/v2/canteens?limit=500'
    }, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var parsed = JSON.parse(body);
            callback(parsed);
        });
    });
}




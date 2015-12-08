var http = require('http');
var canteens;

exports.getCanteenByCity = function (msg, city, callback) { 
	var result = [];
	var path = '/api/v2/canteens?limit=500';
	mensaCall(path, function(response){
		//simple canteen cache
		canteens = response;
		//filter by city
		if(response===null) return callback(msg, response)
		for(i=0; i<response.length; i++) {
			var mensa = response[i];
			if(mensa.city.toLowerCase()==city.toLowerCase()) result.push(mensa);
		}
		callback(msg, result, city);	
	});
}

exports.getMealsByID = function(msg, canteenID,extraModifier, callback) {
	var path = '/api/v2/canteens/'+canteenID+'/days/'+getDateString()+'/meals';
	mensaCall(path,function(response){
		//get Canteen Name
		var canteenName = null;
		if(canteens!=null){
			for(i=0; i<canteens.length; i++) {
				if(canteens[i].id==canteenID) canteenName=canteens[i].name;
			}
		}
		callback(msg, response, {"modifier":extraModifier,"canteenName":canteenName});
	});
}

function getDateString() {
	var today = new Date();
	return (today.getMonth()+1)+'-'+(today.getDate())+'-'+today.getFullYear();
	//@testing
	//return "12-8-2015";
}

function mensaCall(path, callback) {
	http.get({
        host: 'openmensa.org',
        path: path
    }, function(response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
        	var result;
        	try {
        		result = JSON.parse(body);
    		} catch (e) {
        		result = null;
    		}
            callback(result);
        });
    });
}




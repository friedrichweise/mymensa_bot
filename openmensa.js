const http = require('http');
let canteens;

exports.getCanteenByCity = function (city, callback) { 
	let result = [];
	const path = '/api/v2/canteens?limit=500';
	mensaCall(path, function(response){
		//simple canteen cache
		canteens = response;
		//filter by city
		if(response===null) return callback(null)
		for(i=0; i<response.length; i++) {
			let mensa = response[i];
			if(mensa.city.toLowerCase() === city.toLowerCase()) result.push(mensa);
		}
		callback(result);	
	});
}

exports.getMealsByID = function(canteenID, callback) {
	const path = '/api/v2/canteens/'+canteenID+'/days/'+getDateString()+'/meals';
	mensaCall(path,function(response){
		//get Canteen Name
		let canteenName = null;
		if(canteens!=null){
			for(i=0; i<canteens.length; i++) {
				if(canteens[i].id==canteenID) canteenName=canteens[i].name;
			}
		}
		callback(response, canteenName);
	});
}

function getDateString() {
	const today = new Date();
	return (today.getMonth()+1)+'-'+(today.getDate())+'-'+today.getFullYear();
}

function mensaCall(path, callback) {
	http.get({
        host: 'openmensa.org',
        path: path
    }, function(response) {
        let body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
        	let result;
        	try {
        		result = JSON.parse(body);
    		} catch (e) {
        		result = null;
    		}
            callback(result);
        });
    });
}




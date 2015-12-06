var token = require('./token.js').token;
var mensa = require('./openmensa.js');
var Bot = require('node-telegram-bot-api'),
    bot = new Bot(token, { polling: true });


/////////////////////
//get canteen by city
/////////////////////
bot.onText(/^\/mensa (.+)$/, function(msg, match){
  var city = match[1];
  bot.sendChatAction(msg.chat.id, 'typing').then(function () {
      mensa.getCanteenByCity(msg, city, responseCanteenCity);
  });
});
function responseCanteenCity(msg, result, city) {
  if(result===null) {
    botSendError(msg);
  }
  else {
    var out = [];
    for (i=0; i<result.length; i++) {
        var re = new RegExp(city+',', "gi");
        var name = result[i].name.replace(re, "");
        out.push([name+" ID:"+result[i].id,"/meals "+result[i].id]);
    }
    if(out.length==0) botSendError(msg);
    else {
      var opts = {
          reply_to_message_id: msg.message_id,
          reply_markup: JSON.stringify({keyboard: out, one_time_keyboard: true,resize_keyboard:false})
      };
      bot.sendMessage(msg.chat.id, 'Ergebnisse für '+city+':', opts);
    }
  }
}



/////////////////////////
//get meals by canteen id
/////////////////////////
bot.onText(/^\/meals (.+)$/, function(msg, match){
  var chatID = msg.chat.id;
  var canteenID = match[1];
  bot.sendChatAction(chatID, 'typing').then(function () {
      mensa.getMealsByID(msg, canteenID, responseMeals);
  });
});
function responseMeals(msg, result) {
    var output = "";
    if(result===null) {
      botSendError(msg);
      return;
    }
    for (i=0; i<result.length; i++) {
      var meal = result[i];
      output+='📂 '+meal.category+' ▶️ '+meal.name+' ◀️️ ';
      if(meal.prices.students!=null) output+= 'Student: '+meal.prices.students+'€';
      if(meal.prices.employees!=null) output+= ' Mitarbeiter: '+meal.prices.employees+'€ 💰';
      output+='\n';
    }
    if(output=="") {
      botSendError(msg);
      return;
    }
    bot.sendMessage(msg.chat.id, output);
}
///////////////////
//global error call
///////////////////
function botSendError(msg) {
  bot.sendMessage(msg.chat.id, '❌ Keine Ergebnisse');
}

////////
//@debug
bot.on('message', function (msg) {
  console.log("⭕️  New Message: "+msg.text);
});

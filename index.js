var token = require('./token.js').token;
var mensa = require('./openmensa.js');
var Bot = require('node-telegram-bot-api'),
    bot = new Bot(token, { polling: true });


var extras = {"items":[
          {"icon": "🌱","keywords":["vegetarisch","vegan"]},
          {"icon": "🍷", "keywords":["Alkohol"]},
          {"icon": "🐮", "keywords":["Rindfleisch"]},
          {"icon": "🐷", "keywords":["Schweinefleisch"]}
]};

var helpText = "Welcome to mymensa_bot \nPlease use the /mensa command to search for canteens in your city (example: /mensa Berlin). You are going to receive a custom keyboard that contains further commands.";

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
        var re = new RegExp(city+',', 'gi');
        var name = result[i].name.replace(re, '');
        out.push([name+' ➡️','/meals '+result[i].id]);
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

  var input = match[1].split(' ');
  var canteenID = input[0];
  var extraModifier = '';
  for(var a=0; (input.length>1 && a<extras.items.length); a++) {
      if(input[1]==extras.items[a].icon) extraModifier = extras.items[a].icon;
  }

  bot.sendChatAction(chatID, 'typing').then(function () {
      mensa.getMealsByID(msg, canteenID,extraModifier, responseMeals);
  });
});
function responseMeals(msg, result, extraResult) {
    var output = '';
    if(result===null) {
      botSendError(msg);
      return;
    }
    if(extraResult.canteenName!=null) output+='Ergebnisse für '+extraResult.canteenName+':\n\n';
    for (i=0; i<result.length; i++) {
      var meal = result[i];
      var flag = false;
      var notes = '';
      //add extra icons
      for(var a=0; a<extras.items.length; a++) {
        var extra = extras.items[a];
        if(evaluateNotes(meal.notes,extra.keywords)) {
          notes+=extra.icon;
          if(extraResult.modifier==extra.icon) flag = true;
        }
      }
      if(flag==true || extraResult.modifier=='') {
        output+='`▸ '+meal.category+'` : *'+meal.name+'*';
        if(meal.prices.students!=null) output+= ', Student: *'+meal.prices.students+'*€';
        if(meal.prices.employees!=null) output+= ' Mitarbeiter: *'+meal.prices.employees+'*€';
        output+=' '+notes;
        output+='\n';
      }
    }
    if(output=='') {
      botSendError(msg);
      return;
    }
    var opts = {
          parse_mode: 'Markdown',
    };
    bot.sendMessage(msg.chat.id, output,opts);
}
function evaluateNotes(notes,query) {
  if(notes===null | query===null) return false;
  for(var i=0; i<notes.length; i++) {
    for(var a=0; a<query.length; a++) {
        if(notes[i].indexOf(query[a])>-1) return true;
    }
  }
  return false;
}



bot.onText(/\/help/,function(msg){
  bot.sendMessage(msg.chat.id,helpText);
});
///////////////////
//global error call
///////////////////
function botSendError(msg) {
  bot.sendMessage(msg.chat.id, '❌ Keine Ergebnisse');
}

////////
//@debug
bot.on('message', function (msg) {
  console.log('⭕️  New Message: '+msg.text);
});

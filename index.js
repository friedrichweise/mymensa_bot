const token = require('./token.js').token;
const mensa = require('./openmensa.js');
const Bot = require('node-telegram-bot-api'),
    bot = new Bot(token, { polling: true });

const extras = {"items":[
          {"icon": "🌱","keywords": ["vegetarisch","vegan"]},
          {"icon": "🍷", "keywords":["Alkohol"]},
          {"icon": "🐮", "keywords":["Rindfleisch"]},
          {"icon": "🐷", "keywords":["Schweinefleisch"]}
]};

const helpText = `
Welcome to mymensa_bot \n
Please use the /mensa command to search for canteens in your city (example: /mensa Berlin). 
You are going to receive a custom keyboard that contains further commands.`;

/*
 * Requests of type /mensa city
 * Call the OpenMensa API and answers to the message
 */
bot.onText(/^\/mensa (.+)$/, function(msg, match){
  const city = match[1];
  bot.sendChatAction(msg.chat.id, 'typing').then(() => {
      mensa.getCanteenByCity(city, (result) => {
        const text = `Ergebnisse für ${city}:`;
        const opts = createCanteenKeyboard(result, city);
        if(opts) bot.sendMessage(msg.chat.id, 'Ergebnisse für '+city+':', opts);
        else botSendError(msg);
      });
  });
});

/*
 * creates telegram custom keyboard from all canteens in one city
 */
function createCanteenKeyboard(canteens, city) {
  if(!canteens) return null;
  let out = [];
  for (i=0; i<canteens.length; i++) {
    const re = new RegExp(city+',', 'gi');
    const name = canteens[i].name.replace(re, '');
    const keyboard_object = {text:name, callback_data: `${canteens[i].id}`};
    out.push([keyboard_object]);
  }
  if(out.length===0) return null;
  const opts = {
      reply_markup: JSON.stringify({inline_keyboard: out})
  };
  return opts;
}

/*
 * gets called after the user clicked on a custom keyboard key
 * return the full meal information for the mensa
 */
bot.on('callback_query', function onCallbackQuery(callbackQuery) {
  const canteenID = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
    parse_mode: 'Markdown'
  };
  //Das will man eigentlich
  bot.sendChatAction(msg.chat.id, 'typing').then(function () {
    mensa.getMealsByID(canteenID, (result, canteenName) => {
      if(!result) botSendError(msg);
      const text = createMealResponse(result, canteenName, '');
      if(!text) botSendError(msg)
      else bot.editMessageText(text, opts);
    })
  });

});

/*
 * Requests of type /meals id
 * call the OpenMensa and returns meals
 */
bot.onText(/^\/meals (.+)$/, function(msg, match){
  const chatID = msg.chat.id;
  const opts = {
        parse_mode: 'Markdown',
  };
  const input = match[1].split(' ');
  const canteenID = input[0];
  let extraModifier = '';
  for(a=0; (input.length>1 && a<extras.items.length); a++) {
      if(input[1]==extras.items[a].icon) extraModifier = extras.items[a].icon;
  }
  bot.sendChatAction(chatID, 'typing').then(function () {
    mensa.getMealsByID(canteenID, (result, canteenName) => {
      if(!result) botSendError(msg);
      const text = createMealResponse(result, canteenName, extraModifier);
      if(!text) botSendError(msg)
      else bot.sendMessage(chatID, text, opts);
    })
  });
});

/*
 * create human readable string of all meals offered by a single cantenn
 */
function createMealResponse(meals, canteen, modifiers) {
  let output = '';
  if(!meals) return null;
  if(canteen) output = `Ergebnisse für ${canteen} \n\n`;
  for (i=0; i<meals.length; i++) {
    const meal = meals[i];
    const flag = false;
    let notes = '';
    //add extra icons
    for(a=0; a<extras.items.length; a++) {
      const extra = extras.items[a];
      if(evaluateNotes(meal.notes,extra.keywords)) {
        notes+=extra.icon;
        if(modifiers===extra.icon) flag = true;
      }
    }
    if(flag==true || modifiers==='') {
      output+='`▸ '+meal.category+'` : *'+meal.name+'*';
      if(meal.prices.students!=null) output+= ', Student: *'+formatPrice(meal.prices.students)+'*€';
      if(meal.prices.employees!=null) output+= ' Mitarbeiter: *'+formatPrice(meal.prices.employees)+'*€';
      output+=' '+notes;
      output+='\n';
    } 
  }
  return output;
}

/*
 * Helper functions
 */
function evaluateNotes(notes,query) {
  if(notes===null | query===null) return false;
  for(i=0; i<notes.length; i++) {
    for(a=0; a<query.length; a++) {
        if(notes[i].indexOf(query[a])>-1) return true;
    }
  }
  return false;
}
function formatPrice(price) {
  let parts = price.toString().split('.');
  if(parts!=null && parts.length==2) {
    if(parts[1].length==1) return parts[0]+"."+parts[1]+"0";
  }
  return price;
}

/*
 * return help text
 */
bot.onText(/\/help/,function(msg){
  bot.sendMessage(msg.chat.id, helpText);
});
bot.onText(/\/start/,function(msg){
  bot.sendMessage(msg.chat.id, helpText);
});

/*
 * default error call
 */
function botSendError(msg) {
  bot.sendMessage(msg.chat.id, '❌ Keine Ergebnisse');
}



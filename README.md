# kochomat
*telegram bot for the OpenMensa API*

Simple Telegram Bot for the <a href="">OpenMensa API</a> using the <a href="">node-telegram-bot-api</a>, written in Node.js.


### Install Dev Environment
```
git clone
npm update
npm start
```

### Commands
#### /mensa [CITY]
**Example:** `/mensa berlin` <br>
**Returns:** custom keyboard with canteen selection
#### /meals [CANTEEN_ID]
**Example:** `meals 79` <br>
**Returns:** list of meals for the current day
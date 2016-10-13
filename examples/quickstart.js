'use strict';

let Wit = null;
let interactive = null;
let sizes = null;
let genders = null;
let request = null;
let queryString = null;
let Botkit = null;
let slackToken = null;
let controller = null;
let uuid = null;
let greetings = null;
let currentMessage = null;
let chatbot = null;
let context = typeof initContext === 'object' ? initContext : {};
let sessions = {};

try {
  greetings = new Map();
  greetings.set('Australia', "G'day mate!");
  greetings.set('Germany', 'Hallo!');
  request = require('request');
  uuid = require('node-uuid');
  
  slackToken = '<YOUR_SLACK_TOKEN>';
  
  // if running from repo
  Wit = require('../').Wit;
  Botkit = require('botkit');
  interactive = require('../').interactive;
  
  controller = Botkit.slackbot({
    debug: false
  })

  controller.spawn({
    token: slackToken
  }).startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error('Error connecting to slack: ', err)
    }
    console.log('Connected to slack')
  })
} catch (e) {
  Wit = require('node-wit').Wit;
  Botkit = require('botkit');
  interactive = require('node-wit').interactive;
}

const accessToken = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node examples/quickstart.js <wit-access-token>');
    process.exit(1);
  }
  return process.argv[2];
})();

// Quickstart example
// See https://wit.ai/ar7hur/quickstart

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    return new Promise(function(resolve, reject) {
//      if(response.text.indexOf("How do people say") === -1) {
        chatbot.reply(currentMessage, response.text);
//      }
      console.log('sending...', JSON.stringify(response));
      return resolve();
    });
  },
  addGreeting({context, entities}) {
    return new Promise(function(resolve, reject) {
        var location = firstEntityValue(entities, "location")
        console.log(location);
        if (location) {
          if(!greetings.get(location)) {
            greetings.set(location, entities['greeting'][0].value);
            context.greeting = entities['greeting'][0].value;
          } else {
            context.greeting = greetings.get(location);
          }
          context.location = location;
          delete context.missingLocation;
        } else {
          context.missingLocation = true;
          delete context.greeting;
        }
        return resolve(context);
    });
  },
  getGreeting({context, entities}) {
    return new Promise(function(resolve, reject) {
        var greeting = context.greeting;
        var location = firstEntityValue(entities, 'location')
        console.log("Got location " + location);
        if(!greeting) {
            greeting = greetings.get(location);
        }
        
        if (greeting) {
          context.greeting = greeting;
          delete context.location;
          delete context.missingLocation;
        } else {
          context.missingLocation = true;
          delete context.greeting;
        }
        return resolve(context);
    });
  },
  showEmpathy({context, entities}) {
    return new Promise(function(resolve, reject) {
        var goodOrBad = firstEntityValue(entities, 'good_bad');
      
        console.log("Good or bad " + goodOrBad);
      
        if(goodOrBad === 'good') {
          chatbot.reply(currentMessage, "That's great! Have a good day!");
        } else {
          chatbot.reply(currentMessage, "Oh no! I hope you feel better soon.");
        }
        return resolve();
    });
  },
  
};

const client = new Wit({accessToken, actions});
controller.hears('.*', 'direct_message,direct_mention', function (bot, message) {
  currentMessage = message;
  chatbot = bot;
  
  const sessionId = message.user;
  if(!sessions[sessionId]) {
    sessions[sessionId] = {user: message.user, context: {}};
  }
  
  console.log(message.text);
  
  client.runActions(
    sessions[sessionId].user, // the user's current session
    message.text, // the user's message
    sessions[sessionId].context, // the user's current session state
    5
  ).then((context) => {
    // Our bot did everything it has to do.
    // Now it's waiting for further messages to proceed.
    console.log('Waiting for next user messages');

    // Based on the session state, you might want to reset the session.
    // This depends heavily on the business logic of your bot.
    // Example:
    // if (context['done']) {
    //   delete sessions[sessionId];
    // }

    // Updating the user's current session state
    sessions[sessionId].context = context;
  })
  .catch((err) => {
    console.error('Oops! Got an error from Wit: ', err.stack || err);
  })
})
//interactive(client);

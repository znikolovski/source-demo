'use strict';

let Wit = null;
let interactive = null;
let greetings = null;

try {
  greetings = new Map();
  greetings.set('Australia', "G'day mate!");
  greetings.set('Germany', 'Hallo!');
  
  // if running from repo
  Wit = require('../').Wit;
  interactive = require('../').interactive;
} catch (e) {
  Wit = require('node-wit').Wit;
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
      console.log('sending...', JSON.stringify(response));
      return resolve();
    });
  },
  getGreeting({context, entities}) {
    return new Promise(function(resolve, reject) {
        var greeting = context.greeting;
        var location = firstEntityValue(entities, 'location')
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
  addGreeting({context, entities}) {
    return new Promise(function(resolve, reject) {
        var location = firstEntityValue(entities, "location")
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
};

const client = new Wit({accessToken, actions});
interactive(client);

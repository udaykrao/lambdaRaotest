/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a sample skill built with Amazon Alexa Skills nodejs
 * skill development kit.
 * This sample supports multiple languages (en-US, en-GB, de-GB).
 * The Intent Schema, Custom Slot and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-howto
 **/

'use strict';

const Alexa = require('alexa-sdk');
const recipes = require('./recipes');
const personaldates = require('./personaldates');
var request = require('./node_modules/request');
var moment = require('./node_modules/moment');
var shuffle = require('./node_modules/shuffle-array');
var sprintf = require('./node_modules/sprintf-js').sprintf;
var cache = { "time" : Date.now(), "value" : "empty"};


const APP_ID = undefined; // TODO replace with your app ID (OPTIONAL).

const languageStrings = {
    'en': {
        translation: {
            RECIPES: recipes.RECIPE_EN_US,
            PERSONALDATES: personaldates.PERSONALDATES_EN_US,
            // TODO: Update these messages to customize.
            SKILL_NAME: 'Marcy\'s valet',
            WELCOME_MESSAGE: "Welcome to %s. You can ask a question like, what happened on a date? ... Now, what can I help you with?",
            WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',
            DISPLAY_CARD_TITLE: '%s  - Recipe for %s.',
            HELP_MESSAGE: "You can ask questions such as, what happened on a date, or, you can say exit...Now, what can I help you with?",
            HELP_REPROMPT: "You can say things like, what happened on a date, or you can say exit...Now, what can I help you with?",
            STOP_MESSAGE: 'Goodbye!',
            RECIPE_REPEAT_MESSAGE: 'Try saying repeat.',
            RECIPE_NOT_FOUND_MESSAGE: "I\'m sorry, I currently do not know ",
            RECIPE_NOT_FOUND_WITH_ITEM_NAME: 'the recipe for %s. ',
            RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME: 'that recipe. ',
            RECIPE_NOT_FOUND_REPROMPT: 'What else can I help with?',
        },
    },
    'en-US': {
        translation: {
            RECIPES: recipes.RECIPE_EN_US,
            PERSONALDATES: personaldates.PERSONALDATES_EN_US,
            SKILL_NAME: 'Marcy\'s valet',
        },
    },
    'en-GB': {
        translation: {
            RECIPES: recipes.RECIPE_EN_GB,
            PERSONALDATES: personaldates.PERSONALDATES_EN_US,
            SKILL_NAME: 'Marcy\'s valet',
        },
    },
    'de': {
        translation: {
            RECIPES: recipes.RECIPE_DE_DE,
            PERSONALDATES: personaldates.PERSONALDATES_EN_US,
            SKILL_NAME: 'Marcy\'s valet',
            WELCOME_MESSAGE: 'Willkommen bei %s. Du kannst beispielsweise die Frage stellen: Welche Rezepte gibt es für eine Truhe? ... Nun, womit kann ich dir helfen?',
            WELCOME_REPROMPT: 'Wenn du wissen möchtest, was du sagen kannst, sag einfach „Hilf mir“.',
            DISPLAY_CARD_TITLE: '%s - Rezept für %s.',
            HELP_MESSAGE: 'Du kannst beispielsweise Fragen stellen wie „Wie geht das Rezept für“ oder du kannst „Beenden“ sagen ... Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Du kannst beispielsweise Sachen sagen wie „Wie geht das Rezept für“ oder du kannst „Beenden“ sagen ... Wie kann ich dir helfen?',
            STOP_MESSAGE: 'Auf Wiedersehen!',
            RECIPE_REPEAT_MESSAGE: 'Sage einfach „Wiederholen“.',
            RECIPE_NOT_FOUND_MESSAGE: 'Tut mir leid, ich kenne derzeit ',
            RECIPE_NOT_FOUND_WITH_ITEM_NAME: 'das Rezept für %s nicht. ',
            RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME: 'dieses Rezept nicht. ',
            RECIPE_NOT_FOUND_REPROMPT: 'Womit kann ich dir sonst helfen?',
        },
    },
};

const handlers = {
    //Use LaunchRequest, instead of NewSession if you want to use the one-shot model
    // Alexa, ask [my-skill-invocation-name] to (do something)...
    'LaunchRequest': function () {
        this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMPT');

        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'RecipeIntent': function () {
        const itemSlot = this.event.request.intent.slots.Item;
        let itemName;
        if (itemSlot && itemSlot.value) {
            itemName = itemSlot.value.toLowerCase();
        }

        const cardTitle = this.t('DISPLAY_CARD_TITLE', this.t('SKILL_NAME'), itemName);
        const myRecipes = this.t('RECIPES');
        const recipe = myRecipes[itemName];

        if (recipe) {
            this.attributes.speechOutput = recipe;
            this.attributes.repromptSpeech = this.t('RECIPE_REPEAT_MESSAGE');

            this.response.speak(recipe).listen(this.attributes.repromptSpeech);
            this.response.cardRenderer(cardTitle, recipe);
            this.emit(':responseReady');
        } else {
            let speechOutput = this.t('RECIPE_NOT_FOUND_MESSAGE');
            const repromptSpeech = this.t('RECIPE_NOT_FOUND_REPROMPT');
            if (itemName) {
                speechOutput += this.t('RECIPE_NOT_FOUND_WITH_ITEM_NAME', itemName);
            } else {
                speechOutput += this.t('RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME');
            }
            speechOutput += repromptSpeech;

            this.attributes.speechOutput = speechOutput;
            this.attributes.repromptSpeech = repromptSpeech;

            this.response.speak(speechOutput).listen(repromptSpeech);
            this.emit(':responseReady');
        }
    },
    'WhatHappenedOnIntent': function () {
        var reference = this;
        const slotValue = this.event.request.intent.slots.date.value;
        if (slotValue != undefined) {
            var inpdate = moment();
            if (moment(slotValue).isValid()) {
                inpdate = moment(slotValue);
            }
            var inpmonth = inpdate.month() + 1;
            var inpday = inpdate.date();
            var inpmonthday = sprintf("%02d", inpmonth) + "-" + sprintf("%02d", inpday);
            var url = 'http://history.muffinlabs.com/date/' + inpmonth.toString() + '/' + inpday.toString();
            console.log(url);
            request(url, function (error, response, body) {
                console.log("Querying muffinlabs ...");
                if (!error && response.statusCode == 200) {
                    var json = JSON.parse(body);
                    var eventArray = json["data"]["Events"];
                    if (eventArray.length > 3) {
                        var eventarr = shuffle.pick(eventArray, { 'picks': 3 });
                    } else {
                        var eventarr = eventArray;
                    }
                    var speechOutput = "";
                    const mypersdates = reference.t('PERSONALDATES');
                    var mypersdate = mypersdates[inpmonthday];
                    if (mypersdate) {
                        speechOutput += "On this day " + mypersdate + ". ";
                    }
                    for (var i = 0, len = eventarr.length; i < len; i++) {
                        speechOutput += "On this day in " + eventarr[i]["year"] + ", " + eventarr[i]["text"]; 
                    }
                    const cardTitle = "News on " + slotValue;
                    reference.attributes.speechOutput = speechOutput;
                    reference.attributes.repromptSpeech = reference.t('RECIPE_REPEAT_MESSAGE');
                    reference.response.speak(speechOutput).listen(reference.attributes.repromptSpeech);
                    reference.response.cardRenderer(cardTitle, speechOutput);
                    reference.emit(':responseReady');
                }
                else{
                    var speechOutput = "Sorry error in muffinlabs with status of " + response.statusText;
                    const cardTitle = "Error for News on " + slotValue;
                    reference.attributes.speechOutput = speechOutput;
                    reference.attributes.repromptSpeech = reference.t('RECIPE_REPEAT_MESSAGE');
                    reference.response.speak(speechOutput).listen(reference.attributes.repromptSpeech);
                    reference.response.cardRenderer(cardTitle, speechOutput);
                    reference.emit(':responseReady');
                }
            });
        }
        else{
            this.response.speak("I'm sorry.  What day did you want me to look for events?").listen("I'm sorry.  What day did you want me to look for events?");
            this.emit(':responseReady');
        }
//        this.emit(':responseReady');
    },
    'GetUpliftingNews': function () {
        var reference = this;

        var getNonAdminPostEmitted = function(res) {
            var numberOfPosts = (res.data.children).length;
            var randomPostIndex = Math.floor(Math.random() * (numberOfPosts));
            var retryCount = 0;
            var post = res.data.children[randomPostIndex];

            while (retryCount <= 10) {
                if (post.data.domain != 'self.UpliftingNews') {
                    var speechOutput = post.data.title + ". For more information, please visit the Uplifting News subreddit.";
                    reference.emit(':tell', speechOutput);
                    break;
                } else {
                    console.warn("Non-admin post not found. Retrying...");
                    post = res.data.children[Math.floor(Math.random() * (numberOfPosts))];
                    if (retryCount >= 10) {
                        reference.emit(':tell', "I could not find uplifting news for you, sorry.");
                    }
                }
            }
        };

        var timeDifference = Date.now() - cache.time;

        if(cache.value == "empty" || timeDifference > 86400000) {
            request('https://www.reddit.com/r/upliftingnews/hot.json?sort=hot', function (error, response, body) {
                console.log("Querying reddit...");

                if (!error && response.statusCode == 200) {
                    var res = JSON.parse(body);

                    //Cache response
                    cache.value = res;
                    cache.time = Date.now();

                    getNonAdminPostEmitted(res);
                } else {
                    console.error("Error reaching service");
                    reference.emit(':tell', "I could not find uplifting news for you, sorry.");
                }
            });
        } else {
            console.log("Value is in the cache. Emitting post.");
            getNonAdminPostEmitted(cache.value);
        }
    },
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');

        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'AMAZON.RepeatIntent': function () {
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended: ${this.event.request.reason}`);
    },
    'Unhandled': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

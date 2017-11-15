const Botkit = require('botkit');
const mongoose = require("mongoose");
const CONSTANTS = require('./Utility/Constants');
const Bot = require('./Controller/Bot');
const PORT = 8081;
require('dotenv').config();
// const app = require('express')();
// const server = require('http').createServer(app);
const SocketServer = require('./Socket');
const logger = require("winston").loggers.get('server');
// const test = require('./test');

const Ticket = require("./Models/TicketClass");
const Admin = require("./Models/AdminClass");
const Member = require("./Models/Users/Member");
const Response = require("./Responses");

const Wit = require('./Utility/Wit');

const client = new Wit({
    accessToken: process.env.WIT_TOKEN,
    minConfidence: 0.5,
    logLevel: CONSTANTS.LOGGER.INFO
});


let controller = Botkit.slackbot({
    // reconnect to Slack RTM when connection goes bad
    interactive_replies: true,
    retry: Infinity,
    require_delivery: true,
    debug: false,
});

const mongodb_url = process.env.MONGODB_URI;

mongoose.Promise = global.Promise;

let db = mongoose.createConnection(mongodb_url);

SocketServer.createServer(PORT);

db.on('error', (err) => {
    logger.info('Connection to ' + mongodb_url + ' failed: ' + err.message)
});
db.once('open', () => {
    logger.info('Connection to ' + mongodb_url + ' successfully established!');
    // Create your schemas and models here.
    Ticket.createDBSchemes(mongoose, db);
    Member.createDBSchemes(mongoose, db);
    Admin.createDBSchemes(mongoose, db);
    Response.createDBSchemes(mongoose, db);
    Admin.addAdmin("Soren", "U0ESRG2UV", "idp-slackbot");//"G48JDK00G");
});


// Assume single team mode if we have a SLACK_TOKEN
if (process.env.SLACK_TOKEN) {
    controller.spawn({token: process.env.SLACK_TOKEN}).startRTM(function (err, bot, payload) {
        if (err) {
            throw new Error(err)
        }
        logger.info('Connected to Slack RTM')
    });
    Bot.userBot(controller, client);
} else {
    logger.info('Unable to start slack RTM')
}


const cron = require('node-cron');
const CONSTANTS = require('../Utility/Constants');
const logger = require("winston").loggers.get('utils');
const Ticket = require('../Models/TicketClass');
const Response = require('../Responses');
const Member = require("../Models/Users/Member.js");
let wit = null;

function setWit(init) {
    wit = init;
}


function startOnBoarding(bot, message, user) {
    bot.api.im.open({user: user.userId}, (err, res) => {
        if (err) {
            bot.botkit.log('Failed to open IM with user', err)
        }
        let task;
        logger.debug(res);
        bot.startConversation(
            {
                user: user.userId,
                channel: res.channel.id
            }, function (err, convo) {
                task = cron.schedule("*/5 * * * * *", function () {
                    convo.repeat();
                    convo.next();
                }, false);
                convo.ask("Hey there " + user.name + ", " + CONSTANTS.RESPONSES.ONBOARDING_GREETING, [
                    {
                        pattern: 'STOP',
                        callback: function (response, convo) {
                            bot.reply(message, CONSTANTS.RESPONSES.ONBOARDING_HOLD);
                            // convo.say(CONSTANTS.RESPONSES.ONBOARDING_HOLD);
                            // convo.next();
                            task.start();
                        }
                    },
                    {
                        default: true,
                        callback: function (response, convo) {
                            // just repeat the question
                            task.stop();
                            wit.receive(bot, response, function (err) {
                                if (err) {
                                    logger.debug("ERROR", err);
                                } else {
                                    Response.addReply(response.text);
                                    logger.debug("RESPONSE:", Object.keys(response.entities));
                                    if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.CONFIRMATION) !== -1) {
                                        ticketsDelivery(bot, message, user.userId, res.channel.id);
                                        task.destroy();
                                    } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {
                                        logger.debug("Utils ", "help");
                                        task.destroy();
                                    } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.STOP) !== -1) {
                                        convo.say("TEST");

                                        task.start();
                                    }
                                }
                            });
                            convo.next();
                        }
                    }
                ], {}, 'default');
            })
    });
}

function ticketsDelivery(bot, message, userId, channelId) {
    let tickets, string;
    Ticket.getTickets().then((totalTickets) => {

        let updateTickets = function () {
            tickets = totalTickets.slice(0, 3);
            totalTickets = totalTickets.slice(3);
            logger.debug(totalTickets);
            string = {
                'text': 'Here are a few things you need to know, tell me when you are done with them',
                'attachments': [],
                // 'icon_url': 'http://lorempixel.com/48/48'
            };
            tickets.forEach(function (ticket, i) {
                string.attachments[i] = {'color': '#4285F4'};
                string.attachments[i].title = ticket.ticketData + "  (" + ticket.ticketId + ")" + "\n";
            });
            Member.addSuggestedTicket(userId, tickets.map((t) => {
                return t.ticketId;
            }));

            console.log(string)
        };
        updateTickets();
        bot.startConversation({
            user: userId,
            channel: channelId
        }, function (err, convo) {

            convo.ask(string, [
                {
                    default: true,
                    callback: function (response, convo) {
                        // just repeat the question

                        console.log("HERE")
                        wit.receive(bot, response, function (err) {
                            if (err) {
                                logger.info(err);
                            } else {
                                Response.addReply(response.text);
                                logger.debug("RESPONSE:", Object.keys(response.entities));
                                if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.TICKET_INTENT.default) !== -1) {

                                    if (response.entities[CONSTANTS.INTENTS.TICKET_INTENT.default][0].value === CONSTANTS.INTENTS.TICKET_INTENT.finish) {
                                        response.entities[CONSTANTS.INTENTS.WIT_TICKETID].forEach(function (t) {
                                            updateTickets();
                                            tickets = tickets.filter(function (id) {
                                                return id !== t.value;
                                            });
                                            Member.addFinishedTicket(userId, t.value);
                                            Member.removeSuggestedTicket(userId, t.value);
                                        });
                                    }
                                } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {
                                    logger.debug("Utils ", "help");

                                } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.STOP) !== -1) {
                                    convo.say("TEST");

                                }
                            }
                        });
                        if (tickets.length < 0) {
                            convo.next();
                        } else {
                            convo.repeat();
                            convo.next();
                        }
                    }

                }
            ], {}, 'default');
        });
    }).catch((err) => {
        logger.debug(err);
    });

}

module.exports = {
    startOnBoarding: startOnBoarding,
    setWit: setWit,
};
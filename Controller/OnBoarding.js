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

        let updateTickets = function (index) {
            tickets = totalTickets.slice(0, index);
            totalTickets = totalTickets.slice(index);
            logger.debug(totalTickets);
            string = {
                'text': 'Hey, here are a few things you need to know. ',
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
        updateTickets(3);
        bot.startConversation({
            user: userId,
            channel: channelId
        }, function (err, convo) {

            convo.setVar('foo', string.text);
            convo.setVar('list', string.attachments);
            //
            convo.setVar('object', string);
            // convo.say("Hey, {{vars.object.text}}: \n {{#vars.object.attachments}}{{color}}{{title}}{{/vars.object.attachments}}");
            convo.say(string);
            convo.ask("Tell me when you are done with them", [
                {
                    default: true,
                    callback: function (response, convo) {
                        // just repeat the question
                        wit.receive(bot, response, function (err) {
                            if (err) {
                                logger.info(err);
                            } else {
                                Response.addReply(response.text);
                                logger.debug("RESPONSE:", Object.keys(response.entities));
                                if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.TICKET_INTENT.default) !== -1) {

                                    if (response.entities[CONSTANTS.INTENTS.TICKET_INTENT.default][0].value === CONSTANTS.INTENTS.TICKET_INTENT.finish) {
                                        response.entities[CONSTANTS.INTENTS.WIT_TICKETID].forEach(function (t) {

                                            tickets = tickets.filter(function (ticket) {
                                                return ticket.ticketId != t.value;
                                            });

                                            console.log("TICKETS:", tickets);
                                            updateTickets(tickets.length);
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
                            convo.say(string);
                            // convo.say("Hey, {{vars.object.text}}: \n {{#vars.object.attachments}}{{/vars.object.attachments}}");
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
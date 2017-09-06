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

        logger.debug(res);
        bot.startConversation(
            {
                user: user.userId,
                channel: res.channel.id
            }, function (err, convo) {
                convo.ask("Hey there " + user.name + ", " + CONSTANTS.RESPONSES.ONBOARDING_GREETING, [
                    {
                        pattern: 'STOP',
                        callback: function (response, convo) {
                            convo.say(CONSTANTS.RESPONSES.ONBOARDING_STOP);
                            convo.next();
                        }
                    },
                    {
                        default: true,
                        callback: function (response, convo) {
                            // just repeat the question
                            wit.receive(bot, response, function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    Response.addReply(response.text);
                                    console.log("REPSONSE:", Object.keys(response.entities));
                                    if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.CONFIRMATION) !== -1) {
                                        ticketsDelivery(bot, user.userId, res.channel.id);
                                    } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {
                                        logger.debug("Utils ", "help");
                                    } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.STOP) !== -1) {
                                        convo.say(CONSTANTS.RESPONSES.ONBOARDING_HOLD);
                                        convo.repeat();
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

function ticketsDelivery(bot, userId, channelId) {
    let tickets;
    Ticket.getTickets().then((totalTickets) => {
        tickets = totalTickets.slice(0, 3);
        logger.debug(totalTickets);
        let string = {
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

        bot.startConversation({
            user: userId,
            channel: channelId
        }, function (err, convo) {
            convo.ask(string, [
                {
                    default: true,
                    callback: function (response, convo) {
                        // just repeat the question
                        wit.receive(bot, response, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log("REPSONSE:", Object.keys(response.entities));

                            }
                        });
                        convo.repeat();
                        convo.next();
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
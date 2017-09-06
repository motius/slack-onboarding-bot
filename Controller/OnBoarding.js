const cron = require('node-cron');
const CONSTANTS = require('../Utility/Constants');
const logger = require("winston").loggers.get('utils');
const Ticket = require('../Models/TicketClass');
const Response = require('../Responses');
let wit = null;

function setWit(init) {
    wit = init;
}


function checkUser(bot, user) {
    return new Promise(function (resolve, reject) {
        bot.api.groups.list({}, function (err, response) {
            if (err) {
                logger.debug(err);
                reject(false);
            } else {
                response.groups.forEach(function (group) {
                    group.members.forEach(function (member) {
                        if (member === user) {
                            resolve(true);
                        }
                    })
                });
                reject(false);
            }
        });
    })
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
                        pattern: 'YES',
                        callback: function (response, convo) {
                            convo.say('OK you are done!');
                            convo.next();

                        }
                    },
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
        tickets = totalTickets;
        logger.debug(totalTickets);
        var string = {
            'text': 'Here are a few things you need to know, tell me when you are done with them',
            'attachments': [],
            // 'icon_url': 'http://lorempixel.com/48/48'
        };
        tickets.map(function (ticket, i) {
            string.attachments[i] = {'color': '#4285F4'};
            string.attachments[i].title = ticket.ticketData + "  (" + ticket.ticketId + ")" + "\n";
        });

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
    checkUserPermission: checkUser,
    startOnBoarding: startOnBoarding,
    setWit: setWit,
};
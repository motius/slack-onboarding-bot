const CONSTANTS = require('../Utility/Constants');
const logger = require("winston").loggers.get('utils');
const Ticket = require('../Models/TicketClass');
const Response = require('../Responses');

let wit = null;

function setWit(wit) {
    wit = wit;
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
        let tickets;
        Ticket.getTickets().then((totalTickets) => {
            tickets = totalTickets;
            logger.info(totalTickets);
            console.log(totalTickets);
        }).catch((err) => {
            logger.debug(err);
        });
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
                            Response.addReply(response.text);
                            convo.say(CONSTANTS.RESPONSES.ONBOARDING_HOLD);
                            convo.repeat();
                            convo.next();
                        }
                    }
                ], {}, 'default');
            })
    });
}

module.exports = {
    checkUserPermission: checkUser,
    startOnBoarding: startOnBoarding,
    setWit: setWit,
};
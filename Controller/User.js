const logger = require("winston").loggers.get('member');
const Ticket = require('../Models/TicketClass');
const Member = require('../Models/Users/Member');
const CONSTANTS = require('../Utility/Constants');
const cron = require('node-cron');
const Utils = require("../Utility/Utils");

const jobTime = "*/30 * * * * *";
const iterations = 4;

let wit = null;

/**
 * Prepare a member. Add an instance of the prepared member to the DB so they can be started.
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function prepareMember(message, bot) {
    // Check if there actually is a member
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ADD_MEMBER_EMPTY);
        return;
    }
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER_TYPE) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ADD_MEMBER_TYPE_EMPTY);
        return;
    }
    let user = message.entities[CONSTANTS.INTENTS.WIT_MEMBER][0].value.match(CONSTANTS.REGEXES.userIdRegex);
    logger.debug("PREPARE USER", user[1]);
    bot.api.users.info({user: user[1]}, (error, response) => {
        let {id, name, real_name, profile} = response.user;
        Member.addMember(id, real_name, name, profile.email, message.entities[CONSTANTS.INTENTS.WIT_MEMBER_TYPE][0].value).then((res) => {
            bot.reply(message, CONSTANTS.RESPONSES.PREPARE_SUCCESS);
        }).catch((err) => {
            logger.debug("PREPARE FAIL [ERROR]", err);
            if (err.name === 'MongoError' && err.code === 11000) {
                // Duplicate username
                bot.reply(message, CONSTANTS.RESPONSES.PREPARE_DUPLICATE)
                return;
            }
            bot.reply(message, CONSTANTS.RESPONSES.PREPARE_FAIL);
        });
    });
}


/**
 * Start the onboarding of a user
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function startMember(message, bot) {
    let user = message.entities[CONSTANTS.INTENTS.WIT_MEMBER][0].value.match(CONSTANTS.REGEXES.userIdRegex);
    let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);
    logger.debug("START MEMBER", members[1]);
    Member.startMemberOnboarding(members[1]).then((res) => {

        logger.debug("MEMBER START", res);
        if (res == null) {
            bot.reply(message, CONSTANTS.RESPONSES.NOT_PREPARED);
        } else {
            bot.reply(message, CONSTANTS.RESPONSES.PREPARED);

            try {
                startOnBoarding(bot, message, res);
            } catch (e) {
                logger.debug("[ERROR]", e)
            }
        }
    }).catch((err) => {
        logger.debug("START FAIL [ERROR]", err);
        bot.reply(message, CONSTANTS.RESPONSES.DEFAULT);
    });
}


function startOnBoarding(bot, message, user) {
    bot.api.im.open({user: user.userId}, (err, res) => {
        if (err) {
            bot.botkit.log('Failed to open IM with user', err)
        }
        let task;
        logger.debug("ONBOARDING ", res);
        bot.startConversation(
            {
                user: user.userId,
                channel: res.channel.id
            }, function (err, convo) {
                task = cron.schedule(jobTime, function () {
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
                                    logger.debug("RESPONSE [USER]:", Object.keys(response.entities));
                                    if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.CONFIRMATION) !== -1) {
                                        ticketsDelivery(bot, message, user.userId, res.channel.id);
                                        task.destroy();
                                        convo.next();
                                    } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {
                                        logger.debug("User", "help");
                                        bot.reply(message, CONSTANTS.RESPONSES.HELP);
                                        task.start();
                                    } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.STOP) !== -1) {
                                        convo.say(CONSTANTS.RESPONSES.STOP);
                                        task.start();
                                    }
                                }
                            });
                        }
                    }
                ], {}, 'default');
            })
    });
}

function ticketsDelivery(bot, message, userId, channelId) {
    let items = [], string, length, task, counter = 0;

    Ticket.getTickets().then((totalitems) => {

        let updateTickets = function (index) {
            length = 0;
            items = items.concat(totalitems.slice(0, index));
            totalitems = totalitems.slice(index);
            logger.debug("TOTAL ITEM", totalitems);
            string = {
                'text': 'Hey, here are a few things you need to know. ',
                'attachments': [],
                // 'icon_url': 'http://lorempixel.com/48/48'
            };
            items.forEach(function (item, i) {
                string.attachments[i] = {'color': '#4285F4'};
                string.attachments[i].title = item.ticketData + "  (" + item.ticketId + ")" + "\n";
                length++;
            });
            Member.addSuggestedTicket(userId, items.map((t) => {
                return t.ticketId;
            }));
        };
        updateTickets(3);

        bot.startConversation({
            user: userId,
            channel: channelId
        }, function (err, convo) {
            task = cron.schedule(jobTime, function () {
                if (counter > iterations) {
                    task.destroy();
                }
                string.text = CONSTANTS.RESPONSES.REMINDER[counter];
                counter++;

                convo.say(string);
                convo.repeat();
                convo.next();
            }, false);
            task.start();
            convo.say(string);

            convo.ask("Tell me when you are done with them", [
                {
                    default: true,
                    callback: function (response, convo) {
                        // just repeat the question
                        task.stop();
                        wit.receive(bot, response, function (err) {
                            if (err) {
                                logger.info(err);
                            } else {
                                logger.debug("RESPONSE [USER]:", Object.keys(response.entities));
                                if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.ITEM_INTENT.default) !== -1) {

                                    if (response.entities[CONSTANTS.INTENTS.ITEM_INTENT.default][0].value === CONSTANTS.INTENTS.ITEM_INTENT.finish) {
                                        response.entities[CONSTANTS.INTENTS.WIT_ITEM_ID].forEach(function (t) {

                                            items = items.filter(function (item) {
                                                return item.ticketId != t.value;
                                            });
                                            Ticket.getTicket(t.value).then((res) => {
                                                if (!res) {
                                                    bot.reply(message, CONSTANTS.RESPONSES.NOT_FOUND);
                                                } else {
                                                    bot.reply(message, CONSTANTS.RESPONSES.CONGRATS[Math.floor(Math.random() * 3)]);
                                                }
                                            }).catch((err) => {
                                                logger.debug("ERROR ", err);
                                            });
                                            updateTickets(length - items.length);
                                            counter = 0;
                                            Member.addFinishedTicket(userId, t.value);
                                            Member.removeSuggestedTicket(userId, t.value);
                                            if (items.length == 0) {
                                                Utils.getGiphy().then((res) => {
                                                    logger.debug("GIF", res);
                                                    convo.say(CONSTANTS.RESPONSES.CONGRATULATION + res);
                                                    convo.next();
                                                }).catch((err) => {
                                                    logger.debug("AXIOS [ERROR] ", err);
                                                    convo.say(CONSTANTS.RESPONSES.CONGRATULATION);
                                                    convo.next();
                                                });
                                            } else {
                                                task.start();
                                            }
                                        });
                                    }
                                } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {
                                    logger.debug("Utils ", "help");
                                    convo.say(CONSTANTS.RESPONSES.HELP);
                                    task.start();
                                } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.STOP) !== -1) {
                                    convo.say("STOPPED");
                                    convo.next();
                                    task.destroy();
                                }
                            }
                        });

                    }

                }
            ], {}, 'default');
        });
    }).catch((err) => {
        logger.debug(err);
    });

}


function setWit(init) {
    wit = init;
}

module.exports = {
    prepareMember: prepareMember,
    startMember: startMember,
    setWit: setWit
};
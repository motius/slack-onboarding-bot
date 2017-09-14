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
                task = cron.schedule("*/10 * * * * *", function () {
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
    let tickets = [], string, length, task;
    Ticket.getTickets().then((totalTickets) => {

        let updateTickets = function (index) {
            length = 0;
            tickets = tickets.concat(totalTickets.slice(0, index));
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
                length++;
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
            task = cron.schedule("*/20 * * * * *", function () {
                convo.say(string);
                convo.repeat();
                convo.next();
            }, false);
            task.start();
            // convo.setVar('foo', string.text);
            // convo.setVar('list', string.attachments);
            // convo.setVar('object', string);
            // convo.say("Hey, {{vars.object.text}}: \n {{#vars.object.attachments}}{{color}}{{title}}{{/vars.object.attachments}}");
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
                                Response.addReply(response.text);
                                logger.debug("RESPONSE:", Object.keys(response.entities));
                                if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.TICKET_INTENT.default) !== -1) {

                                    if (response.entities[CONSTANTS.INTENTS.TICKET_INTENT.default][0].value === CONSTANTS.INTENTS.TICKET_INTENT.finish) {
                                        response.entities[CONSTANTS.INTENTS.WIT_TICKETID].forEach(function (t) {

                                            tickets = tickets.filter(function (ticket) {
                                                return ticket.ticketId != t.value;
                                            });

                                            updateTickets(length - tickets.length);
                                            Member.addFinishedTicket(userId, t.value);
                                            Member.removeSuggestedTicket(userId, t.value);
                                            if (tickets.length < 0) {
                                                convo.next();
                                            } else {
                                                task.start();
                                                convo.say(string);
                                                // convo.say("Hey, {{vars.object.text}}: \n {{#vars.object.attachments}}{{/vars.object.attachments}}");
                                                convo.repeat();
                                                convo.next();
                                            }
                                        });
                                    }
                                } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {
                                    logger.debug("Utils ", "help");
                                    task.start();
                                } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.STOP) !== -1) {
                                    convo.say("TEST");
                                    task.start();
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

function witProcessMessage(bot, message)
{
    // Do all the entity checks here and call the functions accordingly.
    wit.receive(bot, message.text, function (err) {
        if (err) {
            logger.debug("ERROR", err);
        } else {
            logger.debug("RESPONSE:", Object.keys(message.entities));

            if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.CONFIRMATION) !== -1) {
                ticketsDelivery(bot, user.userId, res.channel.id);
                // task.destroy();
            } else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.TICKET_INTENT) !== -1) {
                switch (message.entities.ticket_intent[0].value)
                {
                    case "tickets_set":
                        addTicket(message, bot);
                        break;
                    case "ticket_list":
                        listTickets(message, bot);
                        break;
                    case "ticket_finish":
                        finishTicket(message, bot);
                        break;
                    case "ticket_progress":
                        showTicketProgress(message, bot);
                        break;
                    case "tickets_finish_suggested":
                        finishSuggestedTickets(message, bot);
                        break;
                    default:
                        break;
                }
            } else if(Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.MEMBER_ENTITY.default) !== -1) {
                switch(message.entities.member_intent[0].value)
                {
                    case "prepare_member":
                        prepareMember(message, bot);
                        break;
                    default:
                        break;
                }
            } else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {
                logger.debug("Utils ", "help");
                // task.destroy();
            } else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.STOP) !== -1) {
                convo.say("TEST");
                // task.start();
            }
        }
    });
}

function addTicket(message, bot) {
    // Check if there is actually a ticket to add
    if(Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_TICKET) == -1 ||
    Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_PRIORITY) == -1)
    {
        bot.reply(message, CONSTANTS.RESPONSES.TICKET_EMPTY);
        return;
    }

    TicketClass.addTicket(message.entities.wit_ticket.value, message.entities.wit_priority.value);
    bot.reply(message, "I added your ticket to the database.");
}

function prepareMember(message, bot)
{
    // Check if there actually is a member
    if(Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER) == -1 ||
    Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER_TYPE) == -1)
    {
        bot.reply(message, CONSTANTS.RESPONSES.ADD_MEMBER_EMPTY);
        return;
    }

    bot.api.users.info({user: message.entities.wit_member[0].value}, (error, response) => {
        let {id, name, real_name, profile} = response.user;
        Member.addMember(id, real_name, name, profile.email, message.entities.wit_member_type[0].value);
    });
}

function listTickets(message, bot)
{
    Ticket.getTickets().then((res) => {
        let tickets = {
            'text': CONSTANTS.RESPONSES.TICKET_LIST,
            'attachments': []
        };
        res.forEach((t) => {
            let ticket = {
                'title': t.ticketData + ' ( ID: ' + t.ticketId + ' )',
                'color': '#117ef9',
            };
            tickets.attachments.push(ticket);
        });
        bot.reply(message, tickets);
    }).catch((err) => {
        logger.debug(err);
    });
}

function finishTicket(message, bot)
{
    if(Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_TICKETID) == -1)
    {
        bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_NOT_FOUND);
        return;
    }

    let ticketID = message.entities.wit_ticketID[0].value;

    Ticket.getTicket(ticketID).then((ticket) => {
        Member.getMemberProgress(message.user).then((res) => {
            let fullfilledTickets = res.tickets;
            let alreadyChecked = false;

            for (i = 0; i < fulfilledTickets.length; i++) {
                if (fulfilledTickets[i].ticketId == ids[1]) {
                    alreadyChecked = true;
                    break;
                }
            }

            if (alreadyChecked) {
                bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_ALREADY_FINISHED);
            }
            else {
                bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_NOT_YET_FINISHED);
                Member.addFinishedTicket(message.user, ticketID);
                Member.removeSuggestedTicket(message.user, ticketID);
            }
        }).catch((err) => {
            bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_NOT_FOUND);
        });
    }).catch((err) => {
        logger.debug(err);
    });
}

function showTicketProgress(message, bot)
{
    if(Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER) == -1)
    {
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_MISSING);
        return;
    }

    Member.getMemberProgress(message.entities.wit_member[0].value).then((res) => {
        Ticket.getTickets().then((totalTickets) => {
            let progress = 0;
            let fulfilledTickets = res.tickets;

            progress = (fulfilledTickets.length / totalTickets.length) * 100;

            bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_REPLY + progress + "%");
        }).catch((err) => {
            logger.debug(err);
        })
    }).catch((err) => {
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_NOT_FOUND_IN_DATABASE);
        logger.debug(err);
    });
}

function finishSuggestedTickets(message, bot)
{
    Member.getMember(message.user).then((user) => {
        user.suggestedTickets.forEach(function(ticketId) {
            Member.addFinishedTicket(message.user, ticketId);
            Member.removeSuggestedTicket(message.user, ticketId);
        });
    }).catch((err) => {
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_NOT_FOUND_IN_DATABASE);
        logger.debug(err);
    });
}

module.exports = {
    startOnBoarding: startOnBoarding,
    witProcessMessage: witProcessMessage,
    setWit: setWit,
};
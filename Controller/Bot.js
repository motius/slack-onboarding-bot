const CONSTANTS = require('../Utility/Constants');
const Utils = require('../Utility/Utils');
const SocketServer = require('../Socket');
const CoreMember = require('../Models/Users/Core');
const ProjectMember = require('../Models/Users/Project');
const Member = require('../Models/Users/Member');
const Response = require('../Responses');
const logger = require("winston").loggers.get('bot');
const cron = require('node-cron');
const Ticket = require('../Models/TicketClass');
const Admin = require("../Models/AdminClass.js");

const jobTime = "*/10 * * * * *";


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
                                    Response.addReply(response.text);
                                    logger.debug("RESPONSE:", Object.keys(response.entities));
                                    if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.CONFIRMATION) !== -1) {
                                        ticketsDelivery(bot, message, user.userId, res.channel.id);
                                        task.destroy();
                                        convo.next();
                                    } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {
                                        logger.debug("Utils ", "help");
                                        bot.reply(message, CONSTANTS.RESPONSES.HELP);
                                        // convo.say(CONSTANTS.RESPONSES.HELP);
                                        task.start();
                                        // task.destroy();
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
    let tickets = [], string, length, task, counter = 0;

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
            task = cron.schedule(jobTime, function () {
                if (counter > 4) {
                    task.destroy();
                }
                string.text = CONSTANTS.RESPONSES.REMINDER[counter];
                counter++;

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
                                            counter = 0;
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

function witProcessMessage(bot, message) {
    // Do all the entity checks here and call the functions accordingly.
    wit.receive(bot, message.text, function (err) {
        if (err) {
            logger.debug("ERROR", err);
        } else {
            logger.debug("RESPONSE:", Object.keys(message.entities));

            if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.TICKET_INTENT) !== -1) {
                switch (message.entities[CONSTANTS.INTENTS.TICKET_INTENT.default][0].value) {
                    case CONSTANTS.INTENTS.TICKET_INTENT.set:
                        addTicket(message, bot);
                        break;
                    case CONSTANTS.INTENTS.TICKET_INTENT.list:
                        listTickets(message, bot);
                        break;
                    case CONSTANTS.INTENTS.TICKET_INTENT.finish:
                        finishTicket(message, bot);
                        break;
                    case CONSTANTS.INTENTS.TICKET_INTENT.progress:
                        showTicketProgress(message, bot);
                        break;
                    case "tickets_finish_suggested":
                        finishSuggestedTickets(message, bot);
                        break;
                    default:
                        break;
                }
            } else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.MEMBER_INTENT.default) !== -1) {
                Utils.checkUser(bot, message.user).then((permission) => {
                    switch (message.entities[CONSTANTS.INTENTS.MEMBER_INTENT.default][0].value) {
                        case CONSTANTS.INTENTS.MEMBER_INTENT.prepare:
                            prepareMember(message, bot);
                            break;
                        case CONSTANTS.INTENTS.MEMBER_INTENT.start:
                            startMember(message, bot);
                            break;
                        default:
                            break;
                    }
                }).catch((err) => {
                    bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
                });

            }
        }
    });
}

function addTicket(message, bot) {
    // Check if there is actually a ticket to add
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_TICKET) == -1 ||
        Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_PRIORITY) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.TICKET_EMPTY);
        return;
    }
    logger.debug("ADD TICKET", message.entities[CONSTANTS.INTENTS.WIT_TICKET].value);
    Ticket.addTicket(message.entities[CONSTANTS.INTENTS.WIT_TICKET].value, message.entities[CONSTANTS.INTENTS.WIT_PRIORITY].value).then((res) => {
        bot.reply(message, CONSTANTS.RESPONSES.ADD_TICKET_SUCCESS);
    }).catch((err) => {
        logger.debug("ADD TICKET FAIL [ERROR]", err);
        bot.reply(message, CONSTANTS.RESPONSES.ADD_TICKET_FAIL);
    });
}

function prepareMember(message, bot) {
    // Check if there actually is a member
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER) == -1 ||
        Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER_TYPE) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ADD_MEMBER_EMPTY);
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
            bot.reply(message, CONSTANTS.RESPONSES.PREPARE_FAIL);
        });
    });
}

function listTickets(message, bot) {
    logger.debug("LIST TICKETS");
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

function finishTicket(message, bot) {
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_TICKETID) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_NOT_FOUND);
        return;
    }

    let ticketID = message.entities[CONSTANTS.INTENTS.WIT_TICKETID][0].value;

    logger.debug("FINISH TICKET", ticketID);

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
            logger.debug("FINISH TICKET FAIL [ERROR]", err);
            bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_NOT_FOUND);
        });
    }).catch((err) => {
        logger.debug(err);
    });
}

function showTicketProgress(message, bot) {
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_MISSING);
        return;
    }

    logger.debug("SHOW TICKET PROGRESS");
    Member.getMemberProgress(message.entities[CONSTANTS.INTENTS.WIT_MEMBER][0].value).then((res) => {
        Ticket.getTickets().then((totalTickets) => {
            let progress = 0;
            let fulfilledTickets = res.tickets;

            progress = (fulfilledTickets.length / totalTickets.length) * 100;

            bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_REPLY + progress + "%");
        }).catch((err) => {
            logger.debug(err);
        })
    }).catch((err) => {
        logger.debug("TICKET PROGRESS FAIL [ERROR]", err);
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_NOT_FOUND_IN_DATABASE);
    });
}

function finishSuggestedTickets(message, bot) {
    logger.debug("FINISH SUGGESTED TICKET");
    Member.getMember(message.user).then((user) => {
        user.suggestedTickets.forEach(function (ticketId) {
            Member.addFinishedTicket(message.user, ticketId);
            Member.removeSuggestedTicket(message.user, ticketId);
        });
    }).catch((err) => {
        logger.debug("FINISH SUGGESTED FAIL [ERROR]", err);
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_NOT_FOUND_IN_DATABASE);
    });
}

function startMember(message, bot) {
    let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);
    Response.addReply(message.text);
    logger.debug("START MEMBER", members[1]);
    CoreMember.startMemberOnboarding(members[1]).then((res) => {

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

module.exports.userBot = (controller, client) => {
    setWit(client);
    controller.middleware.receive.use(client.receive);
    controller.on('bot_channel_join', function (bot, message) {
        bot.reply(message, "I'm here!")
    });

    /*
     controller.hears(['hi'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
     var reply_with_attachments = {
     'text': 'This is a pre-text',
     'attachments': [
     {
     'fallback': 'To be useful, I need you to invite me in a channel.',
     'title': 'How can I help you?',
     'text': 'To be useful, I need you to invite me in a channel ',
     'color': '#7CD197'
     }
     ],
     'icon_url': 'http://lorempixel.com/48/48'
     };
     bot.reply(message, reply_with_attachments);
     });
     */
    controller.hears(['change_channel'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
        let channel = message.text.substr(message.text.indexOf(":") + 1);
        logger.debug("CHANNEL CHANGE", message);
        channel = channel.trim();
        Admin.getAdmin(message.user).then((res) => {
            if (res[0]) {
                Admin.setChannel(message.user, channel).then((res) => {

                    bot.reply(message, "Successfully changed the Admins channel!");
                    console.log(res);
                }).catch((err) => {
                    console.log(err);
                });
            } else {
                bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
            }
        }).catch((err) => {
            logger.debug("ERROR CHANNEL", err);
        });

    });

    controller.hears(['robot'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
        let event = message.text.substr(message.text.indexOf(":") + 1);
        SocketServer.sendCommand(event);
    });

    controller.hears(['edit_member'], ['direct_message'], function (bot, message) {
        Utils.checkUser(bot, message.user).then((permission) => {
            let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);

            Response.addReply(message.text);
            // There has to be a match
            if (members == null) {
                bot.reply(message, CONSTANTS.RESPONSES.PREPARE_MEMBER_NO_MEMBER_ENTERED);
                return;
            }

            Member.getMember(members[1]).then((user) => {
                bot.startConversation(message, function (err, convo) {
                    convo.ask(CONSTANTS.RESPONSES.MEMBER_TYPE + "\nHint:  " + CONSTANTS.RESPONSES.HINT_MEMBER, [
                        {
                            pattern: 'Core',
                            callback: function (response, convo) {
                                // Extract user information from slack and add new member
                                bot.api.users.info({user: members[1]}, (error, response) => {
                                    let {id, name, real_name, profile} = response.user;
                                    CoreMember.editMember(id, profile.email, 'Core');
                                    convo.say('OK you are done!');
                                    convo.next();
                                });

                            }
                        },
                        {
                            pattern: 'Project',
                            callback: function (response, convo) {
                                // Extract user information from slack and add new member
                                bot.api.users.info({user: members[1]}, (error, response) => {
                                    let {id, name, real_name, profile} = response.user;
                                    ProjectMember.editMember(id, profile.email, 'Core');
                                    convo.say('OK you are done!');
                                    convo.next();
                                });
                            }
                        },
                        {
                            default: true,
                            callback: function (response, convo) {
                                // just repeat the question
                                convo.say(CONSTANTS.RESPONSES.NOT_AN_OPTION);
                                convo.repeat();
                                convo.next();
                            }
                        }
                    ], {}, 'default');

                })
            }).catch((err) => {
                logger.debug(err);
            })
        }).catch((permission) => {
            bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        });


    });

    controller.hears(['\.*'], ['direct_message'], function (bot, message) {
        witProcessMessage(bot, message);
    })
};
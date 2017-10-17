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

const jobTime = "*/30 * * * * *";
const iterations = 4;


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
    let items = [], string, length, task, counter = 0;

    Ticket.getTickets().then((totalitems) => {

        let updateTickets = function (index) {
            length = 0;
            items = items.concat(totalitems.slice(0, index));
            totalitems = totalitems.slice(index);
            logger.debug(totalitems);
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

            console.log(string)
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
                                if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.ITEM_INTENT.default) !== -1) {

                                    if (response.entities[CONSTANTS.INTENTS.ITEM_INTENT.default][0].value === CONSTANTS.INTENTS.ITEM_INTENT.finish) {
                                        response.entities[CONSTANTS.INTENTS.WIT_ITEM_ID].forEach(function (t) {

                                            items = items.filter(function (item) {
                                                return item.ticketId != t.value;
                                            });

                                            updateTickets(length - items.length);
                                            counter = 0;
                                            Member.addFinishedTicket(userId, t.value);
                                            Member.removeSuggestedTicket(userId, t.value);
                                            convo.say(CONSTANTS.RESPONSES.CONGRATS[Math.floor(Math.random() * 3)]);
                                            if (items.length < 0) {
                                                convo.next();
                                            } else {
                                                task.start();
                                                // convo.say(string);
                                                // convo.say("Hey, {{vars.object.text}}: \n {{#vars.object.attachments}}{{/vars.object.attachments}}");
                                                // convo.repeat();
                                                // convo.next();
                                            }
                                        });
                                    }
                                } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {
                                    logger.debug("Utils ", "help");
                                    task.start();
                                } else if (Object.keys(response.entities).indexOf(CONSTANTS.INTENTS.STOP) !== -1) {
                                    convo.say("TEST");
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

function witProcessMessage(bot, message) {
    // Do all the entity checks here and call the functions accordingly.
    wit.receive(bot, message.text, function (err) {
        if (err) {
            logger.debug("ERROR", err);
        } else {
            logger.debug("RESPONSE:", Object.keys(message.entities));
            Response.addReply(message.text);

            if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.ITEM_INTENT.default) !== -1) { //check if there is a item intent
                logger.debug("ITEM INTENT:", message.entities[CONSTANTS.INTENTS.ITEM_INTENT.default][0].value);
                switch (message.entities[CONSTANTS.INTENTS.ITEM_INTENT.default][0].value) {
                    case CONSTANTS.INTENTS.ITEM_INTENT.set:
                        addTicket(message, bot);
                        break;
                    case CONSTANTS.INTENTS.ITEM_INTENT.list:
                        listTickets(message, bot);
                        break;
                    case CONSTANTS.INTENTS.ITEM_INTENT.finish:
                        finishTicket(message, bot);
                        break;
                    case CONSTANTS.INTENTS.ITEM_INTENT.progress:
                        showTicketProgress(message, bot);
                        break;
                    case CONSTANTS.INTENTS.ITEM_INTENT.remove:
                        deleteTicket(message, bot);
                        break;
                    case "tickets_finish_suggested":
                        finishSuggestedTickets(message, bot);
                        break;
                    default:
                        break;
                }
            } else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.MEMBER_INTENT.default) !== -1) { //check if there is a member intent
                Utils.checkUser(bot, message.user).then((permission) => {
                    logger.debug("MEMBER INTENT:", message.entities[CONSTANTS.INTENTS.MEMBER_INTENT.default][0].value);
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
                    logger.debug("[ERROR]", err);
                    bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
                });

            } else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.RUDE) !== -1) {  //check if the user was rude

            } else { //default response

            }
        }
    });
}

/**
 * Add item to the DB.
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function addTicket(message, bot) {
    // Check if there is actually a item to add
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_ITEM) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ITEM_EMPTY);
    }
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_ITEM_PRIORITY) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ITEM_PRIORITY_EMPTY);
    }
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER_TYPE) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ITEM_TYPE_EMPTY);
        return;
    }

    logger.debug("ADD ITEM", message.entities[CONSTANTS.INTENTS.WIT_ITEM][0].value);

    let item = message.entities[CONSTANTS.INTENTS.WIT_ITEM][0].value.replace(/['"]+/g, '');
    Ticket.addTicket(item, message.entities[CONSTANTS.INTENTS.WIT_MEMBER_TYPE][0].value, message.entities[CONSTANTS.INTENTS.WIT_ITEM_PRIORITY][0].value).then((res) => {
        bot.reply(message, CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
    }).catch((err) => {
        logger.debug("ADD ITEM FAIL [ERROR]", err);
        bot.reply(message, CONSTANTS.RESPONSES.ADD_ITEM_FAIL);
    });
}

/**
 * Prepare a member. Add an instance of the prepared member to the DB so they can be started.
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
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

/**
 * List all the items added to the DB
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function listTickets(message, bot) {
    logger.debug("LIST ITEMS");
    Ticket.getTickets().then((res) => {
        let items = {
            'text': CONSTANTS.RESPONSES.ITEM_LIST,
            'attachments': []
        };
        res.forEach((t) => {
            let item = {
                'title': t.ticketData + ' with priority ' + t.ticketPriority + ' ( ID: ' + t.ticketId + ' )',
                'color': '#117ef9',
            };
            items.attachments.push(item);
        });
        bot.reply(message, items);
    }).catch((err) => {
        logger.debug(err);
    });
}

/**
 * Remove a ticket
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function deleteTicket(message, bot) {
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_ITEM_ID) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ITEM_ID_EMPTY);
        return;
    }

    let itemID = message.entities[CONSTANTS.INTENTS.WIT_ITEM_ID][0].value;

    logger.debug("FINISH ITEM", itemID);

    Ticket.removeTicket(itemID).then((item) => {
        bot.reply(message, CONSTANTS.RESPONSES.REMOVE_ITEM_SUCCESS);
    }).catch((err) => {
        bot.reply(message, CONSTANTS.RESPONSES.REMOVE_ITEM_FAIL);
        logger.debug("[ERROR] delete ",err);
    });
}
/**
 * Mark one or more items and done
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function finishTicket(message, bot) {
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_ITEM_ID) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.FINISH_ITEM_NOT_FOUND);
        return;
    }

    let itemID = message.entities[CONSTANTS.INTENTS.WIT_ITEM_ID][0].value;

    logger.debug("FINISH ITEM", itemID);

    Ticket.getTicket(itemID).then((item) => {
        Member.getMemberProgress(message.user).then((res) => {
            let fullfilleditems = res.tickets;
            let alreadyChecked = false;

            for (i = 0; i < fulfilleditems.length; i++) {
                if (fulfilleditems[i].ticketId == ids[1]) {
                    alreadyChecked = true;
                    break;
                }
            }

            if (alreadyChecked) {
                bot.reply(message, CONSTANTS.RESPONSES.FINISH_ITEM_ALREADY_FINISHED);
            }
            else {
                bot.reply(message, CONSTANTS.RESPONSES.FINISH_ITEM_NOT_YET_FINISHED);
                Member.addFinishedTicket(message.user, itemID);
                Member.removeSuggestedTicket(message.user, itemID);
            }
        }).catch((err) => {
            logger.debug("FINISH ITEM FAIL [ERROR]", err);
            bot.reply(message, CONSTANTS.RESPONSES.FINISH_ITEM_NOT_FOUND);
        });
    }).catch((err) => {
        logger.debug(err);
    });
}

/**
 * Show the items progress of a user
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function showTicketProgress(message, bot) {
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_MISSING);
        return;
    }

    logger.debug("SHOW ITEM PROGRESS");
    Member.getMemberProgress(message.entities[CONSTANTS.INTENTS.WIT_MEMBER][0].value).then((res) => {
        Ticket.getTickets().then((totalitems) => {
            let progress = 0;
            let fulfilleditems = res.tickets;

            progress = (fulfilleditems.length / totalitems.length) * 100;

            bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_REPLY + progress + "%");
        }).catch((err) => {
            logger.debug(err);
        })
    }).catch((err) => {
        logger.debug("ITEM PROGRESS FAIL [ERROR]", err);
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_NOT_FOUND_IN_DATABASE);
    });
}

function finishSuggestedTickets(message, bot) {
    logger.debug("FINISH SUGGESTED ITEM");
    Member.getMember(message.user).then((user) => {
        user.suggestedTickets.forEach(function (itemId) {
            Member.addFinishedTicket(message.user, itemId);
            Member.removeSuggestedTicket(message.user, itemId);
        });
    }).catch((err) => {
        logger.debug("FINISH SUGGESTED FAIL [ERROR]", err);
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_NOT_FOUND_IN_DATABASE);
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
    controller.middleware.receive.use(client.receive); //integrate wit.ai to listen to all messages sent to the bot

    controller.on('bot_channel_join', function (bot, message) { //Greeting when bot is added to channel
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

    //command to change the channel where the bot will check for admin permission
    controller.hears(['change_channel'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
        let channel = message.text.substr(message.text.indexOf(":") + 1);
        logger.debug("CHANNEL CHANGE", message);
        channel = channel.trim();
        Admin.getAdmin(message.user).then((res) => {
            logger.debug("ADMIN", res);
            if (res) {
                Admin.setChannel(message.user, channel).then((res) => {
                    bot.reply(message, CONSTANTS.RESPONSES.SUCCESS);
                    logger.debug("CHANNEL", res);
                }).catch((err) => {
                    logger.debug("[ERROR]", err);
                });
            } else {
                bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
            }
        }).catch((err) => {
            logger.debug("ERROR CHANNEL", err);
        });

    });

    //send commands to the socket server
    controller.hears(['robot'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
        let event = message.text.substr(message.text.indexOf(":") + 1);
        SocketServer.sendCommand(event);
    });

    controller.hears(['add_item'], ['direct_message'], function (bot, message) {
        Utils.checkUser(bot, message.user).then(permission => {
            // Check for correct Syntax
            logger.debug("LONG ITEM", message);
            let item = "", type = "", priority;

            if (message.text.indexOf("add_item") != -1) {
                item = message.text.substr(message.text.indexOf("add_item") + 8);
            }
            else {
                bot.reply(message, CONSTANTS.RESPONSES.ITEM_WRONG_SYNTAX);
                return;
            }

            // item should not be empty!
            if (item === "") {
                bot.reply(message, CONSTANTS.RESPONSES.ITEM_EMPTY);
            }
            else {
                item = item.replace(/['"]+/g, '');
                let priority = function () {
                    bot.startConversation(message, function (err, convo) {
                        logger.debug("ITEM PRIORITY", message);
                        convo.ask(CONSTANTS.RESPONSES.ITEM_PRIORITIES, [
                            {
                                pattern: '1',
                                callback: function (response, convo) {
                                    Ticket.addTicket(item, type, response.text);
                                    convo.say(CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
                                    convo.next();
                                }
                            },
                            {
                                pattern: '2',
                                callback: function (response, convo) {
                                    Ticket.addTicket(item, type, response.text);
                                    convo.say(CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
                                    convo.next();

                                }
                            },
                            {
                                pattern: '3',
                                callback: function (response, convo) {
                                    Ticket.addTicket(item, type, response.text);
                                    convo.say(CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
                                    convo.next();
                                }
                            },
                            {
                                pattern: '4',
                                callback: function (response, convo) {
                                    Ticket.addTicket(item, type, response.text);
                                    convo.say(CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'cancel',
                                callback: function (response, convo) {
                                    convo.say(CONSTANTS.RESPONSES.CANCEL);
                                    convo.next();
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
                    });
                };
                bot.startConversation(message, function (err, convo) {
                    logger.debug("ITEM TYPE", message);
                    convo.ask(CONSTANTS.RESPONSES.ITEM_TYPE, [
                        {
                            pattern: 'core',
                            callback: function (response, convo) {
                                type = response.text;
                                convo.next();
                                priority();
                            }
                        },
                        {
                            pattern: 'project',
                            callback: function (response, convo) {
                                type = response.text;
                                convo.next();
                                priority();
                            }
                        },
                        {
                            pattern: 'cancel',
                            callback: function (response, convo) {
                                convo.say(CONSTANTS.RESPONSES.CANCEL);
                                convo.next();
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
                        }], {}, 'default')
                });
            }
        });
    });

    controller.hears(['edit_member'], ['direct_message'], function (bot, message) {
        Utils.checkUser(bot, message.user).then((permission) => {
            let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);

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

    //All messages send to the bot will go through here
    controller.hears(['\.*'], ['direct_message'], function (bot, message) {
        witProcessMessage(bot, message);
    })
};
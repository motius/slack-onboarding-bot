const CONSTANTS = require('../Utility/Constants');
const Utils = require('../Utility/Utils');
const SocketServer = require('../Socket');
const CoreMember = require('../Models/Users/Core');
const ProjectMember = require('../Models/Users/Project');
const Member = require('../Models/Users/Member');
const Response = require('../Responses');
const logger = require("winston").loggers.get('bot');
const Ticket = require('../Models/TicketClass');
const Admin = require("../Models/AdminClass.js");
const Item = require("./Item");
const User = require("./User");


let wit = null;

function setWit(init) {
    wit = init;
}

function witProcessMessage(bot, message) {
    // Do all the entity checks here and call the functions accordingly.
    wit.receive(bot, message.text, function (err) {
        if (err) {
            logger.debug("ERROR", err);
        } else {
            logger.debug("RESPONSE [BOT]:", Object.keys(message.entities));
            Response.addReply(message.text);

            if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.GREETINGS) !== -1) {
                bot.reply(message, CONSTANTS.RESPONSES.WELCOME_TEXT);
                Utils.checkUser(bot, message.user).then((permission) => {
                    let response = {
                        'text': CONSTANTS.RESPONSES.BOT_COMMANDS,
                        'attachments': []
                    };
                    CONSTANTS.RESPONSES.WELCOME_COMMAND_TEXT.forEach((t) => {
                        let item = {
                            'title': t,
                            'color': '#117ef9',
                        };
                        response.attachments.push(item);
                    });
                    bot.reply(message, response);
                }).catch((err) => {
                });
            }
            else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.ITEM_INTENT.default) !== -1) { //check if there is a item intent
                Utils.checkUser(bot, message.user).then((permission) => {
                    logger.debug("MEMBER INTENT:", message.entities[CONSTANTS.INTENTS.ITEM_INTENT.default][0].value);
                    switch (message.entities[CONSTANTS.INTENTS.ITEM_INTENT.default][0].value) {
                        case CONSTANTS.INTENTS.ITEM_INTENT.set:
                            Item.addTicket(message, bot);
                            break;
                        case CONSTANTS.INTENTS.ITEM_INTENT.list:
                            Item.listTickets(message, bot);
                            break;
                        case CONSTANTS.INTENTS.ITEM_INTENT.finish:
                            Item.finishTicket(message, bot);
                            break;
                        case CONSTANTS.INTENTS.ITEM_INTENT.progress:
                            Item.showTicketProgress(message, bot);
                            break;
                        case CONSTANTS.INTENTS.ITEM_INTENT.remove:
                            Item.deleteTicket(message, bot);
                            break;
                        case CONSTANTS.INTENTS.ITEM_INTENT.edit:
                            Item.editTicket(message, bot);
                        case "tickets_finish_suggested":
                            finishSuggestedTickets(message, bot);
                            break;
                        default:
                            break;
                    }
                }).catch((err) => {
                    if (message.entities[CONSTANTS.INTENTS.ITEM_INTENT.default][0].value === CONSTANTS.INTENTS.ITEM_INTENT.list) {
                        Item.memberViewTickets(message, bot);
                    } else {
                        logger.debug("MEMBER INTENT:[ERROR]", err);
                        bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
                    }
                })
            } else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.MEMBER_INTENT.default) !== -1) { //check if there is a member intent
                Utils.checkUser(bot, message.user).then((permission) => {
                    logger.debug("MEMBER INTENT:", message.entities[CONSTANTS.INTENTS.MEMBER_INTENT.default][0].value);
                    switch (message.entities[CONSTANTS.INTENTS.MEMBER_INTENT.default][0].value) {
                        case CONSTANTS.INTENTS.MEMBER_INTENT.prepare:
                            User.prepareMember(message, bot);
                            break;
                        case CONSTANTS.INTENTS.MEMBER_INTENT.start:
                            User.startMember(message, bot);
                            break;
                        default:
                            break;
                    }
                }).catch((err) => {
                    logger.debug("MEMBER INTENT:[ERROR]", err);
                    bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
                });

            } else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.RUDE) !== -1) {  //check if the user was rude
                bot.reply(message, message.text);
            } else if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.HELP) !== -1) {  //check if the user needs help
                bot.reply(message, CONSTANTS.RESPONSES.HELP);
            } else { //default response
                bot.reply(message, CONSTANTS.RESPONSES.CONFUSED);
            }
        }
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

module.exports.userBot = (controller, client) => {
    setWit(client);
    User.setWit(client);
    controller.middleware.receive.use(client.receive); //integrate wit.ai to listen to all messages sent to the bot

    controller.on('bot_channel_join', function (bot, message) { //Greeting when bot is added to channel
        bot.reply(message, "I'm here!")
    });

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
            let item = "";

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
                Item.addLongTicket(message, bot, item);
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
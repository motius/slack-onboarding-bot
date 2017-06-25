const Ticket = require('./TicketClass');
const CONSTANTS = require('./Constants');
const Utils = require('./Utils');
const Conversations = require('./Conversations');
const CoreMember = require('./Users/Core');
const ProjectMember = require('./Users/Project');

module.exports.userBot = (controller) => {
    controller.on('bot_channel_join', function (bot, message) {
        bot.reply(message, "I'm here!")
    });

    controller.hears(['hi'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
    });

    controller.hears(['add_ticket'], ['direct_message'], function (bot, message) {
        Utils.checkUserPermission(bot, message.user).then(permission => {

            // Check for correct Syntax
            let ticket = "";

            if (message.text.indexOf(":") != -1) {
                ticket = message.text.substr(message.text.indexOf(":") + 1);
            }
            else {
                bot.reply(message, CONSTANTS.RESPONSES.TICKET_WRONG_SYNTAX);
                return;
            }

            // Ticket should not be empty!
            if (ticket === "") {
                bot.reply(message, CONSTANTS.RESPONSES.TICKET_EMPTY);
            }
            else {
                bot.startConversation(message, function (err, convo) {
                    convo.ask(CONSTANTS.RESPONSES.TICKET_PRIORITIES + "\nHint:  " + CONSTANTS.RESPONSES.TICKET_PRIORITIES_OPTION, [
                        {
                            pattern: '1',
                            callback: function (response, convo) {
                                Ticket.addTicket(ticket, response.text);
                                convo.say('OK you are done!');
                                convo.next();
                            }
                        },
                        {
                            pattern: '2',
                            callback: function (response, convo) {
                                Ticket.addTicket(ticket, response.text);
                                convo.say('OK you are done!');
                                convo.next();

                            }
                        },
                        {
                            pattern: '3',
                            callback: function (response, convo) {
                                Ticket.addTicket(ticket, response.text);
                                convo.say('OK you are done!');
                                convo.next();
                            }
                        },
                        {
                            pattern: '4',
                            callback: function (response, convo) {
                                Ticket.addTicket(ticket, response.text);
                                convo.say('OK you are done!');
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
                })
            }
        }).catch((permission) => {
            bot.reply(CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        });
    });

    controller.hears(['prepare_member'], ['direct_message'], function (bot, message) {
        Utils.checkUserPermission(bot, message.user).then(permission => {
            let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);

            bot.startConversation(message, function (err, convo) {
                convo.ask(CONSTANTS.RESPONSES.MEMBER_TYPE + "\nHint:  " + CONSTANTS.RESPONSES.HINT_MEMBER, [
                    {
                        pattern: 'Core',
                        callback: function (response, convo) {
                            // Extract user information from slack and add new member
                            bot.api.users.info({user: members[1]}, (error, response) => {
                                let {username, real_name} = response.user;
                                Ticket.getTickets().then((tickets) => {
                                    CoreMember.addMemberForOnboarding(real_name, username, "not.filled@yet.duh", tickets);
                                    convo.say('OK you are done!');
                                    convo.next();
                                }).catch((err) => {
                                    console.log(err);
                                    convo.say(CONSTANTS.RESPONSES.ERROR);
                                    convo.next();
                                });
                            });

                        }
                    },
                    {
                        pattern: 'Project',
                        callback: function (response, convo) {
                            // Extract user information from slack and add new member
                            bot.api.users.info({user: members[1]}, (error, response) => {
                                let {username, real_name} = response.user;
                                Ticket.getTickets().then((tickets) => {
                                    ProjectMember.addMemberForOnboarding(real_name, username, "not.filled@yet.duh", tickets);
                                    convo.say('OK you are done!');
                                    convo.next();
                                }).catch((err) => {
                                    console.log(err);
                                    convo.say(CONSTANTS.RESPONSES.ERROR);
                                    convo.next();
                                });
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
        }).catch((permission) => {
            bot.reply(CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        });


    });

    controller.hears(['initialize tasks'], ['direct_message'], function (bot, message) {
        bot.reply(message, 'Initialized task collection')
    });
};
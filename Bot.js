const Ticket = require('./TicketClass');
const CONSTANTS = require('./Constants');
const Utils = require('./Utils');
const Conversations = require('./Conversations');
const SocketServer = require('./Socket');
const CoreMember = require('./Users/Core');
const ProjectMember = require('./Users/Project');
const Member = require('./Users/Member');
const logger = require("winston").loggers.get('bot');

module.exports.userBot = (controller) => {
    controller.on('bot_channel_join', function (bot, message) {
        bot.reply(message, "I'm here!")
    });

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

    controller.hears(['robot'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
        let event = message.text.substr(message.text.indexOf(":") + 1);
        SocketServer.sendCommand(event);
    });

    controller.hears(['start_member'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
        Utils.checkUserPermission(bot, message.user).then((permission) => {
            let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);

            CoreMember.startMemberOnboarding(members[1]).then((res) => {
                logger.debug(res)
                if (res == null) {
                    bot.reply(message, CONSTANTS.RESPONSES.NOT_PREPARED);
                } else {
                    bot.reply(message, CONSTANTS.RESPONSES.PREPARED);
                    try{
                        Utils.startOnBoarding(bot, message, res);
                    }catch (e){
                        logger.info(e)
                    }
                }
            }).catch((err) => {
                bot.reply(message, CONSTANTS.RESPONSES.DEFAULT);
            });
        }).catch((permission) => {
            bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        });
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
                                Ticket.addTicket(ticket, response.text).then((res) => {
                                    logger.debug(res)
                                }).catch((err) => {
                                    logger.debug(err)
                                });
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
        Utils.checkUserPermission(bot, message.user).then((permission) => {
            let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);
            bot.startConversation(message, function (err, convo) {
                convo.ask(CONSTANTS.RESPONSES.MEMBER_TYPE + "\nHint:  " + CONSTANTS.RESPONSES.HINT_MEMBER, [
                    {
                        pattern: 'Core',
                        callback: function (response, convo) {
                            // Extract user information from slack and add new member
                            bot.api.users.info({user: members[1]}, (error, response) => {
                                let {id, name, real_name, profile} = response.user;
                                CoreMember.addMemberForOnboarding(id, real_name, name, profile.email);
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
                                ProjectMember.addMemberForOnboarding(id, real_name, name, profile.email);
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
        }).catch((permission) => {
            bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        });


    });

    controller.hears(['edit_member'], ['direct_message'], function (bot, message) {
        Utils.checkUserPermission(bot, message.user).then((permission) => {
            let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);
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
        }).catch((permission) => {
            bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        });


    });

    controller.hears(['list_tickets'], ['direct_message'], function (bot, message) {
        Utils.checkUserPermission(bot, message.user).then((permission) => {
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
        }).catch((err) => {
            bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        });
    });

    controller.hears(['progress'], ['direct_message'], function (bot, message) {
       Utils.checkUserPermission(bot, message.user).then((permission) => {

           // Check for correct syntax (at least one member must be entered)
           let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);

           if(members == null) {
               bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_MISSING);
               return;
           }

           Member.getMemberProgress(members[1]).then((res) => {
               Ticket.getTickets().then((totalTickets) => {
                   let progress = 0;
                   let fulfilledTickets = res.tickets;

                   progress = fulfilledTickets.length/totalTickets.length;

                   bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_REPLY + progress + "%");
               }).catch((err) => {
                   logger.debug(err);
               })
           }).catch((err) => {
               bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_NOT_FOUND_IN_DATABASE);
               logger.debug(err);
           });
       }).catch((err) => {
           bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
       });
    });
};
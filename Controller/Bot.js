const Ticket = require('../Models/TicketClass');
const CONSTANTS = require('../Utility/Constants');
const Utils = require('./OnBoarding');
const SocketServer = require('../Socket');
const CoreMember = require('../Models/Users/Core');
const ProjectMember = require('../Models/Users/Project');
const Member = require('../Models/Users/Member');
const Response = require('../Responses');
const logger = require("winston").loggers.get('bot');


module.exports.userBot = (controller, client) => {

    Utils.setWit(client);
    controller.middleware.receive.use(client.receive);
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
            Response.addReply(message.text);
            CoreMember.startMemberOnboarding(members[1]).then((res) => {

                if (res == null) {
                    bot.reply(message, CONSTANTS.RESPONSES.NOT_PREPARED);
                } else {
                    bot.reply(message, CONSTANTS.RESPONSES.PREPARED);

                    try {
                        Utils.startOnBoarding(bot, message, res);
                    } catch (e) {
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

            Response.addReply(message.text);
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
            let members = message.text.match(CONSTANTS.REGEXES.userIdRegex)
            Response.addReply(message.text);
            // There has to be a match
            if (members == null) {
                bot.reply(message, CONSTANTS.RESPONSES.PREPARE_MEMBER_NO_MEMBER_ENTERED);
                return;
            }

            // Check if this user is already in the database
            Member.getMember(members[1]).then((user) => {
                
                if (user != null) {
                    bot.reply(message, CONSTANTS.RESPONSES.PREPARE_MEMBER_MEMBER_ALREADY_PREPARED);
                    return;
                }

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
            }).catch((err) => {
                logger.debug(err);
            });
        }).catch((permission) => {
            bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        });


    });

    controller.hears(['edit_member'], ['direct_message'], function (bot, message) {
        Utils.checkUserPermission(bot, message.user).then((permission) => {
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


            if (members == null) {
                bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_MISSING);
                return;
            }


            Member.getMemberProgress(members[1]).then((res) => {
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
        }).catch((err) => {
            bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        });
    });

    controller.hears(['finished'], ['direct_message'], function (bot, message) {
        Utils.checkUserPermission(bot, message.user).then((permission) => {
            // Check for correct syntax (string must contain a number)
            let ids = message.text.match(CONSTANTS.REGEXES.ticketIdRegex)

            if (ids == null) {
                bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_NO_ID);
                return;
            }

            // Check if the ticket exists and is not yet checked
            Ticket.getTicket(ids[1]).then((ticket) => {
                Member.getMemberProgress(message.user).then((res) => {
                    let fullfilledTickets = res.tickets;
                    let alreadyChecked = false;

                    for (i = 0; i < res.tickets.length; i++) {
                        if (res.tickets[i].ticketId == ids[1]) {
                            alreadyChecked = true;
                            break;
                        }
                    }

                    if (alreadyChecked) {
                        bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_ALREADY_FINISHED);
                    }
                    else {
                        bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_NOT_YET_FINISHED);
                        Member.addFinishedTicket(message.user, ids[1]);
                        Member.removeSuggestedTicket(message.user, ids[1]);
                    }
                }).catch((err) => {
                    bot.reply(message, CONSTANTS.RESPONSES.FINISH_TICKET_NOT_FOUND);
                });
            }).catch((err) => {
                logger.debug(err);
            });
        }).catch((err) => {
            bot.reply(message, CONSTANTS.RESPONSES.NOT_AUTHORIZED);
        })
    });
};
const Ticket = require('../Models/TicketClass');
const CONSTANTS = require('../Utility/Constants');
const OnBoarding = require('./OnBoarding');
const Utils = require('../Utility/Utils');
const SocketServer = require('../Socket');
const CoreMember = require('../Models/Users/Core');
const ProjectMember = require('../Models/Users/Project');
const Member = require('../Models/Users/Member');
const Response = require('../Responses');
const logger = require("winston").loggers.get('bot');


module.exports.userBot = (controller, client) => {

    OnBoarding.setWit(client);
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

    controller.hears(['robot'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
        let event = message.text.substr(message.text.indexOf(":") + 1);
        SocketServer.sendCommand(event);
    });

    controller.hears(['start_member'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
        Utils.checkUser(bot, message.user).then((permission) => {
            let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);
            Response.addReply(message.text);
            CoreMember.startMemberOnboarding(members[1]).then((res) => {

                if (res == null) {
                    bot.reply(message, CONSTANTS.RESPONSES.NOT_PREPARED);
                } else {
                    bot.reply(message, CONSTANTS.RESPONSES.PREPARED);

                    try {
                        OnBoarding.startOnBoarding(bot, message, res);
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

    controller.hears(['test'], ['direct_message'], function (bot, message) {
        OnBoarding.witProcessMessage(bot, message);
    })
};
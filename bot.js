const Ticket = require('./TicketClass');
const CONSTANTS = require('./Constants');
const Utils = require('./Utils')

module.exports.userBot = (controller) => {
    controller.on('bot_channel_join', function (bot, message) {
        bot.reply(message, "I'm here!")
    });

    controller.hears(['hi'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
    });

    controller.hears(['add_ticket'], ['direct_message'], function (bot, message) {
        // console.log(bot)
        bot.startConversation(message, function (err, convo) {
            if (Utils.checkUserPermission(bot, message.user)) {
                var ticket = message.text.substr(message.text.indexOf(":") + 1)
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
            }

        });

        // bot.reply(message, 'Hello.')
    });

    controller.hears(['prepare_member'], ['direct_message'], function (bot, message) {
        if (Utils.checkUserPermission(bot, message.user)) {
            let members = message.text.match(CONSTANTS.REGEXES.userIdRegex);
            members.forEach(function (member) {
                //TODO: relate members with tickets
            });
        }
        bot.reply(message, 'Initialized member collection')
    });

    controller.hears(['initialize tasks'], ['direct_message'], function (bot, message) {
        bot.reply(message, 'Initialized task collection')
    });

    controller.hears(['add'], ['direct_message'], function (bot, message) {
        bot.reply(message, 'Added member')
    })
};
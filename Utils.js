const CONSTANTS = require('./Constants');
const logger = require("winston").loggers.get('bot');

function checkUser(bot, user) {
    return new Promise(function (resolve, reject) {
        bot.api.groups.list({}, function (err, response) {
            if (err) {
                logger.debug(err);
                reject(false);
            } else {
                response.groups.forEach(function (group) {
                    group.members.forEach(function (member) {
                        if (member === user) {
                            resolve(true);
                        }
                    })
                });
                reject(false);
            }
        });
    })
}

function startOnBoarding(bot, message, user) {
    bot.api.im.open({user: user.userId}, (err, res) => {
        if (err) {
            bot.botkit.log('Failed to open IM with user', err)
        }
        logger.debug(res);
        bot.startConversation(
            {
                user: user.userId,
                channel: res.channel.id
            }, function (err, convo) {
                convo.ask("Hey there " + user.name + ", " + CONSTANTS.RESPONSES.ONBOARDING_GREETING, [
                    {
                        pattern: 'DONE',
                        callback: function (response, convo) {

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
    });
}

module.exports = {
    checkUserPermission: checkUser,
    startOnBoarding: startOnBoarding,
};
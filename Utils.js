function checkUser(bot, user) {
    return new Promise(function (resolve, reject) {
        bot.api.groups.list({}, function (err, response) {
            if (err) {
                console.log(err);
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

function startOnBoarding(bot, message, res) {
    bot.startConversation({
        user: res.userId,
        channel: res.userId,
        text: "Here is the message", function (err, convo){
            convo.ask("" + res.name + CONSTANTS.RESPONSES.ONBOARDING_GREETING, [
                {}
            ], {}, 'default');
        }
    });
}

module.exports = {
    checkUserPermission: checkUser,
    startOnBoarding: startOnBoarding,
};
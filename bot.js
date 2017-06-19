module.exports.userBot = (controller) => {
    controller.on('bot_channel_join', function (bot, message) {
        bot.reply(message, "I'm here!")
    });

    controller.hears(['hi'], ['ambient', 'direct_message', 'direct_mention', 'mention'], function (bot, message) {
    });

    controller.hears(['add'], ['direct_message'], function (bot, message) {
        // console.log(bot)
        console.log(message);
        bot.startConversation(message, function (err, convo) {

        });
        // bot.api.groups.list({}, function (err, response) {
        //     if (err) {
        //         console.log(err)
        //     } else {
        //         response.groups.forEach(function (group) {
        //             // console.log(group)
        //             group.members.forEach(function (member) {
        //                 if (member === message.user) {
        //                     console.log("YAY  " + member);
        //                 }
        //             })
        //         });
        //     }
        // });

        bot.reply(message, 'Hello.')
    });

    controller.hears(['initialize members'], ['direct_message'], function (bot, message) {

        bot.reply(message, 'Initialized member collection')
    });

    controller.hears(['initialize tasks'], ['direct_message'], function (bot, message) {
        bot.reply(message, 'Initialized task collection')
    });

    controller.hears(['add'], ['direct_message'], function (bot, message) {
        bot.reply(message, 'Added member')
    })

};
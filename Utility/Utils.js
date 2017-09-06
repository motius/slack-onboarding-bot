module.exports = {
    checkUser: function (bot, user) {
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
    },
};
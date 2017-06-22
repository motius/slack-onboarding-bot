function checkUser(bot, user) {
    return new Promise(function (resolve, reject) {
        bot.api.groups.list({}, function (err, response) {
            if (err) {
                console.log(err)
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

module.exports = {
    checkUserPermission: checkUser,
};
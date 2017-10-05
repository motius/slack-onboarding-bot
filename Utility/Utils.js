const Admin = require("../Models/AdminClass.js");

module.exports = {
    /**
     * Check if the user has permission to to the action.
     *
     * @param {Bot} bot - bot instance.
     * @param user - The user invoking the action.
     */
    checkUser: function (bot, user) {
        return new Promise(function (resolve, reject) {
            bot.api.groups.list({}, function (err, response) {
                if (err) {
                    reject(false);
                } else {
                    Admin.getChannel().then((res) => {
                        response.groups.forEach(function (group) {
                            if (res[0].channel === group.name) {
                                group.members.forEach(function (member) {
                                    if (member === user) {
                                        resolve(true);
                                    }
                                });
                            }
                        });
                        reject(false);
                    }).catch((err) => {
                        reject(false);
                    });
                }
            });
        })
    },
};
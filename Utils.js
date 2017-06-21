function checkUser(bot, user) {
    bot.api.groups.list({}, function (err, response) {

        if (err) {
            console.log(err)
        } else {
            response.groups.forEach(function (group) {
                // console.log(group)
                group.members.forEach(function (member) {
                    if (member === user) {
                        return true;
                    }
                })
            });
        }
    });
    return false;
}

module.exports = {
    checkUserPermission: checkUser,
};
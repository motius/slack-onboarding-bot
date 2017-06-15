function checkUserPermissionForAddingTickets(err, convo) {
    if (err) {

    } else {
        convo.say("TEST");
    }
}


module.exports = {
    checkUser: checkUserPermissionForAddingTickets,
};
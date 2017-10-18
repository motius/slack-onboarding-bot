const logger = require("winston").loggers.get('item');
const Ticket = require('../Models/TicketClass');
const Member = require('../Models/Users/Member');
const CONSTANTS = require('../Utility/Constants');


/**
 * Add item to the DB.
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function addTicket(message, bot) {
    // Check if there is actually a item to add
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_ITEM) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ITEM_EMPTY);
    }
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_ITEM_PRIORITY) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ITEM_PRIORITY_EMPTY);
    }
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER_TYPE) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ITEM_TYPE_EMPTY);
        return;
    }

    logger.debug("ADD ITEM", message.entities[CONSTANTS.INTENTS.WIT_ITEM][0].value);

    let item = message.entities[CONSTANTS.INTENTS.WIT_ITEM][0].value.replace(/['"]+/g, '');
    Ticket.addTicket(item, message.entities[CONSTANTS.INTENTS.WIT_MEMBER_TYPE][0].value, message.entities[CONSTANTS.INTENTS.WIT_ITEM_PRIORITY][0].value).then((res) => {
        bot.reply(message, CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
    }).catch((err) => {
        logger.debug("ADD ITEM FAIL [ERROR]", err);
        bot.reply(message, CONSTANTS.RESPONSES.ADD_ITEM_FAIL);
    });
}

/**
 * List all the items added to the DB
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function listTickets(message, bot) {
    logger.debug("LIST ITEMS");
    Ticket.getTickets().then((res) => {
        let items = {
            'text': CONSTANTS.RESPONSES.ITEM_LIST,
            'attachments': []
        };
        res.forEach((t) => {
            let item = {
                'title': t.ticketData + ' with priority ' + t.ticketPriority + ' ( ID: ' + t.ticketId + ' )',
                'color': '#117ef9',
            };
            items.attachments.push(item);
        });
        bot.reply(message, items);
    }).catch((err) => {
        logger.debug(err);
    });
}


/**
 * Remove a ticket
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function deleteTicket(message, bot) {
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_ITEM_ID) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.ITEM_ID_EMPTY);
        return;
    }

    let itemID = message.entities[CONSTANTS.INTENTS.WIT_ITEM_ID][0].value;

    logger.debug("FINISH ITEM", itemID);

    Ticket.removeTicket(itemID).then((item) => {
        bot.reply(message, CONSTANTS.RESPONSES.REMOVE_ITEM_SUCCESS);
    }).catch((err) => {
        bot.reply(message, CONSTANTS.RESPONSES.REMOVE_ITEM_FAIL);
        logger.debug("[ERROR] delete ", err);
    });
}


/**
 * Mark one or more items and done
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function finishTicket(message, bot) {
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_ITEM_ID) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.FINISH_ITEM_NOT_FOUND);
        return;
    }

    let itemID = message.entities[CONSTANTS.INTENTS.WIT_ITEM_ID][0].value;

    logger.debug("FINISH ITEM", itemID);

    Ticket.getTicket(itemID).then((item) => {
        Member.getMemberProgress(message.user).then((res) => {
            let fullfilleditems = res.tickets;
            let alreadyChecked = false;

            for (i = 0; i < fulfilleditems.length; i++) {
                if (fulfilleditems[i].ticketId == ids[1]) {
                    alreadyChecked = true;
                    break;
                }
            }

            if (alreadyChecked) {
                bot.reply(message, CONSTANTS.RESPONSES.FINISH_ITEM_ALREADY_FINISHED);
            }
            else {
                bot.reply(message, CONSTANTS.RESPONSES.FINISH_ITEM_NOT_YET_FINISHED);
                Member.addFinishedTicket(message.user, itemID);
                Member.removeSuggestedTicket(message.user, itemID);
            }
        }).catch((err) => {
            logger.debug("FINISH ITEM FAIL [ERROR]", err);
            bot.reply(message, CONSTANTS.RESPONSES.FINISH_ITEM_NOT_FOUND);
        });
    }).catch((err) => {
        logger.debug(err);
    });
}


/**
 * Show the items progress of a user
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 */
function showTicketProgress(message, bot) {
    if (Object.keys(message.entities).indexOf(CONSTANTS.INTENTS.WIT_MEMBER) == -1) {
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_MISSING);
        return;
    }

    logger.debug("SHOW ITEM PROGRESS");
    Member.getMemberProgress(message.entities[CONSTANTS.INTENTS.WIT_MEMBER][0].value).then((res) => {
        Ticket.getTickets().then((totalitems) => {
            let progress = 0;
            let fulfilleditems = res.tickets;

            progress = (fulfilleditems.length / totalitems.length) * 100;

            bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_REPLY + progress + "%");
        }).catch((err) => {
            logger.debug(err);
        })
    }).catch((err) => {
        logger.debug("ITEM PROGRESS FAIL [ERROR]", err);
        bot.reply(message, CONSTANTS.RESPONSES.PROGRESS_MEMBER_NOT_FOUND_IN_DATABASE);
    });
}

/**
 * Add long item to the DB.
 *
 * @param message - the message received from the bot controller.
 * @param {Bot} bot - instance of the bot.
 * @param item - the item to be added to the DB.
 */
function addLongTicket(message, bot, item) {
    // Check if there is actually a item to add

    let priority = function () {
        bot.startConversation(message, function (err, convo) {
            logger.debug("ITEM PRIORITY", message);
            convo.ask(CONSTANTS.RESPONSES.ITEM_PRIORITIES, [
                {
                    pattern: '1',
                    callback: function (response, convo) {
                        Ticket.addTicket(item, type, response.text);
                        convo.say(CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
                        convo.next();
                    }
                },
                {
                    pattern: '2',
                    callback: function (response, convo) {
                        Ticket.addTicket(item, type, response.text);
                        convo.say(CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
                        convo.next();

                    }
                },
                {
                    pattern: '3',
                    callback: function (response, convo) {
                        Ticket.addTicket(item, type, response.text);
                        convo.say(CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
                        convo.next();
                    }
                },
                {
                    pattern: '4',
                    callback: function (response, convo) {
                        Ticket.addTicket(item, type, response.text);
                        convo.say(CONSTANTS.RESPONSES.ADD_ITEM_SUCCESS);
                        convo.next();
                    }
                },
                {
                    pattern: 'cancel',
                    callback: function (response, convo) {
                        convo.say(CONSTANTS.RESPONSES.CANCEL);
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
        });
    };
    bot.startConversation(message, function (err, convo) {
        logger.debug("ITEM TYPE", message);
        convo.ask(CONSTANTS.RESPONSES.ITEM_TYPE, [
            {
                pattern: 'core',
                callback: function (response, convo) {
                    type = response.text;
                    convo.next();
                    priority();
                }
            },
            {
                pattern: 'project',
                callback: function (response, convo) {
                    type = response.text;
                    convo.next();
                    priority();
                }
            },
            {
                pattern: 'cancel',
                callback: function (response, convo) {
                    convo.say(CONSTANTS.RESPONSES.CANCEL);
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
            }], {}, 'default')
    });
}

module.exports = {
    addTicket: addTicket,
    listTickets: listTickets,
    finishTicket: finishTicket,
    deleteTicket: deleteTicket,
    showTicketProgress: showTicketProgress,
    addLongTicket: addLongTicket,
};
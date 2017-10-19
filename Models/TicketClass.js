'use strict';


let TicketItem;
const CONSTANTS = require('../Utility/Constants');
const logger = require("winston").loggers.get('ticket');

/**
 * @class
 */
class TicketClass {

    /**
     * @constructor
     */
    constructor() {
    }

    /**
     * Creates the mongoose schemes and models for the mongo board.
     *
     * @param {mongoose} mongoose - Mongoose instance.
     * @param db - The database connection
     */
    static createDBSchemes(mongoose, db) {
        let mongoSchema = mongoose.Schema({
            ticketId: Number,
            ticketData: String,
            ticketType: [String],
            ticketPriority: Number
        });
        mongoSchema.index({ticketId: 1}, {unique: true});

        mongoSchema.query.byId = function (ticketId) {
            return this.findOne({ticketId: ticketId});
        };
        TicketItem = db.model('Ticket', mongoSchema);
    };

    /**
     * Add the given ticket.
     *
     * @param {String} ticket - new ticket data.
     * @param {Array} type - new ticket type.
     * @param {Number} priority - ticket priority.
     * @return {Promise}
     */
    static addTicket(ticket, type, priority) {
        let ticketId = Math.round(Math.random() * (CONSTANTS.NUMBERS.maxTicketID - CONSTANTS.NUMBERS.minTicketID) + CONSTANTS.NUMBERS.minTicketID);
        return TicketItem.create({ticketId: ticketId, ticketData: ticket, ticketType: type, ticketPriority: priority});
    }

    /**
     * Updates the given ticket.
     *
     * @param {Number} ticketId - id of the ticket to be updated.
     * @param {String} updateTicket -  ticket data.
     * @param {Array} type -  ticket type.
     * @param {Number} updatePriority - ticket priority.
     * @return {Promise}
     */
    static updateTicketById(ticketId, updateTicket, type, updatePriority) {
        return TicketItem.findOneAndUpdate({
            ticketId: ticketId,
        }, {$set: {ticketData: updateTicket, ticketType: type, ticketPriority: updatePriority}});
    }

    /**
     * Get ticket.
     *
     * @param {Number} ticketId - id of the ticket to be updated.
     * @return {Promise}
     */
    static getTicket(ticketId) {
        return TicketItem.findOne({ticketId: ticketId});
    }

    /**
     * Get all given ticket.
     *
     * @param {String} type -  ticket type.
     * @return {Promise}
     */
    static getTicketsWithType(type) {
        console.log(type.toLocaleLowerCase())
        return TicketItem.find({ticketType: {"$in": [type.toLocaleLowerCase()]}});
    }

    /**
     * Get all given ticket.
     *
     * @return {Promise}
     */
    static getAllTickets() {
        return TicketItem.find({});
    }

    /**
     * Removes ticket.
     *
     * @param {Number} ticketId - id of the ticket to be updated.
     * @return {Promise}
     */
    static removeTicket(ticketId) {
        return TicketItem.remove({ticketId: ticketId}, function (err) {
                if (err) logger.debug("Remove Ticket ERROR ", err);
                // removed!
            }
        );
    }

    /**
     * Removes tickets.
     *
     * @return {Promise}
     */
    static removeTickets() {
        return TicketItem.remove({}, function (err) {
            if (err) logger.debug("Remove Tickets ERROR ", err);
            // removed!
        });
    }

}

module.exports = TicketClass;

'use strict';


let TicketItem;

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
            ticketPriority: Number
        });
        mongoSchema.index({ticketId: 1}, {unique: true});

        mongoSchema.query.byId = function (ticketId) {
            return this.findOne({ticketId: ticketId});
        };
        TicketItem = db.model('Ticket', mongoSchema);
    };

    /**
     * Updates the given ticket.
     *
     * @param {Number} ticketId - id of the ticket to be updated.
     * @param {String} updateTicket - new ticket data.
     * @return {Promise}
     */
    static updateTicketById(ticketId, updateTicket, updatePriority) {
        return TicketItem.findOneAndUpdate({
            ticketId: ticketId,
        }, {$set: {ticketData: updateTicket, ticketPriority: updatePriority}});
    }

    /**
     * Removes ticket.
     *
     * @param {Number} ticketId - id of the ticket to be updated.
     * @return {Promise}
     */
    static removeTicket(ticketId) {
        return TicketItem.remove({ticketId: ticketId}, function (err) {
                if (err) console.log("Remove Ticket ERROR ", err);
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
            if (err) console.log("Remove Tickets ERROR ", err);
            // removed!
        });
    }

}

module.exports = TicketClass;

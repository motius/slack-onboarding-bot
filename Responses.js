'use strict';


let response;

/**
 * @class
 */
class Responses {

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
            reply: String
        });

        response = db.model('Responses', mongoSchema);
    };

    /**
     * Add the given ticket.
     *
     * @param {String} reply - new ticket data.
     * @return {Promise}
     */
    static addReply(reply) {
        return response.create({reply: reply});
    }

    /**
     * Get all given ticket.
     *
     * @return {Promise}
     */
    static getReplies() {
        return response.find({});
    }
}

module.exports = Responses;

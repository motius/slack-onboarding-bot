'use strict';

let member;

/**
 * @class
 */
class Member {

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
            id: {
                type: String,
                unique: true
            },
            name: String,
            username: {
                type: String,
                unique: true
            },
            emailAddress: {
                type: String,
                unique: true
            },
            type: String,
            tickets: [{
                ticketdId: Number,
                status: Boolean
            }]
        });

        mongoSchema.query.byUsername = function (username) {
            return this.findOne({username: username});
        };
        member = db.model('User', mongoSchema);
    };

    /**
     * Returns the type of the Member.
     *
     * @param {String} username - Username of the member to get the type.
     * @return {Promise}
     */
    getMemberType(username) {
        return member.findOne({username: username}, {type: 1});
    }

    /**
     * Returns the progress of the Member.
     *
     * @param {String} username - Username of the member to get the progress.
     * @return {Promise}
     */
    getMemberProgress(username) {
        return (member.findOne({username: username}, tickets));
    }


    /**
     * Setups member for onboarding.
     *
     * @param {String} username - Username of the member to get the progress.
     * @return {Promise}
     */
    startMemberOnboarding(username) {
        throw "Abstract method getMemberProgress not implemented";
    }

    /**
     * Adds member for onboarding.
     *
     * @param {String} name - Name of the member to add to the database.
     * @param {String} username - Username of the member to add to the database.
     * @param {String} emailAddress - emailAddress of the member to add to the database.
     * @param {String} type - type of the member to add to the database.
     * @param {Array} tickets - tickets to be completed by the member.
     * @return {Promise}
     */
    static addMember(name, username, emailAddress, type, tickets) {
        tickets = tickets.map((ticket) => {
            let t = {};
            t.status = false;
            t._id = ticket._id;
            return t;
        });
        
        return member.create({
            name: name,
            username: username,
            emailAddress: emailAddress,
            type: type,
            tickets: tickets
        });
    }


}

module.exports = Member;

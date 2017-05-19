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
            name: String,
            username: {
                type: String,
                unique: true
            },
            emailAddress: {
                type: String,
                unique: true
            },
            type: String
        });

        mongoSchema.query.byUsername = function (username) {
            return this.findOne({username: username});
        };
        member = db.model('User', mongoSchema);
    };

    /**
     * Returns the boardsize.
     *
     * @return {number}
     */
    static get BOARDSIZE() {
        return BOARDSIZE;
    }

    /**
     * Returns the type of the Member.
     *
     * @param {String} username - Username of the member to get the type.
     * @return {Promise}
     */
    getMemberType(username) {
        return(member.findOne({username: username}, {type: 1}))
    }

    /**
     * Returns the progress of the Member.
     *
     * @param {String} username - Username of the member to get the progress.
     * @return {Promise}
     */
    getMemberProgress(username) {
        throw "Abstract method getMemberProgress not implemented";
    }


    /**
     * Setups member for onboarding.
     *
     * @param {String} username - Username of the member to get the progress.
     * @return {Promise}
     */
    prepareMember(username) {
        throw "Abstract method getMemberProgress not implemented";
    }

    /**
     * Adds member for onboarding.
     *
     * @param {String} username - Username of the member to add to the database.
     * @return {Promise}
     */
    addMember(name, username, emailAdress) {
        throw "Abstract method getMemberProgress not implemented";
    }


}

module.exports = Member;

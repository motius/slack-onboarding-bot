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
            userId: {
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

        mongoSchema.query.byUserId = function (userId) {
            return this.findOne({userId: userId});
        };
        member = db.model('User', mongoSchema);
    };

    /**
     * Returns the type of the Member.
     *
     * @param {String} userId - userId of the member to get the type.
     * @return {Promise}
     */
    getMemberType(userId) {
        return member.byUserId(userId);
    }

    /**
     * Returns the progress of the Member.
     *
     * @param {String} userId - userId of the member to get the progress.
     * @return {Promise}
     */
    static getMemberProgress(userId) {
        return (member.findOne({userId: userId}, 'tickets'));
    }

    /**
     * Setups member for onboarding.
     *
     * @param {String} userId - Username of the member to get the progress.
     * @param {String} emailAddress - emailAddress of the member to add to the database.
     * @param {String} type - type of the member to add to the database.
     * @return {Promise}
     */
    editMember(userId, emailAddress, type) {
        return member.findOneAndUpdate({
            userId: userId,
        }, {$set: {emailAddress: emailAddress, type: type}});
    }


    /**
     * Setups member for onboarding.
     *
     * @param {String} userId - userId of the member to get the progress.
     * @return {Promise}
     */
    startMemberOnboarding(userId) {
        throw "Abstract method getMemberProgress not implemented";
    }

    /**
     * Adds member for onboarding.
     *
     * @param {Number} id - ID of the member to add to the database.
     * @param {String} name - Name of the member to add to the database.
     * @param {String} username - Username of the member to add to the database.
     * @param {String} emailAddress - emailAddress of the member to add to the database.
     * @param {String} type - type of the member to add to the database.
     * @return {Promise}
     */
    static addMember(id, name, username, emailAddress, type) {

        return member.create({
            userId: id,
            name: name,
            username: username,
            emailAddress: emailAddress,
            type: type,
            tickets: []
        });
    }
}

module.exports = Member;

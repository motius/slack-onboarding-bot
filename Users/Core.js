'use strict';
const Member = require("./Member");
const CONSTANTS = require("../Constants");

let coreMember;

/**
 * @class
 * @augments {Member}
 */
class Core extends Member {

    /**
     * @constructor
     */
    constructor() {
        super();
    }

    /**
     * Returns the progress of the Member.
     *
     * @param {String} userId - userId of the member to get the progress.
     * @return {Promise}
     */
    static getMemberProgress(userId) {
        super.getMemberProgress(userId)
            .then((res) => {
                console.log(res)
            }).catch((err) => {
            console.log(err)
        });
    }

    /**
     * Setups member for onboarding.
     *
     * @param {String} userId - userId of the member to get the progress.
     * @return {Promise}
     */
    startMemberOnboarding(userId) {
        //TODO
    }

    /**
     * Adds member for onboarding.
     *
     * @param {Number} id - ID of the member to add to the database.
     * @param {String} name - Name of the member to add to the database.
     * @param {String} username - Username of the member to add to the database.
     * @param {String} emailAddress - emailAddress of the member to add to the database.
     * @return {Promise}
     */
    static addMemberForOnboarding(id, name, username, emailAddress) {
        super.addMember(id, name, username, emailAddress, CONSTANTS.USERS.CORE)
            .then((res) => {
                console.log(res)
            }).catch((err) => {
            console.log(err)
        });
    }

    /**
     * Setups member for onboarding.
     *
     * @param {String} userId - Username of the member to get the progress.
     * @param {String} emailAddress - emailAddress of the member to edit to the database.
     * @param {String} type - type of the member to edit to the database.
     * @return {Promise}
     */
    static editMember(userId, emailAddress, type) {
        super.editMember(userId, emailAddress, type).then((res) => {
            console.log(res)
        }).catch((err) => {
            console.log(err)
        });
    }
}

module.exports = Core;

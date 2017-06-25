'use strict';
const Member = require("./Member");

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
     * @param {String} username - Username of the member to get the progress.
     * @return {Promise}
     */
    getMemberProgress(username) {
        super.getMemberProgress(username);
    }

    /**
     * Setups member for onboarding.
     *
     * @param {String} username - Username of the member to get the progress.
     * @return {Promise}
     */
    startMemberOnboarding(username) {
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
        super.addMember(id, name, username, emailAddress, "CORE").catch((err) => {
            console.log(err)
        });
    }
}

module.exports = Core;

'use strict';
const Member = require("./Member");

let projectMember;

/**
 * @class
 * @augments {Member}
 */
class Project extends Member {

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
     * @param {String} name - Name of the member to add to the database.
     * @param {String} username - Username of the member to add to the database.
     * @param {String} emailAddress - emailAddress of the member to add to the database.
     * @param {Array} tickets - tickets to be completed by the member.
     * @return {Promise}
     */
    static addMemberForOnboarding(name, username, emailAddress, tickets) {
        super.addMember(name, username, emailAddress, "PROJECT", tickets);
    }

}

module.exports = Project;

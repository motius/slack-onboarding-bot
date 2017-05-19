'use strict';
const Member = require("./Member");

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
        //TODO
    }

    /**
     * Setups member for onboarding.
     *
     * @param {String} username - Username of the member to get the progress.
     * @return {Promise}
     */
    prepareMember(username) {
        //TODO
    }

    /**
     * Adds member for onboarding.
     *
     * @param {String} username - Username of the member to add to the database.
     * @return {Promise}
     */
    addMember(name, username, emailAdress) {
        member.create({name: name, username: username, emailAddress: emailAdress, type: "Project"})
    }

}

module.exports = Project;

'use strict';
const Member = require("./Member");
const CONSTANTS = require("../../Utility/Constants");
const logger = require("winston").loggers.get('project');


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
     * @param {String} userId - userId of the member to get the progress.
     * @return {Promise}
     */
    static getMemberProgress(userId) {
        super.getMemberProgress(userId)
            .then((res) => {
                logger.debug("Project DB", res)
            }).catch((err) => {
            logger.debug("Project DB", err)
        });
    }

    /**
     * Setups member for onboarding.
     *
     * @param {String} userId - userId of the member to get the progress.
     * @return {Promise}
     */
    static startMemberOnboarding(userId) {
        return super.startMemberOnboarding(userId);
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
        super.addMember(id, name, username, emailAddress, CONSTANTS.USERS.PROJECT)
            .then((res) => {
                logger.debug("Project DB", res)
            }).catch((err) => {
            logger.debug("Project DB", err)
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
            logger.debug("Project DB", res)
        }).catch((err) => {
            logger.debug("Project DB", err)
        });
    }

}

module.exports = Project;

'use strict';

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
        throw "Abstract method getMemberType not implemented";
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


}

module.exports = Member;

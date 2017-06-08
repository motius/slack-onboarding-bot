'use strict';


let admin;

/**
 * @class
 */
class AdminClass {

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
            }
        });

        mongoSchema.query.byUsername = function (username) {
            return this.findOne({username: username});
        };
        admin = db.model('Admin', mongoSchema);
    };

    /**
     * Adds an Admin.
     *
     * @param {String} name - The name of the admin slot.
     * @param {String} username - The username of the admin slot.
     * @return {Promise}
     */
    static addAdmin(name, username) {
        return admin.create({name: name, username: username});
    }

    /**
     * Removes an admin.
     *
     * @param {String} username - The username of the admin slot.
     * @return {Promise}
     */
    static removeAdmin(username) {
        return admin.remove({username: username}, function (err) {
            if (err) console.log("Remove Admin ERROR ", err);
            // removed!
        });
    }

    /**
     * Removes all admins.
     *
     * @return {Promise}
     */
    static removeAdmins() {
        return admin.remove({}, function (err) {
            if (err) console.log("Remove Admins ERROR ", err);
            // removed!
        });
    }

}

module.exports = AdminClass;

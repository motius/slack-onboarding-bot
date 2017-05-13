'use strict';


let Admin;

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
        Admin = db.model('User', mongoSchema);
    };

    /**
     * Adds an Admin.
     *
     * @param {String} name - The name of the admin slot.
     * @param {String} username - The username of the admin slot.
     * @return {Promise}
     */
    static addAdmin(name, username) {
        return Admin.create({name: name, username: username});
    }

    /**
     * Removes an admin.
     *
     * @param {String} username - The username of the admin slot.
     * @return {Promise}
     */
    static removeAdmin(username) {
        return Admin.remove({username: username}, function (err) {
            if (err) console.log("Remove Admin ERROR ", err);
            // removed!
        });
    }

    /**
     * Removes all users.
     *
     * @return {Promise}
     */
    static removeUsers() {
        return Admin.remove({}, function (err) {
            if (err) console.log("Remove Admins ERROR ", err);
            // removed!
        });
    }

}

module.exports = AdminClass;

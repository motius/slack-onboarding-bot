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
            userId: {
                type: String,
                unique: true
            },
            channel: String
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
     * @param {String} userId - The username of the admin slot.
     * @param {String} channel - The name of the channel where the bo checks for admins.
     * @return {Promise}
     */
    static addAdmin(name, userId, channel) {
        return admin.create({name: name, userId: userId, channel: channel});
    }

    /**
     * Gets an Admin user.
     *
     * @param {String} userId - The name of the admin slot.
     * @return {Promise}
     */
    static getAdmin(userId) {
        return admin.findOne({userId: userId});
    }

    /**
     * Get the channel of the admins users.
     *
     * @return {Promise}
     */
    static getChannel() {
        return admin.find({}, 'channel', function (err, res) {
            if (err) console.log('error occured in the database');
        });
    }


    /**
     * Get the channel of the admins users.
     *
     * @param {String} userId - The admin changing the channel.
     * @param {String} channel - The name of the channel where the bo checks for admins.
     * @return {Promise}
     */
    static setChannel(userId, channel) {
        return admin.findOneAndUpdate({
            userId: userId,
        }, {$set: {channel: channel}});
    }

    /**
     * Removes an admin.
     *
     * @param {String} userId - The username of the admin slot.
     * @return {Promise}
     */
    static removeAdmin(userId) {
        return admin.remove({userId: userId}, function (err) {
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

const Admin = require("../Models/AdminClass.js");
const axios = require('axios');

module.exports = {
    /**
     * Check if the user has permission to to the action.
     *
     * @param {Bot} bot - bot instance.
     * @param user - The user invoking the action.
     */
    checkUser: function (bot, user) {
        return new Promise(function (resolve, reject) {
            bot.api.groups.list({}, function (err, response) {
                if (err) {
                    reject(false);
                } else {
                    Admin.getChannel().then((res) => {
                        response.groups.forEach(function (group) {
                            if (res[0].channel === group.name) {
                                group.members.forEach(function (member) {
                                    if (member === user) {
                                        resolve(true);
                                    }
                                });
                            }
                        });
                        reject(false);
                    }).catch((err) => {
                        reject(false);
                    });
                }
            });
        })
    },

    /**
     * Check if the user has permission to to the action.
     *
     */

    getGiphy: function () {
        let url = "http://api.giphy.com/v1/gifs/search?q=happy&api_key=yNKW8tDXQaf6O5qyNO6WSrYmb29nY5Iu&limit=10";
        return new Promise(function (resolve, reject) {
            axios.get(url).then((res) => {
                let data = res.data.data;
                let max = data.length;
                let min = 0;
                let randomNumber = Math.floor(Math.random() * (max - min)) + min;
                resolve(data[randomNumber].images.downsized.url);
            }).catch((err) => {
                reject(err);
            });
        })
    }
};
const {Wit, log} = require('node-wit');

const logLevels = ["debug", "info", "warn", "error"];

module.exports = function (options) {


    if (!options || !options.accessToken) {
        throw new Error('No wit.ai Access Token specified');
    }

    options.minConfidence = options.minConfidence || 0.5;

    options.logLevel = options.logLevel ? (logLevels.indexOf(options.logLevel) != -1 ? options.logLevel.toUpperCase() : "DEBUG") : null;

    const params = {
        accessToken: options.accessToken
    }

    if (options.logLevel){
        params.logger = new log.Logger(options.logLevel);
    }

    const client = new Wit(params);

    const middleware = {};

    middleware.receive = function (bot, message, next) {

        //Sends the message to wit.ai and receive the entities
        if (message.text && message.text.indexOf("_") == -1 && !message.bot_id && !message.payload && !message.attachments && !message.quick_reply) {
            client.message(message.text)
                .then((data) => {
                    console.log('Wit.ai response: ' + JSON.stringify(data));
                    message.entities = data.entities;
                    next();
                })
                .catch((err) => {
                    console.log(err);
                    next(err);
                });
        } else {
            message.entities = {};
            next();
        }
    };

    middleware.hears = function (patterns, message) {
        if (message.entities && Object.keys(message.entities).length) {
            for (var i = 0; i < Object.keys(message.entities).length; i++) {
                for (var t = 0; t < patterns.length; t++) {
                    if (Object.keys(message.entities)[i] == patterns[t]){
                        for (var j = 0; j < message.entities[Object.keys(message.entities)[i]].length; j++){
                            if (message.entities[Object.keys(message.entities)[i]][j].confidence >= options.minConfidence){
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return false;
    };

    return middleware;
};
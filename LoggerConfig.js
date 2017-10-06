const winston = require("winston");

const LOGLEVEL = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    VERBOSE: 'verbose',
    DEBUG: 'debug',
    SILLY: 'silly'
};

const loglevel = LOGLEVEL.DEBUG;

winston.loggers.add('bot', {
        console: {
            level: loglevel,
            colorize: true,
            label: 'bot'
        }
    }
);

winston.loggers.add('socket', {
        console: {
            level: loglevel,
            colorize: true,
            label: 'socket'
        }
    }
);

winston.loggers.add('utils', {
        console: {
            level: loglevel,
            colorize: true,
            label: 'utils'
        }
    }
);

winston.loggers.add('server', {
        console: {
            level: loglevel,
            colorize: true,
            label: 'server'
        }
    }
);

winston.loggers.add('member', {
        console: {
            level: loglevel,
            colorize: true,
            label: 'member'
        }
    }
);

winston.loggers.add('core', {
        console: {
            level: loglevel,
            colorize: true,
            label: 'core'
        }
    }
);

winston.loggers.add('project', {
        console: {
            level: loglevel,
            colorize: true,
            label: 'project'
        }
    }
);

winston.loggers.add('ticket', {
        console: {
            level: loglevel,
            colorize: true,
            label: 'ticket'
        }
    }
);

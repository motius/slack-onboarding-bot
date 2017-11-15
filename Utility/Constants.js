const RESPONSES = {
        DEFAULT: "Well... I got confused and I forgot what we were doing. How about we start from the top?",
        NOT_AUTHORIZED: "Hmmmm... yeah you can't do that buddy!",
        NOT_AN_OPTION: "Yeah.. That\'s not an option. I am sorry.",
        ITEM_EMPTY: "I missed the item in your message unfortunately.",
        ITEM_PRIORITY_EMPTY: "I missed the priority in your message unfortunately. The items have priority between 1 and 4.",
        ITEM_TYPE_EMPTY: "I missed the type of item in your message unfortunately.",
        ITEM_ID_EMPTY: "I missed the ID of item in your message unfortunately.",
        ITEM_EDIT_SUCCESSFUL: "Alright, your item is updated!",
        ITEM_EDIT_FAIL: "Oh no! Something went wrong ...",
        REMOVE_ITEM_SUCCESS: "Item successfully removed.",
        REMOVE_ITEM_FAIL: "I could not remove the item, something went wrong",
        FINISH_ITEM_NOT_FOUND: "I was unable to find the item you want to complete. Maybe you got the ID wrong?",
        FINISH_ITEM_ALREADY_FINISHED: "Looks like you already did that. I am impressed by your eagerness though.",
        FINISH_ITEM_NOT_YET_FINISHED: "Nice! We are making progress with getting you up and running.",
        ITEM_PRIORITIES: "What is the priority of the item?",
        ITEM_TYPE: "What is the type of the item? (Core, Project OR Both)",
        ITEM_PRIORITIES_OPTION: "Priority from 1-4",
        ITEM_WRONG_SYNTAX: "You seem to have the syntax for the item wrong. Hint: add_item (your_item_here)",
        ITEM_EDIT_NO_EDIT_INFORMATION: "I was not able to find the information with which to update the item. Sorry.",
        PREPARE_MEMBER_MEMBER_ALREADY_PREPARED: "This one is already in the database. Maybe you can start his onboarding?",
        PREPARE_MEMBER_NO_MEMBER_ENTERED: "You have to give me a name. Like @detlef for example.",
        PROGRESS_MEMBER_MISSING: "When asking for progress, you need to tell me who this is about. Try ask me 'progress @detlef' for example.",
        PROGRESS_MEMBER_NOT_FOUND_IN_DATABASE: "Unfortunately I was not able to retrieve the progress from the database.",
        PROGRESS_REPLY: "The progress of this Motee is: ",
        ADD_MEMBER_EMPTY: "We don't take Noname members at Motius. Try again with a real name. Like Detlef.",
        ADD_MEMBER_TYPE_EMPTY: "Well either you forgot to tell me what kind of member you mean, or silly me missed it.",
        HINT_MEMBER: "Please tell me exactly. Does this Motee join the CORE team or a PROJECT team?",//TODO remove
        MEMBER_TYPE: "What is the role for the member?",//TODO remove
        ITEM_LIST: "Here are aaaaall current items:",
        ITEM_LIST_EMPTY: "There are no items!",
        USER_NOT_FOUND: "I can't seem to find your tickets! Talk to HR about this issue.",
        NOT_PREPARED: "Member has not been prepared yet!",
        PREPARED: "Got you, I will now start the onboarding journey!",
        SUCCESS: "Successfully changed the Admins channel!",
        ONBOARDING_GREETING: " are you ready to get on board?",
        ONBOARDING_HOLD: "I will ask you again later then.",
        ONBOARDING_STOP: "Well... if you want help later, ask around. I am sad that you don't want to talk to me anymore.",
        REMINDER: ["It's me again. Just wanted to remind you about getting on board properly.", "Okay, maybe you're just to busy or don't know how to use me. Here is important information to get you onboard. If you need help, ask me for 'help'.", "Yeah.. I know...I know. Me agian.. aaanoooyyiing. But: it's important for me to integrate you into our community. Therefore:", "This is my last try, I promise. Please work together with me."],//TODO add text for iterations
        CONGRATS: ["Cool, marked as done", "Awesome, keep up the good work", "Yayyyyy!", "YOu did it!!:clap:"],
        CONGRATULATION: "Congratulations, there no more tasks left, you successfully completed all of them! :clap: :clap: :clap:\n",
        NOT_FOUND: "Ops seems like you typed the wrong ID, please check again!",
        PREPARE_SUCCESS: "The member is prepared and ready to start onboarding.",
        PREPARE_FAIL: "Something went wrong. Couldn't prepare member.",
        PREPARE_DUPLICATE: "Couldn't prepare member. Member already prepared!",
        ADD_ITEM_SUCCESS: "I added your item to the database.",
        ADD_ITEM_FAIL: "I couldn't add your item to the database.",
        STOP: "Alright, I will ask you again later.",
        CANCEL: "Process cancelled!",
        HELP: "Sooooo. I'm Paul and I'm helping new Motees to get up and running smoothly. I am a chatbot, so I'm not perfect yet. But I'll try my best to support you and remind you of all the things that are important for your life in the Motius community. I can understand normal sentences, just try to talk to me. E.g. start with the question 'What should I do?'",
        CONFUSED: "Oh, hm, I didn't understand you! Maybe you would like to repeat what you just said or maybe you would like some \"help\"",
        WELCOME_TEXT: "Welcome to Motius! I´m Paul - I will help you in the first days to provide you with everything you need in order to be a successful part of the team. \n" +
        "Motius wants to empower you to onboard yourself with my help.\n" +
        "If something is unclear please be proactive, ask your supervisor, project owner, team buddy or HR responsible person or whenever they have to give you something for a successful onboarding. Until then I´m happy when you get along with me.\n" +
        "If you were already onboarded you can view your items by asking me to : list items\nIf you need more assistance you can ask directly the HR team\n",
        WELCOME_COMMAND_TEXT: ["To add new items try: add core/project \"item\" (#) \nor if you need to add long items try: add_item \"item\"\n", "to prepare a member try: prepare @user\n",
            "a member has to be prepared before you can start onboarding, to get the bot to start the onboarding try: start @user \n", "to remove an item try: remove #itemID\n",
            "to view all added items try: list items\n", "to view the progress of a member try: progress @user\n"],
        BOT_COMMANDS: "Here are some ways to communicate with the bot:",
    }
;

const NUMBERS = {
    maxTicketID: 10000,
    minTicketID: 1,
};

const USERS = {
    PROJECT: "PROJECT",
    CORE: "CORE",
};

const REGEXES = {userIdRegex: new RegExp('\@(.{9})'), ticketIdRegex: new RegExp('[ ](0|[1-9][0-9]*)[ ]*')};

const LOGGER = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
};

const INTENTS = {
    GREETINGS: "greetings",
    RUDE: "rude_intent",
    CONFIRMATION: "wit_confirmation",
    HELP: "wit_help",
    STOP: "wit_stop",
    ITEM_INTENT: {
        set: "item_set",
        finish: "item_finish",
        progress: "item_progress",
        list: "item_list",
        remove: "item_remove",
        edit: "item_edit",
        default: "item_intent"
    },
    WIT_ITEM_PRIORITY: "item_priority",
    WIT_ITEM_TYPE: "item_type",
    WIT_ITEM_ID: "item_id",
    WIT_ITEM: "wit_item",
    WIT_MEMBER_TYPE: "wit_member_type",
    MEMBER_INTENT: {
        start: "start_member",
        prepare: "prepare_member",
        edit: "edit_member",
        default: "member_intent"
    },
    WIT_MEMBER: "wit_member"
};

module.exports = {
    NUMBERS: NUMBERS,
    RESPONSES: RESPONSES,
    REGEXES: REGEXES,
    USERS: USERS,
    LOGGER: LOGGER,
    INTENTS: INTENTS
};
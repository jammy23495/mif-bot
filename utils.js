const fallBackAnswers = ["I am sorry, I don't understand this. Please ask me something related to forum.",
    "I am sorry, I don't understand this. Maybe the experts can help you. Please check with designated Subject Matter Expert."
]

function isNULL(property) {
    if (property === "NULL") return true
    else return false
}

function isBot(property) {
    if (property === "Bot") return true
    else return false
}

function getRandomFallbackAnswers() {
    let randomNumber = Math.floor(Math.random() * fallBackAnswers.length);
    return fallBackAnswers[randomNumber]
}

module.exports = {
    isNULL,
    isBot,
    getRandomFallbackAnswers
}
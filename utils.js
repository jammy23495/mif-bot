
let checkInternetConnected = require('check-internet-connected');

const fallBackAnswers = ["I am sorry, I don't understand this. Please ask me something related to forum.",
    "I am sorry, I have found no such discussions on this matter in the forum.",
    "I am sorry, I have found no such discussions in the forum. Please check with designated Subject Matter Expert."
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

function filterString(answer) {
    if (answer) {
        answer = answer.includes("\"") ? answer.replaceAll("\"", "\'") : answer;
        answer = answer.includes("\r") ? answer.replaceAll("\r", " ") : answer;
        answer = answer.includes("\n") ? answer.replaceAll("\n", " ") : answer;
        answer = answer.includes("\t") ? answer.replaceAll("\t", " ") : answer;
        answer = answer.includes("�") ? answer.replaceAll("�", "") : answer;
        return answer
    }
}


async function checkInternet() {
    try {
        let response = await checkInternetConnected();
        return true
    } catch (error) {
        console.log(error)
        return false;
    }
}

module.exports = {
    isNULL,
    isBot,
    getRandomFallbackAnswers,
    filterString,
    checkInternet
}
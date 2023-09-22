let checkInternetConnected = require('check-internet-connected');

const { StopwordsEn, TokenizerEn } = require('@nlpjs/lang-en');

const fallBackAnswers = ["I am sorry, I don't understand this. I am still learning. Please ask me something related to forum. Please share your feedback on admin@hq.indiannavy.mil",
    "I am sorry, I have found no such discussions on this matter in the forum. Please share your feedback on admin@hq.indiannavy.mil",
    "I am sorry, I have found no such discussions in the forum. Please check with designated Subject Matter Expert. Please share your feedback on admin@hq.indiannavy.mil"
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

async function tokenize(input) {
    const tokenizer = new TokenizerEn();
    const result = tokenizer.tokenize(input);
    const stopwords = new StopwordsEn();
    let finalResult = stopwords.removeStopwords(result)
    return finalResult
}

async function getData(params) {
    
}

module.exports = {
    isNULL,
    isBot,
    getRandomFallbackAnswers,
    filterString,
    checkInternet,
    tokenize
}
let {
    loadActions
} = require("./actions")

let {
    getMIFData,
    getFAQs
} = require("./sql")

let {
    tokenize
} = require("./utils")

let language = "en"

//Train MIF Dataset
async function train(manager) {
    try {
        let jsonArray = await getFAQs();
        let sqlData = await getMIFData();
        jsonArray = [...jsonArray, ...sqlData]

        //Load Actions & Entities
        await loadActions(manager)

        let allSubjects = []

        //Create Intents and Utterances from Greet
        for (let index = 0; index < jsonArray.length; index++) {
            let topic = jsonArray[index].Topic ? jsonArray[index].Topic : "MIF";

            let ID = jsonArray[index].Post_ID.toString();

            let filteredSubject = await filterString(jsonArray[index].Subject)
            let subject = jsonArray[index].Subject ? filteredSubject.answer : "";

            let filteredQuestion = await filterString(jsonArray[index].Question)
            let question = jsonArray[index].Question ? filteredQuestion.answer : "";

            let filteredAnswer = await filterString(jsonArray[index].Comment)
            let answer = jsonArray[index].Comment ? filteredAnswer.answer : "";

            let intent = ID + `_${topic}` + "_intent_" + subject.replaceAll(" ", "_")

            allSubjects = [...allSubjects, ...await tokenize(subject)]

            manager.addDocument(language, subject, intent);

            manager.addDocument(language, question, intent);

            manager.addAnswer(language, intent, answer);
        }


        // Train and save the model.
        await manager.train();
        await manager.save();
        console.log("Model Trained successfully!")
        return {
            "status": "200",
            "message": "Model Trained successfully!"
        }
    } catch (error) {
        return {
            "status": "400",
            "message": error
        }
    }
}

async function filterString(answer) {
    if (answer) {
        answer = answer.includes("\"") ? answer.replaceAll("\"", "\'") : answer;
        answer = answer.includes("\r") ? answer.replaceAll("\r", " ") : answer;
        answer = answer.includes("\n") ? answer.replaceAll("\n", " ") : answer;
        answer = answer.includes("\t") ? answer.replaceAll("\t", " ") : answer;
        answer = answer.includes("�") ? answer.replaceAll("�", "") : answer;
        return {
            "answer": answer,
            "status": 200
        };
    } else {
        return {
            "answer": "I am sorry! I don't know about this.",
            "status": 400
        }
    }
}


module.exports = {
    train
}
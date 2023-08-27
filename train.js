const moment = require('moment');
const csv = require('csvtojson');
let {
    loadActions
} = require("./actions")

let {
    getMIFData
} = require("./sql")

let language = "en"

//Train MIF Dataset
async function train(manager) {
    try {
        let jsonArray = await csv().fromFile("./mif.csv");
        let sqlData = await getMIFData();
        jsonArray = [...jsonArray, ...sqlData]
        let classifications = []

        //Create Intents and Utterances from Greet
        for (let index = 0; index < jsonArray.length; index++) {
            let topic = jsonArray[index].Topic ? jsonArray[index].Topic : "MIF";
            
            let ROW_ID = jsonArray[index].Row_Number.toString();
            let ID = jsonArray[index].Post_ID.toString();

            let filteredSubject = await filterString(jsonArray[index].Subject)
            let subject = jsonArray[index].Subject ? filteredSubject.answer : "";
            
            let filteredQuestion = await filterString(jsonArray[index].Question)
            let question = jsonArray[index].Question ? filteredQuestion.answer : "";

            let filteredAnswer = await filterString(jsonArray[index].Comment)
            let answer = jsonArray[index].Comment ? filteredAnswer.answer : "";

            let likes = jsonArray[index].LikeCount ? jsonArray[index].LikeCount : 0;
            let comments = jsonArray[index].CommentCount ? jsonArray[index].CommentCount : 0;
            let post_url = jsonArray[index].Post_URL ? jsonArray[index].Post_URL : "https://miforum.indiannavy.mil:8081/#/home/" + ID;
            let post_date = jsonArray[index].Comment_On;
            let post_date_string = moment(post_date, "YYYY-MM-DD").format('MMMM Do YYYY');
            let answered_by = jsonArray[index].Comment_By;

            let newanswer = answer + `???{"ID":"${ID}","Answered_By":"${answered_by}","likes":${likes},"comments":${comments},"post_url":"${post_url}","post_date":"${post_date_string}","subject":"${subject}","question":"${question}","answer":"${answer}"}`

            let intent = ROW_ID + `_${topic}` + "_intent_" + subject.replaceAll(" ", "_")

            manager.addDocument(language, subject, intent);
            manager.addDocument(language, "Summarize " + subject, intent);
            manager.addDocument(language, "Tell me something about " + subject, intent);
            manager.addDocument(language, "Is there any post related to " + subject, intent);
            manager.addDocument(language, "Are there any post related to " + subject, intent);



            manager.addAnswer(language, intent, newanswer);
        }


        //Load Actions & Entities
        await loadActions(manager, jsonArray, classifications)

        // Train and save the model.
        await manager.train();
        manager.save();
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
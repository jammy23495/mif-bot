let {
    getRandomFallbackAnswers,
    filterString,
    checkInternet
} = require("./utils")

let {
    summarize
} = require("./hf")
const moment = require('moment');
require('dotenv').config()


//QNA
async function qna(question, manager, summarizer) {
    //Load NLP Manager
    await manager.load("./model.nlp")

    //Generating Response
    const response = await manager.process('en', question);

    let finalAnswers = []

    //Check the greet response (topic)
    if (response && response.intent && (response.intent.toLowerCase().includes("greet") || response.intent.toLowerCase().includes("action"))) {

        let answer = response.answer || getRandomFallbackAnswers();

        finalAnswers.push({
            "answer_summary": answer,
            "isGreet": true
        })
        console.log(answer)
    }
    // For other topics rather than greet
    else {
        //Classifcations found
        if (response && response.classifications && response.classifications.length > 0) {

            let isCommentsAdded = true;
            let classifications = response.classifications;
            let validClassifications = classifications.filter((e) => {
                return e.score > 0.1 && !e.intent.toLowerCase().includes("greet")
            })

            //Valid Classifications found
            if (validClassifications && validClassifications.length > 0) {
                for (let i = 0; i < validClassifications.length; i++) {
                    if (validClassifications[i].intent.includes("MIF")) {
                        let intent = validClassifications[i].intent.split("_");
                        let POST_ID = intent[0];
                        let post = await getDataByPOSTID(POST_ID)
                        post = [...new Map(post.map(item => [item["Post_ID"], item])).values()]
                        if (post && post.length > 0) {

                            for (let j = 0; j < post.length; j++) {
                                // let comment_summary = post[j].Comment && post[j].Comment != "NULL" ? await generateAnswer(filterString(post[j].Comment), summarizer) : {
                                //     "answer_summary": "No comments found!",
                                //     "isGreet": false
                                // }
                                let comment_summary = post[j].Comment && post[j].Comment != "NULL" ? filterString(post[j].Comment) : {
                                    "answer_summary": "No comments found!",
                                    "isGreet": false
                                }
                                let finalCommentCount = 0;
                                if (response.commentCount && isCommentsAdded) {
                                    finalCommentCount = response.commentCount;
                                    isCommentsAdded = false
                                } else {
                                    finalCommentCount = post[j].CommentCount
                                }

                                // let question_summary = await generateAnswer(filterString(post[j].Question), summarizer)
                                let question_summary = filterString(post[j].Question)
                                finalAnswers.push({
                                    // "answer_summary": comment_summary.answer_summary,
                                    "answer_summary": comment_summary.answer_summary ? comment_summary.answer_summary : comment_summary,
                                    "isGreet": comment_summary.isGreet,
                                    "props": {
                                        "ID": post[j].Post_ID,
                                        "Posted_By": post[j].SubmittedBy,
                                        "Subject": post[j].Subject,
                                        // "Question": question_summary.answer_summary,
                                        "Question": question_summary.answer_summary ? question_summary.answer_summary : question_summary,
                                        "FeedType": post[j].FeedType,
                                        "Posted_On": moment(post[j].Submitted_On, "YYYY-MM-DD").format('MMMM Do YYYY'),
                                        "Likes": post[j].LikeCount,
                                        "Comments": finalCommentCount,
                                        "Views": post[j].ViewCount,
                                        "Comment_By": post[j].Comment_By,
                                        "Commented_On": moment(post[j].Comment_On, "YYYY-MM-DD").format('MMMM Do YYYY'),
                                        "Category": post[j].Category
                                    }
                                })
                            }
                        }
                    }
                }

            } else {
                console.log("No Valid Classifications found!")
                finalAnswers.push({
                    "answer_summary": getRandomFallbackAnswers(),
                    "isGreet": true,
                    "isFallback": true
                })
            }
        } else {
            console.log("No Classifications found!")
            finalAnswers.push({
                "answer_summary": getRandomFallbackAnswers(),
                "isGreet": true,
                "isFallback": true
            })
        }
    }
    return {
        "data": finalAnswers,
        "response": response
    };
}

async function generateAnswer(answer, offlineSummarizer) {
    try {
        let answer_summary = ""

        let answer_length = answer.split(/[.?!]/g).filter(Boolean).length;

        //Perform Summarization
        if (answer_length > 3) {
            let internet = await checkInternet()

            // Using huggingfacejs inference if internet is available
            if (internet && process.env.runOffline.toLocaleLowerCase() === "false") {
                console.log("Running on Huggingface online inference")
                let response = await summarize(answer)
                answer_summary = response ? response.summary_text : ""
            }
            // Using Transformersjs if internet isn't available
            else {
                console.log("Running on Transformers offline pipeline")
                let response = await offlineSummarizer(answer)
                answer_summary = response && response.length > 0 ? response[0].summary_text : ""
            }
        } else {
            answer_summary = answer
        }

        return {
            answer_summary: answer_summary,
            isGreet: false,
            isFallback: true
        }
    } catch (error) {
        return {
            answer_summary: "I am sorry! I don't know about this. Please ask questions related to forum.",
            isGreet: true,
            isFallback: true
        }
    }
}

async function getDataByPOSTID(id) {
    let {
        getMIFData
    } = require("./sql")
    let sqlData = await getMIFData();
    let filteredData = sqlData.filter((s) => {
        return s.Post_ID == id
    })
    return filteredData
}


module.exports = {
    qna
}
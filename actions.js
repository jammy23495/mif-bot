var _ = require('underscore');

let {
    getMIFData,
    getListOfExperts,
    getListOfCategories,
    getListOfAPSOS,
    getWeeklyQuizAnswers,
    getInformationBasket,
    getNodalDTE,
    getTechBytes,
    getAnnouncements
} = require("./sql");
const {
    get
} = require('lodash');

async function loadActions(manager, jsonArray, classifications) {
    try {
        //Entities
        manager.addNerAfterLastCondition('en', 'answered_by', 'by');
        manager.addNerAfterLastCondition('en', 'post_number', 'in');
        manager.addNerAfterLastCondition('en', 'post_number', 'post');
        manager.addNerRuleOptionTexts('en', 'post_type', 'post', ["Posts", "post", "posts", "Post"]);
        manager.addNerRuleOptionTexts('en', 'post_field', 'comment', ["Comment", "comment", "Comments", "comments", "Commented", "commented"]);
        manager.addNerRuleOptionTexts('en', 'post_field', 'likes', ["Likes", "likes", "Like", "like", "Liked", "liked"]);
        manager.addNerRuleOptionTexts('en', 'post_type', 'query', ["Query", "query", "Queries", "queries"]);
        manager.addNerRuleOptionTexts('en', 'post_type', 'COM Post', ["COM Post", "COM Posts", "COM post", "COM posts"]);
        manager.addNerRuleOptionTexts('en', 'post_type', 'Expert Post', ["Expert Post", "Expert Posts", "expert post", "expert posts"]);

        //-------------------------------------------showCommentsByName------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Show me the comments given by @answered_by', "intent_showCommentsByName");
        manager.addDocument('en', 'Is there any comments given by @answered_by', "intent_showCommentsByName");

        //Action
        manager.addAction("intent_showCommentsByName", 'showCommentsByName', [], async (data) => {
            classifications = []
            if (data && data.entities.length > 0) {
                let entities = data.entities;
                entities.filter(async (ent) => {
                    if (ent.entity === "answered_by") {
                        jsonArray.filter(async (c) => {
                            if (c?.Comment_By?.toLowerCase().includes(ent.sourceText.toLowerCase())) {
                                let intent = c.Post_ID + `_${c.Topic || "MIF"}` + "_intent_" + c.Subject.replaceAll(" ", "_")
                                classifications.push({
                                    "intent": intent,
                                    "score": 0.5
                                })
                            } else {
                                data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showCommentsByNameError" : "intent_action_showCommentsByName", "I am sorry! I cannot find the posts/queries by this person")
                            }
                        })
                    } else {
                        data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showCommentsByNameError" : "intent_action_showCommentsByName", "I am sorry! I cannot find the posts/queries by this person")
                    }
                })
            }
            data.classifications = classifications;
        });

        //-------------------------------------------showCountBasedOnPostType------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'How many @post_type are there in MIF?', "intent_showCountBasedOnPostType")
        manager.addDocument('en', 'What are the number of @post_type available in MIF?', "intent_showCountBasedOnPostType")

        //Actions
        manager.addAction("intent_showCountBasedOnPostType", 'showCountBasedOnPostType', [], async (data) => {
            if (data && data.entities.length > 0) {
                let entities = data.entities;
                let post_type = entities.filter((e) => {
                    return e.entity === "post_type"
                })[0]

                let numberOfPosts = jsonArray.filter((e) => {
                    try {
                        return !e.Post_ID.toString().includes("Bot") && e.FeedType === "Post"
                    } catch (error) {
                        console.log(e)
                    }
                })

                let numberOfQuery = jsonArray.filter((e) => {
                    return !e.Post_ID.toString().includes("Bot") && e.FeedType === "Query"
                })

                let numberOfCOMPost = jsonArray.filter((e) => {
                    return !e.Post_ID.toString().includes("Bot") && e.FeedType === "COM Post"
                })

                let numberOfExpertPost = jsonArray.filter((e) => {
                    return !e.Post_ID.toString().includes("Bot") && e.FeedType === "Expert Post"
                })

                //Check for post category
                if (post_type.option === "post") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostType", `I found ${numberOfPosts.length} posts in MIF`)
                }
                //Check for query category
                else if (post_type.option === "query") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostType", `I found ${numberOfQuery.length} queries in MIF`)
                }
                //Check for COM Posts category
                else if (post_type.option === "COM Post") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostType", `I found ${numberOfCOMPost.length} COM Posts in MIF`)
                }
                //Check for Expert Posts category
                else if (post_type.option === "Expert Post") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostType", `I found ${numberOfExpertPost.length} Expert Posts in MIF`)
                }
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showCountBasedOnPostFieldAndPostNumber------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'How many @post_field are there in post @post_number?', "intent_showCountBasedOnPostTypeAndPostNumber")
        manager.addDocument('en', 'How many @post_field are there on post @post_number?', "intent_showCountBasedOnPostTypeAndPostNumber")
        manager.addDocument('en', 'How many people @post_field on post @post_number?', "intent_showCountBasedOnPostTypeAndPostNumber")


        //Actions
        manager.addAction("intent_showCountBasedOnPostTypeAndPostNumber", 'showCountBasedOnPostTypeAndPostNumber', [], async (data) => {
            if (data && data.entities.length > 0) {
                let entities = data.entities;
                let post_type = entities.filter((e) => {
                    return e.entity === "post_field"
                })[0]
                let post_number = entities.filter((e) => {
                    return e.entity === "post_number"
                })[0]

                if (post_number) {
                    classifications.push({
                        "intent": "intent_showCountBasedOnPostTypeAndPostNumber",
                        "score": 1
                    })
                    let numberOfPosts = jsonArray.filter((e) => {
                        return !e.Post_ID.toString().includes("Bot") && e.Post_ID.toString() === post_number.sourceText.replace(/[^0-9]/g, "");
                    })[0]

                    //For comments
                    if (post_type.option === "comment") {
                        data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostTypeAndPostNumber", `There are ${numberOfPosts.CommentCount} comments on post ${post_number.sourceText.replace(/[^0-9]/g, "")} in MIF`)
                    } else if (post_type.option === "likes") {
                        data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostTypeAndPostNumber", `There are ${numberOfPosts.LikeCount} likes on post ${post_number.sourceText.replace(/[^0-9]/g, "")} in MIF`)
                    }
                }
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showListOfCategories------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Give me the list of categories', "intent_showListOfCategories")
        manager.addDocument('en', 'Provide me the list of categories', "intent_showListOfCategories")
        manager.addDocument('en', 'Which categories are available?', "intent_showListOfCategories")
        manager.addDocument('en', 'How many categories are there in MIF?', "intent_showListOfCategories")

        //Actions
        manager.addAction("intent_showListOfCategories", 'showListOfCategories', [], async (data) => {
            if (data) {
                let categoryList = await getListOfCategories();
                let categoryString = `There are ${categoryList.length} categories in MIF.`
                categoryString += " Below are the list of categories:\n"
                categoryString += "<ul style='padding: revert; '>"
                categoryList.map((c) => {
                    categoryString += "<li>"
                    categoryString += `${c.Name}`
                    categoryString += "</li>"
                })
                categoryString += "</ul>"
                data = generateActionDataResponse(data, "intent_action_showListOfExperts", categoryString)
            }
            data.classifications = classifications;
        })


        //-------------------------------------------showListOfExperts------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Give me the list of experts', "intent_showListOfExperts")
        manager.addDocument('en', 'Provide me the list of experts', "intent_showListOfExperts")
        manager.addDocument('en', 'Who are the experts in MIF?', "intent_showListOfExperts")
        manager.addDocument('en', 'How many experts are there in MIF?', "intent_showListOfExperts")

        //Actions
        manager.addAction("intent_showListOfExperts", 'showListOfExperts', [], async (data) => {
            if (data) {
                let expertList = await getListOfExperts();
                let expertString = `There are ${expertList.length} experts in MIF.`
                expertString += " Below are the list of experts:\n"
                expertString += "<ul style='padding: revert; '>"
                expertList.map((e) => {
                    expertString += "<li>"
                    expertString += `${e.Name}(${e.Category})`
                    expertString += "</li>"
                })
                expertString += "</ul>"
                data = generateActionDataResponse(data, "intent_action_showListOfExperts", expertString)
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showListOfAPSOs------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Give me the list of APSOs', "intent_showListOfAPSOs")
        manager.addDocument('en', 'Provide me the list of APSOs', "intent_showListOfAPSOs")
        manager.addDocument('en', 'Who are the APSOs in MIF?', "intent_showListOfAPSOs")
        manager.addDocument('en', 'How many APSOs are there in MIF?', "intent_showListOfAPSOs")

        //Actions
        manager.addAction("intent_showListOfAPSOs", 'showListOfAPSOs', [], async (data) => {
            if (data) {
                let APSOsList = await getListOfAPSOS();
                let APSOsString = `There are ${APSOsList.length} APSOs in MIF.`
                APSOsString += " Below are the list of APSOs:\n"
                APSOsString += "<ul style='padding: revert; '>"
                APSOsList.map((e) => {
                    APSOsString += "<li>"
                    APSOsString += `${e.Name}`
                    APSOsString += "</li>"
                })
                APSOsString += "</ul>"
                data = generateActionDataResponse(data, "intent_action_showListOfAPSOs", APSOsString)
            }
            data.classifications = classifications;
        })


        //-------------------------------------------showWeeklyQuizAnswerList------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'How many people answered in weekly quiz?', "intent_showWeeklyQuizAnswerList")
        manager.addDocument('en', 'Provide me the details about the members who answered correctly in weekly quiz', "intent_showWeeklyQuizAnswerList")

        //Actions
        manager.addAction("intent_showWeeklyQuizAnswerList", 'showWeeklyQuizAnswerList', [], async (data) => {
            if (data) {
                let weeklyQuizList = await getWeeklyQuizAnswers();
                let weeklyQuizString = `In MIF, ${weeklyQuizList.length} members have answered correctly in weekly quiz.`
                weeklyQuizString += " Below are the list of members:\n"
                weeklyQuizString += "<ul style='padding: revert; '>"
                weeklyQuizList.map((e) => {
                    weeklyQuizString += "<li>"
                    weeklyQuizString += `${e.Name}`
                    weeklyQuizString += "</li>"
                })
                weeklyQuizString += "</ul>"
                data = generateActionDataResponse(data, "intent_action_showWeeklyQuizAnswerList", weeklyQuizString)
            }
            data.classifications = classifications;
        })


        //-------------------------------------------showNameOfTheLinks------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Show me the name of the links in the information basket', "intent_showNameOfTheLinks")
        manager.addDocument('en', 'Provide me the details about information basket', "intent_showNameOfTheLinks")

        //Actions
        manager.addAction("intent_showNameOfTheLinks", 'showNameOfTheLinks', [], async (data) => {
            if (data) {
                let InformationBasketsList = await getInformationBasket();
                let InformationBasketsString = `There are ${InformationBasketsList.length} links in Information Baskets.`
                InformationBasketsString += " Below are the list of links:\n"
                InformationBasketsString += "<ul style='padding: revert; '>"
                InformationBasketsList.map((e) => {
                    InformationBasketsString += "<li>"
                    InformationBasketsString += `${e.Name} (${e.FilePath})`
                    InformationBasketsString += "</li>"
                })
                InformationBasketsString += "</ul>"
                data = generateActionDataResponse(data, "intent_action_showNameOfTheLinks", InformationBasketsString)
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showListOfTechBytes------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Give me the list of Tech Bytes', "intent_showListOfTechBytes")
        manager.addDocument('en', 'Provide me the list of Tech Bytes', "intent_showListOfTechBytes")
        manager.addDocument('en', 'What are the Tech bytes in MIF?', "intent_showListOfTechBytes")
        manager.addDocument('en', 'How many tech bytes are there in MIF?', "intent_showListOfTechBytes")

        //Actions
        manager.addAction("intent_showListOfTechBytes", 'showListOfTechBytes', [], async (data) => {
            if (data) {
                let TechBytesList = await getTechBytes();
                let TechBytesString = `There are ${TechBytesList.length} Tech Bytes in MIF.`
                TechBytesString += " Below are the list of Tech bytes:\n"
                TechBytesString += "<ul style='padding: revert; '>"
                TechBytesList.map((e) => {
                    TechBytesString += "<li>"
                    TechBytesString += `${e.Name}`
                    TechBytesString += "</li>"
                })
                TechBytesString += "</ul>"
                data = generateActionDataResponse(data, "intent_action_showListOfTechBytes", TechBytesString)
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showListOfNodalDTE------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Give me the list of nodal DTE', "intent_showListOfNodalDTE")
        manager.addDocument('en', 'Provide me the list of  nodal DTE', "intent_showListOfNodalDTE")
        manager.addDocument('en', 'What are the  nodal DTE in MIF?', "intent_showListOfNodalDTE")
        manager.addDocument('en', 'How many  nodal DTE are there in MIF?', "intent_showListOfNodalDTE")

        //Actions
        manager.addAction("intent_showListOfNodalDTE", 'showListOfNodalDTE', [], async (data) => {
            if (data) {
                let nodalDTEList = await getNodalDTE();
                let nodalDTEString = `There are ${nodalDTEList.length} nodal DTE in MIF.`
                nodalDTEString += " Below are the list of nodal DTE's:\n"
                nodalDTEString += "<ul style='padding: revert; '>"
                nodalDTEList.map((e) => {
                    nodalDTEString += "<li>"
                    nodalDTEString += `${e.Name}`
                    nodalDTEString += "</li>"
                })
                nodalDTEString += "</ul>"
                data = generateActionDataResponse(data, "intent_action_showListOfNodalDTE", nodalDTEString)
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showAnnouncements------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Give me the list of Announcements', "intent_showAnnouncements")
        manager.addDocument('en', 'What are the announcements available in MIF?', "intent_showAnnouncements")

        //Actions
        manager.addAction("intent_showAnnouncements", 'showAnnouncements', [], async (data) => {
            if (data) {
                let announcementsList = await getAnnouncements();
                let announcementsString = `There are ${announcementsList.length} announcements in MIF.`
                announcementsString += " Below are the list of announcements:\n"
                announcementsString += "<ul style='padding: revert; '>"
                announcementsList.map((e) => {
                    announcementsString += "<li>"
                    announcementsString += `<b>Announcement: </b>${e.Name}<br/>`
                    announcementsString += `<b>Description: </b>${e.Description}`
                    announcementsString += "</li>"
                })
                announcementsString += "</ul>"
                data = generateActionDataResponse(data, "intent_action_showAnnouncements", announcementsString)
            }
            data.classifications = classifications;
        })


    } catch (error) {
        data.classifications = classifications;
    }

}

async function generateActionDataResponse(data, intent, answer) {
    data.intent = intent
    data.answer = answer
    return data;
}

module.exports = {
    loadActions
}
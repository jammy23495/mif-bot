var _ = require('underscore');

async function loadActions(manager, jsonArray, classifications) {
    //Entities
    manager.addNerAfterLastCondition('en', 'answered_by', 'by');
    manager.addNerAfterLastCondition('en', 'post_number', 'in');
    manager.addNerAfterLastCondition('en', 'post_number', 'post');
    manager.addNerRuleOptionTexts('en', 'post_type', 'post', ["Posts", "post", "posts", "Post"]);
    manager.addNerRuleOptionTexts('en', 'post_type', 'comment', ["Comment", "comment", "Comments", "comments"]);
    manager.addNerRuleOptionTexts('en', 'post_type', 'likes', ["Likes", "likes", "Like", "like"]);

    //-------------------------------------------showCommentsByName------------------------------------------------------------

    //Documents
    manager.addDocument('en', 'Show me the comments given by @answered_by', "intent_showCommentsByName");

    //Action
    manager.addAction("intent_showCommentsByName", 'showCommentsByName', [], async (data) => {
        if (data && data.entities.length > 0) {
            let entities = data.entities;
            entities.filter(async (ent) => {
                if (ent.entity === "answered_by") {
                    jsonArray.filter(async (c) => {
                        if (c.Comment_By.toLowerCase().includes(ent.sourceText.toLowerCase())) {
                            let intent = c.Row_Number + `_${c.Topic}` + "_intent_" + c.Subject.replaceAll(" ", "_")
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
            entities.filter(async (ent) => {
                if (ent.entity === "post_type") {
                    //Check for Posts
                    if (ent.option === "post") {
                        let uniquePosts = _.keys(_.countBy(jsonArray, function (data) {
                            if (!data.Post_ID.includes("Bot"))
                                return data.Post_ID;
                        }));
                        data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostType", `I found ${uniquePosts.length} ${ent.sourceText} in MIF`)
                    }
                    //Check for Comments
                    else if (ent.option === "comment") {
                        let numberOfComments = jsonArray.filter((e) => {
                            return !e.Post_ID.includes("Bot")
                        })
                        data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostType", `I found ${numberOfComments.length} ${ent.sourceText} in MIF`)
                    }
                }
            })
        }
        data.classifications = classifications;
    })

    //-------------------------------------------showCountBasedOnPostTypeAndPostNumber------------------------------------------------------------

    //Documents
    manager.addDocument('en', 'How many @post_type are there in post @post_number?', "intent_showCountBasedOnPostTypeAndPostNumber")

    //Actions
    manager.addAction("intent_showCountBasedOnPostTypeAndPostNumber", 'showCountBasedOnPostTypeAndPostNumber', [], async (data) => {
        if (data && data.entities.length > 0) {
            let entities = data.entities;
            let post_type = entities.filter((e) => {
                return e.entity === "post_type"
            })[0]
            let post_number = entities.filter((e) => {
                return e.entity === "post_number"
            })[0]
            let numberOfPosts = jsonArray.filter((e) => {
                return !e.Post_ID.includes("Bot") && e.Post_ID === post_number.sourceText.replace(/[^0-9]/g, "");
            })[0]

            //For comments
            if (post_type.option === "comment") {
                data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostTypeAndPostNumber", `There are ${numberOfPosts.CommentCount} comments on post ${post_number.sourceText.replace(/[^0-9]/g, "")} in MIF`)
            } else if (post_type.option === "likes") {
                data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostTypeAndPostNumber", `There are ${numberOfPosts.LikeCount} likes on post ${post_number.sourceText.replace(/[^0-9]/g, "")} in MIF`)
            }
        }
        data.classifications = classifications;
    })

    //-------------------------------------------showListOfCategories------------------------------------------------------------

    //Documents
    manager.addDocument('en', 'Give me the list of categories', "intent_showListOfCategories")
    manager.addDocument('en', 'Provide me the list of categories', "intent_showListOfCategories")
    manager.addDocument('en', 'What are the categories available?', "intent_showListOfCategories")

    //Actions
    manager.addAction("intent_showListOfCategories", 'showListOfCategories', [], async (data) => {
        if (data) {
            let uniqueCategories = _.keys(_.countBy(jsonArray, function (data) {
                if (!data.Post_ID.includes("Bot"))
                    return data.FeedType
            }));
            uniqueCategories = uniqueCategories.filter((e) => {
                return e && e !== "undefined"
            })
            data = generateActionDataResponse(data, "intent_action_showListOfCategories", `There are ${uniqueCategories.length} categories in MIF such as ${uniqueCategories.toString()}`)

        }
        data.classifications = classifications;
    })

}

async function generateActionDataResponse(data, intent, answer) {
    data.intent = intent
    data.answer = answer + "???{}"
    return data;
}

module.exports = {
    loadActions
}
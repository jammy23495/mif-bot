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
    getAnnouncements,
    getDistinctMIFBotData,
    getAPSOsPosts,
    getAttachmentsInIS,
    getTechBytesHistory
} = require("./sql");

let {
    getRandomFallbackAnswers,
    tokenize,
    filterString
} = require("./utils")


async function loadActions(manager, jsonArray, classifications) {
    try {
        //Entities
        manager.addNerAfterLastCondition('en', 'answered_by', 'by');
        manager.addNerAfterLastCondition('en', 'answered_by', 'of');
        manager.addNerAfterLastCondition('en', 'post_number', 'in');
        manager.addNerAfterLastCondition('en', 'post_number', 'post');
        manager.addNerAfterLastCondition('en', 'post_number', 'no');
        manager.addNerAfterLastCondition('en', 'post_number', 'number');
        manager.addNerAfterLastCondition('en', 'post_description', 'on');
        manager.addNerAfterLastCondition('en', 'post_description', 'to');

        manager.addNerRuleOptionTexts('en', 'post_field', 'comment', ["Comment", "comment", "Comments", "comments", "Commented", "commented"]);
        manager.addNerRuleOptionTexts('en', 'post_field', 'likes', ["Likes", "likes", "Like", "like", "Liked", "liked"]);

        manager.addNerRuleOptionTexts('en', 'post_type', 'post', ["Posts", "post", "posts", "Post"]);
        manager.addNerRuleOptionTexts('en', 'post_type', 'query', ["Query", "query", "Queries", "queries"]);

        manager.addNerRuleOptionTexts('en', 'answered_by_person_type', 'COM', ["COM", "com"]);
        manager.addNerRuleOptionTexts('en', 'answered_by_person_type', 'Expert', ["expert", "experts", "Subject Matter Expert"]);
        manager.addNerRuleOptionTexts('en', 'answered_by_person_type', 'APSOs', ["apsos", "APSOs", "APSO's", "apso's"]);

        //-------------------------------------------showPostDetails------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Show me the @post_field given by @answered_by', "intent_showPostDetails");
        manager.addDocument('en', 'Show me the @post_field of @answered_by', "intent_showPostDetails");
        manager.addDocument('en', 'Is there any @post_field given by @answered_by', "intent_showPostDetails");
        manager.addDocument('en', 'How many @post_field by @answered_by?', "intent_showPostDetails");

        manager.addDocument('en', 'Show me the @post_type given by @answered_by', "intent_showPostDetails");
        manager.addDocument('en', 'Show me the @post_type of @answered_by', "intent_showPostDetails");
        manager.addDocument('en', 'Is there any @post_type given by @answered_by', "intent_showPostDetails");
        manager.addDocument('en', 'How many @post_type by @answered_by?', "intent_showPostDetails");

        manager.addDocument('en', 'Is there any post on @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'Is there any query on @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'Is there any comment on @post_description?', "intent_showPostDetails");

        manager.addDocument('en', 'Is there any post related to @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'Is there any query related to @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'Is there any comment related to @post_description?', "intent_showPostDetails");

        manager.addDocument('en', 'Are there any posts related to @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'Are there any queries related to @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'Are there any comments related to @post_description?', "intent_showPostDetails");

        manager.addDocument('en', 'Any post on @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'Any query on @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'Any comment on @post_description?', "intent_showPostDetails");

        manager.addDocument('en', 'post on @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'query on @post_description?', "intent_showPostDetails");
        manager.addDocument('en', 'comment on @post_description?', "intent_showPostDetails");

        //Action
        manager.addAction("intent_showPostDetails", 'showPostDetails', [], async (data) => {
            let jsonArray = await getMIFData()
            classifications = []
            if (data && data.entities.length > 0) {
                let entities = data.entities;
                let post_type = entities.filter((e) => {
                    return e.entity === "post_type"
                })[0]
                let post_field = entities.filter((e) => {
                    return e.entity === "post_field"
                })[0]
                let answered_by = entities.filter((e) => {
                    return e.entity === "answered_by"
                })[0]
                let post_description = entities.filter((e) => {
                    return e.entity === "post_description"
                })[0]

                //If post description is present
                if (post_description) {
                    let allMIFData = await getMIFData();
                    let allMIFDistinctData = [...new Map(allMIFData.map(item => [item["Post_ID"], item])).values()]
                    let allMIFPostData = allMIFDistinctData.filter((e) => {
                        return e.FeedType == "Post"
                    })
                    let allMIFQueryData = allMIFDistinctData.filter((e) => {
                        return e.FeedType == "Query"
                    })
                    let tokens = await tokenize(post_description.sourceText)
                    if (tokens.length > 0) {
                        //Get Data for Post
                        if (post_type && post_type.option == "post") {
                            for (let j = 0; j < allMIFPostData.length; j++) {
                                let availableTokens = 0;
                                let context = filterString(allMIFPostData[j].Subject) + filterString(allMIFPostData[j].Question);
                                for (let i = 0; i < tokens.length; i++) {
                                    if (context && context.toLowerCase().includes(tokens[i].toLowerCase())) {
                                        availableTokens++;
                                    }
                                }
                                let score = (availableTokens / (tokens.length)) || 0;
                                if (score > 0.5) {
                                    let intent = allMIFPostData[j].Post_ID + `_${allMIFPostData[j].Topic || "MIF"}` + "_intent_" + allMIFPostData[j].Subject.replaceAll(" ", "_")
                                    classifications.push({
                                        "intent": intent,
                                        "score": 1
                                    })
                                } else {
                                    data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showPostDetails" : "intent_action_showPostDetails", `I am sorry! I cannot find the posts on ${post_description.sourceText || "the question you asked"}`)
                                }
                            }
                        }
                        //Get Data for Query
                        else if (post_type && post_type.option == "query") {
                            for (let j = 0; j < allMIFQueryData.length; j++) {
                                let availableTokens = 0;
                                let context = filterString(allMIFQueryData[j].Subject) + filterString(allMIFQueryData[j].Question);
                                for (let i = 0; i < tokens.length; i++) {
                                    if (context && context.toLowerCase().includes(tokens[i].toLowerCase())) {
                                        availableTokens++;
                                    }
                                }
                                let score = (availableTokens / (tokens.length)) || 0;
                                if (score > 0.5) {
                                    let intent = allMIFQueryData[j].Post_ID + `_${allMIFQueryData[j].Topic || "MIF"}` + "_intent_" + allMIFQueryData[j].Subject.replaceAll(" ", "_")
                                    classifications.push({
                                        "intent": intent,
                                        "score": 1
                                    })
                                } else {
                                    data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showPostDetails" : "intent_action_showPostDetails", `I am sorry! I cannot find the queries on ${post_description.sourceText || "the question you asked"}`)
                                }
                            }
                        }//Get Data for Query
                        else if (post_field.option == "comment") {
                            for (let j = 0; j < allMIFData.length; j++) {
                                let availableTokens = 0;
                                let context = filterString(allMIFData[j].Comment);
                                for (let i = 0; i < tokens.length; i++) {
                                    if (context && context.toLowerCase().includes(tokens[i].toLowerCase())) {
                                        availableTokens++;
                                    }
                                }
                                let score = (availableTokens / (tokens.length)) || 0;
                                if (score > 0.5) {
                                    let intent = allMIFData[j].Post_ID + `_${allMIFData[j].Topic || "MIF"}` + "_intent_" + allMIFData[j].Subject.replaceAll(" ", "_")
                                    classifications.push({
                                        "intent": intent,
                                        "score": 1
                                    })
                                } else {
                                    data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showPostDetails" : "intent_action_showPostDetails", `I am sorry! I cannot find any comments on ${post_description.sourceText || "the question you asked"}`)
                                }
                            }
                        }
                    }
                }
                //Get Comments and Likes of a person
                else if (answered_by && post_field) {
                    //Get Comments
                    if (post_field.option == "comment") {
                        let commentCount = 0;
                        jsonArray.filter(async (c) => {
                            if (c && c.Comment_By && c.Comment_By.toLowerCase().includes(answered_by.sourceText.toLowerCase())) {
                                commentCount++;
                                let intent = c.Post_ID + `_${c.Topic || "MIF"}` + "_intent_" + c.Subject.replaceAll(" ", "_")
                                classifications.push({
                                    "intent": intent,
                                    "score": 1
                                })
                            } else {
                                data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showPostDetails" : "intent_action_showPostDetails", `I am sorry! I cannot find the comments by ${answered_by.sourceText || "this person"}`)
                            }
                        })
                        data.commentCount = commentCount
                        console.log("Comment Count: ", commentCount)
                    }
                }
                //Get Post and Queries of a person
                else if (answered_by && post_type) {
                    //Get Posts
                    if (post_type.option == "post") {
                        jsonArray.filter(async (c) => {
                            if (c && c.SubmittedBy && c.SubmittedBy.toLowerCase().trim().includes(answered_by.sourceText.toLowerCase().trim()) && c.FeedType.toLowerCase().includes("post")) {
                                let intent = c.Post_ID + `_${c.Topic || "MIF"}` + "_intent_" + c.Subject.replaceAll(" ", "_")
                                classifications.push({
                                    "intent": intent,
                                    "score": 1
                                })
                            } else {
                                data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showPostDetails" : "intent_action_showPostDetails", `I am sorry! I cannot find any posts by ${answered_by.sourceText || "this person"}`)
                            }
                        })
                    }
                    //Get Queries
                    else if (post_type.option == "query") {
                        jsonArray.filter(async (c) => {
                            if (c && c.SubmittedBy && c.SubmittedBy.toLowerCase().trim().includes(answered_by.sourceText.toLowerCase().trim()) && c.FeedType.toLowerCase().includes("query")) {
                                let intent = c.Post_ID + `_${c.Topic || "MIF"}` + "_intent_" + c.Subject.replaceAll(" ", "_")
                                classifications.push({
                                    "intent": intent,
                                    "score": 1
                                })
                            } else {
                                data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showPostDetails" : "intent_action_showPostDetails", `I am sorry! I cannot find any queries by ${answered_by.sourceText || "this person"}`)
                            }
                        })
                    }
                } else {
                    data = await generateActionDataResponse(data, "intent_action_showPostDetails", getRandomFallbackAnswers())
                }
            }
            data.classifications = classifications;
        });


        //-------------------------------------------showCountBasedOnPostType------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'How many @post_type are there in MIF?', "intent_showCountBasedOnPostType")
        manager.addDocument('en', 'How many @post_type in MIF?', "intent_showCountBasedOnPostType")
        manager.addDocument('en', 'What are the number of @post_type available in MIF?', "intent_showCountBasedOnPostType")
        manager.addDocument('en', 'How many posts of @post_type available in MIF?', "intent_showCountBasedOnPostType")
        manager.addDocument('en', 'How many posts by @post_type available in MIF?', "intent_showCountBasedOnPostType")


        manager.addDocument('en', 'How many queries are there in MIF?', "intent_showCountBasedOnPostType")
        manager.addDocument('en', 'How many posts are there in MIF?', "intent_showCountBasedOnPostType")

        //Actions
        manager.addAction("intent_showCountBasedOnPostType", 'showCountBasedOnPostType', [], async (data) => {
            let jsonArray = await getDistinctMIFBotData()
            if (data && data.entities.length > 0) {
                let entities = data.entities;
                let post_type = entities.filter((e) => {
                    return e.entity === "post_type"
                })[0]

                let numberOfPosts = jsonArray.filter((e) => {
                    return e.FeedType === "Post"
                })

                let numberOfQuery = jsonArray.filter((e) => {
                    return e.FeedType === "Query"
                })

                //Check for post category
                if (post_type.option === "post") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostType", numberOfPosts.length > 0 ? `I found ${numberOfPosts.length} posts in MIF` : "There are no posts available in MIF")
                }
                //Check for query category
                else if (post_type.option === "query") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostType", numberOfQuery.length > 0 ? `I found ${numberOfQuery.length} queries in MIF` : "There are no queries available in MIF")
                }
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showCountByPersonType------------------------------------------------------------


        manager.addDocument('en', 'How many @answered_by_person_type Post are there in MIF?', "intent_showCountByPersonType")
        manager.addDocument('en', 'How many COM Post are there in MIF?', "intent_showCountByPersonType")
        manager.addDocument('en', 'How many Expert Post are there in MIF?', "intent_showCountByPersonType")

        manager.addDocument('en', 'How many posts by @answered_by_person_type in MIF?', "intent_showCountByPersonType")
        manager.addDocument('en', 'How many posts by COM in MIF?', "intent_showCountByPersonType")
        manager.addDocument('en', 'How many posts by Experts in MIF?', "intent_showCountByPersonType")

        manager.addDocument('en', 'How many posts of @answered_by_person_type in MIF?', "intent_showCountByPersonType")
        manager.addDocument('en', 'How many posts of COM in MIF?', "intent_showCountByPersonType")
        manager.addDocument('en', 'How many posts of Experts in MIF?', "intent_showCountByPersonType")

        manager.addDocument('en', 'Any posts or queries by @answered_by_person_type in MIF?', "intent_showCountByPersonType")
        manager.addDocument('en', 'Any posts or queries by COM in MIF?', "intent_showCountByPersonType")
        manager.addDocument('en', 'Any posts or queries by Experts in MIF?', "intent_showCountByPersonType")

        manager.addDocument('en', 'Any @answered_by_person_type Post?', "intent_showCountByPersonType")
        manager.addDocument('en', 'Any Expert Post?', "intent_showCountByPersonType")
        manager.addDocument('en', 'Any COM Post?', "intent_showCountByPersonType")
        manager.addDocument('en', 'Any Expert queries?', "intent_showCountByPersonType")
        manager.addDocument('en', 'Any COM queries?', "intent_showCountByPersonType")

        //Actions
        manager.addAction("intent_showCountByPersonType", 'showCountByPersonType', [], async (data) => {
            let jsonArray = await getDistinctMIFBotData()
            if (data && data.entities.length > 0) {
                let entities = data.entities;
                let answered_by_person_type = entities.filter((e) => {
                    return e.entity === "answered_by_person_type"
                })[0]

                let numberOfCOMPost = jsonArray.filter((e) => {
                    return e.FeedType === "COM Post"
                })

                let numberOfExpertPost = jsonArray.filter((e) => {
                    e.FeedType === "Expert Post"
                })

                //Check for COM Posts category
                if (answered_by_person_type.option.includes("COM")) {
                    data = generateActionDataResponse(data, "intent_action_showCountByPersonType", numberOfCOMPost.length > 0 ? `I found ${numberOfCOMPost.length} COM Posts in MIF` : "There are no COM posts available in MIF")
                }
                //Check for Expert Posts category
                else if (answered_by_person_type.option.includes("Expert")) {
                    data = generateActionDataResponse(data, "intent_action_showCountByPersonType", numberOfExpertPost.length > 0 ? `I found ${numberOfExpertPost.length} Expert Posts in MIF` : "There are no Expert posts available in MIF")
                }
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showCountBasedOnPostTypeStatus------------------------------------------------------------

        //Documents
        manager.addDocument('en', '@post_type are valid or invalid?', "intent_showCountBasedOnPostTypeStatus")
        manager.addDocument('en', '@post_type are active or inactive?', "intent_showCountBasedOnPostTypeStatus")
        manager.addDocument('en', 'What are the number of @post_type that are valid or invalid in MIF?', "intent_showCountBasedOnPostTypeStatus")
        manager.addDocument('en', 'What is the status of @post_type?', "intent_showCountBasedOnPostTypeStatus")

        //Actions
        manager.addAction("intent_showCountBasedOnPostTypeStatus", 'showCountBasedOnPostTypeStatus', [], async (data) => {
            classifications = []
            let jsonArray = await getDistinctMIFBotData()
            if (data && data.entities.length > 0) {
                let entities = data.entities;
                let post_type = entities.filter((e) => {
                    return e.entity === "post_type"
                })[0]

                let numberOfPosts = jsonArray.filter((e) => {
                    return e.FeedType === "Post"
                })
                let numberOfPostsActive = jsonArray.filter((e) => {
                    return e.FeedType === "Post" && e.IsActive == 1
                })

                let numberOfQuery = jsonArray.filter((e) => {
                    return e.FeedType === "Query"
                })
                let numberOfQueryActive = jsonArray.filter((e) => {
                    return e.FeedType === "Query" && e.IsActive == 1
                })

                let numberOfCOMPost = jsonArray.filter((e) => {
                    return e.FeedType === "COM Post"
                })
                let numberOfCOMPostActive = jsonArray.filter((e) => {
                    return e.FeedType === "COM Post" && e.IsActive == 1
                })

                let numberOfExpertPost = jsonArray.filter((e) => {
                    e.FeedType === "Expert Post"
                })
                let numberOfExpertPostActive = jsonArray.filter((e) => {
                    e.FeedType === "Expert Post" && e.IsActive == 1
                })
                
                let post_description = entities.filter((e) => {
                    return e.entity === "post_description"
                })[0]
                //If post description is present
                if (post_description) {
                    let allMIFData = await getMIFData();
                    let allMIFDistinctData = [...new Map(allMIFData.map(item => [item["Post_ID"], item])).values()]
                    let allMIFPostData = allMIFDistinctData.filter((e) => {
                        return e.FeedType == "Post"
                    })
                    let allMIFQueryData = allMIFDistinctData.filter((e) => {
                        return e.FeedType == "Query"
                    })
                    let tokens = await tokenize(post_description.sourceText)
                    if (tokens.length > 0) {
                        //Get Data for Post
                        if (post_type && post_type.option == "post") {
                            for (let j = 0; j < allMIFPostData.length; j++) {
                                let availableTokens = 0;
                                let context = filterString(allMIFPostData[j].Subject) + filterString(allMIFPostData[j].Question);
                                for (let i = 0; i < tokens.length; i++) {
                                    if (context && context.toLowerCase().includes(tokens[i].toLowerCase())) {
                                        availableTokens++;
                                    }
                                }
                                let score = (availableTokens / (tokens.length)) || 0;
                                if (score > 0.5) {
                                    let intent = allMIFPostData[j].Post_ID + `_${allMIFPostData[j].Topic || "MIF"}` + "_intent_" + allMIFPostData[j].Subject.replaceAll(" ", "_")
                                    classifications.push({
                                        "intent": intent,
                                        "score": 1
                                    })
                                } else {
                                    data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showPostDetails" : "intent_action_showPostDetails", `I am sorry! I cannot find the posts on ${post_description.sourceText || "the question you asked"}`)
                                }
                            }
                        }
                        //Get Data for Query
                        else if (post_type && post_type.option == "query") {
                            for (let j = 0; j < allMIFQueryData.length; j++) {
                                let availableTokens = 0;
                                let context = filterString(allMIFQueryData[j].Subject) + filterString(allMIFQueryData[j].Question);
                                for (let i = 0; i < tokens.length; i++) {
                                    if (context && context.toLowerCase().includes(tokens[i].toLowerCase())) {
                                        availableTokens++;
                                    }
                                }
                                let score = (availableTokens / (tokens.length)) || 0;
                                if (score > 0.5) {
                                    let intent = allMIFQueryData[j].Post_ID + `_${allMIFQueryData[j].Topic || "MIF"}` + "_intent_" + allMIFQueryData[j].Subject.replaceAll(" ", "_")
                                    classifications.push({
                                        "intent": intent,
                                        "score": 1
                                    })
                                } else {
                                    data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showPostDetails" : "intent_action_showPostDetails", `I am sorry! I cannot find the queries on ${post_description.sourceText || "the question you asked"}`)
                                }
                            }
                        }//Get Data for Query
                        else if (post_field.option == "comment") {
                            for (let j = 0; j < allMIFData.length; j++) {
                                let availableTokens = 0;
                                let context = filterString(allMIFData[j].Comment);
                                for (let i = 0; i < tokens.length; i++) {
                                    if (context && context.toLowerCase().includes(tokens[i].toLowerCase())) {
                                        availableTokens++;
                                    }
                                }
                                let score = (availableTokens / (tokens.length)) || 0;
                                if (score > 0.5) {
                                    let intent = allMIFData[j].Post_ID + `_${allMIFData[j].Topic || "MIF"}` + "_intent_" + allMIFData[j].Subject.replaceAll(" ", "_")
                                    classifications.push({
                                        "intent": intent,
                                        "score": 1
                                    })
                                } else {
                                    data = await generateActionDataResponse(data, classifications.length > 0 ? "intent_showPostDetails" : "intent_action_showPostDetails", `I am sorry! I cannot find any comments on ${post_description.sourceText || "the question you asked"}`)
                                }
                            }
                        }
                    }
                }

                //Check for post category
                else if (post_type.option === "post") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostTypeStatus", numberOfPosts.length > 0 ? `There are ${numberOfPosts.length} posts in MIF where ${numberOfPostsActive.length} are active & ${(numberOfPosts.length - numberOfPostsActive.length)} posts are inactive` : "There are no posts available in MIF")
                }
                //Check for query category
                else if (post_type.option === "query") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostTypeStatus", numberOfQuery.length > 0 ? `There are ${numberOfQuery.length} queries in MIF where ${numberOfQueryActive.length} are active & ${(numberOfQuery.length - numberOfQueryActive.length)} queries are inactive` : "There are no queries available in MIF")
                }
                //Check for COM Posts category
                else if (post_type.option === "COM Post") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostTypeStatus", numberOfCOMPost.length > 0 ? `There are ${numberOfCOMPost.length} COM posts in MIF where ${numberOfCOMPostActive.length} are active & ${(numberOfCOMPost.length - numberOfCOMPostActive.length)} COM posts are inactive` : "There are no COM posts available in MIF")
                }
                //Check for Expert Posts category
                else if (post_type.option === "Expert Post") {
                    data = generateActionDataResponse(data, "intent_action_showCountBasedOnPostTypeStatus", numberOfExpertPost.length > 0 ? `There are ${numberOfExpertPost.length} Expert posts in MIF where ${numberOfExpertPostActive.length} are active & ${(numberOfExpertPost.length - numberOfExpertPostActive.length)} Expert posts are inactive` : "There are Expert posts available in MIF")
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
                        return !e.Post_ID.toString().includes("Bot") && e.QueryNumber.toString() == post_number.sourceText.replace(/[^0-9]/g, "");
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
                if (categoryList.length > 0) {
                    let categoryString = `There are ${categoryList.length} categories in MIF.`
                    categoryString += " Below are the list of categories:\n"
                    categoryString += "<ul style='padding: revert; '>"
                    categoryList.map((c) => {
                        categoryString += "<li>"
                        categoryString += `${c.Name}`
                        categoryString += "</li>"
                    })
                    categoryString += "</ul>"
                    data = generateActionDataResponse(data, "intent_action_showListOfCategories", categoryString)
                } else {
                    data = generateActionDataResponse(data, "intent_action_showListOfCategories", "There are no categories available in MIF")
                }
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
                if (expertList.length > 0) {
                    let expertString = `There are ${expertList.length} experts in MIF.`
                    expertString += " Below are the list of experts:\n"
                    expertString += "<ul style='padding: revert; '>"
                    expertList.map((e) => {
                        expertString += "<li>"
                        expertString += `${e.Name} (${e.Category})`
                        expertString += "</li>"
                    })
                    expertString += "</ul>"
                    data = generateActionDataResponse(data, "intent_action_showListOfExperts", expertString)
                } else {
                    data = generateActionDataResponse(data, "intent_action_showListOfExperts", "There are no experts available in MIF")
                }
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
                if (APSOsList.length > 0) {
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
                } else {
                    data = generateActionDataResponse(data, "intent_action_showListOfAPSOs", "There are no APSO's available in MIF")
                }
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
                if (weeklyQuizList.length > 0) {
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
                } else {
                    data = generateActionDataResponse(data, "intent_action_showWeeklyQuizAnswerList", "I am not able to find anyone who answered weekly quiz")
                }
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
                if (InformationBasketsList.length > 0) {
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
                } else {
                    data = generateActionDataResponse(data, "intent_action_showNameOfTheLinks", "There are no links available in Information baskets")
                }
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
                let TechBytesList = await getTechBytesHistory();
                if (TechBytesList.length > 0) {
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
                } else {
                    data = generateActionDataResponse(data, "intent_action_showListOfTechBytes", "I am not able to find any tech bytes in MIF")
                }
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showListOfLatestTechBytes------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Give me the list of latest Tech Bytes', "intent_showListOfLatestTechBytes")
        manager.addDocument('en', 'Provide me the list of latest Tech Bytes', "intent_showListOfLatestTechBytes")
        manager.addDocument('en', 'What are the latest Tech bytes in MIF?', "intent_showListOfLatestTechBytes")
        manager.addDocument('en', 'How many latest tech bytes are there in MIF?', "intent_showListOfLatestTechBytes")

        //Actions
        manager.addAction("intent_showListOfLatestTechBytes", 'showListOfLatestTechBytes', [], async (data) => {
            if (data) {
                let TechBytesList = await getTechBytes();
                if (TechBytesList.length > 0) {
                    let TechBytesString = `There are ${TechBytesList.length} latest Tech Bytes in MIF.`
                    TechBytesString += " Below are the list of Tech bytes:\n"
                    TechBytesString += "<ul style='padding: revert; '>"
                    TechBytesList.map((e) => {
                        TechBytesString += "<li>"
                        TechBytesString += `${e.Name}`
                        TechBytesString += "</li>"
                    })
                    TechBytesString += "</ul>"
                    data = generateActionDataResponse(data, "intent_action_showListOfLatestTechBytes", TechBytesString)
                } else {
                    data = generateActionDataResponse(data, "intent_action_showListOfLatestTechBytes", "I am not able to find any latest tech bytes in MIF")
                }
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
                if (nodalDTEList.length > 0) {
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
                } else {
                    data = generateActionDataResponse(data, "intent_action_showListOfNodalDTE", "There are no Nodal DTE's available in MIF")
                }
            }
            data.classifications = classifications;
        })

        //-------------------------------------------showAnnouncements------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'Give me the list of Announcements', "intent_showAnnouncements")
        manager.addDocument('en', 'Give me the list of latest Announcements', "intent_showAnnouncements")
        manager.addDocument('en', 'What are the announcements available in MIF?', "intent_showAnnouncements")

        //Actions
        manager.addAction("intent_showAnnouncements", 'showAnnouncements', [], async (data) => {
            if (data) {
                let announcementsList = await getAnnouncements();

                if (announcementsList.length > 0) {
                    let announcementsString = `I found ${announcementsList.length} latest announcement in MIF.`
                    announcementsString += " Below are the details:\n"
                    announcementsString += "<ul style='padding: revert; '>"
                    announcementsList.map((e) => {
                        announcementsString += "<li>"
                        announcementsString += `<b>Announcement: </b>${e.Name}<br/>`
                        announcementsString += `<b>Description: </b>${e.Description}`
                        announcementsString += "</li>"
                    })
                    announcementsString += "</ul>"
                    data = generateActionDataResponse(data, "intent_action_showAnnouncements", announcementsString)
                } else {
                    data = generateActionDataResponse(data, "intent_action_showAnnouncements", "I am not able to find any latest announcements in MIF")
                }
            }
            data.classifications = classifications;
        })


        //-------------------------------------------showAPSOsPosts------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'How many posts of APSOs?', "intent_showAPSOsPosts")
        manager.addDocument('en', 'What is the count of posts that are posted by APSOs?', "intent_showAPSOsPosts")

        //Actions
        manager.addAction("intent_showAPSOsPosts", 'showAPSOsPosts', [], async (data) => {
            if (data) {
                let APSOsPostList = await getAPSOsPosts();

                if (APSOsPostList[0].APSOsFeedCount > 0) {
                    let APSOsString = `There are ${APSOsPostList[0].APSOsFeedCount} posts by APSO's in MIF.`
                    data = generateActionDataResponse(data, "intent_action_showAPSOsPosts", APSOsString)
                } else {
                    data = generateActionDataResponse(data, "intent_action_showAPSOsPosts", "There are no posts by APSOs in MIF")
                }

            }
            data.classifications = classifications;
        })




        //-------------------------------------------showAttachmentsInIS------------------------------------------------------------

        //Documents
        manager.addDocument('en', 'How many attachment or pdf are there in information section?', "intent_showAttachmentsInIS")
        manager.addDocument('en', 'Give me the list of attachment or pdf that are available in information section', "intent_showAttachmentsInIS")

        //Actions
        manager.addAction("intent_showAttachmentsInIS", 'showAttachmentsInIS', [], async (data) => {
            if (data) {
                let attachmentsList = await getAttachmentsInIS();

                if (attachmentsList.length > 0) {
                    let attachmentsString = `There are ${attachmentsList.length} attachments in Information Basket.`
                    data = generateActionDataResponse(data, "intent_action_showAnnouncements", attachmentsString)
                } else {
                    data = generateActionDataResponse(data, "intent_action_showAnnouncements", "I am not able to find any attachments in Information Basket")
                }
            }
            data.classifications = classifications;
        })


        //-------------------------------------------showPersonTypeLikePost------------------------------------------------------------

        //Documents

        manager.addDocument('en', 'How many post and query COM liked?', "intent_showPersonTypeLikePost")
        manager.addDocument('en', 'How many post and query Expert liked?', "intent_showPersonTypeLikePost")
        manager.addDocument('en', 'How many post and query APSOs liked?', "intent_showPersonTypeLikePost")

        manager.addDocument('en', 'How many likes by COM?', "intent_showPersonTypeLikePost")
        manager.addDocument('en', 'How many likes by Experts?', "intent_showPersonTypeLikePost")
        manager.addDocument('en', 'How many likes by APSOs?', "intent_showPersonTypeLikePost")

        manager.addDocument('en', 'Give me the count of number of posts or queries that COM liked', "intent_showPersonTypeLikePost")
        manager.addDocument('en', 'Give me the count of number of posts or queries that Experts liked', "intent_showPersonTypeLikePost")
        manager.addDocument('en', 'Give me the count of number of posts or queries that APSOs liked', "intent_showPersonTypeLikePost")

        manager.addDocument('en', 'How many post and query @answered_by_person_type @post_field?', "intent_showPersonTypeLikePost")
        manager.addDocument('en', 'How many @post_field by @answered_by_person_type?', "intent_showPersonTypeLikePost")
        manager.addDocument('en', 'Give me the count of number of posts or queries that @answered_by_person_type @post_field', "intent_showPersonTypeLikePost")

        //Actions
        manager.addAction("intent_showPersonTypeLikePost", 'showPersonTypeLikePost', [], async (data) => {
            if (data) {
                if (data && data.entities.length > 0) {
                    classifications.push({
                        "intent": "intent_showPersonTypeLikePost",
                        "score": 1
                    })
                    let entities = data.entities;
                    let answered_by_person_type = entities.filter((e) => {
                        return e.entity === "answered_by_person_type"
                    })[0]
                    let post_field = entities.filter((e) => {
                        return e.entity === "post_field"
                    })[0]

                    let mifData = await getDistinctMIFBotData();
                    let numberCOMLikedList = await mifData.filter((e) => {
                        return e.Feed_COM_LIKE == 1
                    })
                    let numberExpertLikedList = await mifData.filter((e) => {
                        return e.IsExpertLiked == 1
                    })
                    let numberAPSOLikedList = await mifData.filter((e) => {
                        return e.IsAPSOsLiked == 1
                    })

                    let numberCOMCommentedList = await mifData.filter((e) => {
                        return e.IsCOMCommented == 1
                    })
                    let numberExpertCommentedList = await mifData.filter((e) => {
                        return e.IsExpertCommented == 1
                    })
                    let numberAPSOCommentedList = await mifData.filter((e) => {
                        return e.IsAPSOsCommented == 1
                    })

                    if (answered_by_person_type && post_field) {
                        //For Likes
                        if (post_field.option == "likes") {
                            if (answered_by_person_type.option == "COM" || answered_by_person_type.sourceText.toLowerCase().includes("com")) {
                                data = generateActionDataResponse(data, "intent_action_showPersonTypeLikePost", numberCOMLikedList.length > 0 ? `There are ${numberCOMLikedList.length} likes by COM in MIF` : "There are no likes by COM in MIF")
                            } else if (answered_by_person_type.option == "Expert" || answered_by_person_type.sourceText.toLowerCase().includes("expert")) {
                                data = generateActionDataResponse(data, "intent_action_showPersonTypeLikePost", numberExpertLikedList.length > 0 ? `There are ${numberExpertLikedList.length} likes by Experts in MIF` : "There are no likes by Experts in MIF")
                            } else if (answered_by_person_type.option == "APSOs" || answered_by_person_type.sourceText.toLowerCase().includes("apso")) {
                                data = generateActionDataResponse(data, "intent_action_showPersonTypeLikePost", numberAPSOLikedList.length > 0 ? `There are ${numberAPSOLikedList.length} likes by APSOs in MIF` : "There are no likes by APSOs in MIF")
                            }
                        }
                        //For Comments
                        else if (post_field.option == "comment") {
                            if (answered_by_person_type.option == "COM" || answered_by_person_type.sourceText.toLowerCase().includes("com")) {
                                data = generateActionDataResponse(data, "intent_action_showPersonTypeLikePost", numberCOMCommentedList.length > 0 ? `There are ${numberCOMCommentedList.length} comments by COM in MIF` : "There are no comments by COM in MIF")
                            } else if (answered_by_person_type.option == "Expert" || answered_by_person_type.sourceText.toLowerCase().includes("expert")) {
                                data = generateActionDataResponse(data, "intent_action_showPersonTypeLikePost", numberExpertCommentedList.length > 0 ? `There are ${numberExpertCommentedList.length} comments by Experts in MIF` : "There are no comments by Experts in MIF")
                            } else if (answered_by_person_type.option == "APSOs" || answered_by_person_type.sourceText.toLowerCase().includes("apso")) {
                                data = generateActionDataResponse(data, "intent_action_showPersonTypeLikePost", numberAPSOCommentedList.length > 0 ? `There are ${numberAPSOCommentedList.length} comments by APSOs in MIF` : "There are no comments by APSOs in MIF")
                            }
                        }

                    } else {
                        data = generateActionDataResponse(data, "intent_action_showPersonTypeLikePost", getRandomFallbackAnswers())
                    }

                }
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
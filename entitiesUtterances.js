let {
    getListOfCategories,
    getUtterances
} = require("./sql");

async function loadEntities(manager) {
    let categories = await getListOfCategories();
    categories = categories.map((c) => {
        return c.Name
    })

    //Entities

    manager.addNerAfterLastCondition('en', 'answered_by', 'by');
    manager.addNerAfterLastCondition('en', 'answered_by', 'of');
    manager.addNerAfterLastCondition('en', 'post_number', 'in');
    manager.addNerAfterLastCondition('en', 'post_number', 'post');
    manager.addNerAfterLastCondition('en', 'post_number', 'no');
    manager.addNerAfterLastCondition('en', 'post_number', 'number');
    manager.addNerAfterLastCondition('en', 'post_description', 'on');
    manager.addNerAfterLastCondition('en', 'post_description', 'to');

    manager.addNerRuleOptionTexts('en', 'post_field', 'comment', ["Comment", "comment", "Comments", "comments", "Commented", "commented", "remark", "remarks"]);
    manager.addNerRuleOptionTexts('en', 'post_field', 'likes', ["Likes", "likes", "Like", "like", "Liked", "liked"]);
    manager.addNerRuleOptionTexts('en', 'post_field', 'views', ["Views", "views", "view", "View", "Viewed", "viewed"]);

    manager.addNerRuleOptionTexts('en', 'post_type', 'post', ["Posts", "post", "posts", "Post"]);
    manager.addNerRuleOptionTexts('en', 'post_type', 'query', ["Query", "query", "Queries", "queries"]);

    manager.addNerRuleOptionTexts('en', 'answered_by_person_type', 'COM', ["COM", "com"]);
    manager.addNerRuleOptionTexts('en', 'answered_by_person_type', 'Expert', ["expert", "experts", "Subject Matter Expert"]);
    manager.addNerRuleOptionTexts('en', 'answered_by_person_type', 'APSOs', ["apsos", "APSOs", "APSO's", "apso's"]);

    manager.addNerRuleOptionTexts('en', 'category', 'category', categories);
}

async function loadUtterances(manager) {
    let utterances = await getUtterances()
    await utterances.map((u) => {
        manager.addDocument(u.Language || "en", u.Utterance || "", u.Intent || "None");
    })
}

module.exports = {
    loadEntities,
    loadUtterances
}
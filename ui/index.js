const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

let HOST = window.location.origin;

// Utils
function get(selector, root = document) {
    return root.querySelector(selector);
}

document.getElementById("msg").addEventListener("focus", function () {

    document.onkeydown = (e) => {
        e = e || window.event;
        let queries = JSON.parse(localStorage.getItem("queries")) || []
        let currentQuery = localStorage.getItem("currentQuery") || (queries.length - 1)
        currentQuery = parseInt(currentQuery)
        if (e.keyCode === 38) {
            if (currentQuery > 0) {
                currentQuery--
                localStorage.setItem("currentQuery", currentQuery)
            }

            msgerInput.value = queries[currentQuery]
        }
        else if (e.keyCode === 40) {
            if (currentQuery < (queries.length - 1)) {
                currentQuery++
                localStorage.setItem("currentQuery", currentQuery)
            }

            msgerInput.value = queries[currentQuery]
        }

    };
});


angular.module("myapp", [])
    .controller("HelloController", function ($scope, $http) {
        // Icons made by Freepik from www.flaticon.com
        const BOT_IMG = "./assets/bot_icon.gif";
        const PERSON_IMG = "./assets/user_icon.gif";
        const TYPING_BOT = "./assets/typing.gif";
        const BOT_NAME = "MIF Bot";
        const PERSON_NAME = "User";
        $scope.time = formatDate(new Date());

        $scope.train_button = "Train"

        $scope.submit = () => {
            console.log("In Submit")

            const msgText = msgerInput.value;
            if (!msgText) return;
            console.log(msgText)

            let queries = JSON.parse(localStorage.getItem("queries")) || []
            queries.push(msgText)
            localStorage.setItem("queries", JSON.stringify(queries));
            localStorage.setItem("currentQuery", (queries.length - 1))

            appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
            msgerInput.value = "";

            showLoader("left", BOT_IMG)
            botResponse(msgText);
        }


        $scope.train = () => {
            console.log("In Training...")
            $scope.train_button = "Training..."
            $http({
                method: 'GET',
                url: `${HOST}/train`
            }).then(function successCallback(response) {
                let status = response.data.status;
                if (status == 200) {
                    $scope.train_button = "Train"
                    alert("Model Trained successfully!")
                } else {
                    alert("Error in training model")
                }
            }, function errorCallback(response) {
                console.log(response)
                alert("Error in training model")
            });
        }

        function appendMessage(name, img, side, text) {
            //   Simple solution for small apps
            const msgHTML = `
            <div class="msg ${side}-msg">
              <div class="msg-img" style="background-image: url(${img})"></div>
        
              <div class="msg-bubble">
                <div class="msg-info">
                  <div class="msg-info-name">${name}</div>
                  <div class="msg-info-time">${formatDate(new Date())}</div>
                </div>
        
                <div class="msg-text">${text}</div>
              </div>
            </div>
          `;

            msgerChat.insertAdjacentHTML("beforeend", msgHTML);
            msgerChat.scrollTop += 500;
        }

        function botResponse(userMessage) {
            $http({
                method: 'GET',
                url: `${HOST}/ask/${userMessage}`
            }).then(function successCallback(response) {
                console.log(response.data.data);

                hideLoader()
                let data = response.data.data;
                let botAnswer = ""
                let groups = []
                if (data[0].isGreet) {
                    botAnswer += data[0].answer_summary
                    console.log(botAnswer)
                    appendMessage(BOT_NAME, BOT_IMG, "left", botAnswer);
                } else {
                    let totalComments = 0;
                    data.map((d) => {
                        groups.push(d.props)
                        totalComments += d.props.Comments
                    })
                    console.log(groups)
                    let groupedData = groupBy(groups, "FeedType")
                    let properties = Object.keys(groupedData)
                    botAnswer += "<p>I have found ";
                    for (let index = 0; index < properties.length; index++) {
                        botAnswer += `${groupedData[properties[index]].length} ${properties[index]}, `
                    }
                    botAnswer += totalComments > 0 ? ` and ${totalComments} comments ` : ""
                    botAnswer += `related to your question, here are the details:</p>`

                    // botAnswer += `I have found ${data.length} posts/queries & ${data.length} comments related to your query, here are the details: <br><br>`
                    for (let i = 0; i < data.length; i++) {
                        botAnswer += data[i].props.Posted_By !== "NULL" ? `<br><p>As posted by <b>${data[i].props.Posted_By}</b> ` : ""
                        botAnswer += data[i].props.Posted_On !== "NULL" && data[i].props.Posted_On !== "Invalid date" ? `on <b>${data[i].props.Posted_On}</b>, </p>` : "</p>";
                        botAnswer += `<br><p><b>Subject: </b> ${data[i].props.Subject}</p>`
                        botAnswer += `<br><p><b>${data[i].props.FeedType}: </b> ${data[i].props.Question}</p><br>`

                        if (data[i].props.Comments > 0) {
                            botAnswer += `<p>As commented by <b>${data[i].props.Comment_By}</b> `
                            botAnswer += `on <b>${data[i].props.Commented_On}</b>, </p>`;
                        }

                        botAnswer += `<br><b>Comment: </b>"${data[i].answer_summary}"<br>`

                        botAnswer += `<br><span>Click on the below link to view the post</span> <br> <a href="${data[i].props.post_url !== "null" ? data[i].props.post_url : "#"}" target="_blank"> View Post</a>`

                        botAnswer += `
                        <div class="widgets_div">
                            <div class="icon_div">
                                <span><img src="./assets/thumbs-up.png"></img></span>
                            </div>
                            <div class="text_div">
                                <span>${data[i].props.Likes} Likes</span><br>
                                <span></span>
                            </div>
                            <div class="icon_div">
                                <span><img src="./assets/speech-bubble.png"></img></span>
                            </div>
                            <div class="text_div">
                                <span>${data[i].props.Comments} Comments</span><br>
                                <span></span>
                            </div>
                        </div>
                        <br>`
                        botAnswer += i !== (data.length - 1) ? `<br>` : ``
                        // groups.push(data[i].props)
                    }
                    appendMessage(BOT_NAME, BOT_IMG, "left", botAnswer);
                }

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                console.log(response)
                hideLoader()
                appendMessage(BOT_NAME, BOT_IMG, "left", "Error in sending message. Please connect with Administrator");
            });
        }

        let groupBy = function (xs, key) {
            return xs.reduce(function (rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        };

        function showLoader() {
            $scope.isTyping = true;
        }

        function hideLoader() {
            $scope.isTyping = false;
        }

        function formatDate(date) {
            const h = "0" + date.getHours();
            const m = "0" + date.getMinutes();

            return `${h.slice(-2)}:${m.slice(-2)}`;
        }

        function random(min, max) {
            return Math.floor(Math.random() * (max - min) + min);
        }
    });
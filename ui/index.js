const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

let HOST = "http://localhost:3000"

// Utils
function get(selector, root = document) {
    return root.querySelector(selector);
}

angular.module("myapp", [])
    .controller("HelloController", function ($scope, $http) {
        // Icons made by Freepik from www.flaticon.com
        const BOT_IMG = "./assets/bot_icon.gif";
        const PERSON_IMG = "./assets/user_icon.gif";
        const BOT_NAME = "Bot";
        const PERSON_NAME = "User";
        $scope.time = formatDate(new Date());

        $scope.submit = () => {
            console.log("In Submit")
            const msgText = msgerInput.value;
            if (!msgText) return;
            console.log(msgText)

            appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
            msgerInput.value = "";

            botResponse(msgText);
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

                let data = response.data.data;
                let botAnswer = ""
                if (data[0].isBot) {
                    botAnswer += data[0].answer_summary
                    console.log(botAnswer)
                    appendMessage(BOT_NAME, BOT_IMG, "left", botAnswer);
                } else {
                    botAnswer += `I have found ${data.length} post(s)/queries related to your query, here are the details: <br><br>`
                    for (let i = 0; i < data.length; i++) {
                        botAnswer += `<p>As posted by <b>${data[i].jsonString.Answered_By !== "Bot" ? data[i].jsonString.Answered_By : "Bot"}</b> `
                        botAnswer += data[i].jsonString.post_date !== "null" ? `on <b>${data[i].jsonString.post_date}</b>, </p>` : "</p>";
                        botAnswer += `<br><p>"${data[i].answer_summary}"</p>`

                        botAnswer += `<br><span>Click on the below link to view the post</span> <br> <a href="${data[i].jsonString.post_url !== "null" ? data[i].jsonString.post_url : "#"}" target="_blank"> View Post</a>`

                        botAnswer += `
                        <div class="widgets_div">
                            <div class="icon_div">
                                <span><img src="./assets/thumbs-up.png"></img></span>
                            </div>
                            <div class="text_div">
                                <span>${data[i].jsonString.likes} Likes</span><br>
                                <span></span>
                            </div>
                            <div class="icon_div">
                                <span><img src="./assets/speech-bubble.png"></img></span>
                            </div>
                            <div class="text_div">
                                <span>${data[i].jsonString.comments} Comments</span><br>
                                <span></span>
                            </div>
                        </div>
                        <br>`
                        botAnswer += i !== (data.length - 1) ? `<br>` : ``
                    }
                    appendMessage(BOT_NAME, BOT_IMG, "left", botAnswer);
                }

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                appendMessage(BOT_NAME, BOT_IMG, "left", "Error in sending message. Please connect with Administrator");
            });
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
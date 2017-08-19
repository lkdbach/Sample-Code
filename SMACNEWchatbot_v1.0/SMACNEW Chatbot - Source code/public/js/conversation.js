// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/
/* global document, window*/
/* exported ConversationPanel*/
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

var initial = true;

var ConversationPanel = (function () {
  var settings = {
    selectors: {
      chatBox: '#scrollingChat',
      fromUser: '.from-user',
      fromWatson: '.from-watson',
      latest: '.latest',
      textInputLocation: '#textInputLocation',
      loginSection: '#loginSection',
      conversationSection: '#conversationSection',
      textInputOne: '#textInputOne'
    },
    authorTypes: {
      user: 'user',
      watson: 'watson'
    }
  };

  // Publicly accessible methods defined
  return {
    init: init,
    inputKeyDown: inputKeyDown,
    submitInputOnClicked: submitInputOnClicked
  };

  // Initialize the module
  function init() {
    var http = new XMLHttpRequest();
    $("#textInputOne").prop("disabled", false);
    $("#textInputOne").prop("placeholder", "Start typing...");
    $("#textInputOne").prop("maxlength", "200");
    $(".inputBefore").removeClass("ended");
    http.open('GET', "/reset", true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function () {
      if (http.readyState === 4) {
        Api.sendRequest('Hello', null);
        initial = false;
      }
    };
    http.send(null);
    chatUpdateSetup();
  }

  // Set up callbacks on payload setters in Api module
  // This causes the displayMessage function to be called when messages are sent / received
  function chatUpdateSetup() {
    var currentRequestPayloadSetter = Api.setRequestPayload;
    Api.setRequestPayload = function (newPayloadStr) {
      currentRequestPayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.user);
    };

    var currentResponsePayloadSetter = Api.setResponsePayload;
    Api.setResponsePayload = function (newPayloadStr) {
      currentResponsePayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.watson);
    };
  }

  // Display a user or Watson message that has just been sent/received
  function displayMessage(newPayload, typeValue) {
    if (initial)
      return;
    var isUser = isUserMessage(typeValue);
    var textExists = (newPayload.input && newPayload.input.text)
      || (newPayload.output && newPayload.output.text);
    if (isUser !== null && textExists) {
      // Create new message DOM element
      var messageDivs = buildMessageDomElements(newPayload, isUser);
      var chatBoxElement = document.querySelector(settings.selectors.chatBox);
      var previousLatest = chatBoxElement.querySelectorAll((isUser
          ? settings.selectors.fromUser : settings.selectors.fromWatson)
        + settings.selectors.latest);
      // Previous "latest" message is no longer the most recent
      if (previousLatest) {
        Common.listForEach(previousLatest, function (element) {
          element.classList.remove('latest');
        });
      }

      messageDivs.forEach(function (currentDiv) {
        chatBoxElement.appendChild(currentDiv);
        // Class to start fade in animation
        currentDiv.classList.add('load');
      });
      // Move chat to the most recent messages when new messages are added
      scrollToChatBottom();
    }
  }

  // Checks if the given typeValue matches with the user "name", the Watson "name", or neither
  // Returns true if user, false if Watson, and null if neither
  // Used to keep track of whether a message was from the user or Watson
  function isUserMessage(typeValue) {
    if (typeValue === settings.authorTypes.user) {
      return true;
    } else if (typeValue === settings.authorTypes.watson) {
      return false;
    }
    return null;
  }

  // Constructs new DOM element from a message payload
  function buildMessageDomElements(newPayload, isUser) {
    var currentText = isUser ? newPayload.input.text : newPayload.output.text;
    if (Array.isArray(currentText)) {
      //currentText = currentText.join('<br/>');
      //FIX for empty string at UI
      currentText = currentText.filter(function (val) {
        return val;
      }).join('<br/>');
    }
    console.log(newPayload);
    var messageArray = [];
    var summary = '&nbsp';
    if (typeof(newPayload.context) !== undefined && !isUser) {
      summary = newPayload.context.summary;
    }

    if (currentText && (isUser || (!isUser && currentText != "&nbsp"))) {
      var messageJson = {
        // <div class='segments'>
        'tagName': 'div',
        'classNames': ['segments'],
        'children': [{
          // <div class='from-user/from-watson latest'>
          'tagName': 'div',
          'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
          'children': [{
            'tagName': 'div',
            'classNames': ['summary'],
            'text': summary
          }, {
            // <div class='message-inner'>
            'tagName': 'div',
            'classNames': ['message-inner'],
            'children': [{
              // <p>{messageText}</p>
              'tagName': 'p',
              'text': currentText
            }]
          }, {
            // <div class='message-time'>
            'tagName': 'div',
            'classNames': ['message-time'],
            'children': [{
              // <p>{messageText}</p>
              'tagName': 'span',
              'text': '<i class="fa fa-clock-o" aria-hidden="true"></i> ' + $.format.date(new Date(), "ddd, MMM D yyyy - h:mm")
            }]
          }

          ]
        }]
      };
      messageArray.push(Common.buildDomElement(messageJson));
    }

    return messageArray;
  }

  // Scroll to the bottom of the chat window (to the most recent messages)
  // Note: this method will bring the most recent user message into view,
  //   even if the most recent message is from Watson.
  //   This is done so that the "context" of the conversation is maintained in the view,
  //   even if the Watson message is long.
  function scrollToChatBottom() {
    var scrollingChat = document.querySelector('#scrollingChat');

    // Scroll to the latest message sent by the user
    var scrollEl = scrollingChat.querySelector(settings.selectors.fromUser + settings.selectors.latest);
    if (scrollEl) {
      scrollingChat.scrollTop = scrollEl.offsetTop;
    }
  }

  // Handles the submission of input
  function inputKeyDown(event, inputBox) {
    // Submit on enter key, dis-allowing blank messages
    if (event.keyCode === 13 && inputBox.value) {
      // Retrieve the context from the previous server response    
      var context;
      var latestResponse = Api.getResponsePayload();
      if (latestResponse) {
        context = latestResponse.context;
      }

      // Send the user message    
      Api.sendRequest(inputBox.value, context);

      //hide pincode on html
      var responseText = $("#scrollingChat .segments:eq(-2) .message-inner").text();
      if (responseText.split('.').length > 1) {
        responseText = responseText.split('.')[1].trim();
      }
      if (inputBox.value.match(/^\d+$/) && inputBox.value.length < 5 &&
        responseText == "Please enter your 4-digit PIN"
        || responseText == "Please enter your PIN again") {
        var tx = inputBox.value.replace(/./g, '*');
        $("#scrollingChat .segments:last .message-inner p").html(tx)
      }

      // Clear input box for further messages
      inputBox.value = '';
      Common.fireEvent(inputBox, 'input');
    }
  }

  // Handles the submission of input on click send button
  function submitInputOnClicked(event, inputBox) {
    // Submit on enter key, dis-allowing blank messages
    if ($('#textInputOne').first().val()) {
      // Retrieve the context from the previous server response
      var context;
      var latestResponse = Api.getResponsePayload();
      if (latestResponse) {
        context = latestResponse.context;
      }

      // Send the user message
      Api.sendRequest($('#textInputOne').first().val(), context);

      //hide pincode on html
      var responseText = $("#scrollingChat .segments:eq(-2) .message-inner").text();
      if (responseText.split('.').length > 1) {
        responseText = responseText.split('.')[1].trim();
      }
      if (inputBox.value.match(/^\d+$/) && inputBox.value.length < 5 &&
        responseText == "Please enter your 4-digit PIN"
        || responseText == "Please enter your PIN again") {
        var tx = inputBox.value.replace(/./g, '*');
        $("#scrollingChat .segments:last .message-inner p").html(tx)
      }

      // Clear input box for further messages
      $('#textInputOne').first().val('');
      Common.fireEvent($('#textInputOne')[0], 'input');
    }
  }

}());

// The Api module is designed to handle all interactions with the server
/* global XMLHttpRequest*/

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

var loadingChat = {
  show: function () {
    document.getElementById("loadingChat").style.display = "";
    document.getElementById("scrollingChat").style.height = "calc(100% - 305px)";
    this.showLoadingDots();
  },
  hide: function () {
    document.getElementById("loadingChat").style.display = "none";
    document.getElementById("scrollingChat").style.height = "calc(100% - 280px)";
  },
  showLoadingDots: function () {
    var showDots = setInterval(function () {
      //look for the element with id=loadingDots
      //if not found clear the interval
      if ($("#loadingDots").length > 0) {
        var dots = '...', i = 1;
        if ($("#loadingDots").html().length == 0 || ($("#loadingDots").html().length == dots.length)) {
          $("#loadingDots").html('');
          var i = 1;
        } else {
          i++;
        }
        $("#loadingDots").html($("#loadingDots").html() + ".");
      } else {
        //clear the interval, if element not found
        clearInterval(showDots);
      }
    }, 1000);
  }
}


var Api = (function () {
  var uuid = guid();
  var requestPayload;
  var responsePayload;
  var messageEndpoint = '/api/message';

  //Send a message request to the server
  function sendRequest(text, context) {
    // Build request payload
    var payloadToWatson = {};
    if (text) {
      payloadToWatson.input = {
        text: text
      };
    }
    if (context) {
      payloadToWatson.context = context;
    }
    payloadToWatson.user = uuid;
    // Built http request    
    var http = new XMLHttpRequest();
    loadingChat.show();
    http.open('POST', messageEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function () {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
        Api.setResponsePayload(http.responseText);
        loadingChat.hide();

        var response = JSON.parse(http.responseText);
        var text = "";
        if (response.output.text.toString().split('.').length > 1) {
          text = response.output.text.toString().split('.')[1].trim();
        }
        if (response.context.dialog_status && response.context.dialog_status == "quit") {
          $("#textInputOne").prop("disabled", "disabled");
          $("#textInputOne").prop("placeholder", "Chat has ended");
          $(".inputBefore").addClass("ended");
        } else if (text == "Please enter your 4-digit PIN" || text == "Please enter your PIN again") {
          $("#textInputOne").get(0).type = "password";
          $("#textInputOne").attr("maxlength","4");
          $("#textInputOne").keydown(function (event) {
            if (!(!event.shiftKey //Disallow: any Shift+digit combination
              && !(event.keyCode < 48 || event.keyCode > 57) //Disallow: everything but digits
              || !(event.keyCode < 96 || event.keyCode > 105) //Allow: numeric pad digits
              || event.keyCode == 46 // Allow: delete
              || event.keyCode == 8  // Allow: backspace
              || event.keyCode == 9  // Allow: tab
              || event.keyCode == 27 // Allow: escape
              || (event.keyCode == 65 && (event.ctrlKey === true || event.metaKey === true)) // Allow: Ctrl+A
              || (event.keyCode == 67 && (event.ctrlKey === true || event.metaKey === true)) // Allow: Ctrl+C
                //Uncommenting the next line allows Ctrl+V usage, but requires additional code from you to disallow pasting non-numeric symbols
                //|| (event.keyCode == 86 && (event.ctrlKey === true || event.metaKey === true)) // Allow: Ctrl+Vpasting
              || (event.keyCode >= 35 && event.keyCode <= 39) // Allow: Home, End
              )) {
              event.preventDefault();
            }
          });
        } else {
          $("#textInputOne").get(0).type = "text";
          $("#textInputOne").unbind("keydown");
          $("#textInputOne").attr("maxlength","200");
        }
      }else if (http.readyState === 4 && http.status === 500){
        alert("Error");
        console.log("Status text: " + http.statusText);
        console.log("Response text: " + http.responseText);
        loadingChat.hide();
      }
    };

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
      Api.setRequestPayload(params);
    }

    // Send request
    http.send(params);
  }


  // Publicly accessible methods defined
  return {
    sendRequest: sendRequest,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function () {
      return requestPayload;
    },
    setRequestPayload: function (newPayloadStr) {
      requestPayload = JSON.parse(newPayloadStr);
    },
    getResponsePayload: function () {
      return responsePayload;
    },
    setResponsePayload: function (newPayloadStr) {
      responsePayload = JSON.parse(newPayloadStr);
    }
  };

} ());

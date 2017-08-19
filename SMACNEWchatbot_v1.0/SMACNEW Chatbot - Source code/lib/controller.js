/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var debug = require('debug')('bot:controller');
var extend = require('extend');
var Promise = require('bluebird');
var conversation = require('./api/conversation');
var alchemyLanguage = require('./api/alchemy-language');
var format = require('string-template');
var pick = require('object.pick');
var sqlDb = require('./db/db.js').sqlDb;
var constMessage = require('./const.js');
var lodash = require("lodash");
var creditCardValid = require('card-validator');
var creditCardType = require('credit-card-type');

var sendMessageToConversation = Promise.promisify(conversation.message.bind(conversation));
var extractMessage = Promise.promisify(alchemyLanguage.extractMessage.bind(alchemyLanguage));
var executeQuery = Promise.promisify(conversation.executeQuery.bind(conversation));

var extractNumber = string => string.replace(/[^a-zA-Z0-9]+/g, "").match(/[\d]+/g);
var validationTime = 0;

var authentication = [
  {
    userName: 'rrutz',
    name: 'Reynaldo?Rutz',
    dob: '1984-12-04',
    ssn: '3507',
    phone: '3455012527',
    email: 'rey.rutz@pge.com',
    certNo: '739831761342',
    type: 'Life - Accidental Death & Dismemberment',
    form: 'Beneficiary',
    provider: 'MetLife',
    link: "http://mercer.com/sitedocs/forms/Metlife/AD&D.pdf",
    payment: 'Auto - VISA',
    pending: '04/03/2017',
    nextPayment: '04/03/2017',
    isLate: true,
    pendingAmount: "214.8",
    currentMonthly: '71.60',
    nextYearMonthly: '78.76',
    reason: 'Not enough credit to process the transaction',
    gender: "Mr"
  },
  {
    userName: 'tvitela',
    name: 'Tracey?Vitela',
    dob: '1989-09-15',
    ssn: '4941',
    phone: '6625887043',
    email: 'vitela.tracey@yahoo.com',
    certNo: '408828873175',
    type: 'Life - Accidental Death & Dismemberment',
    form: 'Beneficiary',
    provider: 'AXA',
    link: "http://mercer.com/sitedocs/forms/AXA/AD&D.pdf",
    payment: 'Auto - Master',
    pending: '04/14/2017',
    nextPayment: '04/14/2017',
    isLate: true,
    pendingAmount: "185",
    currentMonthly: '92.50',
    nextYearMonthly: '87.875',
    reason: 'Credit Card expired',
    gender: "Ms"
  },
  {
    userName: 'hhulse',
    name: 'Harold?Hulse',
    dob: '1991-05-05',
    ssn: '6040',
    phone: '5102663583',
    email: 'h.harold@fsoft.com.vn',
    certNo: '915544875979',
    type: 'Life - Accidental Death & Dismemberment',
    form: 'Beneficiary',
    provider: 'Atena',
    link: "http://mercer.com/sitedocs/forms/Atena/AD&D.pdf",
    payment: 'Cash',
    nextPayment: '42784',
    isLate: false,
    currentMonthly: '47.53',
    nextYearMonthly: '52.283',
    gender: "Mr"
  },
  {
    userName: 'aspeidel',
    name: 'Allyson?Speidel',
    dob: '1995-07-30',
    ssn: '7240',
    phone: '6194728074',
    email: 'speidelallyson@vca.com',
    certNo: '920828300529',
    type: 'Life - Accidental Death & Dismemberment',
    form: 'Beneficiary',
    provider: 'Kaiser',
    link: "http://mercer.com/sitedocs/forms/Kaiser/AD&D.pdf",
    payment: 'Auto - VISA',
    nextPayment: '42788',
    isLate: false,
    currentMonthly: '68.25',
    nextYearMonthly: '78.4875',
    gender: "Ms"
  },
  {
    userName: 'mchynoweth',
    name: 'Malinda?Chynoweth',
    dob: '1957-09-10',
    ssn: '5533',
    phone: '7737836087',
    email: 'ma.chy@gmail.com',
    certNo: '284857772890',
    type: 'Retirement',
    form: 'Beneficiary',
    provider: 'ING',
    link: "http://mercer.com/sitedocs/forms/ING/AD&D.pdf",
    payment: 'Cash',
    nextPayment: '42790',
    isLate: false,
    currentMonthly: '124.80',
    nextYearMonthly: '137.28',
    gender: "Ms"
  }
];

var certDetails = [
  {
    certNo: '739831761342',
    type: 'Life - Accidental Death & Dismemberment',
    provider: 'MetLife',
    link: "http://mercer.com/sitedocs/forms/Metlife/AD&D.pdf"
  },
  {
    certNo: '408828873175',
    type: 'Life - Accidental Death & Dismemberment',
    provider: 'AXA',
    link: "http://mercer.com/sitedocs/forms/AXA/AD&D.pdf"
  },
  {
    certNo: '915544875979',
    type: 'Life - Accidental Death & Dismemberment',
    provider: 'Atena',
    link: "http://mercer.com/sitedocs/forms/Atena/AD&D.pdf"
  },
  {
    certNo: '920828300529',
    type: 'Life - Accidental Death & Dismemberment',
    provider: 'Kaiser',
    link: "http://mercer.com/sitedocs/forms/Kaiser/AD&D.pdf"
  },
  {
    certNo: '284857772890',
    type: 'Retirement',
    provider: 'ING',
    link: "http://mercer.com/sitedocs/forms/ING/AD&D.pdf"
  }
];

let userCredentials = {};


module.exports = {
  /**
   * Process messages from a channel and send a response to the user
   * @param  {Object}   message.user  The user
   * @param  {Object}   message.input The user meesage
   * @param  {Object}   message.context The conversation context
   * @param  {Function} callback The callback
   * @return {void}
   */

  processMessage: function (_message, callback, req) {
    let message = extend({input: {text: _message.body.text}}, _message.body);
    let input = message.text ? {text: message.text} : message.input;
    let user = message.user || message.from;
    let responseContextMess = null;
    if (_message.session && _message.session.user) {
      var dbUser = _message.session.user;
    }
    message.context = dbUser ? dbUser.context : {};

    debug('Send message to Conversation.');

    sendMessageToConversation(message)
      .then(function (response) {
        var intent = lodash.maxBy(response.intents, "confidence");

        if (response.context.creditcard.action == "checkccnumber") {
          var input = response.input.text;
          var ccArray = extractNumber(input);
          var validCC = lodash.find(ccArray, number => creditCardValid.number(number).isValid);
		  	  
		  if (ccArray && ccArray.length && validCC) {
            var cardType = creditCardType(validCC);
            if (cardType[0].type != "visa" && cardType[0].type != "master-card") {
              console.log(cardType[0].niceType);
              response.output.text = "Sorry, we don't accept " + cardType[0].niceType + ". We only accept Visa or MasterCard. Please try again.";
            } else {
              response.context.creditcard.ccnumber = validCC;
              response.context.creditcard.action = "checkexpdate";
              response.context.creditcard.type = cardType[0].niceType;
              response.output.text = "Thank you. Next, please enter your card's valid period (in MM/YY or MM/YYYY format)";
            }
          }
        } else if (response.context.creditcard.action == "checkexpdate") {
          var input = response.input.text;
          var dateValidation = creditCardValid.expirationDate(input);
          if (dateValidation.isValid) {
            response.context.creditcard.expdate = dateValidation.month + "/" + dateValidation.year;
            response.context.creditcard.action = "confirmcreditcard";
            response.context.currentContext = "creditcard";
            response.output.text = "Thank you for your input, I have your credit card information as below:<br><br>Card Number: " + response.context.creditcard.ccnumber + "<br>Card Type: " + response.context.creditcard.type + "<br>Expiry Date: " + response.context.creditcard.expdate + "<br><br>Please double check and confirm with only a 'CONFIRM' (in capital letter, and no extra character) in your answer.";
          }
        }

        if (response.context.authen.asking == "dob" && !response.context.authen.phonenumber) {
		  var input = response.input.text;
          var numberArray = extractNumber(input);
          var phone = lodash.find(numberArray, number => number.length == 10);
          if (phone) {
            response.context.authen.phonenumber = phone;
          } else {
            response.context.authen.asking = "phonenumber";
            response.context.authen.status = "inprogress";
            response.context.repromptQuestion = "Please give me your phone number.";
            response.output.text = "Sorry, it looks like the phone number you just gave is invalid. Please give me your 10-digit registered phone number.";
          }
        }

        if (response.context.authen && response.context.authen.status == "done") {
          let authen = response.context.authen;
		  let firstName = authen.firstname.toLowerCase().trim()
		  let lastName = authen.lastname.toLowerCase().trim();
          let phoneNo = authen.phonenumber.replace(/[^\d]+/g, "");
          let dob = authen.dob;
          let ssn = authen.socialsecurity;
	  
          userCredentials = lodash.find(authentication, function (record) {
            return record.name.toLowerCase().indexOf(firstName) >= 0 && record.name.toLowerCase().indexOf(lastName) >= 0 && record.phone == phoneNo && record.dob == dob && record.ssn == ssn;
          });

          if (!userCredentials) {
			validationTime++;	
					
			if(validationTime >= 3){				
				response.context.repromptQuestion = response.output.text = authen.firstname + ", I've just been failed three times. We must end the conversation for security reason.";
				response.context.authen.status = "incorrect";
				response.context.dialog_status = "quit";
				validationTime = 0;
			} else {
				var message = "I am unable to identify your provided";
				if(!lodash.find(authentication, function (record) {return record.name.toLowerCase().indexOf(firstName) >= 0 && record.name.toLowerCase().indexOf(lastName) >= 0;})){
					message = message + " name,";
				}
				
				if(!lodash.find(authentication, function (record) {return record.name.toLowerCase().indexOf(firstName) >= 0 && record.name.toLowerCase().indexOf(lastName) >= 0 && record.phone == phoneNo;})){
					message = message + " phone number,";
				}
				
				if(!lodash.find(authentication, function (record) {record.name.toLowerCase().indexOf(firstName) >= 0 && record.name.toLowerCase().indexOf(lastName) >= 0 && record.phone == phoneNo && record.dob == dob ;})){
					message = message + " date of birth,";
				}
				
				if(!lodash.find(authentication, function (record) {record.name.toLowerCase().indexOf(firstName) >= 0 && record.name.toLowerCase().indexOf(lastName) >= 0 && record.phone == phoneNo && record.dob == dob&& record.ssn == ssn;})){
					message = message + " social security number,";
				}
				
				response.context.repromptQuestion = response.output.text = authen.firstname + ", " + message.substr(0, message.length - 1) + ". Would you like to start all over again?";
				response.context.authen.status = "incorrect";
				response.context.dialog_status = "incorrect";						
			}
          } else {
            response.context.isValidUser = true;

            //Authen info
            response.context.authen.email = userCredentials.email;
            response.context.authen.gender = userCredentials.gender;
            response.context.authen.certNo = userCredentials.certNo;

            //Beneficiary form
            response.context.beneficiary.provider = userCredentials.provider;
            response.context.beneficiary.type = userCredentials.type;
            response.context.beneficiary.url = userCredentials.link;
            response.context.beneficiary.email = "your default email at " + userCredentials.email;

            //Payment
            response.context.payment.provider = userCredentials.provider;
            response.context.payment.type = userCredentials.type;
            response.context.payment.certNo = userCredentials.certNo;
            response.context.payment.nextPayment = userCredentials.nextPayment;
            response.context.payment.currentMonthly = userCredentials.currentMonthly;
            response.context.payment.late = userCredentials.isLate ? "Yes" : "No";
            response.context.payment.paymentSetting = userCredentials.payment;
            response.context.payment.reason = userCredentials.reason || "123";
            response.context.payment.failType = userCredentials.reason == 'Credit Card expired' ? "expire" : "not enough";
            response.context.payment.pendingAmount = userCredentials.pendingAmount;
          }
        }
        if (response.context.beneficiary.action == "checkcertificatenumber") {
          var input2 = response.input.text;
          var arrNumber = extractNumber(input2);
          var certNo = lodash.find(arrNumber, number => number.length == 12);
          if (!certNo) {
            response.output.text = "I am sorry, I do not recognize your certificate number. Could I have it again, please?";
            response.context.beneficiary.action = "askcertificatenumber";
          } else {
            response.context.beneficiary.certificatenumber = certNo;
            response.context.payment.certificatenumber = certNo;
            response.context.creditcard.certificatenumber = certNo;
            if (certNo != response.context.authen.certNo) {
              response.context.beneficiary.action = "askcertificatenumber";
              response.output.text = "I'm sorry, what you have entered is not matching with any certificate number under your account. Please re-enter the correct number.";
            } else {
              if (response.context.asking == "unclear") {
                response.context.beneficiary.action = "unclear";
              } else {
                response.context.beneficiary.action = "done";
              }
            }
          }
        }

        if (response.context.payment.action == "checkcertificatenumber") {
          var input2 = response.input.text;
          var arrNumber = extractNumber(input2);
          var certNo = lodash.find(arrNumber, number => number.length == 12);
          if (!certNo) {
            response.output.text = "I am sorry, I do not recognize your certificate number. Could I have it again, please?";
            response.context.payment.action = "askcertificatenumber";
          } else {
            response.context.payment.certificatenumber = certNo;
            response.context.beneficiary.certificatenumber = certNo;
            response.context.creditcard.certificatenumber = certNo;
            if (certNo != response.context.authen.certNo) {
              response.context.payment.action = "askcertificatenumber";
              response.output.text = "I'm sorry, what you have entered is not matching with any certificate number under your account. Please re-enter the correct number.";
            } else {
              if (response.context.asking == "paymentinfo") {
                response.context.payment.action = "resolve";
              } else {
                response.context.payment.action = "none";
              }
              //success context for payment
            }
          }
        }

        if (response.context.creditcard.action == "checkcertificatenumber") {
          console.log("check cert#");
          var input2 = response.input.text;
          var arrNumber = extractNumber(input2);
          var certNo = lodash.find(arrNumber, number => number.length == 12);
          if (!certNo) {
            response.output.text = "I am sorry, I do not recognize your certificate number. Could I have it again, please?";
            response.context.creditcard.action = "askcertificatenumber";
          } else {
            response.context.payment.certificatenumber = certNo;
            response.context.beneficiary.certificatenumber = certNo;
            response.context.creditcard.certificatenumber = certNo;
            if (certNo != response.context.authen.certNo) {
              response.context.creditcard.action = "askcertificatenumber";
              response.output.text = "I'm sorry, what you have entered is not matching with any certificate number under your account. Please re-enter the correct number.";
            } else {
              response.context.creditcard.action = "checkccnumber";
              //success context for payment
            }
          }
        }


        // if (response.context.loginstatus.authen == "true") {
        //   var email = response.context.loginstatus.email;
        //   var authen = lodash.find(authentication, user => user.email == email);
        //   if (authen) {
        //     response.context.loginstatus.authen = "false";
        //     if (response.context.loginstatus.action == "unlock") {
        //     } else if (response.context.loginstatus.action == "sendemail") {
        //       response.context.currentContext = "none";
        //       response.context.loginstatus.email_sent = "true";
        //     }
        //   } else {
        //     response.output.text = "No user with email " + email + " found. Please try entering your email again.";
        //     if (response.context.loginstatus.action == "unlock") {
        //       response.context.loginstatus.action = "checkemail";
        //     } else if (response.context.loginstatus.action == "sendemail") {
        //       response.context.loginstatus = {
        //         email: 'none',
        //         action: 'sendemail',
        //         status: 'none',
        //         email_sent: 'none'
        //       }
        //     }
        //   }
        // }

        if (response.context.loginstatus.action == "validateemail") {
          if (intent.intent != "FindInfoIntent") {
            var email = response.context.loginstatus.email;
            var authen = null;
            if (email) {
              authen = lodash.find(authentication, user => user.email == email);
            } else {
              authen = lodash.find(authentication, user => response.input.text.toLowerCase().indexOf(user.userName.toLowerCase()) >= 0);
            }
            if (authen) {
              response.context.loginstatus.email = authen.email;
              if (response.context.loginstatus.checkLocked == "true") {
                response.context.loginstatus.action = "unlockaccount";
                response.output.text = "According to the system, your account is being locked due to multiple failed login attempts. Do you want to unlock?";
              } else {
                response.context.loginstatus.action = "sendemail";
                response.context.loginstatus.email_sent = "true";
                response.output.text = "A new email has been sent to your registered email address, please follow the link in this email to access your account. Is there anything else I can help you with?";
                response.context.currentContext = "none";
                response.context.repromptQuestion = "Is there anything else I can help you with?";
              }
            }
          }
        }
        return response;
      })
      .then(function (messageToUser) {
        debug('5. Save conversation context.');
        if (!dbUser) {
          dbUser = {_id: user};
        }
        if (messageToUser.output.text == "") {
          messageToUser.output.text = constMessage.isEmptyMess();
        }
        dbUser.context = messageToUser.context;
        _message.session.user = dbUser;
        debug('6. Send response to the user.');
        //messageToUser = extend(messageToUser, _message.body);
        messageToUser.user = _message.body.user;
        //console.log(messageToUser);
        callback(null, messageToUser);

      })
      // Catch any issue we could have during all the steps above
      .catch(function (error) {
        debug(error);
        callback(error);
      });
  }
};
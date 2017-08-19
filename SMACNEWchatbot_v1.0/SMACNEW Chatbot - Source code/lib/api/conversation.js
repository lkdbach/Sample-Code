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

let extend = require('extend');
let ConversationV1 = require('watson-developer-cloud/conversation/v1');
var sqlDb = require('../db/db.js').sqlDb;
var conversation = new ConversationV1({
  username: process.env.CONVERSATION_USERNAME,
  password: process.env.CONVERSATION_PASSWORD,
  version_date: '2016-07-01',
  path: {
    workspace_id: "12171e17-1038-4a6e-a391-b7792130bfe1"
  }
});
var debug = require('debug')('bot:api:conversation');

/**
* Converts a day number to a string.
*
* @method dayOfWeekAsString
* @param {Number} dayIndex
* @return {Number} Returns day as number
*/
function dayOfWeekAsString(dayIndex) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex % 7];
}

function toDatetime(date) {
  var d = new Date();
  return new Date(d.getFullYear(), date);
}

module.exports = {
  /**
   * Sends a message to the conversation. If context is null it will start a new conversation
   * @param  {Object}   params   The conversation payload. See: http://www.ibm.com/watson/developercloud/conversation/api/v1/?node#send_message
   * @param  {Function} callback The callback
   * @return {void}
   */
  message: function (params, callback) {
    // 1. Set today and tomorrow's day of the week
    var now = new Date();
    var context = {};

    var _params = extend({}, params);
    if (!_params.context) {
      _params.context = {};
      _params.context.system = {
        dialog_stack: ['root'],
        dialog_turn_counter: 1,
        dialog_request_counter: 1
      }
    }
    var newMessage = extend(true, _params, { context: context });
    conversation.message(newMessage, function (err, response) {
      debug('message:', newMessage);
      if (err) {
        callback(err);
      } else {
        debug('response:', response);
        callback(null, response);
      }
    });
  },

  executeQuery: function (params, type, callback) {
    var query;
    var item;
    switch (type) {
      case 'getBalance':
        query = "select AccountBalance from Account where AccountNo ='" + params.context.Account + "'";
        break;
      case 'checkAccount':
        query = "select * from Account where AccountNo ='" + params + "'";
        break;
      case 'checkPinAccount':
        query = "select * from Account where AccountNo ='" + params.context.Account + "' and AccountPinCode ='" + params.input.text.trim() + "'"
        break;
      case 'getRevenue':
        query = "select sum(Transaction_.Amount) AS TotalIncome from Account JOIN Transaction_ on Account.AccountId = Transaction_.AccountId where Account.AccountNo ='" + params.context.Account + "' and Transaction_.TransactionType = '1' and MONTH(Transaction_.Date) = MONTH('" + params.context.currentDate + "')"
        break;
      case 'getAllSpend':
        query = "select sum(Transaction_.Amount) AS TotalSpend from Account JOIN Transaction_ on Account.AccountId = Transaction_.AccountId where Account.AccountNo ='" + params.context.Account + "' and Transaction_.TransactionType = '2' and MONTH(Transaction_.Date) = MONTH('" + params.context.currentDate + "')"
        break;
      case 'getTotalTransaction':
        query = "select count(Transaction_.Amount) AS TotalTransaction from Account JOIN Transaction_ on Account.AccountId = Transaction_.AccountId where Account.AccountNo ='" + params.context.Account + "' and Transaction_.TransactionType = '2' and MONTH(Transaction_.Date) = MONTH('" + params.context.currentDate + "')"
        break;
      case 'getSpend':
        switch (params.context.item) {
          case 'clothes':
            item = 1;
            break;
          case 'restaurant':
            item = 3;
            break;
          case 'hotel':
            item = 2;
            break;
        }
        query = "select sum(Transaction_.Amount) as TotalSpend from Account JOIN Transaction_ on Account.AccountId = Transaction_.AccountId JOIN Category on Transaction_.ItemId = Category.ItemId where Account.AccountNo ='" + params.context.Account + "' and Transaction_.ItemId = " + item + " and MONTH(Transaction_.Date) = MONTH('" + params.context.currentDate + "')"
        break;
    }
    try {
      sqlDb.execute({
        query: query
      }).then(function (results) {
        debug('5.Get Balance');
        callback(null, results);
      }, function (err) {
        debug('error db get balance!' + err);
        callback(err);
      })
    } catch (err) {
      throw err
    }
  }
}

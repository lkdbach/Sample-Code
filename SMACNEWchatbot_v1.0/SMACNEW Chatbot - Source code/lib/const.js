function format(n, currency) {
    return currency + "" + n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
}

module.exports = {
    isValidAccountNoMess: function () {
        return "Thank you. Please enter your 4-digit PIN."
    },
    isInValidAccountMess: function () {
        return "This account number doesn’t exist. Please enter another one."
    },
    isGotAccountMess: function () {
        return "You already logged in."
    },
    isWrongFormatAccount: function () {
        return "Sorry, I don't understand your request. You can say : my account is xxxx, or enter your account number alone..."
    },
    isWrongFormatPincode: function () {
        return "Incorrect PIN format. Only 4-digit accept. Please enter your PIN again."
    },
    isInvalidPincode: function () {
        return "Incorrect PIN. Please enter your PIN again."
    },
    isValidAccountMess: function () {
        return "Great. What can I do for you?"
    },
    getBalanceMess: function (val) {
        return "Your balance is " + format(val,"$") + "."
    },
    getTransaction: function (val, date, type) {
        return "You have made " + val + " transaction" + (val <= 1 ? "":"s") + (type == 2 ? " in ":" ") + date + "."
    },
    getRevenue: function (val, date, type) {
        return "The total debits " + (type == 2 ? "in ":"of ") + date + (type == 0 ? " are ":" were ") + format(val,"$") + "."
    },
    getEmptyRevenue: function (date, type) {
        return "You " + (type == 0 ? "don't":"didn't") +" have any income " + (type == 2 ? "in ":"") + date + "."
    },
    getAllSpend: function (val, date, type) {
        return "Your spending " + (type == 2 ? "in ":"") + date + (type == 0 ? " is ":" was ") + format(val,"$") + "."
    },
    getAllSpendEmpty: function (date, type) {
        return "There " + (type == 0 ? "is":"was") + " no payment " + date + "."
    },
    getSpend: function (val, date, item, type) {
        return "You " + (type == 0 ? "spend ":"spent ") +  format(val,"$") + " on " + item + (type == 2 ? " in ":" ") + date + "."
    },
    getSpendEmpty: function (date, item, type) {
        return "There " + (type == 0 ? "is":"was") + " no payment on " + item + (type == 2 ? " in ":" ") + date + "."
    },
    getDatetime: function () {
        return "Which month?"
    },
    isInvalidInformation: function () {
        return "Please enter correct new information to update your account."
    },
    isEmptyMess: function(){
        return "I'm sorry if I'm misunderstanding you, but your answer doesn't seem to match our conversation context. Would you care to try again?"
    }
};
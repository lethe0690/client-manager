const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://rbc:rbc@ds161503.mlab.com:61503/rbc');

const AccountSchema = new Schema({
    cid: String,
    number: String,
    type: String,
    status: String,
    created: Date,
    lastUpdated: Date
});

const ClientSchema = new Schema({
    name: String,
    address: String,
    postalCode: String,
    phone: String,
    email: String,
    dob: Date,
    created: Date,
    lastUpdated: Date
});


const account = mongoose.model('Account', AccountSchema);
const client = mongoose.model('Client', ClientSchema);

module.exports = {account};
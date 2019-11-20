const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema

const store = new mongoose.Schema({
    productId:{
        type: String
    },
    name:{
        type: String
    } ,
    value:{
        type: Number
    },
    category: {
        type: String, 
        required: true
    },
    amount: {
        type: Number
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
},{
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
})

module.exports = mongoose.model('Store', store);;

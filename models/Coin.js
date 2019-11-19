const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema

const coins = new mongoose.Schema({
    mixeruserId:{
        type: Number
    },
    username:{
        type: String
    } ,
    coin:{
        type: Number
    }
},{
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
})

module.exports = mongoose.model('Money', coins);;

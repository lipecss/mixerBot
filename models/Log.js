const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema

const logs = new mongoose.Schema({
  mixeruserId:{
    type: Number
  },
  username: {
    type: String
  },
  action: {
    type: String, 
    required: true 
  },
  category: {
    type: String, 
    required: true
  },
  message: {
    type: String, 
    required: true
  }
}, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
})
  
module.exports = mongoose.model('MixerLogs', logs);
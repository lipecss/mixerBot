const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema

const users = new mongoose.Schema({
  mixeruserId:{
    type: Number
  },
  mixerchannelId:{
    type: Number
  },
  username: {
    type: String
  },
  level:{
    type: Number
  },
  levelProgression:{
    type: Number
  },
  avatarUrl: {
    type: String
  },
  assetsUrl: {
    type: String
  },
  isverified: {
    type: String
  },
  isfollow:{
    type: Boolean,
  },
  ispartnered:{
      type: Boolean,
      default: false
  },
  languageId:{
      type: String
  }  
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
})

module.exports = mongoose.model('MixerUsers', users);

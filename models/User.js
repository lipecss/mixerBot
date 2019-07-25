const mongoose     = require('mongoose');
const moment       = require('moment');
const Schema       = mongoose.Schema

const users = new mongoose.Schema({
  mixeruserId:{
    type: Number
  },
  username: {
    type: String
  },
  level:{
    type: Number
  },
  avatarUrl: {
    type: String
  },
  isverified: {
    type: String
  },
  isfollow:{
    type: Boolean,
    default: false
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


module.exports = mongoose.model('MixerUsers', users);;

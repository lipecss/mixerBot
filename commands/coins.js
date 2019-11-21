const Mixer = require('@mixer/client-node');
const mongoose     = require('mongoose');

const Money = require('../models/Coin.js')

exports.run = async (data, args, userId, channelId, socket, msg) => {
    Money.findOne({mixeruserId: data.user_id}, async (err, user) =>{
        if(err) console.log(err);
        if(user){
            socket.call('whisper', [data.user_name, `Voce possui ${user.coin.toLocaleString('pt-BR')} Coins no momento!`]); //Sussurro de confirmação 
        }
    })
}
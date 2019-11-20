const Mixer = require('@mixer/client-node');
var crypto = require('crypto');
const mongoose     = require('mongoose');
const moment = require('moment')


const Store = require('../models/Store.js')

exports.run = async (data, args, userId, channelId, socket, msg) => {
    let products = await Store.find({amount: {$gte: 1 }, isAvailable: true}) 
    socket.call('whisper', [data.user_name,`-- Produtos disponiveis --`])
    products.forEach(async (product) => {
        if (product) {
            socket.call('whisper', [data.user_name,`/me :hashtags ${product.name}: Valor: ${product.value.toLocaleString('pt-BR')} - Qtd: ${product.amount} - ID: ${product.productId}`])
        }
      })
}
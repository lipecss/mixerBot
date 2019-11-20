const Mixer = require('@mixer/client-node');
const mongoose = require('mongoose');
const moment = require('moment')

const Money = require('../models/Coin.js')
const Log = require('../models/Log.js')

exports.run = async (data, args, userId, channelId, socket, msg) => {
    let roles = [
        'Owner', 
        'Mod'
    ];

    const coinsToGive = parseInt(args[0], 10)
    const user = args[1];

    if(!coinsToGive) return socket.call('whisper', [data.user_name, `É preciso informar a quantidade de moedas a serem doadas!`]);
    if(!user) return socket.call('whisper', [data.user_name, `É preciso informar também quem receberá as moedas EX: !givecoins 10 Felipecss`]);
    
    if(roles.some(r => data.user_roles.includes(r))){
        Money.findOne({username: user}, (err, coin) =>{
            if(err) console.log(err);
            if(user){
                console.log(coin)
                console.log(coinsToGive)
                coin.coin = coin.coin + coinsToGive
                coin.save().catch(err => console.log(err))
                socket.call('whisper', [user, `WoW!!! Voce recebeu +${coinsToGive} coins de Brinde de ${data.user_name}`]); //Sussurro de confirmação
                socket.call('whisper', [data.user_name, `Voce doou com sucesso +${coinsToGive} coins de Brinde para o(a) ${data.user_name}`]); //Nos informa se foi atribuido
            }else{
                socket.call('whisper', [data.user_name, `Usuário ${user} não foi localizado!`]);
            }
            const newLog = new Log({
                mixeruserId: coin.mixeruserId,
                username: coin.username,
                action: 'Comando !givecoinsto utilizado',
                category: 'Comando',
                message: `${data.user_name} atribuiu +${coinsToGive} moedas ao usuário ${user} em ${moment().format('LLL')}`
            })
            // Salva o LOG no banco de Dados
            newLog.save().then(()=>{
                console.log('Log de Eventos criado com sucesso')
            }).catch(err => console.log(err))
        }).catch((err)=>{
           console.log(err);
       })
    }else{
        socket.call('whisper', [data.user_name, `você nao tem cargo para dar Moedas!`]); //Sussurro de erro
        const newLogError = new Log({
            mixeruserId: data.mixeruserId,
            username: data.user_name,
            action: 'Comando Negado',
            category: 'Comando',
            message: `Usuário ${data.user_name} sem permissao tentou usar o comando !doar em ${moment().format('LLL')}`
        })
    
    // Salva o LOG no banco de Dados
        newLogError.save().then(()=>{
            console.log('Log de Erro criado com sucesso')
        }).catch(err => console.log(err))
    }
}
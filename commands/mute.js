const Mixer = require('@mixer/client-node');
const ms = require("ms");
const moment = require('moment')

const Log = require('../models/Log.js')

exports.run = async (data, args, userId, channelId, socket, msg) => {
    let roles = [
        'Owner', 
        'Mod'
    ];

    let toMute = args[0];
    let mutetime  = args[1];
    if(!toMute) return socket.call('whisper', [data.user_name, `informe quem será mutado!`]);
    if(!mutetime) return socket.call('whisper', [data.user_name, `é necessário informar a duração Ex: 2d/2h/2m ou 2s!`]);
    //console.log(data.message.message[2]);
    if(roles.some(r => data.user_roles.includes(r))){
     socket.call('timeout', [toMute, `"${mutetime}"`]).then(()=>{
            socket.call('msg', [`/me Por motivos maiores o ${toMute} foi mutado. Preste atenção para nao levar BAN!`])
            console.log(`Usuário ${toMute} foi mutado`);
        }).catch((err) => {
              console.log(err);
        })
        // Quando acabar o tempo de mute, o usuario recebe uma mensagem
        setTimeout(function(){
            console.log(ms(mutetime))
            socket.call('whisper', [toMute, `/me acabou a duração e você foi 'desmutado'! Você já pode conversar`]);
        }, ms(mutetime));
    }else{
        socket.call('whisper', [data.user_name, `você nao tem cargo para Mutar as pessoas!`]); //Sussurro de erro
        const newLogError = new Log({
            mixeruserId: data.user_id,
            username: data.user_name,
            action: 'Comando Negado',
            category: 'Comando',
            message: `Usuário ${data.user_name} sem permissao tentou usar o comando !mute em ${moment().format('LLL')}`
        })
    
    // Salva o LOG no banco de Dados
        newLogError.save().then(()=>{
            console.log('Log de Erro criado com sucesso')
        }).catch(err => console.log(err))
    }
}
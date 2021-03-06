const Mixer = require('@mixer/client-node');
const mongoose = require('mongoose');
const moment = require('moment')

const Log = require('../models/Log.js')

exports.run = async (data, args, userId, channelId, socket, msg) => {
  let usertoclear = args.join(" ")
  let roles = [
    'Owner', 
    'Mod'
  ];

  if(roles.some(r => data.user_roles.includes(r))){
    if(!usertoclear) return socket.call('whisper', [data.user_name, `informe alguem para apagar as mensagens!`]);
      socket.call('purge', [usertoclear]).then(()=>{ //Se for cria a votação
         socket.call('whisper', [data.user_name, `mensagens do ${usertoclear} apagadas com sucesso!`]); //Sussurro de confirmação
     }).catch((err)=>{
         console.log(err);
     })
  }else{
    socket.call('whisper', [data.user_name, `você nao tem cargo para limpar chat!`]); //Sussurro de erro
    const newLogError = new Log({
        mixeruserId: data.user_id,
        username: data.user_name,
        action: 'Comando Negado',
        category: 'Comando',
        message: `Usuário ${data.user_name} sem permissao tentou usar o comando !clear em ${moment().format('LLL')}`
    })

// Salva o LOG no banco de Dados
    newLogError.save().then(()=>{
        console.log('Log de Erro criado com sucesso')
    }).catch(err => console.log(err))
}
}
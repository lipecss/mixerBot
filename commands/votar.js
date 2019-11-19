const Mixer = require('@mixer/client-node');
const mongoose = require('mongoose');
const moment = require('moment')

const Log = require('../models/Log.js')

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    let roles = [
        'Owner', 
        'Mod'
    ];
                   
    let pergunta = args.slice(0, args.lastIndexOf('?')).join(" ")
    let opcoes = args.slice(0).join(" ").slice(args.slice(0).join(" ").indexOf("?") + 1).split(',');
    const optionsArray = opcoes.toString().replace(/ ?, ?/g, ',').replace(/(^ | $)/g, '').split(',');
    const result = optionsArray;

    console.log("pergunta: " + pergunta)
    console.log("opcoes: " + opcoes)
    console.log("optionsArray: " + optionsArray)
    console.log("result: " + result)

    if(roles.some(r => data.user_roles.includes(r))){
         if(!pergunta) return socket.call('whisper', [data.user_name, `informe uma pergunta para a votação!`]);
          socket.call('vote:start',[`${pergunta}`, result,30]).then(()=>{ //Se for cria a votação
              socket.call('whisper', [data.user_name, `votação criada com sucesso!`]); //Sussurro de confirmação
          }).catch((err)=>{
              console.log(err);
          })
      }else{
        socket.call('whisper', [data.user_name, `você nao tem cargo para iniciar um Voto!`]); //Sussurro de erro
        const newLogError = new Log({
            mixeruserId: data.user_id,
            username: data.user_name,
            action: 'Comando Negado',
            category: 'Comando',
            message: `Usuário ${data.user_name} sem permissao tentou usar o comando !vote em ${moment().format('LLL')}`
        })
    
    // Salva o LOG no banco de Dados
        newLogError.save().then(()=>{
            console.log('Log de Erro criado com sucesso')
        }).catch(err => console.log(err))
    }
}
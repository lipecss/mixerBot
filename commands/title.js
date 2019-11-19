/** Inicia o dotenv */
require('dotenv').config()

const Mixer = require('@mixer/client-node');
const request = require('request');
const channelID = 3553359

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    let roles = [
        'Owner', 
        'Mod'
      ];
    
    let title = args.join(" ");
    const options = {
        url: 'https://mixer.com/api/v1/channels/3553359',
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
        },
        json: true,
        body:{
            'token': 'https://mixer.com/Felipecss',
            'name': `${title}`
        }
    };
    if(roles.some(r => data.user_roles.includes(r))){  
        request(options, function(req, res) {
            if (res.body.errorCode){
                socket.call('whisper', [data.user_name, `Erro ao atualizar o titulo da Live: ${res.body.errorCode}`]);
                console.log(res.body.errorCode);
            } else{
            socket.call('whisper', [data.user_name, `Titulo da Live atualizado!`]);
            }
        });
    }else{
        socket.call('whisper', [data.user_name, `você nao pode alterar o nome da Live!`]);
        const newLogError = new Log({
            mixeruserId: data.user_id,
            username: data.user_name,
            action: 'Comando Negado',
            category: 'Comando',
            message: `Usuário ${data.user_name} sem permissao tentou usar o comando !title(alterar titulo da live) em ${moment().format('LLL')}`
        })
    
    // Salva o LOG no banco de Dados
        newLogError.save().then(()=>{
            console.log('Log de Erro criado com sucesso')
        }).catch(err => console.log(err))
    }
}
/** Inicia o dotenv */
require('dotenv').config()

const Mixer = require('@mixer/client-node');
const request = require('request');
const channelID = 3553359

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    let roles = ['Owner','Mod'];
    let audiences = ['family','teen','18+']
    let audienceType = args.join(" ").toLowerCase();

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
            'audience': `${audienceType}`
        }
    };
    if(roles.some(r => data.user_roles.includes(r))){  
        if(audiences.some(r => audienceType.includes(r))){  
            request(options, function(req, res) {
                if (res.body.errorCode){
                    socket.call('whisper', [data.user_name, `Erro ao atualizar a audiência da Live: ${res.body}`]);
                    console.log(res.body);
                } else{
                socket.call('whisper', [data.user_name, `Audiência da Live atualizado!`]);
                }
            });
        }else{
            socket.call('whisper', [data.user_name, `Só é permitido os seguintes tipos de Audiência: 'Teen', 'Family' ou '18+'`]);
        }
    }else{
        socket.call('whisper', [data.user_name, `você nao pode alterar a audiência da Live!`]);
        const newLogError = new Log({
            mixeruserId: data.mixeruserId,
            username: data.user_name,
            action: 'Comando Negado',
            category: 'Comando',
            message: `Usuário ${data.user_name} sem permissao tentou usar o comando !audience(trocar o audienencia) em ${moment().format('LLL')}`
        })
    
    // Salva o LOG no banco de Dados
        newLogError.save().then(()=>{
            console.log('Log de Erro criado com sucesso')
        }).catch(err => console.log(err))
    }
}
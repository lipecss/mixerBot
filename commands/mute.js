const Mixer = require('@mixer/client-node');
const ms = require("ms");

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    let toMute = args[0];
    let mutetime  = args[1];
    //console.log(data.message.message[2]); 
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
}
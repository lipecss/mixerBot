const Mixer = require('@mixer/client-node');
const ms = require("ms");

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    let toMute = args[0]
    let mutetime  = args[1]
    console.log(data.message.message[2])
    
     socket.call('timeout', [toMute, `"${mutetime}"`]).then(()=>{
            console.log(`Usuário ${toMute} foi mutado`)
        }).catch((err) => {
              console.log(err)
        })
        // Quando acabar o tempo de mute, o usuario recebe uma mensagem
        setTimeout(function(){
            socket.call('whisper', [toMute, `acabou a duração e você foi 'desmutado'! Você já pode conversar`]);
          }, ms(mutetime));
        
}
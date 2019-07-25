const Mixer = require('@mixer/client-node');

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    let usertoclear = args.join(" ")
    let roles = [
      'Owner', 
      'Mod'
    ];
  
    if(roles.some(r => data.user_roles.includes(r))){
        socket.call('attachEmotes', []).then(()=>{ //Se for cria a votação
           socket.call('whisper', [data.user_name, `Aprimoramento para os eventos ChatMessagee e SkillAttribution! ativados!`]); //Sussurro de confirmação
       }).catch((err)=>{
           console.log(err);
       })
    }else{
      socket.call('whisper', [data.user_name, `você nao pode usar esse comando!`]); //Sussurro de erro
    }
}
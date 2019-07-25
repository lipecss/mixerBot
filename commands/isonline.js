const Mixer = require('@mixer/client-node');
const fetch = require('node-fetch');

const channelId = 3553359;

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
  let usertoSearch = args.join(" ")
  let roles = [
    'Owner', 
    'Mod'
  ];

  // Se for Dono ou Admin
  if(roles.some(r => data.user_roles.includes(r))){
      //link base: https://mixer.com/api/v2/chats/${channelId}/users

      console.log(data.message.message.filter(d => d.type === "tag")); 
  }
}
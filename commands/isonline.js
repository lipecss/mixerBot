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
    const mixerFetch = await fetch(`https://mixer.com/api/v2/chats/${channelId}/users`)
    .then((res)=>{
      return res.json();
    })
    .then((datafetch)=>{
      console.log(datafetch); 
    })

      
  }
}
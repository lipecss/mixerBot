const Mixer = require('@mixer/client-node');
const fetch = require('node-fetch');

exports.run = async (data, args, userId, channelId, socket, msg) => {
    const mixer = new Mixer.Client(new Mixer.DefaultRequestRunner());
    let channel = args[0];
    //console.log(data);
    const mixerFetch = await fetch(`https://mixer.com/api/v1/users/${data.user_id}`)
    .then((res)=>{
      return res.json();
    })
    .then((datafetch)=>{
        //console.log(datafetch)
        socket.call('msg', [`/me ${data.user_name}, você possui :spark ${datafetch.sparks} Sparks :spark`]);
    })
}
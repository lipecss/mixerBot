const Mixer = require('@mixer/client-node');
const fetch = require('node-fetch');

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    const mixer = new Mixer.Client(new Mixer.DefaultRequestRunner());
    let channel = args[0];
    console.log(data)
    const mixerFetch = await fetch(`https://mixer.com/api/v1/users/${data.user_id}`)
    .then((res)=>{
      return res.json()
    })
    .then((datafecth)=>{
        //console.log(datafecth)
        socket.call('msg', [`${data.user_name}, você possui :spark ${datafecth.sparks} Sparks :spark`])
    })
}
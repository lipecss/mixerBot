const Mixer = require('@mixer/client-node');
const fetch = require('node-fetch');

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    let user = args[0];
    let timeTowait = args[1];
    socket.call('timeout', [user, timeTowait]).then(()=>{
        console.log("timatado")
    }).catch((err) => {
        console.log(err)
    })
}
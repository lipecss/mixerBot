const Mixer = require('@mixer/client-node');
const request = require('request');
const channelID = 3553359

exports.run = async (client, data, args, userId, channelId, socket, msg) => {

    const options = {
        url: 'https://mixer.com/api/v1/channels/3553359',
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer Y7MO063IYHWNkhvFmM5XOBH3bJgqVodEY0ksw5G7YrFqX7l6QzwBk4H8KLQS9WFd`
        },
        json: true,
        body:{
            'token': 'https://mixer.com/Felipecss',
            'name': 'Atualizado'
        }
    };

    request(options, function(req, res) {
        if (res.body.errorCode){
            console.log(res.body.errorCode)
          } else{
           socket.call('msg', [`Titulo atualizado`]);
          }
    });
}
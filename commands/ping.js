const Mixer = require('@mixer/client-node');
const ping = require('node-http-ping');

exports.run = async (client, data, args, userId, channelId, socket) => {
    const str = String(new Date().getMilliseconds()).padStart(3, '0');
    ping('https://status.mixer.com')
    .then((time) => {
        socket.call('msg', [`PONG\n :spaceship Latência da API: ${Math.round(time)}ms!\n :spaceship Latência do BOT: ${str}ms!`]);
    })
    .catch(() => console.log('Fala ao conectar no enedereço da API Mixer'));
}
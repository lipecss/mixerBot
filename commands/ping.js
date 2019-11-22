const Mixer = require('@mixer/client-node');
const ping = require('node-http-ping');

exports.run = async (data, args, userId, channelId, socket, msg) => {
    const str = String(new Date().getMilliseconds()).padStart(3, '0');
    ping('https://status.mixer.com')
    .then((time) => {
        socket.call('msg', [`/me PONG\n :spaceship Latência da API: ${Math.round(time)}ms!\n :spaceship Latência do BOT: ${str}ms!`]);
    })
    .catch(() => console.log('Falha ao conectar no enedereço da API Mixer'));
}
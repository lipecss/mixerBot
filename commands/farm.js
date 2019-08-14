const Mixer = require('@mixer/client-node');

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    socket.call('msg', [`/me Dica para farmar mais sparks: Abra uma aba mutada na @ChannelOneBR e outra com o nosso canal (ou o streamer que estiver assistindo), após isso vc irá farmar 75 sparks ao invez de 50.`])
}
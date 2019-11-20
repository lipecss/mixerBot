const math = require('mathjs');
exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    let input = args.join(" ");
    if(!input) return socket.call('whisper', [data.user_name, `Você deve fornecer uma equação a ser resolvida na calculadora!`]);

    const question = args.join(" ");

    let answer;
    try {
        answer = math.evaluate(question);
      } catch (error) {
        console.error(error);
        socket.call('whisper', [data.user_name, `Não foi possivel executar a conta. Tente novamente.`]);
      }
      socket.call('whisper', [data.user_name, `:rmf O resultado é: ${answer}`]);
}

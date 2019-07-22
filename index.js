const Mixer = require('@mixer/client-node');
const { ShortCodeExpireError, OAuthClient } = require('@mixer/shortcode-oauth');
const ws = require('ws');

/** Carrega outros modulos uteis */
const moment = require('moment');
const fs = require('fs');
const { readFileSync } = require('fs');


let userInfo;


const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

// With OAuth we don't need to log in. The OAuth Provider will attach
// the required information to all of our requests after this call.
client.use(new Mixer.OAuthProvider(client, {
    tokens: {
        access: 'my acsessToken',
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
    },
}));

// Gets the user that the Access Token we provided above belongs to.
client.request('GET', 'users/current')
.then(response => {
    userInfo = response.body;
    console.log(userInfo);
    return new Mixer.ChatService(client).join(response.body.channel.id);
})
.then(response => {
    const body = response.body;
    console.log(body);
    return createChatSocket(userInfo.id, userInfo.channel.id, body.endpoints, body.authkey);
})
.catch(error => {
    console.error('Something went wrong.');
    console.error(error);
});

/**
* Creates a Mixer chat socket and sets up listeners to various chat events.
* @param {number} userId The user to authenticate as
* @param {number} channelId The channel id to join
* @param {string[]} endpoints An array of endpoints to connect to
* @param {string} authkey An authentication key to connect with
* @returns {Promise.<>}
*/

/** Inicia o dotenv */
require('dotenv').config()
client.prefix = process.env.PREFIX;
moment.locale('pt-BR');


function createChatSocket (userId, channelId, endpoints, authkey) {

    const userTimes = new Map()
    const startTime = new Date()
    // Chat connection
    const socket = new Mixer.Socket(ws, endpoints).boot();

    // Greet a joined user
    socket.on('UserJoin', data => {
        socket.call('msg', [`Olá ${data.username}! Eu sou o Botinho, seja bem vindo ao canal! Já lavou a louça hoje, antes de jogar?`]);
    
  userTimes.set(data.username, new Date())
  console.log(`User joined: ${data.username}`)
  console.log(userTimes);
   
});

socket.on('UserLeave', data => {
    // Get the user's join time from the `userTimes` list above, or fall back
    // to `startTime` if we missed their join time
    const joinTime = userTimes.get(data.username) || startTime

    // Subtract the current time from their join time
    const watchTime = Math.round((Date.now() - joinTime.getTime()) / 1000)

    // Log it!
    console.log(`User left: ${data.username} (${watchTime}s)`)
  })

// React to our !pong command
socket.on('ChatMessage', async data => {

// Pegando o conteudo da mensagem
let msg = data.message.message[0].data.toLowerCase();

  // Se a mensagem nao conter o prefixo do codigo, retorna nada
  if (data.message.message[0].data.indexOf(client.prefix) !== 0) return;

  const args = data.message.message[0].data.slice(client.prefix.length).trim().split(/ +/g);
  console.log(args)
  const command = args.shift().toLowerCase();
  
  try {
    //Busca o comando
    let commands = require(`./commands/${command}.js`);
    commands.run(client, data, args, userId, channelId, socket, msg);
  } catch(err){
     //Apaga a o comando que não existe
    if (err.code == "MODULE_NOT_FOUND") console.log("Esse comando não existe! Tente Novamente");
    socket.call('whisper', [data.user_name, 'desculpe mas esse comando nao existe'])
    console.log(err)
  } 
});

// Handle errors
    socket.on('error', error => {
        console.error('Socket error');
        console.error(error);
    });

    //Evento de quando fica online
return socket.auth(channelId, userId, authkey)
.then(() => {
    console.log('Logado com Sucesso ao chat');
/**
* Contando Comandos
*/

const dir = './commands';

    fs.readdir(dir, (err, files) => {
        console.log('Total de Comandos: ' + files.length + ' carregados');
    });

    return socket.call('msg', ['Oi! Eu estou online, sabe o que quer dizer?! A diversão está de volta!!']);
});
}
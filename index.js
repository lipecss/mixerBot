const Mixer = require('@mixer/client-node');
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
        access: 'my accessToken',
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
    },
}));

// Gets the user that the Access Token we provided above belongs to.
client.request('GET', 'users/current')
.then(response => {
    console.log(response.body);

    // Store the logged in user's details for later reference
    userInfo = response.body;

    // Returns a promise that resolves with our chat connection details.
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

/** Inicia o dotenv */
require('dotenv').config()
client.prefix = process.env.PREFIX;
moment.locale('pt-BR');

function createChatSocket (userId, channelId, endpoints, authkey) {
    const socket = new Mixer.Socket(ws, endpoints).boot();

    // You don't need to wait for the socket to connect before calling
    // methods. We spool them and run them when connected automatically.
    socket.auth(channelId, userId, authkey)
    .then(() => {
        console.log('You are now authenticated!');
        // Send a chat message
        return socket.call('msg', ['Hello world!']);
    })
    .catch(error => {
        console.error('Oh no! An error occurred.');
        console.error(error);
    });

    // Listen for chat messages. Note you will also receive your own!
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

    // Listen for socket errors. You will need to handle these here.
    socket.on('error', error => {
        console.error('Socket error');
        console.error(error);
    });
}
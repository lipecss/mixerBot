/** Carrega os modulos uteis */
const ws = require('ws');
const moment = require('moment');
const fs = require('fs');
const { readFileSync } = require('fs');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const Mixer = require('@mixer/client-node');
const Carina = require('carina').Carina;
Carina.WebSocket = ws;


const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

// Prefixo do Bot
client.prefix = process.env.PREFIX;

// Localização do Moment
moment.locale('pt-BR');

/**
 * Importando Models
 */
const User = require('./models/User.js')

/** Instancia os ARQUIVOS. */
const welcomeMessages = require('./welcomeMessages.js')


/**
 * Database setup
 */
const db = 'mongodb://localhost:27017/mixer';

// Connect to Database
mongoose.connect(db, { useNewUrlParser: true }).then(()=>{
    console.log('Conectado com sucesso ao banco!')
}).catch((err)=>{
    console.log('Erro ao tentar se conectar ao Mongodb ' + err);
})

// Variáveis Globais
let userInfo; //Dados do canal
const myiduser = 4509390; // Id do usuario do canal
const channelId = 3553359; // Id do canal

const ca = new Carina({
    queryString: {
        'Client-ID': 'Click here to get your Client ID!',
    },
    isBot: true,
}).open();

// With OAuth we don't need to log in. The OAuth Provider will attach
// the required information to all of our requests after this call.
client.use(new Mixer.OAuthProvider(client, {
    tokens: {
        access: 'i2YdKaRpCADcOgmBJuA0sAhWfSj5cUj6IlywTlWu8txXUc0ek5ePSyIDgMa8OicF',
        expires: Date.now() + (365 * 24 * 60 * 60 * 1000)
    },
}));

// Pega o usuario do Access Token.
client.request('GET', 'users/current')
.then(response => {
    //console.log(response.body);

    // Store the logged in user's details for later reference
    userInfo = response.body;

    // Returns a promise that resolves with our chat connection details.
    return new Mixer.ChatService(client).join(response.body.channel.id);
})
.then(response => {
    const body = response.body;
    //console.log(body); //Dados
    return createChatSocket(userInfo.id, userInfo.channel.id, body.endpoints, body.authkey);
})
.catch(error => {
    console.error('Algo de errado aconteceu');
    console.error(error);
});

// Funcação do chat
function createChatSocket (userId, channelId, endpoints, authkey) {
    const socket = new Mixer.Socket(ws, endpoints).boot();
    
    // You don't need to wait for the socket to connect before calling
    // methods. We spool them and run them when connected automatically.
    socket.auth(channelId, userId, authkey)
    .then(() => {
        console.log('Agora estamos autenticados');
        // Send a chat message
        //return socket.call('msg', ['Olá Mundo']);
    })
    .catch(error => {
        console.error('Oh não! Ocorreu um erro.');
        console.error(error);
    });

// Evento de escutar as mensagens recebidas no chat
socket.on('ChatMessage', async data => {
    //console.log(data.message)
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
        socket.call('whisper', [data.user_name, 'desculpe mas esse comando nao existe']);
        console.log(err);
    } 
});

// Quando um usuario entra na Live(chta)
socket.on('UserJoin', async data => {
    User.findOne({mixeruserId: data.id}).then(async (user) =>{
        if(user && user.isUnfollowed){
        console.log(`${data.username} retornou ao servidor e já tinha saido antes`)
        }
        if(!user){
            // Pega os dados do novo usuario
        const mixerFetch = await fetch(`https://mixer.com/api/v1/users/${data.id}`)
        .then((res)=>{
            return res.json();
        })
        .then(async (datafecth)=>{
            const newuser = new User({
                mixeruserId: datafecth.id,
                username: datafecth.username,
                level: datafecth.level,
                avatarUrl: datafecth.avatarURL,
                isverified: datafecth.verified,
                isfollow: false,
                ispartnered: datafecth.channel.partnered,
                languageId: datafecth.channel.languageId,
                createdTimestamp : Date.now()
            })
            // Cadatra no banco
            newuser.save().then(() =>{
                console.log(`Usuario ${datafecth.username} cadastrado com sucesso no Banco`);
            }).catch((err)=>{
                console.log('Houve um erro ao cadastrar usuáriro no Bacndo de Dados: ' + err)
            })
            // Randomiza as mensagens do array
            let randomItem = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
            // Troca o valor userName para o nome do usuario
            let resultadoMessage = randomItem.replace('userName', `@${data.username}`);
            socket.call('msg', [resultadoMessage]);
        })
        }else{
            //console.log('Já está Cadastrado')
        }
    });
});

socket.on('skillattribution', skills => {
    console.log('aui')
});

// Listen for socket errors. You will need to handle these here.
socket.on('error', error => {
        console.error('Socket error');
        console.error(error);
});



                                    /*Eventos Carina (Tempo Real)*/

// Quando ocorre atualização do meu canal
ca.subscribe(`channel:${channelId}:update`, data => {
    if(!data.name){

    }else{
        socket.call('msg', [` :honk O nome da Live foi alterado e agora é :honk \n\n ${data.name}`]);
    }
});

// Quando alguem segue o nosso canal
ca.subscribe(`channel:${channelId}:followed`, data =>{
    console.log("data: " + data.user.id + " - " + data.following)
    User.findOne({mixeruserId: data.user.id}).then(async (user) =>{
        if(user && data.following == false){
            user.isfollow = false;
            user.save().then(() =>{
                console.log(`Usuário atualizado, agora seu Status de Seguindo é: ${user.isfollow}`);
            }).catch((err)=>{
                console.log(`Houve um erro ao atualizar o status ${user.isfollow} do usuário ${user.username} no Banco de Dados:\n\n ${err}`)
            })
        }else{
            user.isfollow = true;
            user.save().then(() =>{
                console.log(`Usuário atualizado, agora seu Status de Seguindo é: ${user.isfollow}`);
            }).catch((err)=>{
                console.log(`Houve um erro ao atualizar o status ${user.isfollow} do usuário ${user.username} no Banco de Dados:\n\n ${err}`)
            })
        }
    })
})
}
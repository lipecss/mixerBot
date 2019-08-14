/** Inicia o dotenv */
require('dotenv').config()

/** Carrega os modulos uteis */
const ws = require('ws');
const moment = require('moment');
const fs = require('fs');
const { readFileSync } = require('fs');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const Mixer = require('@mixer/client-node');
const Carina = require('carina').Carina;
const { ShortCodeExpireError, OAuthClient } = require('@mixer/shortcode-oauth');
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

const ca = new Carina({ isBot: true }).open();


// With OAuth we don't need to log in. The OAuth Provider will attach
// the required information to all of our requests after this call.
client.use(new Mixer.OAuthProvider(client, {
    tokens: {
        access: process.env.ACCESS_TOKEN,
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
    
    // Se a Mensagem conter Autocolantes(Stikers)
    if (data.message.meta.is_skill) {
        let stickers = data.message.meta
        //console.log(stickers)
        //link da imagem https://xforgeassets002.xboxlive.com/xuid-2535473787585366-public/b7a1d715-3a9e-4bdd-a030-32f9e2e0f51e/0013_lots-o-stars_256.png
        if(stickers.skill.cost > 5000 && stickers.skill.currency == 'Sparks'){
            socket.call('msg', [`/me Obrigado @${data.user_name} pelos ${stickers.skill.cost} Sparks :spark`])
        }
        console.log(JSON.stringify(data.message.meta, null, 4));
    }
    
    // Se a mensagem nao conter o prefixo do codigo, retorna nada
    if (data.message.message[0].data.indexOf(client.prefix) !== 0) return;
    
    const args = data.message.message[0].data.slice(client.prefix.length).trim().split(/ +/g);
    console.log(args)
    const command = args.shift().toLowerCase();
      
    try {
        //Busca o comando
        let commands = require(`./commands/${command}.js`);
        socket.call('deleteMessage', [data.id])
        commands.run(client, data, args, userId, channelId, socket, msg);
    } catch(err){
         //Apaga a o comando que não existe
        socket.call('deleteMessage', [data.id])
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
        .then(async (datafetch)=>{
            const mixerLevelProgression = await fetch(`https://mixer.com/api/v1/ascension/channels/${channelId}/users/${datafetch.id}`)
            .then((res)=>{
                return res.json();
            })
            .then(async (datafetchLevel)=>{
                console.log(datafetchLevel)
                const newuser = new User({
                    mixeruserId: datafetch.id,
                    mixerchannelId: datafetch.channel.id,
                    username: datafetch.username,
                    level: datafetch.level,
                    levelProgression: datafetchLevel.level.level,
                    avatarUrl: datafetch.avatarUrl,
                    assetsUrl: datafetchLevel.level.assetsUrl,
                    isverified: datafetch.verified,
                    isfollow: false,
                    ispartnered: datafetch.channel.partnered,
                    languageId: datafetch.channel.languageId,
                    createdTimestamp : Date.now()
                })
                // Cadatra no banco
                newuser.save().then(() =>{
                    console.log(`Usuario ${datafetch.username} cadastrado com sucesso no Banco`);
                }).catch((err)=>{
                    console.log('Houve um erro ao cadastrar usuáriro no Bacndo de Dados: ' + err)
                })
                // Randomiza as mensagens do array
                let randomItem = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
                // Troca o valor userName para o nome do usuario
                let resultadoMessage = randomItem.replace('userName', `@${data.username}`);
                socket.call('msg', [resultadoMessage]);
            })
         });
        }else{
            //console.log('Já está Cadastrado')
        }
    });
});

socket.on('UserUpdate', user => {
    console.log(user);
});

socket.on('SkillAttribution', data =>{
    console.log('data')
})

// Evento de quando uma Poll é iniciada
socket.on('PollEnd', poll => {
    socket.call('msg', [`:honk Poll finalizada! :honk \nTotal de votos: ${poll.voters}\nRespotas: ${JSON.stringify(poll.responses, null, 4)}`])
});

// Listen for socket errors. You will need to handle these here.
socket.on('error', error => {
        console.error('Socket error');
        console.error(error);
});


                                    /*Eventos Carina (Tempo Real)*/

// Quando ocorre atualização do meu canal
ca.subscribe(`channel:${channelId}:update`, data => {
    console.log(data)
    if(data.name){
         socket.call('msg', [`:honk O nome da Live foi alterado e agora é ${data.name} :honk`]);
     }else if (data.type.name){
        socket.call('msg', [`:XboxElite O Jogo da Live foi alterado e agora é ${data.type.name} :XboxElite `]);
     }
   
});


// Quando alguem segue o nosso canal
ca.subscribe(`channel:${channelId}:followed`, data =>{
    console.log("Usuário: " + data.user.id + " - " + "Status: " + data.following)
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

// Evento de quando alguem upa na progressão do canal
ca.subscribe(`progression:${channelId}:levelup`, levelProgression =>{
    User.findOne({mixeruserId: levelProgression.userId}).then(async (user) =>{
        if(user){
            user.levelProgression = levelProgression.level.level
            user.assetsUrl = levelProgression.level.assetsUrl
            user.save().then(() =>{
                //https://mixer.com/api/v1/ascension/channels/3553359/users/79317924
                //Imagem https://static.mixer.com/img/design/ui/fan-progression/v1_badges/teal/large.gif
                console.log(`Nível do ${user.username} atualizado com sucesso`)
                socket.call('whisper', [user.username,`Parabéns você upou, continue assim. Você é LVL ${levelProgression.level.level} agora!`])
            }).catch((err) =>{
                console.log(`Falha ao atualizar o nivel do ${user.username} no banco`)
            }); 
        }
    })
})

// Evento de quando alguem Subscreve no canal
ca.subscribe(`channel:${channelId}:skill`, skill =>{
    console.log(skill)
})
}
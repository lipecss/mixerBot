/** Inicia o dotenv */
require('dotenv').config()

/** Carrega os modulos uteis */
const ws = require('ws');
const moment = require('moment');
const fs = require('fs');
const { readFileSync } = require('fs');
const mongoose = require('mongoose');
const cron = require("node-cron");
const fetch = require('node-fetch');
const Mixer = require('@mixer/client-node');
const Carina = require('carina').Carina;
const { ShortCodeExpireError, OAuthClient } = require('@mixer/shortcode-oauth');
Carina.WebSocket = ws;

const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

// Prefixo do Bot
client.prefix = process.env.PREFIX;

//Executa a função de envio da SMS quando o servidor fica ativo
// SMSOpenServer()

//   twilio.calls.create({
//     url: 'http://demo.twilio.com/docs/voice.xml',
//     to: '+5511951350668',
//     from: '+19198085223'
// }).then(call => 
//     console.log(call)
// ).catch((err) => console.log(err));

// Localização do Moment
moment.locale('pt-BR');
/**
 * Importando Models
 */
const User = require('./models/User.js')
const Money = require('./models/Coin.js')
const Log = require('./models/Log.js')

/** Instancia os ARQUIVOS. */
const welcomeMessages = require('./welcomeMessages.js')


/**
 * Database setup
 */
const db = process.env.MONGO_URL;

// Connect to Database
mongoose.connect(db, { 
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    autoIndex: false, // Don't build indexes
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    socketTimeoutMS: 60000, // Close sockets after 60 seconds of inactivity
    useUnifiedTopology: true,
    keepAlive: true,
}).then(()=>{
    console.log('Conectado com sucesso ao banco!')
}).catch((err)=>{
    console.log('Erro ao tentar se conectar ao Mongodb ' + err);
    // Envia a SMS informando erro no MONGO
    // SMSDownMongo(err)
})

// Variáveis Globais
let userInfo; //Dados do canal
const myiduser = 4509390; // Id do usuario do canal
const channelId = 3553359; // Id do canal
let isOnline = false;
let roundSkillAndEventsCoins = 5000 // Valor que os sparks serão validados e divididos

const ca = new Carina({ isBot: true }).open();


// With OAuth we don't need to log in. The OAuth Provider will attach
// the required information to all of our requests after this call.
client.use(new Mixer.OAuthProvider(client, {
    tokens: {
        access: process.env.ACCESS_TOKEN,
        expires: new Date(Number(new Date()) + 315360000000)
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
        // SMSDownServer(error)
    });

socket.on('UserUpdate', data =>{
    console.log(data)
})

// Evento de escutar as mensagens recebidas no chat
socket.on('ChatMessage', async data => {
    //console.log(data.message)
    
        // Se a Mensagem conter Autocolantes(Stikers)
        if (data.message.meta.is_skill) {
            let stickers = data.message.meta
            //console.log(stickers)
            //link da imagem https://xforgeassets002.xboxlive.com/xuid-2535473787585366-public/b7a1d715-3a9e-4bdd-a030-32f9e2e0f51e/0013_lots-o-stars_256.png
            if(stickers.skill.cost > 5000 && stickers.skill.currency == 'Sparks'){
                socket.call('msg', [`/me Obrigado @${data.user_name} pelos ${stickers.skill.cost} Sparks :spark`])
            }
    
            if(stickers.skill.cost >= roundSkillAndEventsCoins && stickers.skill.currency == 'Sparks'){
                let coinsToAdd = Math.round((stickers.skill.cost/roundSkillAndEventsCoins))*5;
                console.log('calculo: ', coinsToAdd)
                Money.findOne({mixeruserId: data.user_id}, (err, coin) =>{
                    if(err) console.log(err);
                    if(!coin){
                        const newCoin = new Money({
                            mixeruserId: data.user_id,
                            username: data.user_name,
                            coin: coinsToAdd
                        })
                        newCoin.save().catch(err => console.log(err))
                    }else{
                        const newLog = new Log({
                            mixeruserId: coin.mixeruserId,
                            username: coin.username,
                            action: 'Uso de Skill Premiada',
                            category: 'Skill',
                            message: `Recebeu +${coinsToAdd} moedas ao enviar a Skill ${stickers.skill.skill_name} de ${stickers.skill.cost} Sparks em ${moment().format('LLL')}`
                        })
                        coin.coin = coin.coin + coinsToAdd
                        coin.save().catch(err => console.log(err))
                        newLog.save().then(()=>{
                            console.log('Log de Skill criado com sucesso')
                        }).catch(err => console.log(err))
                    }
                })
                socket.call('whisper', [data.user_name, `Voce recebeu +${coinsToAdd} moedas pelos mais de ${roundSkillAndEventsCoins} Sparks doados!`])
            }
            // console.log(JSON.stringify(data.message.meta, null, 4));
        }
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
             socket.call('deleteMessage', [data.id]).then(() =>{
                 console.log(`Mensagem do comando ${command} apagada`)
             }).catch(console.log)
            commands.run(data, args, userId, channelId, socket, msg);
            //console.log(data)
            // let coinsToAdd = Math.ceil(Math.random() * 50)
            // console.log(coinsToAdd + " coins")
            // Money.findOne({mixeruserId: data.user_id}, (err, coin) =>{
            //     if(err) console.log(err);
            //     if(!coin){
            //         const newCoin = new Money({
            //             mixeruserId: data.user_id,
            //             username: data.user_name,
            //             coin: coinsToAdd
            //         })
    
            //         newCoin.save().catch(err => console.log(err))
            //     }else{
            //         coin.coin = coin.coin + coinsToAdd
            //         coin.save().catch(err => console.log(err))
            //     }
            // })
        } catch(err){
             //Apaga a o comando que não existe
             socket.call('deleteMessage', [data.id]).then(() =>{
                 console.log('mensagem apagada')
             }).catch(console.log)
            if (err.code == "MODULE_NOT_FOUND") console.log("Esse comando não existe! Tente Novamente");
            socket.call('whisper', [data.user_name, 'desculpe mas esse comando nao existe']);
            console.log(err);
        } 
});
let users = []

// Quando um usuario entra na Live(chat)
socket.on('UserJoin', async data => {
    data.hour_of_entry = moment().format()
    users.push(data)
    console.log(data)
    Money.findOne({mixeruserId: data.id}, async (err, coin) =>{
        if(err) console.log(err);
        if(!coin){
            console.log(`Nao tem: ${data.username}`)
            const newCoin = new Money({
                mixeruserId: data.id,
                username: data.username,
                coin: 500
            })
            console.log(`Usuario: ${data.username} foi adicionado ao banco de Money`)
            newCoin.save().catch(err => console.log(err))
        }
    })
    const followers = await fetch(`https://mixer.com/api/v1/channels/${channelId}/follow`)
    .then((res)=>{
      return res.json();
    })
    .then((users)=>{
        const followers = users.map(({username})=>username)
        
        User.findOne({mixeruserId: data.id}).then(async (user) =>{
            if(user && user.isUnfollowed){
                console.log(`${data.username} retornou a Live e deixou de nos seguir antes`)
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
                    if(followers.includes(datafetchLevel.username)){
                        const newuser = new User({
                            mixeruserId: datafetch.id,
                            mixerchannelId: datafetch.channel.id,
                            username: datafetch.username,
                            level: datafetch.level,
                            levelProgression: datafetchLevel.level.level,
                            avatarUrl: datafetch.avatarUrl,
                            assetsUrl: datafetchLevel.level.assetsUrl,
                            isverified: datafetch.verified,
                            isfollow: true,
                            ispartnered: datafetch.channel.partnered,
                            languageId: datafetch.channel.languageId,
                            createdTimestamp : Date.now()
                        })
                        // Cadatra no banco
                        newuser.save().then(() =>{
                            console.log(`Usuario ${datafetch.username} cadastrado com sucesso no Banco`);
                        }).catch((err)=>{
                            console.log('Houve um erro ao cadastrar usuáriro no Banco de Dados: ' + err)
                        })    
                    }else{
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
                            console.log('Houve um erro ao cadastrar usuáriro no Banco de Dados: ' + err)
                        }) 
                    }
                    // Randomiza as mensagens do array
                    let randomItem = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
                    // Troca o valor userName para o nome do usuario
                    let resultadoMessage = randomItem.replace('userName', `@${data.username}`);
                        socket.call('msg', [resultadoMessage]);
                    })
                });
            }else{
                User.findOne({mixeruserId: data.id}).then(async (user) =>{
                    const mixerFetch = await fetch(`https://mixer.com/api/v1/users/${user.mixeruserId}`)
                    .then((res)=>{
                        return res.json();
                    })
                    .then((datafetch)=>{
                        // Se o usuário upar de nivel, atualiza no banco
                        if(datafetch.level != user.level){
                            user.level = datafetch.level;
                            user.save().then(() =>{
                                console.log(`Nivel de usuario atualizado, agora seu Nivel é: ${user.level}`);
                            }).catch((err)=>{
                                console.log(`Houve um erro ao atualizar o nível de usuario do ${user.username} no Banco de Dados:\n\n ${err}`)
                            })
                        // Se o suaurio alterou sua imagem de perfil
                        }else if(datafetch.avatarUrl != user.avatarUrl){
                            user.avatarUrl = datafetch.avatarUrl;
                            user.save().then(() =>{
                                console.log(`Imagem de usuario atualizado, agora é: ${user.avatarUrl}`);
                            }).catch((err)=>{
                                    console.log(`Houve um erro ao atualizar a imagem de usuario do ${user.username} no Banco de Dados:\n\n ${err}`)
                            })
                        }else if(datafetch.username != user.username){
                            user.username = datafetch.username;
                            user.save().then(() =>{
                                console.log(`Isername de usuario atualizado, agora é: ${user.username}`);
                            }).catch((err)=>{
                                console.log(`Houve um erro ao atualizar o Username do ${user.username} no Banco de Dados:\n\n ${err}`)
                            })
                        }
                    })
                }).catch((erro)=>{
                    console.log('Erro no banco: ' + erro)
                })
            }
        });
    })
     console.log('------------Array----------------')
     for(var i = users.length - 1; i >= 0; i--) {
         //console.log(users[i].username)
         console.log(users[i])
     }
});

// // Tarefa que adiciona X coins aos usuarios logados


// Quando um usuario sai da Live(chat)
socket.on('UserLeave', async data => {
    for(var i = users.length - 1; i >= 0; i--) {
        if(users[i].id === data.id) {
            users.splice(i);
            break;
         }
    }
    console.log(`${data.username} saiu`)
    await console.log(users.length)
  
});


// Listen for socket errors. You will need to handle these here.
socket.on('error', error => {
        console.error('Socket error');
        console.error(error);
});


                                    /*Eventos Carina (Tempo Real)*/

// Quando alguem segue o nosso canal
ca.subscribe(`channel:${channelId}:followed`, data =>{
    console.log("Usuário: " + data.user.id + " - " + "Status: " + data.following)
    User.findOne({mixeruserId: data.user.id}).then(async (user) =>{
        if(user && data.following == false){
            user.isfollow = false;
            user.save().then(() =>{
                socket.call('msg', [`Poxa vida @${user.username} deixou de nos seguir... Falei que estava de Olho 3:) Volte Sempre!!`])
                console.log(`Usuário atualizado, agora seu Status de Seguindo é: ${user.isfollow}`);
            }).catch((err)=>{
                console.log(`Houve um erro ao atualizar o status ${user.isfollow} do usuário ${user.username} no Banco de Dados:\n\n ${err}`)
            })
        }else{
            user.isfollow = true;
            user.save().then(() =>{
                socket.call('msg', [` <3 Iuhu @${user.username} agora é seguidor do Canal. Tô de olho se você continuará hehe <3`])
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

// Evento de quando alguem Usa Skill no canal
ca.subscribe(`channel:${channelId}:skill`, skill =>{
    console.log(skill)
    let coinsToAdd = Math.round((skill.price/roundSkillAndEventsCoins))*5;
    
    // Se a mensagem conter Eventos(GIF, Bola de Praia....)
    if (skill.manifest.type == 'event') {

        // Busca o usuario e insere o log de envio de Eventos so Banco de Dados
        User.findOne({mixeruserId: skill.triggeringUserId}, (err, user) =>{
            if(err) console.log(err)
            if(user){
                const newLog = new Log({
                    mixeruserId: user.mixeruserId,
                    username: user.username,
                    action: 'Uso de Eventos Premiados',
                    category: 'Eventos',
                    message: `Recebeu +${coinsToAdd} moedas ao enviar o Evento de ${skill.price} Sparks em ${moment().format('LLL')}`
                })
                // Salva o LOG no banco de Dados
                newLog.save().then(()=>{
                    console.log('Log de Eventos criado com sucesso')
                }).catch(err => console.log(err))

                socket.call('msg', [`/me Obrigado @${user.username} pelos ${skill.price} Sparks :spark`])
                socket.call('whisper', [user.username, `Voce recebeu +${coinsToAdd} moedas pelos ${skill.price} Sparks doados! Use !coins para saber quantos voce já tem`])
            }
        })
        // Insere o valor gasto do evento ao usuario no Banco
        Money.findOne({mixeruserId: skill.triggeringUserId}, (err, coin) =>{
            if(err) console.log(err);
            coin.coin = coin.coin + coinsToAdd
            coin.save().then(()=>{
                console.log(`Receberá: ${coinsToAdd}`)
                console.log('Moeda do evento adicionada com sucesso')
            }).catch(err => console.log(err))
        })
    }
})

// Evento de quando ficamos online
ca.subscribe(`channel:${channelId}:update`, update =>{
    if(update.online == true){
        isOnline = true
    }
    console.log(update);
    console.log('isOnline é: ' + isOnline);
})

}





// FUNCOES //

function SMSOpenServer(){
    const twilio = require('twilio')(process.env.TWILIO_VOICE_ACCOUNT_SID, process.env.TWILIO_VOICE_TOKEN);
    twilio.messages
    .create({
       body: `[${moment().format('LLL')}] O BOT está ativo agora`,
       from: '+19198085223',
       to: process.env.PHONE_NUMBER
     })
    .then(message => console.log(message.sid));
}

function SMSDownServer(erro){
    const twilio = require('twilio')(process.env.TWILIO_VOICE_ACCOUNT_SID, process.env.TWILIO_VOICE_TOKEN);
    twilio.messages
    .create({
       body: `[${moment().format('LLL')}] O BOT parou de funcionar: ${erro} `,
       from: '+19198085223',
       to: process.env.PHONE_NUMBER
     })
    .then(message => console.log(message.sid));
}

function SMSDownMongo(erro){
    const twilio = require('twilio')(process.env.TWILIO_VOICE_ACCOUNT_SID, process.env.TWILIO_VOICE_TOKEN);
    twilio.messages
    .create({
       body: `[${moment().format('LLL')}] Ocorreu um erro no Bando do BOT: ${erro} `,
       from: '+19198085223',
       to: process.env.PHONE_NUMBER
     })
    .then(message => console.log(message.sid));
}
/** Inicia o dotenv */
require('dotenv').config()

const Mixer = require('@mixer/client-node');
const request = require('request');
const fetch = require('node-fetch');
const channelID = 3553359

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
    let roles = ['Owner','Mod'];
    let gameId = args.join(" ");

    const mixerFetch = await fetch(`https://mixer.com/api/v1/types?query=${gameId}`)
    .then((res)=>{
      return res.json();
    })
    .then(async (datafetch)=>{
        let currentGame = []
        datafetch.forEach((game, index, games) => {
          if (game.name === gameId) {
            currentGame = game
          }
        })
        console.log(currentGame.length)
        if(currentGame.length <= 0) {
            socket.call('whisper', [data.user_name, `jogo ${gameId} não encontrado. Informe um Game igual está na Mixer`]);
        } else {
            const options = {
                url: 'https://mixer.com/api/v1/channels/3553359',
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
                },
                json: true,
                body:{
                    'token': 'https://mixer.com/Felipecss',
                    'typeId': `${currentGame.id}`
                }
            };

            await request(options, async function(req, res) {
                if (res.body.errorCode){
                    await socket.call('whisper', [data.user_name, `Erro ao atualizar o game da Live: ${res.body}`]);
                    console.log(res.body.errorCode);
                } else{
                    await socket.call('whisper', [data.user_name, `Game da Live atualizado!`]);
                }
            });
        }
    })
}
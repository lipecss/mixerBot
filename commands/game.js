/** Inicia o dotenv */
require('dotenv').config()

const Mixer = require('@mixer/client-node');
const request = require('request');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const moment = require('moment')

const Log = require('../models/Log.js')
const channelID = 3553359

exports.run = async (data, args, userId, channelId, socket, msg) => {
    let roles = ['Owner','Mod'];
    let gameId = args.join(" ");

    if(roles.some(r => data.user_roles.includes(r))){
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
    }else{
        socket.call('whisper', [data.user_name, `você nao pode alterar o Game da Live!`]); //Sussurro de erro
        const newLogError = new Log({
            mixeruserId: data.mixeruserId,
            username: data.user_name,
            action: 'Comando Negado',
            category: 'Comando',
            message: `Usuário ${data.user_name} sem permissao tentou usar o comando !game(trocar o game) em ${moment().format('LLL')}`
        })
    
    // Salva o LOG no banco de Dados
        newLogError.save().then(()=>{
            console.log('Log de Erro criado com sucesso')
        }).catch(err => console.log(err))
    }
}
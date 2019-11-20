const Mixer = require('@mixer/client-node');
const fetch = require('node-fetch');
const moment = require("moment")
moment.locale('pt-BR');

const channelID = 3553359
exports.run = async (data, args, userId, channelId, socket, msg) => {

    const mixerFetch = await fetch(`https://mixer.com/api/v1/channels/${channelID}/broadcast`)
    .then((res)=>{
      return res.json();
    })
    .then((datafetch)=>{
        const now = moment(); // Data atual
        const upstream = new Date(datafetch.startedAt); // Passando a String de Inicio para Dada
        const onlyhour = moment(upstream,"HH:mm").format("HH:mm"); // Exbibe apenas as horas
        const date = moment(upstream).format('LL'); // Exbibe apenas a data
        const duration = moment.utc(moment(now,"DD/MM/YYYY HH:mm:ss").diff(moment(upstream,"DD/MM/YYYY HH:mm:ss"))).format("HH:mm") //Duração da Live desde o inicio    
        if(datafetch.error === "Not Found"){
            socket.call('whisper', [data.user_name, `Que pena, nao estamos Online. Fique tranquilo quando ficarmos On voce será notificado. Abraços!`]);
        }else{
            //Start Time: julho 25, 2019 - 1:56 , Stream Length: 2:06
            //console.log("Data atual: " + now.format('HH:mm') + ' tipo: ' + typeof now); //string
            socket.call(`whisper`,[data.user_name,`Iniciado em: ${date} - ${onlyhour}, Duração da Live: ${duration}`]);
        }
    })
}




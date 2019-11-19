const Mixer = require('@mixer/client-node');
const mongoose = require('mongoose');
const moment = require('moment')

const Money = require('../models/Coin.js')
const Log = require('../models/Log.js')

const talkedRecently = new Set();

exports.run = async (client, data, args, userId, channelId, socket, msg) => {
  let valueToGet = parseInt(args[0])
  let userToGet = args[1]
  let number = Math.floor((Math.random() * 100) + 1);
  var rangeNumber = canIGetCoins()

  //Se tentarem roubar de nos as moedas, não será permitido
  if(userToGet == 'Felipecss' || userToGet == 'tonhaosantos') return socket.call('whisper', [data.user_name, `Estamos blindados contra roubo!`])
  if(userToGet == data.user_name) return socket.call('whisper', [data.user_name, ':phils É possivel roubar voce mesmo? Nao!!'])
  
  // Se usuario estiver no array de CoolDown,ele nao poderá usar o comando
  if (talkedRecently.has(data.user_id)) {
    console.log(talkedRecently)
    
        socket.call('msg', [`:stop Espere 15 minutos para poder tentar Roubar moedas @${data.user_name}`]);
  } else {
    if (number % 2 == 0) { // Se for numero Par entao irá retirar
      canIGetCoins(1,10) // Gera a probabildiade de chances de conseguir roubar
      console.log(rangeNumber)
      // Se a probabilidade for de 80% nao irá retirar (Falsa)
      if(rangeNumber >= 1 && rangeNumber <= 8){
        // Busca a pessoa que realizou o comando
        const userCommand = await Money.findOne({mixeruserId: data.user_id}).then((user) =>{
          // Se existir usuario
          if(user){
            // Pegando 5% do valor informado Ex: 5000 = 250
            var result = Math.round((valueToGet * 5)/ 100);

            // Se o valor dos 5% for menor ou igual ao saldo de moedas da pessoa que realizou o comando
            if(result <= user.coin){
              // Retira esse valor do usuario.
              user.coin -= result
              user.save().catch(err => console.log(err))

              // Envia no chat a confirmação que o usuario perdeu X moedas por nao ter conseguido
              socket.call('msg', [`/me Que pena @${data.user_name}, voce tentou roubar moedas mas nao obteve sucesso e perdeu 5% do valor informado, de suas moedas!`])
              
            }else{
              // Caso o valor dos 5% seja maior do que o usuario tenha
              console.log(`${data.user_name} tem ${user.coin} e nao da para perder ${result}`)
            }         
            console.log('aqui 80%')
            // Cria o LOG de falha no roubo
            createFailureLog(data, result, valueToGet, user.username)
          }else{
            //Se nao existir o usuario

          }
        }).catch((err) => {console.log(err)})

      // Se a probabildiade for de 20% irá retirar (Verdadeira)
      }else if(rangeNumber >= 8 && rangeNumber <= 10){
        // Busca o usuario digitado no comando
        const user = await Money.findOne({username: userToGet}).then(async (whoToGet) =>{
          console.log(whoToGet)
          console.log('aqui 20%')
          // Se o valor digitado é menor ou igual ao saldo de quem será roubado
          if(whoToGet.coin >= valueToGet){
            // Envia no chat a confirmação que o usuario perdeu X moedas por nao ter conseguido
            socket.call('msg', [`:swag @${data.user_name} roubou ${valueToGet} moedas`])
            
            // Retira do usuario informado o valor de moedas
            whoToGet.coin -= valueToGet
            await whoToGet.save().catch(err => console.log(err))

            // Adiciona o valor ao usuario que usou o comando
            const userCommand = await Money.findOne({mixeruserId: data.user_id})

            userCommand.coin += valueToGet
            await userCommand.save().catch(err => console.log(err))
            // Cria o LOG de sucesso no roubo
            createSuccessLog(data,valueToGet, whoToGet.username)
          }else{
            // Pegando 5% do valor informado Ex: 5000 = 250
            var result = Math.round((valueToGet * 5)/ 100);

            const userCommand = await Money.findOne({mixeruserId: data.user_id})
            // Se o valor dos 5% for menor ou igual ao saldo de moedas da pessoa que realizou o comando
            if(result <= userCommand.coin){
              // Retira esse valor do usuario.
              userCommand.coin -= result
              userCommand.save().catch(err => console.log(err))
              socket.call('msg', [`Pegando 5% do valor`])
            }else{
              var result2 = Math.round((userCommand.coin * 5)/ 100);
              // Caso o valor dos 5% seja maior do que o usuario tenha, retira 5% do saldo dele
              userCommand.coin -= result2
              userCommand.save().catch(err => console.log(err))
              console.log('Saldo em conta é menor entao sera retirado 5% do saldo atual', result2)
            }  
          }
        }).catch((err) => {console.log(err)})
      }
    }
    else {
      console.log('numero impar', number)
    }
    // Add o usuario ao array e seta que ele nao pode usar o comando por 15 minutos
    talkedRecently.add(data.user_id);
    setTimeout(() => {
      // Remove o usuario do array e permite ele usar novamente.
      talkedRecently.delete(data.user_id);
    }, 900000);
  }
}

function canIGetCoins(){
  let max = 10
  let min = 1
  var randomNumber = Math.floor(Math.random() * max) + min // Probabilidade de poder roubar moedas 80% nao e 20% sim
  return randomNumber;
}

function createSuccessLog(data, coin, userToGet){
  const newSuccessLog = new Log({
    mixeruserId: data.mixeruserId,
    username: data.user_name,
    action: 'Roubar Moedas (Sucesso)',
    category: 'Comando',
    message: `Usuário ${data.user_name} obteve sucesso ao roubar ${coin} moedas do ${userToGet} em ${moment().format('LLL')}`
})
  // Salva o LOG no banco de Dados
  newSuccessLog.save().then(()=>{
    console.log('Log de Roubo com sucesso criado com sucesso')
  }).catch(err => console.log(err))
}

function createFailureLog(data, fivePerCent, coin, userToGet){
  const newFailuresLog = new Log({
    mixeruserId: data.mixeruserId,
    username: data.user_name,
    action: 'Roubar Moedas (Falha)',
    category: 'Comando',
    message: `${data.user_name} perdeu ${fivePerCent} moedas ao tentar roubar ${coin} moedas do ${userToGet} em ${moment().format('LLL')}`
})
  // Salva o LOG no banco de Dados
  newFailuresLog.save().then(()=>{
    console.log('Log de Falha no Roubo criado com sucesso')
  }).catch(err => console.log(err))
}
const Mixer = require('@mixer/client-node');
const mongoose = require('mongoose');
const moment = require('moment')

const Money = require('../models/Coin.js')
const Log = require('../models/Log.js')

const talkedRecently = new Set();

exports.run = async (data, args, userId, channelId, socket, msg) => {
  let valueToGet = parseInt(args[0])
  let number = Math.floor((Math.random() * 100) + 1);
  var rangeNumber = canIGetCoins()

  if(!valueToGet) return socket.call('whisper', [data.user_name, `Informe o valor a ser reoubado!`]);
  // Se usuario estiver no array de CoolDown,ele nao poderá usar o comando
  if (talkedRecently.has(data.user_id)) {
    console.log(talkedRecently)
    socket.call('msg', [`:stop Espere 15 minutos para poder tentar Roubar moedas @${data.user_name}`]);
  } else {
    // Pega o tamanho de itens em Money
    const whoToGet = await Money.countDocuments()
    //Embaralha os valores
    var random = Math.floor(Math.random() * whoToGet)
    // Retorna um usuario.
    const Randomuser = await Money.findOne().skip(random)
    console.log('Pessoa selcionada: ', Randomuser)
    console.log('RandomUser é: ', typeof(Randomuser))

    // Verifica se tirou ele mesmo
    if(Randomuser.username == data.user_name){
        socket.call('msg', ['Azarado voce tirou voce mesmo!'])
        console.log('Azarado voce tirou voce mesmo!')
    }else{
        // Se for numero Par entao irá retirar
        if (number % 2 == 0) {
            // Gera a probabildiade de chances de conseguir roubar
            canIGetCoins(1,10)
            socket.call('msg', [`Ah que pena @${data.user_name}, voce nao conseguiu roubar ninguem!`])
            // Se a probabilidade for de 80% nao irá retirar (Falsa)
            if(rangeNumber >= 1 && rangeNumber <= 8){
                console.log('80%', rangeNumber)

                // Busca a pessoa que realizou o comando
                const userCommand = await Money.findOne({mixeruserId: data.user_id}, (err, user) => {
                    // Pegando 5% do valor informado Ex: 5000 = 250
                    var result = Math.round((valueToGet * 5)/ 100);
                    console.log('valor a retirar: ', result)
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
                })

            // Se a probabildiade for de 20% irá retirar (Verdadeira)
            }else{
              // Busca o usuario digitado no comando
              const user = await Money.findOne({username: Randomuser.username}).then(async (whoToGet) =>{
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
            console.log(`${number} é Par`)
        }else{
          socket.call('msg', [`@${data.user_name}, sua tentantiva de roubar nao deu certo!`])
          console.log(`${number} é Impar`)
        }
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
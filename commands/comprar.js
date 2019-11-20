const Mixer = require('@mixer/client-node');
const mongoose     = require('mongoose');
const moment = require('moment')

const Money = require('../models/Coin.js')
const Store = require('../models/Store.js')
const Log = require('../models/Log.js')

exports.run = async (data, args, userId, channelId, socket, msg) => {
    let productToFind = args[0].trim()
    let product = await Store.findOne({productId: productToFind , isAvailable: true})
    if(!product) return socket.call('msg', [`Ah que Pena, esse produto nao foi encontrado ou pode ter acabado @${data.user_name}.Aguarde ele voltar`])
        if(product && product.amount >=1){
            Money.findOne({mixeruserId: data.user_id}, async (err, coin) =>{
                if(err) console.log(err);
                if(coin.coin >= product.value){
                    //Retira 1 item do produto
                    product.amount -= 1;
                    product.save().then(() =>{
                        // Se chegar a ficar 0, desabilito o produto
                        if(product.amount == 0){
                            product.isAvailable = false;
                            product.save()
                        }

                        // Cria o LOG de sucesso na compra
                        createSuccessLog(data, product)
                    }).catch((err)=>{
                        // Cria o LOG de erro na compra
                        createFailureLog(data, product, err)
                        console.log(`erro ao comprar ${err}`)
                    })
                    coin.coin -= product.value
                    coin.save().catch(err => console.log(err))
                    socket.call('msg', [`Parabéns @${data.user_name} adiquiriu 1 '${product.name}' da Loja`])
                    socket.call('whisper', [data.user_name,`Informe pelo chat ou por Email que realizou a troca para receber o produto.`])
                }else{
                    socket.call('whisper', [data.user_name,`Voce precisa de mais ${(product.value - coin.coin).toLocaleString('pt-BR')} moedas para comprar esse item :phils`])
                }
            })
        }else{
            socket.call('msg', [`@${data.user_name}, esse produto nao está disponível para comprar`])
        }
}

function createSuccessLog(data, product){
    const newSuccessLog = new Log({
      mixeruserId: data.mixeruserId,
      username: data.user_name,
      action: 'Comprar Produtos (Sucesso)',
      category: 'Comando',
      message: `Usuário ${data.user_name} comprou com sucesso o produto '${product.name}' em ${moment().format('LLL')}`
  })
    // Salva o LOG no banco de Dados
    newSuccessLog.save().then(()=>{
      console.log('Log de Compra criado com sucesso')
    }).catch(err => console.log(err))
  }
  
  function createFailureLog(data, product, err){
    const newFailuresLog = new Log({
      mixeruserId: data.mixeruserId,
      username: data.user_name,
      action: 'Comprar Produtos (Falha)',
      category: 'Comando',
      message: `${data.user_name} tentou comprar o item '${product.name}' em ${moment().format('LLL')} mas obteve o erro ${err}`
  })
    // Salva o LOG no banco de Dados
    newFailuresLog.save().then(()=>{
      console.log('Log de Falha no Roubo criado com sucesso')
    }).catch(err => console.log(err))
  }
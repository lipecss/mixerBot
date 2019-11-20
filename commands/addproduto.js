const Mixer = require('@mixer/client-node');
var crypto = require('crypto');
const mongoose     = require('mongoose');
const moment = require('moment')


const Log = require('../models/Log.js')
const Store = require('../models/Store.js')

exports.run = async (data, args, userId, channelId, socket, msg) => {
    let roles = [
        'Owner', 
        'Mod'
    ];

    //Com o Pipe
    let msgSplitada = msg.replace('!addproduto','').split("|");
    let productName = msgSplitada[0];
    let producutValue = msgSplitada[1]
    let productCategory = msgSplitada[2]
    let productAmount = msgSplitada[3]

    // let productName = msg.split(/(\.|)\w+/)[0].replace('!addproduto','');
    // let producutValue = msg.split(/[^0-9]+/)[1]
    // let productCategory = msg.split(/\d+/)[1]
    // let productAmount = msg.split(/[^0-9]+/)[2]

    if(!productName ) return socket.call('whisper', [data.user_name, `informe um nome do produto`]) 
    if(!producutValue ) return socket.call('whisper', [data.user_name, `informe o valor`])
    if(!productCategory ) return socket.call('whisper', [data.user_name, `informe a categoria`])
    if(!productAmount ) return socket.call('whisper', [data.user_name, `Falta a quantidade EX: Game Pass | 1000 | Subs | 4`])
    if(roles.some(r => data.user_roles.includes(r))){
        Store.findOne({name: titleize(productName.trim())}, async (err, product) =>{
            if(err) console.log(err);
            if(product){
                await socket.call('whisper', [data.user_name, `Esse produto já existe`]); 
                await socket.call('whisper', [data.user_name, `ID: ${product.productId}`]);
                await socket.call('whisper', [data.user_name, `Nome: ${product.name}`]);
                await socket.call('whisper', [data.user_name, `Valor: ${product.value.toLocaleString('pt-BR')} moedas`]);
                await socket.call('whisper', [data.user_name, `Quantidade: ${product.amount}`]);

            }else{
                const newProduct = new Store({
                    productId: randomValueHex(12),
                    name: titleize(productName.trim()),
                    value: producutValue,
                    category: productCategory,
                    amount: productAmount
                })
                newProduct.save().then(()=>{
                    socket.call('whisper',[data.user_name,'Produto criado com sucesso :salute'])
                }).catch(err => console.log(err))

                const newLog = new Log({
                    mixeruserId: data.user_id,
                    username: data.user_name,
                    action: 'Comando !addproduto utilizado',
                    category: 'Comando',
                    message: `${data.user_name} adicionou "${titleize(productName.trim())}" na loja em ${moment().format('LLL')}`
                })
                // Salva o LOG no banco de Dados
                newLog.save().then(()=>{
                    console.log('Log de Eventos criado com sucesso')
                }).catch(err => console.log(err))
            }
        })
    }else{
        socket.call('whisper', [data.user_name, `você nao tem cargo para adicionar produtos na Loja!`]); //Sussurro de erro
        const newLogError = new Log({
            mixeruserId: data.user_id,
            username: data.user_name,
            action: 'Comando Negado',
            category: 'Comando',
            message: `Usuário ${data.user_name} sem permissao tentou usar o comando !addprodutos em ${moment().format('LLL')}`
        }) 

        // Salva o LOG no banco de Dados
        newLogError.save().then(()=>{
            console.log('Log de Erro criado com sucesso')
        }).catch(err => console.log(err))
    }
}

function randomValueHex (len) {
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len);   // return required number of characters
}

function titleize(text) {
    var loweredText = text.toLowerCase();
    var words = loweredText.split(" ");
    for (var a = 0; a < words.length; a++) {
        var w = words[a];

        var firstLetter = w[0];
        w = firstLetter.toUpperCase() + w.slice(1);

        words[a] = w;
    }
    return words.join(" ");
}
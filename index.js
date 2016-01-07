var fs = require('fs');
var draft = './draft';
var remove = require('rimraf');
var randomstring = require("randomstring");
var readline = require('readline');

/********** CONFIG **************/
var spoil = false;
var mythicRatio = 0.09375; // => 4 / 32
var foilRatio = 0.1875; // 6 / 32
/********************************/

if(fs.existsSync(draft)){
    console.log('Removing old draft');
    remove.sync(draft);
}
var set = fs.readdirSync('./set');
var common = {
    cards: fs.readdirSync('./set/common'),
    rarety: '0',
    path: 'common'
}
var unco = {
    cards: fs.readdirSync('./set/unco'),
    rarety: '1',
    path: 'unco'
}
var rare = {
    cards: fs.readdirSync('./set/rare'),
    rarety: '2',
    path: 'rare'
}
var mythic = {
    cards: fs.readdirSync('./set/mythic'),
    rarety: '3',
    path: 'mythic'
}

function getCard(typeFolder, path){
    var cardIndex = Math.round(Math.random() * (typeFolder.length - 1));
    var cardName = typeFolder[cardIndex];
    return './set/'+ path + '/' + cardName
}

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
var format;
rl.question("Want to do a draft or a sealed?: ", function(format) {
    rl.question("Write the name of all player separated with one space: ", function(answer) {
        startComputingBoosters(answer.split(' '), format);
        rl.close();
    });
});

function startComputingBoosters(players, format) {
    var numberOfPlayer = parseInt(players.length);
    console.log(format + " for " + numberOfPlayer + " players");
    var numberOfBooster = format === 'draft' ? 3 : 6;
    fs.mkdirSync(draft);
    var myticSpoil = 0
    for(var i = 0; i < numberOfPlayer; i++){
        var currentPlayer = players[i]
        console.log('Making ' + currentPlayer + "'s boosters");
        var playerRepo = draft + '/' + currentPlayer
        var boosterDir = playerRepo + '/booster';
        fs.mkdirSync(playerRepo)
        for(var booster = 1; booster <= numberOfBooster; booster++){
            var currentBooster = boosterDir + booster
            fs.mkdirSync(currentBooster);
            var cardAmount = 14;
            if (Math.random() < foilRatio) {
                cardAmount = 15;
            }
            for(var card = 0; card < cardAmount; card+=1) {
                var cardObj
                var foilModif = false
                if (card < 10) {
                    cardObj = common;
                } else if (card < 13) {
                    cardObj = unco;
                } else if (card < 14) {
                    cardObj = rare;
                    if (Math.random() < mythicRatio) {
                        myticSpoil++
                        cardObj = mythic;
                    }
                } else {
                    var foilCard = Math.random() * (common.cards.length + unco.cards.length + rare.cards.length + mythic.cards.length - 1) + 1
                    if (foilCard <= common.cards.length) {
                        cardObj = common;
                    } else if (foilCard <= common.cards.length + unco.cards.length) {
                        cardObj = unco;
                    } else if (foilCard <= common.cards.length + unco.cards.length + rare.cards.length) {
                        cardObj = rare;
                    } else {
                        cardObj = mythic;
                    }
                    foilModif = true;
                }
                var cardPath = getCard(cardObj.cards, cardObj.path);
                var readStream = fs.createReadStream(cardPath);
                var rsPath = currentBooster + "/" + cardObj.rarety + '-' + randomstring.generate(13) + '.png';
                if (foilModif) {
                    rsPath = currentBooster + "/" + '4-' + randomstring.generate(13) + '.png';
                }
                //bug ici car non synchrone
                readStream.pipe(fs.createWriteStream(rsPath));
                readStream.on('error', function(err) {
                    console.log(cardIndex, cardName, path);
                    console.log(err);
                });
            }
            var cardList = fs.readdirSync(currentBooster);
            console.log(cardList);
            if (cardList.length === 15) {
                var cardToRemove = cardList[0];
                console.log(cardToRemove);
                console.log(currentBooster + '/' + cardToRemove);
                fs.unlinkSync(currentBooster + '/' + cardToRemove);
            }
        }
    }
    if (spoil) {
        console.log('There is ' + myticSpoil + ' mythics in this draft!');
    }
}

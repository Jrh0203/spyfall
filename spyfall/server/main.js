function cleanUpGamesAndPlayers(){
  var cutOff = moment().subtract(2, 'hours').toDate().getTime();

  var numGamesRemoved = Games.remove({
    createdAt: {$lt: cutOff}
  });

  var numPlayersRemoved = Players.remove({
    createdAt: {$lt: cutOff}
  });
}

function getRandomLocation(){
  var locationIndex = Math.floor(Math.random() * locations.length);
  return locations[locationIndex];
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function assignRoles(players, location){
  var default_role = location.roles[location.roles.length - 1];
  var roles = location.roles.slice();
  var shuffled_roles = shuffleArray(roles);
  var role = null;

  players.forEach(function(player){
    if (!player.isSpy){
      role = shuffled_roles.pop();

      if (role === undefined){
        role = default_role;
      }

      Players.update(player._id, {$set: {role: role}});
    }
  });
}

Meteor.startup(function () {
  // Delete all games and players at startup
  Games.remove({});
  Players.remove({});
});

var MyCron = new Cron(60000);

MyCron.addJob(5, cleanUpGamesAndPlayers);

Meteor.publish('games', function(accessCode) {
  return Games.find({"accessCode": accessCode});
});

Meteor.publish('players', function(gameID) {
  return Players.find({"gameID": gameID});
});

function getConfig(numPlayers) {
  var gameConfig = 
    [
    null,
    { 
      good: 1,
      evil: 0
    },
    null,
    null,
    null,
    {
      good: 3,
      evil: 2
    },
    { 
      good: 4,
      evil: 2
    },
    {
      good: 4,
      evil: 3
    },
    { 
      good: 5,
      evil: 3
    },
    { 
      good: 6,
      evil: 3
    },
    { 
      good: 6,
      evil: 4
    }
    ];

    return gameConfig[numPlayers].good;
}

function getNumBad(numPlayers)
{
  return Math.ceil(numPlayers/3);
}
function getNumGood(numPlayers)
{
  return numPlayers-Math.ceil(numPlayers/3);
}

//****
Games.find({"state": 'settingUp'}).observeChanges({
  added: function (id, game) {
    var location = getRandomLocation();
    var players = Players.find({gameID: id});
    //window.alert(players);
    //console.log(players)
    var gameEndTime = moment().add(game.lengthInMinutes, 'minutes').valueOf();
    console.log(getNumBad(players.count()));
    var mordred = Math.floor(Math.random() * players.count());
  if (players.count()>4)
  {
    var merlin = Math.floor(Math.random() * players.count());
    while (merlin==mordred)
    {
      merlin = Math.floor(Math.random() * players.count());
    }
    var percival = Math.floor(Math.random() * players.count());
    while (percival==mordred||percival==merlin)
    {
      percival = Math.floor(Math.random() * players.count());
    }
    var morgana = Math.floor(Math.random() * players.count());
    while (morgana==mordred||morgana==merlin||morgana==percival)
    {
      morgana = Math.floor(Math.random() * players.count());
    }
    var normBad1 = Math.floor(Math.random() * players.count());
    while (normBad1==mordred||normBad1==merlin||normBad1==percival||normBad1==morgana)
    {
      normBad1 = Math.floor(Math.random() * players.count());
    }
    var normBad2 = Math.floor(Math.random() * players.count());
    while (normBad2==mordred||normBad2==merlin||normBad2==percival||normBad2==morgana)
    {
      normBad2 = Math.floor(Math.random() * players.count());
    }
  }
  else
  {
    mordred = 0;
    var merlin = 1;
    var normBad1 = 2;
  }
    

    var firstPlayerIndex = Math.floor(Math.random() * players.count());
    //console.log("lookhere");
    //console.log(players);
    players.forEach(function(player, index){
      Players.update(player._id, {$set: {
        isMordred: index===mordred,
        isMorgana: index===morgana,
        isMerlin: index===merlin,
        isPercival: index===percival,
        isGoodLancelot: false,
        isBadLancelot: false,
        isEvil: index===mordred||index===morgana||index===normBad1||(index===normBad2&&players.count()==10),
        isGood: !(index===mordred||index===morgana||index===normBad1||(index===normBad2&&players.count()==10)),
        isSpy: false,
        isFirstPlayer: index === firstPlayerIndex,
      }});
    });

    assignRoles(players, location);

    Games.update(id, {$set: {state: 'inProgress', location: location, endTime: gameEndTime, paused: false, pausedTime: null}});
  }
});
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const minecraftData = require('minecraft-data');

// Generate a random username for the bot
function generateRandomUsername() {
  const adjectives = ['Fast', 'Smart', 'Mighty', 'Sneaky', 'Happy', 'Crazy', 'Brave'];
  const nouns = ['Bot', 'Explorer', 'Miner', 'Jumper', 'Runner', 'Digger', 'Guardian'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}${noun}${number}`;
}

// Minecraft server credentials
const serverOptions = {
  host: 'localhost',
  port: 1111,
  username: generateRandomUsername(),
  version: false,
};

// Create the bot
const bot = mineflayer.createBot(serverOptions);
bot.loadPlugin(pathfinder);

// Function to follow the player "glitchoff"
function followGlitchoff() {
  const mcData = minecraftData(bot.version);
  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);

  const checkGlitchoffEntity = () => {
    const player = bot.players['glitchoff'];

    if (!player || !player.entity) {
      setTimeout(checkGlitchoffEntity, 1000);
      return;
    }

    bot.chat('Following glitchoff');
    const goal = new goals.GoalFollow(player.entity, 1); // Follow with 1 block distance
    bot.pathfinder.setGoal(goal, true);
  };

  checkGlitchoffEntity();
}

// Function to detect and attack nearby hostile mobs
function protectGlitchoff() {
  const attackRadius = 10;
  const player = bot.players['glitchoff'];

  if (!player || !player.entity) return;

  // List of hostile mobs
  const hostileMobs = ['zombie', 'skeleton', 'spider', 'creeper', 'witch', 'enderman', 'drowned', 'husk'];

  const nearbyHostileMob = bot.nearestEntity((entity) => {
    if (hostileMobs.includes(entity.name)) {
      const distance = entity.position.distanceTo(player.entity.position);
      return distance <= attackRadius;
    }
    return false;
  });

  if (nearbyHostileMob) {
    bot.chat(`Attacking ${nearbyHostileMob.name} to protect glitchoff!`);
    bot.pvp.attack(nearbyHostileMob); // Attack the mob
  }
}

// Event handlers
bot.on('login', () => {
  console.log(`Bot logged in as ${bot.username}`);
});

bot.on('spawn', () => {
  console.log('Bot has spawned in the world.');
  followGlitchoff();
});

// Automatically try to follow and protect glitchoff if they respawn, re-enter, or if the bot respawns
bot.on('playerJoined', (player) => {
  if (player.username === 'glitchoff') {
    console.log('glitchoff joined the server, following and protecting...');
    followGlitchoff();
  }
});

bot.on('respawn', () => {
  console.log('Bot respawned, resuming follow and protection...');
  followGlitchoff();
});

// Check for hostile mobs every 1 second
setInterval(() => {
  protectGlitchoff();
}, 1000);

// Chat command to stop following
bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  console.log(`<${username}>: ${message}`);

  if (message === 'stop') {
    bot.pathfinder.setGoal(null); // Stop following
    bot.chat('Stopped following.');
  }
});

// Error handling
bot.on('kicked', (reason) => {
  console.log('Bot was kicked:', reason);
});

bot.on('error', (err) => {
  console.error('An error occurred:', err);
});

bot.on('end', () => {
  console.log('Bot disconnected from the server.');
});

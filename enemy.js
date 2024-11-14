const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const minecraftData = require('minecraft-data');
const pvp = require('mineflayer-pvp').plugin;

// Generate a random username for the bot
function generateRandomUsername() {
  const adjectives = ['Dark', 'Evil', 'Angry', 'Aggressive', 'Fierce', 'Vicious'];
  const nouns = ['Warrior', 'Bandit', 'Enemy', 'Hunter', 'Fighter', 'Assailant'];
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

// Create the enemy bot
const bot = mineflayer.createBot(serverOptions);
bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp);

// Attack radius for the bot to engage in PvP
const attackRadius = 10;
const targetPlayers = ['glitchoff', 'abhinaycraft'];

// Equip a weapon if available
async function equipWeapon() {
  const weapon = bot.inventory.items().find(item => item.name.includes('sword') || item.name.includes('axe'));
  if (weapon) {
    try {
      await bot.equip(weapon, 'hand');
      bot.chat(`Equipped ${weapon.displayName}`);
    } catch (err) {
      console.error('Failed to equip weapon:', err);
    }
  }
}

// Function to find the nearest target player
function findNearestPlayer() {
  const target = bot.players[targetPlayers.find(name => bot.players[name] && bot.players[name].entity)];
  if (target && target.entity) {
    const distance = bot.entity.position.distanceTo(target.entity.position);
    if (distance <= attackRadius) {
      return target.entity;
    }
  }
  return null;
}

// Function to engage in combat
function engageInCombat() {
  const targetEntity = findNearestPlayer();
  if (targetEntity) {
    bot.chat(`Engaging in combat with ${targetEntity.username}`);
    bot.pvp.attack(targetEntity);
  } else {
    bot.pvp.stop();
  }
}

// Event handlers
bot.on('login', () => {
  console.log(`Enemy Bot logged in as ${bot.username}`);
});

bot.on('spawn', async () => {
  console.log('Enemy Bot has spawned.');
  await equipWeapon(); // Equip a weapon if available
  setInterval(engageInCombat, 1000); // Check for combat every second
});

bot.on('playerJoined', async (player) => {
  if (targetPlayers.includes(player.username)) {
    console.log(`${player.username} joined the server. Preparing for combat...`);
    await equipWeapon();
  }
});

// Automatically stop PvP when no players are in range
bot.on('playerLeft', (player) => {
  if (targetPlayers.includes(player.username)) {
    bot.pvp.stop();
    bot.chat(`${player.username} left. Stopping combat.`);
  }
});

// Chat commands for testing
bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  if (message === 'stop') {
    bot.pvp.stop();
    bot.chat('Stopped attacking.');
  }
});

// Error handling
bot.on('kicked', (reason) => {
  console.log('Enemy Bot was kicked:', reason);
});

bot.on('error', (err) => {
  console.error('An error occurred:', err);
});

bot.on('end', () => {
  console.log('Enemy Bot disconnected from the server.');
});

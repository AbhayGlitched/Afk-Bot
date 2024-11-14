const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const minecraftData = require('minecraft-data');
const pvp = require('mineflayer-pvp').plugin;

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
bot.loadPlugin(pvp);

// Function to follow the player "abhinaycraft"
function followAbhinaycraft() {
  const mcData = minecraftData(bot.version);
  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);

  const checkAbhinaycraftEntity = () => {
    const player = bot.players['abhinaycraft'];

    if (!player || !player.entity) {
      setTimeout(checkAbhinaycraftEntity, 1000);
      return;
    }

    bot.chat('Following abhinaycraft');
    const goal = new goals.GoalFollow(player.entity, 4); // Follow with 1 block distance
    bot.pathfinder.setGoal(goal, true);
  };

  checkAbhinaycraftEntity();
}

// Function to detect and attack nearby hostile mobs
function protectAbhinaycraft() {
  const attackRadius = 10;
  const player = bot.players['abhinaycraft'];

  if (!player || !player.entity) return;

  const hostileMobs = ['zombie', 'skeleton', 'spider', 'creeper', 'witch', 'enderman', 'drowned', 'husk'];

  const nearbyHostileMob = bot.nearestEntity((entity) => {
    if (hostileMobs.includes(entity.name)) {
      const distance = entity.position.distanceTo(player.entity.position);
      return distance <= attackRadius;
    }
    return false;
  });

  if (nearbyHostileMob) {
    bot.chat(`Attacking ${nearbyHostileMob.name} to protect abhinaycraft!`);
    bot.pvp.attack(nearbyHostileMob);
  }
}

// Function to equip a sword
async function equipSword() {
  const sword = bot.inventory.items().find(item => item.name.includes('sword'));
  if (sword) {
    try {
      await bot.equip(sword, 'hand');
      bot.chat(`Equipped ${sword.displayName}`);
    } catch (err) {
      console.error('Failed to equip sword:', err);
    }
  }
}

// Function to pick up nearby dropped items
function pickupDroppedItems() {
  bot.on('entitySpawn', async (entity) => {
    if (entity.objectType === 'Item') {
      const item = entity.metadata[7]?.itemId;
      const mcData = minecraftData(bot.version);
      const itemName = item ? mcData.items[item]?.name : null;

      if (itemName && itemName.includes('sword')) {
        bot.chat('Sword detected nearby, picking it up...');
        try {
          await bot.lookAt(entity.position, true);
          bot.pathfinder.setGoal(new goals.GoalNear(entity.position.x, entity.position.y, entity.position.z, 1));
          
          bot.on('goal_reached', async () => {
            try {
              await bot.collectBlock.collect(entity);
              bot.chat('Sword picked up!');
              equipSword(); // Equip the sword once picked up
            } catch (err) {
              console.error('Failed to collect sword:', err);
            }
          });
        } catch (err) {
          console.error('Failed to detect and pick up item:', err);
        }
      }
    }
  });
}

// Event handlers
bot.on('login', () => {
  console.log(`Bot logged in as ${bot.username}`);
});

bot.on('spawn', () => {
  console.log('Bot has spawned in the world.');
  followAbhinaycraft();
  pickupDroppedItems();
});

// Automatically try to follow and protect "abhinaycraft" if they respawn, re-enter, or if the bot respawns
bot.on('playerJoined', (player) => {
  if (player.username === 'abhinaycraft') {
    console.log('abhinaycraft joined the server, following and protecting...');
    followAbhinaycraft();
  }
});

bot.on('respawn', () => {
  console.log('Bot respawned, resuming follow and protection...');
  followAbhinaycraft();
});

// Check for hostile mobs every 1 second
setInterval(() => {
  protectAbhinaycraft();
}, 1000);

// Chat command to stop following
bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  console.log(`<${username}>: ${message}`);

  if (message === 'stop') {
    bot.pathfinder.setGoal(null);
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

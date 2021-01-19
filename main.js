const discord = require('discord.js');
const fs = require("fs");
const intents = new discord.Intents([
    discord.Intents.NON_PRIVILEGED,
    "GUILD_MEMBERS",
]);
const bot = new discord.Client({ ws: { intents } });
if (!fs.existsSync("config.json")) {
    console.error("Please create config.json file config.json.exemple is an exemple");
}
var config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
var guilds = JSON.parse(fs.readFileSync("./guilds.json", "utf8"));
bot.on('ready', () => {
    console.log('Bot is online !');
    bot.user.setActivity("!help");
    weekMessage();
    unMuteTimeout();
    reloadCoolDown();
    reloadConfig();
});
function reloadConfig() {
    for (guildID in guilds) {
        bot.guilds.fetch(guildID).then((guild) => {
            guild.members.fetch().then((members) => {
                members.each(member => {
                    if (!member.user.bot && !(member.id in guilds[guildID].users)) guilds[guildID].users[member.id] = {points: 0,objects: {}};
                });
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            }).catch(console.error);
        }).catch(console.error);
    }
}
bot.on("guildCreate", (guild) => {
    guilds[guild.id] = {maxrarity: 0,objects: {},users: {}};
    guild.members.fetch().then((members) => {
        members.each(member => {
            if (!member.user.bot && !(member.id in guilds[guildID].users)) guilds[guildID].users[member.id] = {points: 0,objects: {}};
        });
        fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
    }).catch(console.error);
    fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
});
bot.on("guildDelete", (guild) => {
    delete guilds[guild.id];
    fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
});
bot.on("guildMemberAdd", (member) => {
    guilds[member.guild.id].users[member.id] = {points: 0,objects: {}};
    fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
});
bot.on("guildMemberRemove", (member) => {
    delete guilds[member.guild.id].users[member.id];
    fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
});
bot.on('message', (message) => {
    if (message.content.startsWith("!help") || message.content.startsWith("!h")) {
        message.channel.send("Gagne un item(toute les 2 heures) random avec la commande `!peche`.\n" +
            "Gagne 80 points(toute les 5 heures) avec la commande `!combat`.\n" +
            "Montre tout les items qu'il y a au marcher avec la commande `!shop`.\n" +
            "Affiche tes points et tes objets avec la commande `!bank`.\n" +
            "Achette un item avec la commande `!buy [quantity] <name>`.\n" +
            "Utilise un item avec la commande `!use <name> [user]`.\n" +
            "Affiche le classeent général du serveur avec la commande `!leaderboard`.\n" +
            "Pour plus d'information sur un item utilise la commande `!info <name>`.\n" +
            'Echanger quelque chose avec la commande `!trade <count> <item> or "points" <user> <count> <item> or points`\n' +
            'Donne quelque chose avec la commande `!give <count> <item> or "points" <user>`\n');
    }else if (message.content.startsWith("!shop") || message.content.startsWith("!s")) {
        var msg = "__**Objets en vente:**__\n\n";
        if (message.guild.id in guilds) {
            var objects = guilds[message.guild.id].objects;
            for (var key in objects) {
                if (objects[key].buyable) {
                    msg += "" + objects[key].cost + "⚔️ - " + key + "\n" + objects[key].description + "\n\n";
                }
            }
            if (msg === "__**Objets en vente:**__\n\n") {
                message.channel.send("Il n'y a aucun item à acheter sur ce serveur");
            }else {
                message.channel.send(msg);
            }
        }else {
            message.channel.send("Il n'y a aucun item sur ce serveur");
        }
    }else if (message.content.startsWith("!buy")) {
        if (message.content.split(" ").length === 3) {
            var quantity = parseInt(message.content.split(" ")[1]);
            var name = message.content.split(" ")[2];
            if (name.length > 0) {
                name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            }
            if (name in guilds[message.guild.id].objects) {
                if (guilds[message.guild.id].objects[name].buyable) {
                    var object = guilds[message.guild.id].objects[name];
                    var user = guilds[message.guild.id].users[message.author.id];
                    if (user.points >= object.cost * quantity) {
                        user.points -= object.cost * quantity;
                        if (name in user.objects) {
                            user.objects[name] += quantity;
                        }else {
                            user.objects[name] = quantity;
                        }
                        message.channel.send("Tu as achetter " + quantity + " " + name);
                    }else {
                        message.channel.send("Tu n'as pas assez de ⚔️");
                    }
                }else {
                    message.channel.send("L'objet n'est pas achetable");
                }
            }else {
                message.channel.send("L'objet n'existe pas");
            }
        }else if (message.content.split(" ").length === 2) {
            var name = message.content.split(" ")[1];
            if (name.length > 0) {
                name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            }
            if (name in guilds[message.guild.id].objects) {
                if (guilds[message.guild.id].objects[name].buyable) {
                    var object = guilds[message.guild.id].objects[name];
                    var user = guilds[message.guild.id].users[message.author.id];
                    if (user.points >= object.cost) {
                        user.points -= object.cost;
                        if (name in user.objects) {
                            user.objects[name] += 1;
                        }else {
                            user.objects[name] = 1;
                        }
                        message.channel.send("Tu as achetter 1 " + name);
                    }else {
                        message.channel.send("Tu n'as pas assez de ⚔️");
                    }
                }else {
                    message.channel.send("L'objet n'est pas achetable");
                }
            }else {
                message.channel.send("L'objet n'existe pas");
            }
        }else {
            message.channel.send("La commande n'est pas valide");
        }
        fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
    }else if (message.content.startsWith("!use") || message.content.startsWith("!u")) {
        if (message.content.split(" ")[1]) {
            var name = message.content.split(" ")[1];
            if (name.length > 0) {
                name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            }
            if (name in guilds[message.guild.id].objects) {
                var object = guilds[message.guild.id].objects[name];
                var user = guilds[message.guild.id].users[message.author.id];
                if (name in user.objects) {
                    if (user.usageCounter) {
                        if (user.usageCounter >= 10) {
                            message.channel.send("Le taux journalier d'utilisation maximum à été dépasser");
                            return;
                        }
                        user.usageCounter += 1;
                    }else {
                        user.usageCounter = 1;
                    }
                    var choosedUser = message.author.id;
                    if (message.mentions.users.first() && !message.mentions.users.first().bot) {
                        choosedUser = message.mentions.users.first().id;
                    }
                    use(message, object.action, object.options, choosedUser);
                    user.objects[name] -= 1;
                    if (user.objects[name] === 0) {
                        delete user.objects[name];
                    }
                }else {
                    message.channel.send("Tu n'as aucun " + name);
                }
            }else {
                message.channel.send("L'objet n'existe pas");
            }
        }else {
            message.channel.send("La commande n'est pas valide");
        }
        fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
    }else if (message.content.startsWith("!info") || message.content.startsWith("!i")) {
        if (message.guild.id in guilds) {
            var name = message.content.split(" ")[1];
            if (name) {
                name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            }
            if (name in guilds[message.guild.id].objects) {
                message.channel.send(guilds[message.guild.id].objects[name].description);
            }else {
                message.channel.send("Il n'y a aucun item avec ce nom");
            }
        }else {
            message.channel.send("Il n'y a aucun item sur ce serveur");
        }
    }else if (message.content.startsWith("!peche") || message.content.startsWith("!p")) {
        var now = new Date();
        if (!guilds[message.guild.id].users[message.author.id].lastPeche) guilds[message.guild.id].users[message.author.id].lastPeche = now.getTime();
        if (guilds[message.guild.id].users[message.author.id].lastPeche === now.getTime() || guilds[message.guild.id].users[message.author.id].lastPeche <= new Date().getTime() - 7200000) {
            var objects = [];
            for (var key in guilds[message.guild.id].objects) {
                for (var i = 0; i < guilds[message.guild.id].maxrarity - guilds[message.guild.id].objects[key].rarity; i++) {
                    objects.push(key);
                }
            }
            var randomObject = objects[Math.floor(Math.random() * objects.length)];
            if (randomObject in guilds[message.guild.id].users[message.author.id].objects) {
                guilds[message.guild.id].users[message.author.id].objects[randomObject] += 1;
            }else {
                guilds[message.guild.id].users[message.author.id].objects[randomObject] = 1;
            }
            message.channel.send("Tu as gagné un(e) " + randomObject);
            guilds[message.guild.id].users[message.author.id].lastPeche = now.getTime();
        }else {
            var wait = new Date(guilds[message.guild.id].users[message.author.id].lastPeche + 7200000 - new Date().getTime());
            message.channel.send("Tu doit attendre " + (wait.getHours() - 1) + "h" + wait.getMinutes());
        }
        fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
    }else if (message.content.startsWith("!combat") || message.content.startsWith("!c")) {
        var now = new Date();
        if (!guilds[message.guild.id].users[message.author.id].lastCombat) guilds[message.guild.id].users[message.author.id].lastCombat = now.getTime();
        if (guilds[message.guild.id].users[message.author.id].lastCombat === now.getTime() || guilds[message.guild.id].users[message.author.id].lastCombat <= new Date().getTime() - 18000000) {
            guilds[message.guild.id].users[message.author.id].points += 80;
            message.channel.send("Tu as maintenant " + guilds[message.guild.id].users[message.author.id].points + " ⚔️");
            guilds[message.guild.id].users[message.author.id].lastCombat = now.getTime();
        }else {
            var wait = new Date(guilds[message.guild.id].users[message.author.id].lastCombat + 18000000 - new Date().getTime());
            message.channel.send("Tu doit attendre " + (wait.getHours() - 1) + "h" + wait.getMinutes());
        }
        fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
    }else if (message.content.startsWith("!bank") || message.content.startsWith("!b")) {
        var msg = "Tu as " + guilds[message.guild.id].users[message.author.id].points + " ⚔️\n";
        for (var key in guilds[message.guild.id].users[message.author.id].objects) {
            msg += guilds[message.guild.id].users[message.author.id].objects[key] + " " + key + "\n"
        }
        message.channel.send(msg);
    }else if (message.content.startsWith("!trade") || message.content.startsWith("!t")) {
        // if (message.content.split(" ").length === 6 && message.mentions.users.first() && !isNaN(message.content.split(" ")[2]) && !isNaN(message.content.split(" ")[5])) {
        //     var count1 = parseInt(message.content.split(" ")[2]);
        //     var item1 = message.content.split(" ")[3];
        //     var user = message.mentions.users.first().id;
        //     var count2 = parseInt(message.content.split(" ")[5]);
        //     var item2 = message.content.split(" ")[6];
        //     "<@" +  + "> clique sur ✅ pour accepter l'échange"
        //     fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
        //     // message.channel.send("L' item " + name + " a été ajouter");
        // }else {
        //     message.channel.send("La commande n'est pas valide");
        // }
        message.channel.send("Bientôt disponible");
    }else if (message.content.startsWith("!give") || message.content.startsWith("!g")) {
        if (message.content.split(" ").length === 4 && message.mentions.users.first() && !isNaN(message.content.split(" ")[1])) {
            var count = Math.abs(parseInt(message.content.split(" ")[1]));
            var item = message.content.split(" ")[2];
            var user = message.mentions.users.first().id;
            if (item === "points") {
                if (guilds[message.guild.id].users[message.author.id].points >= count) {
                    guilds[message.guild.id].users[message.author.id].points -= count;
                    guilds[message.guild.id].users[user].points += count;
                    message.channel.send("Tu as donner " + count + " ⚔️ à <@" + user + ">");
                }else {
                    message.channel.send("Tu n'as pas assez de ⚔️");
                }
            }else {
                if (item in guilds[message.guild.id].users[message.author.id].objects) {
                    if (guilds[message.guild.id].users[message.author.id].objects[item] >= count) {
                        if (item in guilds[message.guild.id].users[user].objects) {
                            guilds[message.guild.id].users[user].objects[item] += count;
                        }else {
                            guilds[message.guild.id].users[user].objects[item] = count;
                        }
                        guilds[message.guild.id].users[message.author.id].objects[item] -= count;
                        if (guilds[message.guild.id].users[message.author.id].objects[item] === 0) {
                            delete guilds[message.guild.id].users[message.author.id].objects[item];
                        }
                        message.channel.send("Tu as donner " + count + " " + item + " à <@" + user + ">");
                    }else {
                        message.channel.send("Tu n'as pas assez de " + item);
                    }
                }else {
                    message.channel.send("Tu n'as aucun " + item);
                }
            }
            fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
        }else {
            message.channel.send("La commande n'est pas valide");
        }
    }else if (message.content.startsWith("!leaderboard") || message.content.startsWith("!l")) {
        leaderboard(message);
    }else if (message.content.startsWith("!admin")) {
        if (!message.member.hasPermission("ADMINISTRATOR")) {
            message.channel.send("Tu n'as pas la permission d'utiliser cette commande");
            return;
        }
        if (message.content.startsWith("!admin-help")) {
            message.channel.send('`!admin-add-item <item name> "<description>" <rarity> <action> [options ex: minutes=10,points=5] [cost]` ajouter un nouvelle item\n' +
                "`!admin-remove-item <item>` supprimer un item\n" +
                "`!admin-reload-items` réinitialiser les items\n" +
                "`!admin-reload-points` réinitialiser les points de tout les joueurs\n" +
                "`!admin-modify-item <count> <item> <user>` Ajouter ou retirer des items à quelqu'un\n" +
                "`!admin-modify-item <count> <item>` Ajouter ou retirer des items à tout le monde\n" +
                "`!admin-modify-points <count> <user>` Ajouter ou retirer des ⚔️ à quelqu'un\n" +
                "`!admin-modify-points <count>` Ajouter ou retirer des ⚔️ à tout le monde\n" +
                "`!admin-channel <channel>` Modifier le salon de la leaderboard hebdomadaire");
        }else if (message.content.startsWith("!admin-channel")) {
            console.log(message.content.split(" ").length);
            if (message.content.split(" ").length === 2) {
                guilds[message.guild.id].weekMessageChanel = message.content.split(" ")[1].replace("<#", "").replace(">", "");
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
                message.channel.send("Le salon du leaderboard à été modifier pour " + message.content.split(" ")[1]);
            }else {
                guilds[message.guild.id].weekMessageChanel = "";
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
                message.channel.send("Le salon du leaderboard à été supprimer");
            }
        }else if (message.content.startsWith("!admin-add-item")) {
            if (message.content.split(" ").length >= 5) {
                var name = message.content.split(" ")[1];
                if (name.length > 0) {
                    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
                }
                if (isNaN(message.content.split(" ")[4])) {
                    message.channel.send("La commande n'est pas valide");
                    return;
                }
                var object = {
                    action: message.content.split(" ")[2],
                    description: message.content.split(" ")[3].split('"').join(""),
                    rarity: parseInt(message.content.split(" ")[4]),
                    buyable: false
                }
                if (message.content.split(" ")[5]) {
                    var options = {};
                    for (i = 0; i < message.content.split(" ")[5].split(",").length; i++) {
                        if ("=" in message.content.split(" ")[5].split(",")[i]) {
                            options[message.content.split(" ")[5].split(",")[i].split("=")[0]] = message.content.split(" ")[5].split(",")[i].split("=")[1];
                        }
                    }
                    object.options = options;
                }
                if (message.content.split(" ")[6]) {
                    object.cost = parseInt(message.content.split(" ")[6]);
                    object.buyable = true;
                }
                guilds[message.guild.id].objects[name] = object;
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
                message.channel.send("L' item " + name + " a été ajouter");
            }else {
                message.channel.send("La commande n'est pas valide");
            }
        }else if (message.content.startsWith("!admin-remove-item")) {
            var name = message.content.split(" ")[1];
            if (name.length > 0) {
                name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            }
            if (message.content.split(" ")[1] in guilds[message.guild.id].objects) {
                delete guilds[message.guild.id].objects[message.content.split(" ")[1]];
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
                message.channel.send("L' item " + message.content.split(" ")[1] + " a été supprimer");
            }else {
                message.channel.send("Il n'y a aucun item avec ce nom");
            }
        }else if (message.content.startsWith("!admin-reload-items")) {
            for (var userID in guilds[message.guild.id].users) {
                guilds[message.guild.id].users[userID].objects = {};
            }
            fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            message.channel.send("Les items ont été réinitialiser");
        }else if (message.content.startsWith("!admin-reload-points")) {
            if (!message.member.hasPermission("ADMINISTRATOR")) return;
            for (var userID in guilds[message.guild.id].users) {
                guilds[message.guild.id].users[userID].points = 0;
            }
            fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            message.channel.send("Les ⚔️ ont été réinitialiser");
        }else if (message.content.startsWith("!admin-modify-points")) {
            if (message.content.split(" ").length === 2) {
                for (userID in guilds[message.guild.id].users) {
                    guilds[message.guild.id].users[userID].points += parseInt(message.content.split(" ")[1]);
                    if (guilds[message.guild.id].users[userID].points < 0) guilds[message.guild.id].users[userID].points = 0;
                }
                message.channel.send("Tout le monde à recu " + parseInt(message.content.split(" ")[1]) + " ⚔️");
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            }else if (message.content.split(" ").length === 3 && message.mentions.users.first()) {
                guilds[message.guild.id].users[message.mentions.users.first().id].points += parseInt(message.content.split(" ")[1]);
                if (guilds[message.guild.id].users[message.mentions.users.first().id].points < 0) guilds[message.guild.id].users[message.mentions.users.first().id].points = 0;
                message.channel.send("<@" + message.mentions.users.first().id + "> à recu " + parseInt(message.content.split(" ")[1]) + " ⚔️");
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            }else {
                message.channel.send("La commande n'est pas valide");
            }
        }else if (message.content.startsWith("!admin-modify-items")) {
            if (message.content.split(" ").length === 3) {
                for (userID in guilds[message.guild.id].users) {
                    var count = parseInt(message.content.split(" ")[1]);
                    var item = message.content.split(" ")[2];
                    if (item.length > 0) {
                        item = item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
                    }
                    if (item in guilds[message.guild.id].users[userID].objects) {
                        guilds[message.guild.id].users[userID].objects[item] += count;
                    }else {
                        guilds[message.guild.id].users[userID].objects[item] = count;
                    }
                    if (guilds[message.guild.id].users[userID].objects[item] <= 0) {
                        delete guilds[message.guild.id].users[userID].objects[item];
                    }
                }
                message.channel.send("Tout le monde à recu " + count + " " + item);
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            }else if (message.content.split(" ").length === 4 && message.mentions.users.first()) {
                var count = parseInt(message.content.split(" ")[1]);
                var item = message.content.split(" ")[2];
                if (item.length > 0) {
                    item = item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
                }
                if (item in guilds[message.guild.id].users[message.mentions.users.first().id].objects) {
                    guilds[message.guild.id].users[message.mentions.users.first().id].objects[item] += count;
                }else {
                    guilds[message.guild.id].users[message.mentions.users.first().id].objects[item] = count;
                }
                if (guilds[message.guild.id].users[message.mentions.users.first().id].objects[item] <= 0) {
                    delete guilds[message.guild.id].users[message.mentions.users.first().id].objects[item];
                }
                message.channel.send("<@" + message.mentions.users.first().id + "> à recu " + count + " " + item);
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            }else {
                message.channel.send("La commande n'est pas valide");
            }
        }
    }
});
async function leaderboard(message) {
    if (message.content.split(" ").length === 2 && message.content.split(" ")[1] !== "") {
        var msg = "__**Leader board:**__\n";
        var usersInOrder = [];
        for (var key in guilds[message.guild.id].users) {
            var count = usersInOrder.length;
            for (var i = 0; i < usersInOrder.length; i++) {
                if (guilds[message.guild.id].users[key].points > guilds[message.guild.id].users[usersInOrder[i]].points) {
                    count = i;
                    break;
                }
            }
            usersInOrder.splice(count, 0, key);
        }
        for (var i = 0; i < usersInOrder.length; i++) {
            const member = await message.guild.members.fetch(usersInOrder[i]);
            msg += (i + 1) + ". " + member.user.username + " avec " + guilds[guildID].users[usersInOrder[i]].points + " ⚔️\n";
        }
        message.channel.send(msg);
    }else {
        var msg = "__**Leader board:**__\n";
        var usersInOrder = [];
        for (var key in guilds[message.guild.id].users) {
            var count = usersInOrder.length;
            for (var i = 0; i < usersInOrder.length; i++) {
                if (guilds[message.guild.id].users[key].points > guilds[message.guild.id].users[usersInOrder[i]].points) {
                    count = i;
                    break;
                }
            }
            usersInOrder.splice(count, 0, key);
        }
        if (usersInOrder.length > 10) { 
            for (var i = 0; i < 10; i++) {
                const member = await message.guild.members.fetch(usersInOrder[i]);
                msg += (i + 1) + ". " + member.user.username + " avec " + guilds[guildID].users[usersInOrder[i]].points + " ⚔️\n";
            }
            msg += "*La leaderboard entière est ici: `!l a` ou `!leaderboard all`*";
        } else {
            for (var i = 0; i < usersInOrder.length; i++) {
                const member = await message.guild.members.fetch(usersInOrder[i]);
                msg += (i + 1) + ". " + member.user.username + " avec " + guilds[guildID].users[usersInOrder[i]].points + " ⚔️\n";
            }
        }
        message.channel.send(msg);
    }
}
function use(message, action, options, userID) {
    switch (action) {
        case "Mute":
            unmuteTime = new Date();
            unmuteTime.setMinutes(unmuteTime.getMinutes() + options.minutes);
            guilds[message.guild.id].users[userID].unmuteTime = unmuteTime.getTime();
            message.guild.members.fetch(userID).then(function (member) {
                if (message.guild.roles.cache.find(role => role.name === "Muted")) {
                    var muted = message.guild.roles.cache.find(role => role.name === "Muted");
                    member.roles.add(muted.id);
                }else {
                    message.channel.send("Il n'y a pas de role `Muted` sur le serveur...");
                }
            });
            fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            message.channel.send("<@" + userID + "> a été mute pendant " + options.minutes + " minutes");
            setTimeout(unMute, guilds[message.guild.id].users[userID].unmuteTime - new Date().getTime());
            break;
        case "RemovePoints":
            if (guilds[message.guild.id].users[userID].points > 0) {
                guilds[message.guild.id].users[userID].points -= options.points;
                if (guilds[message.guild.id].users[userID].points < 0) guilds[message.guild.id].users[userID].points = 0;
                message.channel.send("Tu as enlever " + options.points + "⚔️ à <@" + userID + ">, il a maintenant " + guilds[message.guild.id].users[userID].points + "⚔️");
                fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            }else {
                message.channel.send("<@" + userID + "> n'a pas de ⚔️");
            }
            break;
        case "WinRandomPoints":
            var randomPoints = Math.floor(Math.random() * 100);
            guilds[message.guild.id].users[userID].points += randomPoints;
            message.channel.send("Tu as fait gagner " + randomPoints + "⚔️ à <@" + userID + ">, il a maintenant " + guilds[message.guild.id].users[userID].points + "⚔️");
            fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            break;
        case "WinPoints":
            guilds[message.guild.id].users[userID].points += options.points;
            message.channel.send("Tu as fait gagner " + options.points + "⚔️ à <@" + userID + ">, il a maintenant " + guilds[message.guild.id].users[userID].points + "⚔️");
            fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
            break;
        default:
            message.channel.send("Bientôt disponible");
    }
}
function reloadCoolDown() {
    var today = new Date();
    var midnight = new Date();
    midnight.setHours(24);
    midnight.setMinutes(0);
    midnight.setSeconds(0);
    midnight.setMilliseconds(0);
    var waitTime = midnight.getTime() - today.getTime();
    setTimeout(function () {
        for (var guildID in guilds) {
            for (var userID in guilds[guildID].users) {
                guilds[guildID].users[userID].usageCounter = 0;
            }
            if (guilds[guildID].weekMessageChanel) {
                addPoints(guildID, guilds[guildID].weekMessageChanel);
            }
        }
        reloadCoolDown();
    }, waitTime);
}
async function addPoints(guildID, channelID) {
    console.log("addPoints");
    var guild = await bot.guilds.fetch(guildID);
    var channel = guild.channels.cache.get(channelID);
    if (!guildID in guilds) guilds[guildID] = {maxrarity: 0,objects: {},users: {}};
    var usersInOrder = [];
    for (var key in guilds[guildID].users) {
        guilds[guildID].users[key].points += 50;
        console.log(guilds[guildID].users[key].points);
        var count = usersInOrder.length;
        for (var i = 0; i < usersInOrder.length; i++) {
            if (guilds[guildID].users[key].points > guilds[guildID].users[usersInOrder[i]].points) {
                count = i;
                break;
            }
        }
        usersInOrder.splice(count, 0, key);
    }
    if (usersInOrder.length >= 3) {
        guilds[guildID].users[usersInOrder[0]].points -= 30;
        guilds[guildID].users[usersInOrder[1]].points -= 20;
        guilds[guildID].users[usersInOrder[2]].points -= 10;
    }
    channel.send("Tout le monde a recu 50 ⚔️. A part <@" + usersInOrder[0] + "> Qui à recu 20 ⚔️, <@" + usersInOrder[1] + "> Qui à recu 30 ⚔️ et <@" + usersInOrder[2] + "> Qui à recu 40 ⚔️");
}
function weekMessage() {
    var today = new Date();
    var sunday = new Date();
    sunday.setDate(today.getDate() + (6/*last day*/+(7-today.getDay())) % 7);
    sunday.setHours(10);
    sunday.setMinutes(0);
    sunday.setSeconds(0);
    sunday.setMilliseconds(0);
    var waitTime = sunday.getTime() - today.getTime();
    setTimeout(function () {
        for (var key in guilds) {
            if (guilds[key].weekMessageChanel) {
                weekLeaderboard(key, guilds[key].weekMessageChanel);
            }
        }
        weekMessage();
    }, waitTime);
}
async function weekLeaderboard(guildID, channelID) {
    var guild = await bot.guilds.fetch(guildID);
    var channel = guild.channels.cache.get(channelID);
    if (!guildID in guilds) guilds[guildID] = {maxrarity: 0,objects: {},users: {}};
    var msg = "__**Leader board de la semaine:**__\n";
    var usersInOrder = [];
    for (var key in guilds[guildID].users) {
        var count = usersInOrder.length;
        for (var i = 0; i < usersInOrder.length; i++) {
            if (guilds[guildID].users[key].points > guilds[guildID].users[usersInOrder[i]].points) {
                count = i;
                break;
            }
        }
        usersInOrder.splice(count, 0, key);
    }
    if (usersInOrder.length > 10) {
        for (var i = 0; i < 10; i++) {
            const member = await guild.members.fetch(usersInOrder[i]);
            msg += (i + 1) + ". " + member.user.username + " avec " + guilds[guildID].users[usersInOrder[i]].points + " ⚔️\n";
        }
        msg += "*La leaderboard entière est ici: `!l a` ou `!leaderboard all`*";
    } else {
        for (var i = 0; i < usersInOrder.length; i++) {
            const member = await guild.members.fetch(usersInOrder[i]);
            msg += (i + 1) + ". " + member.user.username + " avec " + guilds[guildID].users[usersInOrder[i]].points + " ⚔️\n";
        }
    }
    channel.send(msg);
}
function unMuteTimeout() {
    for (var guildID in guilds) {
        for (var userID in guilds[guildID].users) {
            if (guilds[guildID].users[userID].unmuteTime) {
                unMute();
                setTimeout(unMute, guilds[guildID].users[userID].unmuteTime - new Date().getTime());
            }
        }
    }
}
async function unMute() {
    for (var guildID in guilds) {
        for (var userID in guilds[guildID].users) {
            if (guilds[guildID].users[userID].unmuteTime) {
                if (guilds[guildID].users[userID].unmuteTime <= new Date().getTime()) {
                    delete guilds[guildID].users[userID].unmuteTime;
                    fs.writeFileSync('./guilds.json', JSON.stringify(guilds));
                    var guild = await bot.guilds.fetch(guildID);
                    var member = await guild.members.fetch(userID);
                    if (guild.roles.cache.find(role => role.name === "Muted")) {
                        var muted = guild.roles.cache.find(role => role.name === "Muted");
                        member.roles.remove(muted.id);
                    }
                }
            }
        }
    }
}
bot.on('messageReactionAdd', (reaction, user) => {
    if (reaction.message.author.id === bot.user.id) {
        if (user.id !== bot.user.id) {
            // ✅ 🚫
            // for (var i = 0; i < users.length; i++) {
            //     if (users[i].discordID === user.id) {
            //         if (reaction.emoji.name === "⬅️") {
            //             reaction.message.delete();
            //             updateTimetable(reaction.message, -1);
            //         }else if (reaction.emoji.name === "➡️") {
            //             reaction.message.delete();
            //             updateTimetable(reaction.message, 1);
            //         }
            //     }
            // }
        }
    }
});
bot.login(config.token);

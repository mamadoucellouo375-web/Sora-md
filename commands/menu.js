import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import configs from "../utils/configmanager.js";
import stylizedChar from "../utils/fancy.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

// Commandes regroupées par catégorie (inchangé)
const COMMANDES = {
  "utils":      ["uptime", "ping", "menu", "fancy", "setpp", "getpp", "callad", "afk"],
  "owner":      ["sudo", "delsudo"],
  "settings":   ["public", "setprefix", "autotype", "autorecord", "welcome"],
  "media":      ["photo", "toaudio", "sticker", "play", "img", "vv", "save", "tiktok", "ig", "fb", "twitter", "url", "blur", "grayscale", "invert", "resize"],
  "ai":         ["ia"],
  "group":      ["tag", "tagall", "tagadmin", "kick", "kickall", "kickall2", "promote", "demote", "promoteall", "demoteall", "mute", "unmute", "gclink", "antilink", "bye", "join", "welcomegroup", "resetwarns", "checkwarns", "groupinfo", "listadmins", "warn", "unwarn", "hidetag", "antivirtex", "antitagall", "autosticker", "filter", "setwelcome", "setleft"],
  "moderation": ["block", "unblock"],
  "premium":    ["addprem", "delprem", "auto-promote", "auto-demote", "auto-left"],
  "tools":      ["calc", "base64", "hash", "binary", "morse", "reverse", "case", "count", "palindrome", "password", "time", "note"],
  "fun":        ["dice", "coinflip", "rps", "8ball", "choose"],
  "reactions":  ["hug", "pat", "kiss", "slap", "cry", "dance", "bonk", "cuddle", "poke", "wave", "wink", "highfive", "kickreact", "bite", "blush", "smile", "smug", "yeet", "lick", "nom", "bully", "cringe", "glomp", "handhold", "happy", "kill"],
  "economy":    ["balance", "daily", "rank", "spy"],
};

export default async function info(client, message) {
  try {
    const remoteJid = message.key.remoteJid;
    const userName  = message.pushName || "Unknown";

    // Informations système
    const usedRam  = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
    const totalRam = (os.totalmem() / 1024 / 1024).toFixed(1);
    const platform = os.platform();
    const uptime   = formatUptime(process.uptime());

    // Préfixe et ID du bot
    const botId  = client.user.id.split(":")[0];
    const prefix = configs.config?.users?.[botId]?.prefix || ".";

    // Récupération du propriétaire
    const owner = configs.config?.owner || "SORA";

    // Version depuis package.json
    let version = "1.0.0";
    try {
      const pkgPath = path.resolve(__dirname, "../../package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      version = pkg.version || version;
    } catch (_) {}

    // Nombre total d'utilisateurs (essaie de lire depuis un fichier ou une variable globale)
    let totalUsers = 0;
    try {
      // Exemple : si vous avez un fichier users.json ou une variable globale
      const dbPath = path.resolve(__dirname, "../../database/users.json");
      if (fs.existsSync(dbPath)) {
        const users = JSON.parse(fs.readFileSync(dbPath, "utf8"));
        totalUsers = Object.keys(users).length;
      }
    } catch (_) {}
    // Fallback si aucun fichier
    if (totalUsers === 0) totalUsers = 755; // valeur d'exemple

    // CORVUS : par défaut 100, vous pouvez le lier à un système de points
    const corvus = 100; // ou récupérer depuis la config

    // Date et heure
    const now    = new Date();
    const daysFR = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
    const date   = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const day    = daysFR[now.getDay()];
    const heure  = `${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`;

    // --- Construction du menu ---
    let menu = `SORA MD

Owner: ${owner}
User : ${userName}

CORVUS : ${corvus}
Mode : public
Server : ${platform === "linux" ? "Linux" : platform}
Available RAM : ${usedRam} MB of ${totalRam} MB
Total Users : ${totalUsers}
Version : ${version}

General\n`;

    // Récupération de toutes les commandes (aplatir)
    const allCommands = Object.values(COMMANDES).flat();
    // Trier par ordre alphabétique (optionnel)
    allCommands.sort((a, b) => a.localeCompare(b));

    // Numéroter et ajouter le préfixe
    allCommands.forEach((cmd, index) => {
      menu += `${index + 1}. ${prefix}${cmd}\n`;
    });

    // Envoi du message
    // On essaie d'envoyer une image si elle existe, sinon juste le texte
    try {
      if (fs.existsSync('./database/menu.jpg')) {
        await client.sendMessage(remoteJid, { image: { url: './database/menu.jpg' } });
      }
    } catch (_) {}

    await client.sendMessage(remoteJid, { text: menu.trim() }, { quoted: message });

    console.log(`📋 Menu affiché — ${allCommands.length} commandes`);

  } catch (err) {
    console.error("❌ Erreur menu:", err);
  }
                 }

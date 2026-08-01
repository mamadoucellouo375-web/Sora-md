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

function getCategoryIcon(category) {
  const c = category.toLowerCase();
  if (c === "utils")      return "⚙️";
  if (c === "media")      return "📸";
  if (c === "group")      return "👥";
  if (c === "bug")        return "🐞";
  if (c === "tags")       return "🏷️";
  if (c === "moderation") return "😶‍🌫️";
  if (c === "owner")      return "✨";
  if (c === "creator")    return "👑";
  if (c === "settings")   return "🔧";
  if (c === "premium")    return "💎";
  if (c === "parrainage") return "🤝";
  if (c === "jjk")        return "👁️";
  if (c === "outils")     return "🛠️";
  if (c === "mémoire")    return "📝";
  if (c === "fun")        return "🎮";
  if (c === "reactions")  return "🎭";
  if (c === "xp")         return "⚡";
  return "🎯";
}

// Commandes intégrées directement (plus besoin de lire le fichier)
const COMMANDES = {
  "utils":      ["uptime", "ping", "menu", "fancy", "setpp", "getpp", "callad"],
  "owner":      ["sudo", "delsudo"],
  "settings":   ["public", "setprefix", "autotype", "autorecord", "welcome"],
  "media":      ["photo", "toaudio", "sticker", "play", "img", "vv", "save", "tiktok", "ig", "fb", "twitter", "url", "blur", "grayscale", "invert", "resize"],
  "ai":         ["ia"],
  "group":      ["tag", "tagall", "tagadmin", "kick", "kickall", "kickall2", "promote", "demote", "promoteall", "demoteall", "mute", "unmute", "gclink", "antilink", "bye", "join", "welcomegroup", "resetwarns", "checkwarns", "groupinfo", "listadmins", "warn", "unwarn"],
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

    const usedRam  = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
    const totalRam = (os.totalmem() / 1024 / 1024).toFixed(1);
    const uptime   = formatUptime(process.uptime());
    const platform = os.platform();

    const botId  = client.user.id.split(":")[0];
    const prefix = configs.config?.users?.[botId]?.prefix || ".";

    const now    = new Date();
    const daysFR = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
    const date   = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const day    = daysFR[now.getDay()];
    const heure  = `${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}`;

    const totalCmds = Object.values(COMMANDES).reduce((acc, cmds) => acc + cmds.length, 0);

    // ── En-tête ─────────────────────────────────
    let menu =
      `╔══════════════════════╗\n` +
      `     👁️  *DARSOUL X NOVA*  ♾️\n` +
      `     ✦ _Infinity Never Breaks_ ✦\n` +
      `╚══════════════════════╝\n\n` +
      `┌─「 📊 *SYSTÈME* 」\n` +
      `│ 👤 User     : ${stylizedChar(userName)}\n` +
      `│ 🔑 Prefix   : ${prefix}\n` +
      `│ ⏱️  Uptime   : ${uptime}\n` +
      `│ 💾 RAM      : ${usedRam}/${totalRam} MB\n` +
      `│ 🖥️  Platform : ${platform}\n` +
      `│ 🕐 Heure    : ${heure}\n` +
      `│ 📅 Date     : ${date} — ${stylizedChar(day)}\n` +
      `│ 📋 Cmds     : ${totalCmds} commandes\n` +
      `└──────────────────────\n\n` +
      `┌─「 💎 *CODE PARRAINAGE* 」\n` +
      `│  ♾️  *NOVASOUL*\n` +
      `│  › ${prefix}parrainer NOVASOUL\n` +
      `└──────────────────────\n\n`;

    // ── Catégories ──────────────────────────────
    for (const [category, commands] of Object.entries(COMMANDES)) {
      const icon    = getCategoryIcon(category);
      const catName = stylizedChar(category.toUpperCase());
      menu += `┏━━━ ${icon} ${catName} (${commands.length})\n`;
      commands.forEach(cmd => {
        menu += `┃  › ${stylizedChar(cmd)}\n`;
      });
      menu += `┗━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // ── Pied de page ────────────────────────────
    menu +=
      `╔══════════════════════╗\n` +
      `│ ♾️  _"Je suis le plus fort._\n` +
      `│  _Ce n'est pas de l'arrogance,_\n` +
      `│  _c'est un fait."_\n` +
      `│           — *Gojo Satoru*\n` +
      `╚══════════════════════╝`;

    menu = menu.trim();

    // ── Envoi ────────────────────────────────────
    // ⚠️ Important : on n'envoie JAMAIS le menu complet en légende d'image/vidéo.
    // WhatsApp limite les légendes à environ 1024 caractères, alors que le menu
    // dépasse largement cette taille avec toutes les commandes -> il serait tronqué.
    try {
        if (fs.existsSync('./database/menu.jpg')) {
            await client.sendMessage(remoteJid, { image: { url: './database/menu.jpg' } });
        }
    } catch (imgErr) {
        console.error('⚠️ Menu: image non envoyée:', imgErr.message);
    }

    await client.sendMessage(remoteJid, { text: menu }, { quoted: message });

    console.log(`📋 Menu affiché — ${totalCmds} commandes`);

  } catch (err) {
    console.error("❌ Erreur menu:", err);
  }
}


const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;
const doNotDelete = "[ ➪ 𝗔𝘇𝗶𝘇\n\n 🩷🪽 ]";

module.exports = {
  config: {
    name: "help",
    version: "1.18",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    shortDescription: {
      vi: "Xem cách dùng lệnh",
      en: "View command usage"
    },
    longDescription: {
      vi: "Xem cách sử dụng của các lệnh",
      en: "View command usage"
    },
    category: "info",
    guide: {
      vi: "   {pn} [để trống | <số trang> | <tên lệnh>]",
      en: "{pn} [empty | <page number> | <command name>]"
    },
    priority: 1
  },

  langs: {
    en: {
      help2: "%1\n┌─────────────────────────────⭓\n│ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 𝗮𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲: %2\n│ Type %3help <command> for details\n└─────────────────────────────⭓\n%4",
      commandNotFound: "Command \"%1\" does not exist",
      help: "%1\n┌──── 𝗣𝗮𝗴𝗲 [%2/%3] ─────┐\n│ Total commands: %4\n│ Use %5help <page>\n│ or %5help <name>\n└───────⭓\n%6\n⭓ %7",
      getInfoCommand: "┌─ 🧩 𝗖𝗼𝗺𝗺𝗮𝗻𝗱: %1\n│ Description: %2\n│ Aliases: %3\n│ Group aliases: %4\n│ Version: %5\n│ Role: %6\n│ Cooldown: %7s\n│ Author: %8\n├─ 🛠 𝗨𝘀𝗮𝗴𝗲:\n│ %9\n└─────────────────────⭓",
      onlyUsage: "┌─ 🛠 𝗨𝘀𝗮𝗴𝗲:\n│ %1\n└─────────────────────⭓",
      onlyAlias: "┌─ 🔁 𝗔𝗹𝗶𝗮𝘀𝗲𝘀:\n│ Global: %1\n│ Group: %2\n└─────────────────────⭓",
      onlyRole: "┌─ 🛡 𝗥𝗼𝗹𝗲:\n│ %1\n└─────────────────────⭓",
      onlyInfo: "┌─ 🧩 𝗖𝗼𝗺𝗺𝗮𝗻𝗱: %1\n│ Description: %2\n│ Aliases: %3\n│ Group aliases: %4\n│ Version: %5\n│ Role: %6\n│ Cooldown: %7s\n│ Author: %8\n└─────────────────────⭓",
      doNotHave: "None",
      roleText0: "0 (All users)",
      roleText1: "1 (Group admins)",
      roleText2: "2 (Bot admins)",
      roleText0setRole: "0 (All users — set)",
      roleText1setRole: "1 (Group admins — set)",
      pageNotFound: "Page %1 does not exist"
    }
  },

  onStart: async function ({ message, args, event, threadsData, getLang, role }) {
    const langCode = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;
    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);
    const commandName = (args[0] || "").toLowerCase();
    const command = commands.get(commandName) || commands.get(aliases.get(commandName));

    if (!command && !args[0] || !isNaN(args[0])) {
      const arrayInfo = [];
      let msg = "";

      for (const [, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;
        const category = value.config.category?.toUpperCase() || "UNCATEGORIZED";
        let index = arrayInfo.findIndex(i => i.category === category);
        if (index === -1) {
          arrayInfo.push({ category, names: [value.config.name] });
        } else {
          arrayInfo[index].names.push(value.config.name);
        }
      }

      arrayInfo.sort((a, b) => a.category.localeCompare(b.category));

      arrayInfo.forEach((section, idx) => {
        msg += `┌──── ✦ ${section.category} ✦ ────⭓\n`;
        section.names.sort().forEach(cmd => {
          msg += `│ • ${cmd}\n`;
        });
        msg += `└────────────────────────⭓\n\n`;
      });

      return message.reply(getLang("help2", "", commands.size, prefix, msg));
    }

    if (!command && args[0]) {
      return message.reply(getLang("commandNotFound", args[0]));
    }

    const configCommand = command.config;
    const guide = configCommand.guide?.[langCode] || configCommand.guide?.en || "";
    const guideBody = guide.replace(/\{prefix\}|\{p\}/g, prefix).replace(/\{name\}|\{n\}/g, configCommand.name).replace(/\{pn\}/g, prefix + configCommand.name);
    const aliasesString = configCommand.aliases?.join(", ") || getLang("doNotHave");
    const aliasesGroup = threadData.data.aliases?.[configCommand.name]?.join(", ") || getLang("doNotHave");

    let roleOfCommand = configCommand.role;
    if (threadData.data.setRole?.[configCommand.name]) {
      roleOfCommand = threadData.data.setRole[configCommand.name];
    }

    const roleText = roleOfCommand == 0 ? getLang("roleText0") : roleOfCommand == 1 ? getLang("roleText1") : getLang("roleText2");
    const description = configCommand.longDescription?.[langCode] || configCommand.longDescription?.en || getLang("doNotHave");
    const author = configCommand.author || "";

    const formSendMessage = {};
    if (args[1]?.match(/^-g|guide|-u|usage$/)) {
      formSendMessage.body = getLang("onlyUsage", guideBody);
    } else if (args[1]?.match(/^-a|alias/)) {
      formSendMessage.body = getLang("onlyAlias", aliasesString, aliasesGroup);
    } else if (args[1]?.match(/^-r|role$/)) {
      formSendMessage.body = getLang("onlyRole", roleText);
    } else if (args[1]?.match(/^-i|info$/)) {
      formSendMessage.body = getLang("onlyInfo", configCommand.name, description, aliasesString, aliasesGroup, configCommand.version, roleText, configCommand.countDown || 1, author);
    } else {
      formSendMessage.body = getLang("getInfoCommand", configCommand.name, description, aliasesString, aliasesGroup, configCommand.version, roleText, configCommand.countDown || 1, author, guideBody);
    }

    return message.reply(formSendMessage);
  }
};

const { getTime, drive } = global.utils; if (!global.temp.welcomeEvent) global.temp.welcomeEvent = {};

module.exports = { config: { name: "welcome", version: "1.8", author: "NTKhang + Aziz Van Gogh", category: "events" },

langs: { vi: { session1: "sáng", session2: "trưa", session3: "chiều", session4: "tối", welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help", multiple1: "bạn", multiple2: "các bạn", defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!" }, en: { session1: "morning", session2: "noon", session3: "afternoon", session4: "evening", welcomeMessage: "Merci de m'avoir ajouté dans le groupe\nMon préfixe: %1\nPour voir la liste de toutes mes commandes tapez: %1help", multiple1: "you", multiple2: "you all", defaultWelcomeMessage: 🌟 Welcome to this magical and warm space, where smiles shine and friendship reigns supreme! 🌟\n\n{userName},🌺 We are delighted to have you join us in {boxName}.\n\n🌈 Let this community be a haven of peace, joy, and good vibes where everyone finds their place.\n\n🌟 Make yourself comfortable and enjoy the magic of being here.\n🌼 May our journey together be full of laughs, support, and wonderful discoveries! 🌼\n\n🌈 Welcome aboard! 🌈 }, fr: { session1: "matin", session2: "midi", session3: "après-midi", session4: "soir", welcomeMessage: "Merci de m'avoir ajouté dans le groupe\nMon préfixe: %1\nPour voir la liste de toutes mes commandes disponibles tapez : %1help", multiple1: "toi", multiple2: "vous", defaultWelcomeMessage: ✧༺ 𝓑𝓲𝓮𝓷𝓿𝓮𝓷𝓾𝓮 𝓭𝓪𝓷𝓼 𝓷𝓸𝓽𝓻𝓮 𝓾𝓷𝓲𝓿𝓮𝓻𝓼 ✧༺\n\n🌟 {userName}, nous t'accueillons avec un grand sourire dans {boxName} ! 🌟\n\n🌺 Que ton {session} soit rempli de rires, d’échanges sincères et de belles découvertes.\n\n🌈 Ici, chacun trouve sa place, et chaque nouveau visage est une promesse de bonheur partagé.\n\n💫 Prends place, sens-toi chez toi, et que la magie commence ! 💫\n\n✨ Ensemble, écrivons une belle histoire d’amitié et d’aventures ! ✨ } },

onStart: async ({ threadsData, message, event, api, getLang }) => { if (event.logMessageType !== "log:subscribe") return;

const hours = getTime("HH");
const { threadID } = event;
const { nickNameBot } = global.GoatBot.config;
const prefix = global.utils.getPrefix(threadID);
const dataAddedParticipants = event.logMessageData.addedParticipants;

if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
  if (nickNameBot)
    api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
  return message.send(getLang("welcomeMessage", prefix));
}

if (!global.temp.welcomeEvent[threadID])
  global.temp.welcomeEvent[threadID] = {
    joinTimeout: null,
    dataAddedParticipants: []
  };

global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
  const threadData = await threadsData.get(threadID);
  if (threadData.settings.sendWelcomeMessage === false) return;

  const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
  const dataBanned = threadData.data.banned_ban || [];
  const threadName = threadData.threadName;

  const userName = [], mentions = [];
  let multiple = dataAddedParticipants.length > 1;

  for (const user of dataAddedParticipants) {
    if (dataBanned.some((item) => item.id == user.userFbId)) continue;
    userName.push(user.fullName);
    mentions.push({ tag: user.fullName, id: user.userFbId });
  }

  if (userName.length === 0) return;

  let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

  const session = hours <= 10 ? getLang("session1")
    : hours <= 12 ? getLang("session2")
    : hours <= 18 ? getLang("session3")
    : getLang("session4");

  const form = {
    body: welcomeMessage
      .replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
      .replace(/\{boxName\}|\{threadName\}/g, threadName)
      .replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
      .replace(/\{session\}/g, session),
    mentions: welcomeMessage.includes("{userNameTag}") ? mentions : []
  };

  // Ajouter une image si aucune pièce jointe n'est définie
  const files = threadData.data.welcomeAttachment;
  if (files?.length) {
    const rawAttachments = files.map(file => drive.getFile(file, "stream"));
    const resolved = await Promise.allSettled(rawAttachments);
    form.attachment = resolved.filter(r => r.status === "fulfilled").map(r => r.value);
  } else {
    const { createReadStream } = require("fs-extra");
    const path = require("path");
    const imagePath = path.join(__dirname, "default_welcome.png");
    try {
      form.attachment = [createReadStream(imagePath)];
    } catch (e) {
      console.warn("Default welcome image not found.");
    }
  }

  message.send(form);
  delete global.temp.welcomeEvent[threadID];
}, 1500);

} };


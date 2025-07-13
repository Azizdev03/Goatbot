const { getTime, drive } = global.utils;

module.exports = { config: { name: "leave", version: "1.5", author: "NTKhang + Aziz", category: "events" },

langs: { vi: { session1: "sáng", session2: "trưa", session3: "chiều", session4: "tối", leaveType1: "tự rời", leaveType2: "bị kick", defaultLeaveMessage: "📤 {userName} đã rời khỏi nhóm." }, en: { session1: "morning", session2: "noon", session3: "afternoon", session4: "evening", leaveType1: "left", leaveType2: "was kicked from", defaultLeaveMessage: "📤 {userName} has left the group." }, fr: { session1: "matin", session2: "midi", session3: "après-midi", session4: "soir", leaveType1: "est parti(e)", leaveType2: "a été expulsé(e) de", defaultLeaveMessage: "⭒𖥔⋆ 𝓖𝓸𝓸𝓭𝓫𝔂𝓮 {userName} ⋆𖥔⭒\n📤 {userName} a quitté le groupe pendant le {session}." } },

onStart: async ({ threadsData, message, event, api, usersData, getLang }) => { if (event.logMessageType !== "log:unsubscribe") return;

const { threadID } = event;
const threadData = await threadsData.get(threadID);
if (!threadData.settings.sendLeaveMessage) return;

const { leftParticipantFbId } = event.logMessageData;
if (leftParticipantFbId == api.getCurrentUserID()) return;

const hours = getTime("HH");
const threadName = threadData.threadName;
const userName = await usersData.getName(leftParticipantFbId);

let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;

const leaveType = leftParticipantFbId == event.author
  ? getLang("leaveType1")
  : getLang("leaveType2");

const session = hours <= 10
  ? getLang("session1")
  : hours <= 12
  ? getLang("session2")
  : hours <= 18
  ? getLang("session3")
  : getLang("session4");

leaveMessage = leaveMessage
  .replace(/\{userName\}|\{userNameTag\}/g, userName)
  .replace(/\{type\}/g, leaveType)
  .replace(/\{threadName\}|\{boxName\}/g, threadName)
  .replace(/\{time\}/g, hours)
  .replace(/\{session\}/g, session);

const form = {
  body: leaveMessage,
  mentions: leaveMessage.includes("{userNameTag}") ? [{
    id: leftParticipantFbId,
    tag: userName
  }] : []
};

// Attach default image if none provided
let attachments = [];
if (threadData.data.leaveAttachment?.length) {
  const files = threadData.data.leaveAttachment;
  const rawAttachments = files.map(file => drive.getFile(file, "stream"));
  const resolved = await Promise.allSettled(rawAttachments);
  attachments = resolved
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);
} else {
  // Default image (change to your hosted image URL if needed)
  const defaultImage = "https://i.imgur.com/K8bXrHX.png"; // une image stylée "goodbye"
  const { createReadStream } = require("fs-extra");
  const path = require("path");
  const imagePath = path.join(__dirname, "default_leave.png");

  try {
    attachments.push(createReadStream(imagePath));
  } catch (err) {
    console.warn("No default image found.");
  }
}

if (attachments.length > 0) {
  form.attachment = attachments;
}

message.send(form);

} };


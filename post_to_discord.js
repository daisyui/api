import { config } from "./config.js";
export const postToDiscord = (channelId, message) => {
  const messageData = {
    content: message,
  };

  fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        console.error("Failed to send message to Discord:", data.message);
        return;
      }
      console.log(
        `Published: https://discord.com/channels/${config.serverId}/${data.channel_id}/${data.id}`,
      );
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
};

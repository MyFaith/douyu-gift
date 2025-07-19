import axios from "axios";
import logger from "./logger";
import fs from "fs";
import path from "path";
import kvConfig from "./kv-config";

/**
 * 发送推送消息
 */
async function sendMessage() {
  // 从 KV 获取推送密钥
  const sendKey = await kvConfig.getServerPushKey();
  
  if (!sendKey) {
    logger.error("未能从 KV 获取推送密钥，跳过消息推送");
    return;
  }
  try {
    const url = `https://api2.pushdeer.com/message/push`;
    const data = {
      pushkey: sendKey,
      type: 'text',
      text: `【斗鱼荧光棒-完成】`,
      desp: fs.readFileSync(path.join(__dirname, "..", "..", "douyu.log"), "utf-8")
    };
    logger.info("------执行推送------");
    await axios({
      method: "post",
      url,
      data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    logger.info("------推送成功------");
  } catch (error: any) {
    logger.error(`推送消息失败: ${error.message}`);
  }
}

export default sendMessage;

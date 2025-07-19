import Douyu from "./common/douyu";
import sendMessage from "./common/message";
import logger from "./common/logger";
import request from "./common/request";

(async () => {
  // 初始化配置，从 KV 加载 Cookie
  await request.init();
  
  const douyu = new Douyu();
  logger.info("------登录检查开始------");
  const isLogin = await douyu.checkLogin();
  logger.info("------登录检查结束------");
  // 模式，0=平均分配，1=自由分配（未实现）
  // const mode = 0;
  if (isLogin) {
    await douyu.getGifts();
    if (douyu.own === 0) {
      logger.warn("背包中没有荧光棒,无法执行赠送,任务即将结束");
    } else {
      logger.info("当前选择模式为:平均分配模式");
      const roomList = await douyu.getRoomList();
      // 每个房间送多少个
      const everyGive = Math.ceil(douyu.own / roomList.length);
      // 剩下多少个
      const left = Number(douyu.own) - Number(everyGive) * (roomList.length - 1);
      logger.info("------开始捐赠荧光棒------");
      for (const room of roomList) {
        if (room === roomList.at(-1)) {
          await douyu.donate(left, Number(room));
        } else {
          await douyu.donate(everyGive, Number(room));
        }
      }
      logger.info("------荧光棒捐赠结束------");
      douyu.getNeedExp();
    }
  }
  await sleep(5000);
  // 发送通知
  await sendMessage();
})();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

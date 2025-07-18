import request from "./request";
import puppeteer from "puppeteer";
import { load } from "cheerio";
import logger from "./logger";
import type { CookieData } from "./kv-config";

interface Gift {
  id: number;
}

type Property = string;
type Badge = Record<Property, string>;

class Douyu {
  // 是否登录
  public isLogin = false;
  // 背包是否有荧光棒
  public isHave = false;
  // 当前拥有荧光棒
  public own = 0;

  /**
   * 检查是否登录
   */
  async checkLogin() {
    const loginUrl = "/wgapi/livenc/liveweb/follow/list";
    const result = await request.send("get", loginUrl);
    if (result.error === 0) {
      this.isLogin = true;
      logger.info("Cookie有效,登陆成功");
    } else {
      logger.error("登陆失败,请检查Cookie有效性");
    }
    return this.isLogin;
  }

  /**
   * 获取荧光棒
   */
  async getGifts() {
    // 需要先访问一次直播间才会获得道具
    logger.info("------正在获取荧光棒------");
    // 访问直播间获取荧光棒
    await this.claimGifts();
    const giftUrl = "/japi/prop/backpack/web/v1?rid=12306";
    const giftResult = await request.send("get", giftUrl);
    logger.info("------背包检查开始------");
    // 防止没有道具导致程序报错
    if (giftResult.data.list.length > 0) {
      const findRes = giftResult.data.list.find((e: Gift) => e.id === 268);
      findRes ? (this.own = findRes.count) : 0;
      logger.info(`当前拥有荧光棒${this.own}个,给你喜欢的主播进行赠送吧`);
      this.isHave = true;
      logger.info("------背包检查结束------");
    } else {
      logger.warn("当前背包中没有任何道具");
      logger.info("------背包检查结束------");
    }
  }

  /**
   * 获取房间列表
   */
  async getRoomList() {
    const badge = await this.getBadge();
    const roomList = Object.keys(badge.badgeMap);
    return roomList;
  }

  /**
   * 获取徽章
   */
  async getBadge() {
    const badgesUrl = "/member/cp/getFansBadgeList";
    const badges = await request.send("get", badgesUrl);
    const $ = load(badges);
    // 所有房间列表
    const rooms = $(".fans-badge-list > tbody > tr");
    const expList = [];
    const badgeMap: Badge = {};
    for (const room of rooms) {
      const roomId: string | number = $(room).attr("data-fans-room") ?? "";
      const anchor = $(room).find(".anchor--name").text();
      const exp = $(room).find("td").eq(2).text();
      const expNow = exp.match(/(?<= )\d.*\d(?=\/\d)/)![0];
      const upGrade = exp.match(/(?<=\/)\d.*\d/)![0];
      const expNeed = Math.round(Number(upGrade) - Number(expNow));
      expList.push(expNeed);
      badgeMap[roomId] = anchor;
    }
    return { expList, badgeMap };
  }

  /**
   * 赠送礼物
   */
  async donate(num = 1, roomId = 71415) {
    // const donateUrl = "/japi/prop/donate/mainsite/v1";
    const donateUrl = "/japi/prop/donate/mainsite/v2";
    const data = `propId=268&propCount=${num}&roomId=${roomId}&bizExt={"yzxq":{}}`;
    // 背包中含有道具才会进行赠送，否则会报错
    if (this.isHave) {
      const donateRes = await request.send("post", donateUrl, data);
      if (donateRes.error === 0) {
        // 计算剩余荧光棒
        const nowLeft = this.own - num;
        this.own = nowLeft;
        logger.info(`向房间号${roomId}赠送荧光棒${num}个成功,当前剩余${nowLeft}个`);
      } else {
        logger.error(`向房间号${roomId}赠送荧光棒失败,原因:${donateRes.msg}`);
      }
    }
  }

  /**
   * 获取升级需要的经验
   */
  async getNeedExp() {
    const { badgeMap, expList } = await this.getBadge();
    Object.keys(badgeMap).map((roomId, idx) => {
      logger.info(`房间号${roomId}升级还需${expList[idx]}点经验`);
    });
  }

  /**
   * 访问直播间获取荧光棒
   */
  async claimGifts() {
    // 初始化浏览器
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--window-size=1920,1080", "--ignore-certificate-errors", "--ignore-certificate-errors-spki-list", "--disable-dev-shm-usage"]
    });
    const page = await browser.newPage();
    // await page.setViewport({ width: 1920, height: 1080 });
    // 访问直播间
    await page.goto("https://www.douyu.com/1");
    // 设置cookie - 获取原始cookie数据以支持JSON格式
    const kvConfig = (await import('./kv-config')).default;
    const rawCookieData = await kvConfig.getValue("COOKIES");
    const cookie = this.getCookieJSON(rawCookieData);
    await page.setCookie(...cookie);
    // 刷新页面登录
    logger.info("刷新页面以完成登录");
    await page.reload();
    // 等待页面加载完成
    await page.waitForSelector(".UserInfo");
    await sleep(5000);
    // 判断是否登录
    const isLogin = (await page.$(".UserInfo")) !== null;
    if (isLogin) {
      logger.info("成功以登陆状态进入页面");
    } else {
      logger.info("没有携带cookie进入页面,请重新检查cookie");
    }
    // logger.info("再次刷新页面");
    // await page.reload();
    // await page.waitForSelector(".UserInfo");
    logger.info("关闭直播间");
    await browser.close();
  }

  /**
   * 获取cookie json
   * 支持字符串格式和JSON格式的cookie数据
   * 新版本支持从domainCookieMap.douyu.com.cookies数组中提取cookie数据
   * @param cookieData 原始cookie数据（字符串或JSON字符串）
   * @returns puppeteer格式的cookie数组
   */
  getCookieJSON(cookieData: string): Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None' | undefined;
  }> {
    try {
      // 尝试解析JSON格式的cookie数据
      const parsedData: CookieData = JSON.parse(cookieData);
      
      // 检查是否有domainCookieMap.douyu.com.cookies结构
      if (parsedData.domainCookieMap && 
          parsedData.domainCookieMap["douyu.com"] && 
          parsedData.domainCookieMap["douyu.com"].cookies) {
        
        const cookies = parsedData.domainCookieMap["douyu.com"].cookies;
        logger.info(`从JSON格式cookie数据中提取到${cookies.length}个douyu.com域名的cookies`);
        
        // 转换为puppeteer需要的格式
        return cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain || "www.douyu.com",
          path: cookie.path || "/",
          httpOnly: cookie.httpOnly || false,
          secure: cookie.secure || false,
          sameSite: this.normalizeSameSite(cookie.sameSite)
        }));
      }
    } catch (error) {
      // JSON解析失败，按字符串格式处理
      logger.info("Cookie数据不是JSON格式，使用传统字符串解析方式");
    }
    
    // 原有的字符串格式处理逻辑（向后兼容）
    const result = [];
    const first = cookieData.split(";");
    for (const s of first) {
      const second = s.split("=");
      if (second.length >= 2) {
        result.push({
          name: second[0].trim(),
          value: second[1].trim(),
          domain: "www.douyu.com",
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: undefined
        });
      }
    }
    logger.info(`从字符串格式cookie数据中解析到${result.length}个cookies`);
    return result;
  }

  /**
   * 标准化sameSite属性值
   * @param sameSite 原始sameSite值
   * @returns 标准化后的sameSite值
   */
  private normalizeSameSite(sameSite?: string): 'Strict' | 'Lax' | 'None' | undefined {
    if (!sameSite) return undefined;
    
    const normalized = sameSite.toLowerCase();
    switch (normalized) {
      case 'strict':
        return 'Strict';
      case 'lax':
        return 'Lax';
      case 'none':
        return 'None';
      default:
        return undefined;
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default Douyu;

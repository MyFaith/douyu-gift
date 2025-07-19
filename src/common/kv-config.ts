import axios from "axios";
import logger from "./logger";

/**
 * Cookie数据结构接口
 */
interface CookieData {
  updateTime: number;
  createTime: number;
  domainCookieMap: {
    [domain: string]: {
      updateTime: number;
      createTime: number;
      cookies: Array<{
        domain: string;
        name: string;
        value: string;
        path?: string;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: string;
        expirationDate?: number;
        hostOnly?: boolean;
        session?: boolean;
        storeId?: string;
      }>;
    };
  };
}

/**
 * Cloudflare KV 配置管理类
 * 用于通过 Cloudflare KV API 获取配置信息
 */
class KVConfig {
  private accountId: string;
  private namespaceId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor() {
    // 从环境变量获取 Cloudflare KV 相关配置
    this.accountId = process.env["CF_ACCOUNT_ID"] || "";
    this.namespaceId = process.env["CF_NAMESPACE_ID"] || "";
    this.apiToken = process.env["CF_API_TOKEN"] || "";
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/kv/namespaces/${this.namespaceId}`;

    if (!this.accountId || !this.namespaceId || !this.apiToken) {
      logger.error("Cloudflare KV 配置不完整，请检查环境变量 CF_ACCOUNT_ID, CF_NAMESPACE_ID, CF_API_TOKEN");
    }
  }

  /**
   * 从 Cloudflare KV 获取配置值
   * @param key 配置键名
   * @returns 配置值
   */
  async getValue(key: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/values/${key}`, {
        headers: {
          "Authorization": `Bearer ${this.apiToken}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 200) {
        logger.info(`成功从 KV 获取配置: ${key}`);
        // 如果返回的是对象，转换为JSON字符串；如果是字符串，直接返回
        if (typeof response.data === 'object' && response.data !== null) {
          return JSON.stringify(response.data);
        } else {
          return response.data;
        }
      } else {
        throw new Error(`获取配置失败: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      logger.error(`从 KV 获取配置 ${key} 失败: ${error.message}`);
      return "";
    }
  }

  /**
   * 向 Cloudflare KV 设置配置值
   * @param key 配置键名
   * @param value 配置值
   * @returns 是否设置成功
   */
  async setValue(key: string, value: string): Promise<boolean> {
    try {
      const response = await axios.put(`${this.baseUrl}/values/${key}`, value, {
        headers: {
          "Authorization": `Bearer ${this.apiToken}`,
          "Content-Type": "text/plain"
        }
      });

      if (response.status === 200) {
        logger.info(`成功设置 KV 配置: ${key}`);
        return true;
      } else {
        throw new Error(`设置配置失败: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      logger.error(`设置 KV 配置 ${key} 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取 Cookie 配置
   * @returns Cookie 字符串
   */
  async getCookies(): Promise<string> {
    const cookieData = await this.getValue("COOKIES");
    if (!cookieData) {
      logger.warn("KV中未找到COOKIES配置");
      return "";
    }

    try {
      // 尝试解析JSON格式的cookie数据
      const parsedData = JSON.parse(cookieData);
      
      // 检查是否有domainCookieMap.douyu.com.cookies结构
      if (parsedData.domainCookieMap && 
          parsedData.domainCookieMap["douyu.com"] && 
          parsedData.domainCookieMap["douyu.com"].cookies) {
        
        const cookies = parsedData.domainCookieMap["douyu.com"].cookies;
        
        // 将cookies数组转换为字符串格式
        const cookieString = cookies
          .map((cookie: any) => `${cookie.name}=${cookie.value}`)
          .join("; ");
        
        logger.info("成功从JSON格式的cookie数据中提取douyu.com域名的cookies");
        return cookieString;
      } else {
        // 如果不是JSON格式或结构不匹配，直接返回原始数据（向后兼容）
        logger.info("使用原始字符串格式的cookie数据");
        return cookieData;
      }
    } catch (error: any) {
      // 如果JSON解析失败，可能是旧的字符串格式，直接返回原始数据
      logger.warn(`Cookie数据解析失败，使用原始格式: ${error.message}`);
      return cookieData;
    }
  }

  /**
   * 获取推送密钥配置
   * @returns 推送密钥字符串
   */
  async getServerPushKey(): Promise<string> {
    return await this.getValue("SERVERPUSHKEY");
  }

  /**
   * 设置 Cookie 配置
   * @param cookies Cookie 字符串
   * @returns 是否设置成功
   */
  async setCookies(cookies: string): Promise<boolean> {
    return await this.setValue("COOKIES", cookies);
  }

  /**
   * 设置 JSON 格式的 Cookie 配置
   * @param cookieData JSON格式的cookie数据对象
   * @returns 是否设置成功
   */
  async setCookiesJSON(cookieData: CookieData): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(cookieData);
      return await this.setValue("COOKIES", jsonString);
    } catch (error: any) {
      logger.error(`设置JSON格式Cookie失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 设置推送密钥配置
   * @param pushKey 推送密钥字符串
   * @returns 是否设置成功
   */
  async setServerPushKey(pushKey: string): Promise<boolean> {
    return await this.setValue("SERVERPUSHKEY", pushKey);
  }
}

const kvConfig = new KVConfig();

export default kvConfig;
export type { CookieData };
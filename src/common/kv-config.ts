import axios from "axios";
import logger from "./logger";

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
        return response.data;
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
    return await this.getValue("COOKIES");
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
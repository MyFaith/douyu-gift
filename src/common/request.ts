import axios, { AxiosInstance } from "axios";
import logger from "./logger";
import kvConfig from "./kv-config";

class Request {
  // cookie
  public cookie;
  // axios
  private req: AxiosInstance;

  constructor() {
    // 初始化时设置空的 cookie，稍后通过 init 方法异步获取
    this.cookie = "";
    // 创建axios对象
    this.req = axios.create({
      baseURL: "https://www.douyu.com",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 Edg/88.0.705.81",
        referer: "https://www.douyu.com",
        Cookie: this.cookie
      }
    });
  }

  /**
   * 初始化配置，从 KV 获取 Cookie
   */
  async init() {
    try {
      this.cookie = await kvConfig.getCookies();
      // 更新 axios 实例的 Cookie 头
      this.req.defaults.headers.Cookie = this.cookie;
      logger.info("成功从 KV 加载 Cookie 配置");
    } catch (error: any) {
      logger.error(`从 KV 加载 Cookie 配置失败: ${error.message}`);
    }
  }

  /**
   * 请求方法
   */
  async send(method: string, url: string, data?: any) {
    try {
      const result = await this.req({ method, url, data });
      if (result.status === 200) {
        return result.data;
      } else {
        throw new Error(result.status + result.statusText);
      }
    } catch (err: any) {
      logger.error(`AXIOS_ERROR: ${err.message}`);
      return null;
    }
  }
}

const request = new Request();

export default request;

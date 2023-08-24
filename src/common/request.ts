import axios, { AxiosInstance } from "axios";
import logger from "./logger";

class Request {
  // cookie
  public cookie;
  // axios
  private req: AxiosInstance;

  constructor() {
    // 从环境变量获取cookie
    const cookie = process.env["COOKIE"] || "";
    this.cookie = cookie;
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

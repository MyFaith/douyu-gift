import axios, { AxiosInstance } from "axios";
import logger from "./logger";

class Request {
  // cookie
  public cookie;
  // axios
  private req: AxiosInstance;

  constructor() {
    // 从环境变量获取cookie
    const cookie =
      process.env["COOKIE"] ||
      "dy_did=9d14d3a1dff047d65546fc5300061601; acf_did=9d14d3a1dff047d65546fc5300061601; dy_teen_mode=%7B%22uid%22%3A%22140593%22%2C%22status%22%3A0%2C%22birthday%22%3A%22%22%2C%22password%22%3A%22%22%7D; dy_did=9d14d3a1dff047d65546fc5300061601; acf_auth=82f8mFMTFUa6Zq88I3WX5AaMXWMQDBiEUp2onr5By6VJacRsc99z1cfdaWo0hroje8pYvtn%2BjMgA2OvqV%2F7zOldeG2LrHRHrbVdckqDoxxEsnH9reLGLltGzx9g; dy_auth=6feam%2BPgNny7YdRno72iI1jgHQeS2K3WxmxTiBJhjxSvrHLarFzfauEMTMI3w9w1YNCeaJf4V1uEihaBCHw0Ec%2FZavdvxX%2Bc0wzfMwMLDwhmypnDbnj737CRUzk; wan_auth37wan=67c933e8f668eTalhgPpB0RC%2BjaZlfhGRChTacQ78KVOsIU%2BJH8Gijnhlxv%2BNDxGiNI91NzQICDed7MZSOg%2BKnmJiWFiH8Zd40iq1KCPt9iQt4c; acf_uid=140593; acf_username=auto_Sz82MpyMSn; acf_nickname=MyFaith; acf_own_room=1; acf_groupid=1; acf_phonestatus=1; acf_ct=0; acf_ltkid=21258120; acf_biz=1; acf_stk=0f28ecd4dbd7383c; acf_avatar=//apic.douyucdn.cn/upload/avatar_v3/202307/b02396a029554b0480a1a00b2c61babf_; acf_ccn=f4769599c7a6ed13836fabbdb9eb57ec";
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

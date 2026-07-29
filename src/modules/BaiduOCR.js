import axios from 'axios';

export default class BaiduOCR {
    constructor(appId, apiKey, secretKey) {
        this.appId = appId;
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.accessToken = null;
    }

    /**
     * 内部方法：获取或更新 Access Token
     * 百度 Token 有效期为 30 天，在类实例生命周期内进行内存缓存
     */
    async _getAccessToken() {
        if (this.accessToken) {
            return this.accessToken;
        }

        const tokenUrl = 'https://aip.baidubce.com/oauth/2.0/token';
        
        const response = await axios.get(tokenUrl, {
            params: {
                grant_type: 'client_credentials',
                client_id: this.apiKey,
                client_secret: this.secretKey
            }
        });

        if (response.data && response.data.access_token) {
            this.accessToken = response.data.access_token;
            return this.accessToken;
        } else if (response.data && response.data.error_description) {
            throw new Error(`认证失败: ${response.data.error_description}`);
        } else {
            throw new Error('无法获取 Access Token');
        }
    }

    /**
     * 内部核心请求方法
     */
    async _requestOcr(endpoint, base64Image) {
        try {
            // 1. 确保拿到鉴权 Token
            const token = await this._getAccessToken();

            // 2. 预处理 Base64 字符串（自动过滤掉前端常见的 "data:image/jpeg;base64," 前缀）
            let cleanBase64 = base64Image;
            if (cleanBase64.includes(',')) {
                cleanBase64 = cleanBase64.split(',')[1];
            }

            // 3. 百度要求 Content-Type 为 application/x-www-form-urlencoded
            // 使用 URLSearchParams 会自动对 Base64 中的特殊字符进行 URL 编码
            const params = new URLSearchParams();
            params.append('image', cleanBase64);

            const apiUrl = `${endpoint}?access_token=${token}`;
            
            const response = await axios.post(apiUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 15000
            });

            // 4. 处理百度业务级别的错误（注意：百度在接口报错时，HTTP 状态码依然通常是 200）
            if (response.data && response.data.error_code) {
                return {
                    result: "error",
                    msg: response.data.error_msg || `错误码: ${response.data.error_code}`
                };
            }

            // 5. 成功则直接返回原厂完整数据
            return response.data;

        } catch (error) {
            // 6. 统一捕获网络异常、HTTP 状态码异常(4xx/5xx)或 Token 获取失败
            let errorMsg = error.message || '未知网络错误';
            if (error.response && error.response.data && error.response.data.error_msg) {
                errorMsg = error.response.data.error_msg;
            }
            return {
                result: "error",
                msg: errorMsg
            };
        }
    }

    /**
     * 通用文字识别（高精度版）
     * @param {string} base64Image - 图片的 base64 字符串
     */
    async accurateBasic(base64Image) {
        const endpoint = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic';
        const result = await this._requestOcr(endpoint, base64Image);
        if (result.words_result === undefined || result.result === 'error') {
            return result;
        }
        const list = [];
        result.words_result.forEach(val => {
            list.push(val.words);
        });
        return {result: 'success', list: list};
    }

    /**
     * 通用文字识别（标准版）
     * @param {string} base64Image - 图片的 base64 字符串
     */
    async generalBasic(base64Image) {
        const endpoint = 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic';
        const result = await this._requestOcr(endpoint, base64Image);
        if (result.words_result === undefined || result.result === 'error') {
            return result;
        }
        const list = [];
        result.words_result.forEach(val => {
            list.push(val.words);
        });
        return {result: 'success', list: list};
    }
}
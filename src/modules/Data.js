import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

class Data {
  db = null;
  sqlite = null;

  /**
   * 连接数据库
   * @returns {Promise<void>}
   */
  async init() {
    try {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
      const isConnection = await this.sqlite.checkConnectionsConsistency();
      const isConnected = await this.sqlite.isConnection('app_data', false);
      
      if (isConnected.result) {
        this.db = await this.sqlite.retrieveConnection('app_data', false);
      }else {
        this.db = await this.sqlite.createConnection('app_data', false, 'no-encryption', 1, false);
      }

      await this.db.open();
      // 检查和写入默认数据表
      return  await this.initTables();
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 导入翻译记录
   * @param dataList 数据对象数组
   * @returns {Promise<{result: string, count: number}|{result: string, msg: *}>}
   */
  async importTranslationHistory(dataList) {
    // 生成占位符
    const placeholders = dataList.map(() => '(?, ?, ?, ?)').join(', ');
    const sql = `
    INSERT INTO translation_history (api_name, provider, created, word_count)
    VALUES ${placeholders}
    `;
    // 转换数组
    const values = dataList.flatMap(item => [item.api_name, item.provider, item.created, item.word_count]);
    try {
      const result = await this.db.run(sql, values);
      return {result: 'success', count: result.changes.changes};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 导入 OCR 记录
   * @param dataList 记录数组对象
   * @returns {Promise<{result: string, count: number}|{result: string, msg: *}>}
   */
  async importOcrHistory(dataList) {
    // 生成占位符
    const placeholders = dataList.map(() => '(?, ?, ?)').join(', ');
    const sql = `
    INSERT INTO ocr_history (api_name, provider, created)
    VALUES ${placeholders}
    `;
    // 转换数组
    const values = dataList.flatMap(item => [item.api_name, item.provider, item.created]);
    try {
      const result = await this.db.run(sql, values);
      return {result: 'success', count: result.changes.changes};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 导入 TTS 记录
   * @param dataList 数据对象数组
   * @returns {Promise<{result: string, count: number}|{result: string, msg: *}>}
   */
  async importTtsHistory(dataList) {
    // 生成占位符
    const placeholders = dataList.map(() => '(?, ?, ?, ?)').join(', ');
    const sql = `
    INSERT INTO tts_history (api_name, provider, created, word_count)
    VALUES ${placeholders}
    `;
    // 转换数组
    const values = dataList.flatMap(item => [item.api_name, item.provider, item.created, item.word_count]);
    try {
      const result = await this.db.run(sql, values);
      return {result: 'success', count: result.changes.changes};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取所有翻译记录，用于导出数据
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async exporttranslationHistory() {
    const sql = 'SELECT api_name, provider, created, word_count FROM translation_history';
    try {
      const result = await this.db.query(sql);
      return {result: 'success', data: result.values};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取所有 OCR 记录，用于导出数据
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async exportOcrHistory() {
    const sql = 'SELECT api_name, provider, created FROM ocr_history';
    try {
      const result = await this.db.query(sql);
      return {result: 'success', data: result.values};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取所有 TTS 记录，用于导出数据
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async exportTtsHistory() {
    const sql = 'SELECT api_name, provider, created, word_count FROM tts_history';
    try {
      const result = await this.db.query(sql);
      return {result: 'success', data: result.values};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取翻译记录总数量
   * @returns {Promise<{result: string, msg: *}|{result: string, count: *}>}
   */
  async getTranslationHistoryCount() {
    const sql = 'SELECT COUNT(*) AS count FROM translation_history';
    try {
      const result = await this.db.query(sql);
      return {result: 'success', count: result.values[0].count};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取翻译记录
   * @param {number} start 起始位置
   * @param {number} count 数量
   * @returns {Promise<{result: string, msg: *}|{result: string, data: *}>}
   */
  async getTranslationHistory(start = 0, count = 20) {
    const sql = `
    SELECT api_name, provider, created, word_count FROM translation_history
    ORDER BY created DESC LIMIT ?, ?
    `;
    const values = [start, count];
    try {
      const result = await this.db.query(sql, values);
      return {result: 'success', data: result.values};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取 OCR 记录的总数量
   * @returns {Promise<{result: string, msg: *}|{result: string, count: *}>}
   */
  async getOcrHistoryCount() {
    const sql = 'SELECT COUNT(*) AS count FROM ocr_history';
    try {
      const result = await this.db.query(sql);
      return {result: 'success', count: result.values[0].count};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取 OCR 记录
   * @param {number} start 起始位置
   * @param {number} count 数量
   * @returns {Promise<{result: string, msg: *}|{result: string, data: *}>}
   */
  async getOcrHistory(start = 0, count = 20) {
    const sql = `
    SELECT api_name, provider, created FROM ocr_history
    ORDER BY created DESC LIMIT ?, ?
    `;
    const values = [start, count];
    try {
      const result = await this.db.query(sql, values);
      return {result: 'success', data: result.values};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取 TTS 记录的总数量
   * @returns {Promise<{result: string, msg: *}|{result: string, count: *}>}
   */
  async getTtsHistoryCount() {
    const sql = 'SELECT COUNT(*) AS count FROM tts_history';
    try {
      const result = await this.db.query(sql);
      return {result: 'success', count: result.values[0].count};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取 TTS 记录
   * @param {number} start 起始位置
   * @param {number} count 数量
   * @returns {Promise<{result: string, msg: *}|{result: string, data: *}>}
   */
  async getTtsHistory(start = 0, count = 20) {
    const sql = `
    SELECT api_name, provider, created, word_count FROM tts_history
    ORDER BY created DESC LIMIT ?, ?
    `;
    const values = [start, count];
    try {
      const result = await this.db.query(sql, values);
      return {result: 'success', data: result.values};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 按 api_name、provider 分组统计使用量（公共查询逻辑）
   * @param {string} table 表名
   * @param {string} aggregate 聚合表达式，如 COUNT(*)
   * @param {string} alias 统计列别名，如 count 或 word_count
   * @param {number} [timestamp] 起始时间戳，传入时只统计该时间之后的数据
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async getGroupedStats(table, aggregate, alias, timestamp) {
    const whereClause = timestamp !== undefined ? 'WHERE created >= ?' : '';
    const values = timestamp !== undefined ? [timestamp] : [];
    const sql = `
    SELECT api_name, provider, ${aggregate} AS ${alias}
    FROM ${table}
    ${whereClause}
    GROUP BY api_name, provider
    ORDER BY ${alias} DESC
    `;
    try {
      const result = await this.db.query(sql, values);
      return {result: 'success', data: result.values};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取翻译字数统计
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async getTranslationWordCount() {
    return this.getGroupedStats('translation_history', 'SUM(word_count)', 'word_count');
  }

  /**
   * 获取本月翻译字数统计
   * @param {number} timestamp 起始时间戳
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async getThisMonthTranslationWordCount(timestamp) {
    return this.getGroupedStats('translation_history', 'SUM(word_count)', 'word_count', timestamp);
  }

  /**
   * 获取每个 OCR API 的总使用量
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async getOcrCount() {
    return this.getGroupedStats('ocr_history', 'COUNT(*)', 'count');
  }

  /**
   * 获取本月 OCR API 的使用量
   * @param {number} timestamp 起始时间戳
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async getThisMonthOcrCount(timestamp) {
    return this.getGroupedStats('ocr_history', 'COUNT(*)', 'count', timestamp);
  }

  /**
   * 获取 TTS 字数统计
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async getTtsWordCount() {
    return this.getGroupedStats('tts_history', 'SUM(word_count)', 'word_count');
  }

  /**
   * 获取本月 TTS 字数统计
   * @param {number} timestamp 起始时间戳
   * @returns {Promise<{result: string, data: *}|{result: string, msg: *}>}
   */
  async getThisMonthTtsWordCount(timestamp) {
    return this.getGroupedStats('tts_history', 'SUM(word_count)', 'word_count', timestamp);
  }

  /**
   * 添加翻译记录
   * @param {string} api_name API 名称
   * @param {string} provider 提供商
   * @param {number} created 时间戳
   * @param {number} word_count 字数
   * @returns 
   */
  async addTranslationHistory(api_name, provider, created, word_count) {
    const sql = `
    INSERT INTO translation_history
    (api_name, provider, created, word_count) VALUES (?, ?, ?, ?)
    `;
    const values = [api_name, provider, created, word_count];
    try {
      const result = await this.db.run(sql, values);
      return {result: 'success', count: result.changes.changes};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 添加 OCR 历史记录
   * @param {string} apiName API 名称
   * @param {string} provider 提供商
   * @param {number} created 时间戳
   * @returns 返回受影响的行
   */
  async addOcrHistory(apiName, provider, created) {
    const sql = `
    INSERT INTO ocr_history
    (api_name, provider, created) VALUES (?, ?, ?)
    `;
    const values = [apiName, provider, created];
    try {
      const result = await this.db.run(sql, values);
      return {result: 'success', count: result.changes.changes};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 添加 TTS 历史记录
   * @param {string} api_name API 名称
   * @param {string} provider 提供商
   * @param {number} created 时间戳
   * @param {number} word_count 字数
   * @returns 返回受影响的行
   */
  async addTtsHistory(api_name, provider, created, word_count) {
    const sql = `
    INSERT INTO tts_history
    (api_name, provider, created, word_count) VALUES (?, ?, ?, ?)
    `;
    const values = [api_name, provider, created, word_count];
    try {
      const result = await this.db.run(sql, values);
      return {result: 'success', count: result.changes.changes};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 获取选项数据
   * @returns {Promise<{result: string, msg: *}|*>}
   */
  async getOptions() {
    const sql = 'SELECT name, value FROM options';
    try {
      const result = await this.db.query(sql);
      // 把选项数组转为对象
      const options = Object.fromEntries(result.values.map(item => [item.name, item.value]));
      // 把一些选项值转为 Number
      options.ocr_voice_speed = Number(options.ocr_voice_speed);
      options.ocr_voice_volume = Number(options.ocr_voice_volume);
      options.translation_voice_volume = Number(options.translation_voice_volume);
      options.translation_voice_speed = Number(options.translation_voice_speed);
      // 把一些选项值转为 Boolean
      options.ocr_auto_voice = options.ocr_auto_voice === 'true';
      options.translation_auto_voice = options.translation_auto_voice === 'true';
      options.image_cropping = options.image_cropping === 'true';
      options.image_compression = options.image_compression === 'true';
      options.auto_open_camera = options.auto_open_camera === 'true';
      return {result: 'success', data: options};
    }catch (error) {
      return {result: 'error', msg: error.message};
    }
  }

  /**
   * 批量更新 options 表的配置项
   * @param {Object} optionsObj 配置项对象
   * @returns {Promise<Object>}
   */
  async updateOptions(optionsObj) {
    try {
      let totalChanges = 0;
      const sql = `UPDATE options SET value = ? WHERE name = ?`;

      // 使用 Object.entries 遍历对象的键和值
      for (const [key, value] of Object.entries(optionsObj)) {
        // 将所有类型的值（boolean, number 等）安全地转换为 string
        // 如果值为 null 或 undefined，则转换为空字符串
        const stringValue = (value !== null && value !== undefined) ? String(value) : '';

        // 执行 UPDATE 操作，参数化查询防止 SQL 注入
        const result = await this.db.run(sql, [stringValue, key]);

        // 累加当前行对数据库造成的影响件数
        if (result && result.changes) {
          totalChanges += result.changes.changes;
        }
      }

      // 返回成功对象及受影响的总行数
      return {
        result: "success",
        count: totalChanges
      };

    } catch (error) {
      // 捕获异常并返回错误信息
      return {
        result: "error",
        msg: error.message
      };
    }
  }

  /**
   * 检查并初始化所需的数据表，并自动写入默认配置
   * 使用 IF NOT EXISTS 语法与 PRIMARY KEY 约束配合，确保数据安全不重复
   * @returns {Promise<Object>} 操作结果对象
   */
  async initTables() {
    // 确保数据库连接已成功初始化
    if (!this.db) {
      return {
        result: 'error',
        msg: 'Database connection is not initialized. Call init() first.'
      };
    }

    try {
      // 1. 定义创建表的 SQL 语句
      // 注意：将 options 的 name 字段设为了 PRIMARY KEY，用于后续防止重复插入默认数据
      const schema = `
        CREATE TABLE IF NOT EXISTS options (
          name VARCHAR (500) PRIMARY KEY NOT NULL,
          value VARCHAR (1000) NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS ocr_history (
          api_name VARCHAR (50) NOT NULL,
          provider VARCHAR (30) NOT NULL,
          created INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS translation_history (
          api_name VARCHAR (50) NOT NULL,
          provider VARCHAR (30) NOT NULL,
          created INTEGER NOT NULL,
          word_count INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tts_history (
          api_name VARCHAR (50) NOT NULL,
          provider VARCHAR (30) NOT NULL,
          created INTEGER NOT NULL,
          word_count INTEGER NOT NULL
        );
      `;

      // 执行建表操作
      await this.db.execute(schema);

      // 2. 定义默认初始化的配置项对象
      // 后续如果需要增加或修改初始选项，直接在此处增删改即可
      const defaultOptions = {
        "youdao_ocr_app_id": "",
        "youdao_ocr_app_key": "",
        "xunfei_ocr_app_id": "",
        "xunfei_ocr_api_secret": "",
        "xunfei_ocr_api_key": "",
        "baidu_ocr_app_id": "",
        "baidu_ocr_api_key": "",
        "baidu_ocr_secret_key": "",
        "tencent_ocr_app_id": "",
        "tencent_ocr_secret_id": "",
        "tencent_ocr_secret_key": "",
        "tencent_ocr_region_selected": "ap-shanghai",
        "aliyun_access_key_id": "",
        "aliyun_access_key_secret": "",
        "baidu_translation_app_id": "",
        "baidu_translation_api_key": "",
        "default_ocr_api": "腾讯云通用印刷体识别",
        "ocr_voice_speed": 2,
        "ocr_voice_volume": 10,
        "translation_voice_volume": 10,
        "translation_voice_speed": 2,
        "ocr_auto_voice": false,
        "translation_auto_voice": false,
        "camera_mode": "程序内置相机",
        "image_cropping": true,
        "auto_open_camera": false,
        "ocr_tts_engine": "离线语音",
        "translation_tts_engine": "离线语音",
        "mimo_api_key": ""
      };

      // 3. 循环配置对象，动态拼接批量插入的 SQL 语句
      let insertSqlStatements = '';
      for (const [key, value] of Object.entries(defaultOptions)) {
        // 关键点：强转为 String 类型（将 false 转为 "false"，将数字转为字符串形式的数字）
        // 同时对可能带有单引号的字符串进行 SQLite 安全转义（把 ' 替换成 ''）
        const stringValue = String(value).replace(/'/g, "''");

        // 使用 INSERT OR IGNORE 语法：如果配置项 name 已经存在（即主键冲突），SQLite 会自动忽略该条插入
        // 这样可以确保多次调用 initTables 时，用户已经修改过的配置不会被默认值覆盖
        insertSqlStatements += `INSERT OR IGNORE INTO options (name, value) VALUES ('${key}', '${stringValue}');\n`;
      }

      // 4. 执行批量插入默认数据的 SQL
      if (insertSqlStatements) {
        await this.db.execute(insertSqlStatements);
      }

      // 全部成功后返回指定格式
      return { result: 'success' };

    } catch (error) {
      // 捕获异常并按要求格式返回
      return {
        result: 'error',
        msg: error.message
      };
    }
  }
}

export default new Data();

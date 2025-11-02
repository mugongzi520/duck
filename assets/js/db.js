/**
 * IndexedDB 数据库封装
 * 提供配置数据的本地持久化存储
 */

export class Database {
    constructor() {
        this.dbName = 'DuckovConfigDB';
        this.version = 1;
        this.db = null;
    }

    /**
     * 初始化数据库
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                reject(new Error('无法打开数据库'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ 数据库已连接');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建配置存储
                if (!db.objectStoreNames.contains('configs')) {
                    const configStore = db.createObjectStore('configs', { keyPath: 'id' });
                    configStore.createIndex('type', 'type', { unique: false });
                    configStore.createIndex('fileName', 'fileName', { unique: false });
                    configStore.createIndex('lastModified', 'lastModified', { unique: false });
                }

                console.log('✅ 数据库结构已创建');
            };
        });
    }

    /**
     * 获取所有配置
     */
    async getAllConfigs() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['configs'], 'readonly');
            const store = transaction.objectStore('configs');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(new Error('获取配置失败'));
            };
        });
    }

    /**
     * 根据ID获取配置
     */
    async getConfig(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['configs'], 'readonly');
            const store = transaction.objectStore('configs');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('获取配置失败'));
            };
        });
    }

    /**
     * 保存配置
     */
    async saveConfig(config) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['configs'], 'readwrite');
            const store = transaction.objectStore('configs');
            
            // 更新最后修改时间
            config.lastModified = new Date().toISOString();
            
            const request = store.put(config);

            request.onsuccess = () => {
                resolve(config);
            };

            request.onerror = () => {
                reject(new Error('保存配置失败'));
            };
        });
    }

    /**
     * 删除配置
     */
    async deleteConfig(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['configs'], 'readwrite');
            const store = transaction.objectStore('configs');
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = () => {
                reject(new Error('删除配置失败'));
            };
        });
    }

    /**
     * 按类型搜索配置
     */
    async searchByType(type) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['configs'], 'readonly');
            const store = transaction.objectStore('configs');
            const index = store.index('type');
            const request = index.getAll(type);

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(new Error('搜索配置失败'));
            };
        });
    }

    /**
     * 清空所有配置
     */
    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['configs'], 'readwrite');
            const store = transaction.objectStore('configs');
            const request = store.clear();

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = () => {
                reject(new Error('清空配置失败'));
            };
        });
    }

    /**
     * 批量保存配置
     */
    async batchSave(configs) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['configs'], 'readwrite');
            const store = transaction.objectStore('configs');
            const results = [];

            transaction.oncomplete = () => {
                resolve(results);
            };

            transaction.onerror = () => {
                reject(new Error('批量保存失败'));
            };

            configs.forEach(config => {
                config.lastModified = new Date().toISOString();
                const request = store.put(config);
                request.onsuccess = () => {
                    results.push(config);
                };
            });
        });
    }

    /**
     * 获取数据库统计信息
     */
    async getStatistics() {
        const configs = await this.getAllConfigs();
        const stats = {
            total: configs.length,
            byType: {},
            totalSize: 0,
        };

        configs.forEach(config => {
            // 按类型统计
            if (!stats.byType[config.type]) {
                stats.byType[config.type] = 0;
            }
            stats.byType[config.type]++;

            // 计算大小（粗略估算）
            stats.totalSize += JSON.stringify(config).length;
        });

        return stats;
    }
}

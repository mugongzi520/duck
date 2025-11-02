/**
 * 抽奖服务
 * 处理抽奖配置的管理
 */

export class GachaService {
    constructor() {
        this.gachaConfigs = new Map();
    }

    /**
     * 创建抽奖配置
     */
    createGachaConfig(name, description = '', notificationKey = '') {
        const config = {
            name,
            description,
            notificationKey,
            entries: [],
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        const id = this.generateId();
        this.gachaConfigs.set(id, config);
        return { id, ...config };
    }

    /**
     * 更新抽奖配置
     */
    updateGachaConfig(id, updates) {
        const config = this.gachaConfigs.get(id);
        if (!config) {
            throw new Error('抽奖配置不存在');
        }

        const updatedConfig = {
            ...config,
            ...updates,
            lastModified: new Date().toISOString()
        };

        this.gachaConfigs.set(id, updatedConfig);
        return updatedConfig;
    }

    /**
     * 删除抽奖配置
     */
    deleteGachaConfig(id) {
        if (!this.gachaConfigs.has(id)) {
            throw new Error('抽奖配置不存在');
        }
        this.gachaConfigs.delete(id);
    }

    /**
     * 获取抽奖配置
     */
    getGachaConfig(id) {
        const config = this.gachaConfigs.get(id);
        if (!config) return null;
        return { id, ...config };
    }

    /**
     * 获取所有抽奖配置
     */
    getAllGachaConfigs() {
        return Array.from(this.gachaConfigs.entries()).map(([id, config]) => ({
            id,
            ...config
        }));
    }

    /**
     * 添加抽奖条目
     */
    addGachaEntry(configId, itemId, weight) {
        const config = this.gachaConfigs.get(configId);
        if (!config) {
            throw new Error('抽奖配置不存在');
        }

        const entry = {
            itemId: parseInt(itemId),
            weight: parseFloat(weight)
        };

        config.entries.push(entry);
        config.lastModified = new Date().toISOString();

        return entry;
    }

    /**
     * 更新抽奖条目
     */
    updateGachaEntry(configId, entryIndex, updates) {
        const config = this.gachaConfigs.get(configId);
        if (!config) {
            throw new Error('抽奖配置不存在');
        }

        if (entryIndex < 0 || entryIndex >= config.entries.length) {
            throw new Error('抽奖条目不存在');
        }

        const entry = config.entries[entryIndex];
        const updatedEntry = { ...entry, ...updates };

        // 确保数据类型正确
        if (updatedEntry.itemId !== undefined) {
            updatedEntry.itemId = parseInt(updatedEntry.itemId);
        }
        if (updatedEntry.weight !== undefined) {
            updatedEntry.weight = parseFloat(updatedEntry.weight);
        }

        config.entries[entryIndex] = updatedEntry;
        config.lastModified = new Date().toISOString();

        return updatedEntry;
    }

    /**
     * 删除抽奖条目
     */
    removeGachaEntry(configId, entryIndex) {
        const config = this.gachaConfigs.get(configId);
        if (!config) {
            throw new Error('抽奖配置不存在');
        }

        if (entryIndex < 0 || entryIndex >= config.entries.length) {
            throw new Error('抽奖条目不存在');
        }

        const removedEntry = config.entries.splice(entryIndex, 1)[0];
        config.lastModified = new Date().toISOString();

        return removedEntry;
    }

    /**
     * 计算抽奖概率
     */
    calculateProbabilities(configId) {
        const config = this.gachaConfigs.get(configId);
        if (!config) {
            throw new Error('抽奖配置不存在');
        }

        const totalWeight = config.entries.reduce((sum, entry) => sum + entry.weight, 0);
        
        if (totalWeight === 0) {
            return [];
        }

        return config.entries.map(entry => ({
            itemId: entry.itemId,
            weight: entry.weight,
            probability: (entry.weight / totalWeight * 100).toFixed(2)
        }));
    }

    /**
     * 模拟抽奖
     */
    simulateGacha(configId, count = 100) {
        const config = this.gachaConfigs.get(configId);
        if (!config) {
            throw new Error('抽奖配置不存在');
        }

        if (config.entries.length === 0) {
            return [];
        }

        const totalWeight = config.entries.reduce((sum, entry) => sum + entry.weight, 0);
        const results = [];

        for (let i = 0; i < count; i++) {
            const random = Math.random() * totalWeight;
            let currentWeight = 0;
            
            for (const entry of config.entries) {
                currentWeight += entry.weight;
                if (random <= currentWeight) {
                    results.push(entry.itemId);
                    break;
                }
            }
        }

        // 统计结果
        const statistics = {};
        results.forEach(itemId => {
            statistics[itemId] = (statistics[itemId] || 0) + 1;
        });

        return Object.entries(statistics).map(([itemId, count]) => ({
            itemId: parseInt(itemId),
            count,
            percentage: (count / results.length * 100).toFixed(2)
        }));
    }

    /**
     * 验证抽奖配置
     */
    validateGachaConfig(config) {
        const errors = [];

        if (!config.name || config.name.trim() === '') {
            errors.push('抽奖名称不能为空');
        }

        if (!config.entries || config.entries.length === 0) {
            errors.push('至少需要一个抽奖条目');
        } else {
            config.entries.forEach((entry, index) => {
                if (!entry.itemId || entry.itemId <= 0) {
                    errors.push(`条目 ${index + 1}: 物品ID必须大于0`);
                }
                if (entry.weight === undefined || entry.weight < 0) {
                    errors.push(`条目 ${index + 1}: 权重不能为负数`);
                }
            });

            const totalWeight = config.entries.reduce((sum, entry) => sum + entry.weight, 0);
            if (totalWeight === 0) {
                errors.push('总权重不能为0');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 导出抽奖配置为JSON格式
     */
    exportGachaConfig(configId) {
        const config = this.gachaConfigs.get(configId);
        if (!config) {
            throw new Error('抽奖配置不存在');
        }

        const exportData = {
            Description: config.description,
            NotificationKey: config.notificationKey,
            Entries: config.entries.map(entry => ({
                ItemId: entry.itemId,
                Weight: entry.weight
            }))
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 从JSON导入抽奖配置
     */
    importGachaConfig(jsonData, name) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!data.Entries || !Array.isArray(data.Entries)) {
                throw new Error('无效的抽奖配置格式');
            }

            const config = this.createGachaConfig(
                name || '导入的抽奖配置',
                data.Description || '',
                data.NotificationKey || ''
            );

            data.Entries.forEach(entry => {
                if (entry.ItemId && entry.Weight !== undefined) {
                    this.addGachaEntry(config.id, entry.ItemId, entry.Weight);
                }
            });

            return config;
        } catch (error) {
            throw new Error(`导入失败: ${error.message}`);
        }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'gacha_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取统计信息
     */
    getStatistics() {
        const configs = this.getAllGachaConfigs();
        const totalConfigs = configs.length;
        const totalEntries = configs.reduce((sum, config) => sum + config.entries.length, 0);

        return {
            totalConfigs,
            totalEntries,
            averageEntriesPerConfig: totalConfigs > 0 ? (totalEntries / totalConfigs).toFixed(1) : 0
        };
    }
}

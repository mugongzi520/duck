/**
 * 配置服务
 * 处理配置的业务逻辑
 */

import { generateId, deepClone } from '../utils/helpers.js';
import { CONFIG_TYPES, DEFAULT_CONFIG_CONTENT, TYPE_SPECIFIC_FIELDS } from '../utils/constants.js';

export class ConfigService {
    constructor(db, store) {
        this.db = db;
        this.store = store;
    }

    /**
     * 创建新配置
     */
    async createConfig(type, fileName) {
        const config = {
            id: generateId(),
            fileName: fileName || `new_${type}_${Date.now()}`,
            type: type,
            lastModified: new Date().toISOString(),
            content: this.getDefaultContent(type)
        };

        const saved = await this.db.saveConfig(config);
        this.store.dispatch({ type: 'ADD_CONFIG', payload: saved });
        
        return saved;
    }

    /**
     * 更新配置
     * @param {string} id - 配置ID
     * @param {Object} content - 配置内容
     * @param {Object} options - 可选参数，包含 fileName 和 type
     */
    async updateConfig(id, content, options = {}) {
        const config = await this.db.getConfig(id);
        if (!config) {
            throw new Error('配置不存在');
        }

        config.content = content;
        config.lastModified = new Date().toISOString();

        // 更新文件名和类型（如果提供）
        if (options.fileName !== undefined) {
            config.fileName = options.fileName;
        }
        if (options.type !== undefined) {
            config.type = options.type;
        }

        const saved = await this.db.saveConfig(config);
        this.store.dispatch({ type: 'UPDATE_CONFIG', payload: saved });

        return saved;
    }

    /**
     * 删除配置
     */
    async deleteConfig(id) {
        await this.db.deleteConfig(id);
        this.store.dispatch({ type: 'DELETE_CONFIG', payload: id });
        return true;
    }

    /**
     * 复制配置
     */
    async duplicateConfig(id) {
        const original = await this.db.getConfig(id);
        if (!original) {
            throw new Error('配置不存在');
        }

        const duplicate = {
            id: generateId(),
            fileName: `${original.fileName}_copy`,
            type: original.type,
            lastModified: new Date().toISOString(),
            content: deepClone(original.content)
        };

        const saved = await this.db.saveConfig(duplicate);
        this.store.dispatch({ type: 'ADD_CONFIG', payload: saved });

        return saved;
    }

    /**
     * 获取默认配置内容
     */
    getDefaultContent(type) {
        const content = { ...DEFAULT_CONFIG_CONTENT };
        
        // 添加类型特定属性
        const propsKey = this.getPropsKey(type);
        if (propsKey && propsKey !== 'mshook') {
            content[propsKey] = {};
        } else if (type === CONFIG_TYPES.ITEM) {
            content.mshook = {};
        }

        return content;
    }

    /**
     * 获取特定属性的键名
     */
    getPropsKey(type) {
        const keyMap = {
            [CONFIG_TYPES.WEAPON]: 'WeaponProperties',
            [CONFIG_TYPES.MELEE]: 'MeleeWeaponProperties',
            [CONFIG_TYPES.AMMO]: 'AmmoProperties',
            [CONFIG_TYPES.ACCESSORY]: 'SlotConfiguration',
            [CONFIG_TYPES.ITEM]: 'mshook'
        };
        return keyMap[type];
    }

    /**
     * 验证配置
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];

        // 必填字段检查
        if (!config.fileName) {
            errors.push('文件名不能为空');
        }

        if (!config.type) {
            errors.push('配置类型不能为空');
        }

        if (!config.content) {
            errors.push('配置内容不能为空');
        } else {
            // 检查基础字段
            if (config.content.NewItemId === 0) {
                warnings.push('新物品ID未设置');
            }

            if (!config.content.DisplayName) {
                warnings.push('显示名称未设置');
            }

            // 检查质量范围
            if (config.content.Quality < 1 || config.content.Quality > 9) {
                errors.push('品质必须在1-9之间');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 搜索配置
     */
    searchConfigs(query, configs) {
        if (!query) return configs;

        const lowerQuery = query.toLowerCase();
        return configs.filter(config => {
            return (
                config.fileName.toLowerCase().includes(lowerQuery) ||
                config.content?.DisplayName?.toLowerCase().includes(lowerQuery) ||
                config.content?.NewItemId?.toString().includes(lowerQuery) ||
                config.content?.Tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        });
    }

    /**
     * 按类型筛选配置
     */
    filterByType(type, configs) {
        if (type === 'all') return configs;
        return configs.filter(config => config.type === type);
    }

    /**
     * 获取配置统计
     */
    getStatistics(configs) {
        const stats = {
            total: configs.length,
            byType: {}
        };

        Object.values(CONFIG_TYPES).forEach(type => {
            stats.byType[type] = configs.filter(c => c.type === type).length;
        });

        return stats;
    }
}

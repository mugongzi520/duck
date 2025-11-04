/**
 * 批量操作服务
 * 提供批量编辑、删除、导出等功能
 */

import { generateId } from '../utils/helpers.js';

export class BatchService {
    constructor(db, store) {
        this.db = db;
        this.store = store;
    }

    /**
     * 批量删除配置
     */
    async batchDelete(configIds) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of configIds) {
            try {
                await this.db.deleteConfig(id);
                results.success.push(id);
            } catch (error) {
                results.failed.push({
                    id,
                    error: error.message
                });
            }
        }

        // 更新store状态
        const currentState = this.store.getState();
        const remainingConfigs = currentState.configs.filter(c => !results.success.includes(c.id));
        this.store.dispatch({ type: 'SET_CONFIGS', payload: remainingConfigs });

        return results;
    }

    /**
     * 批量导出配置
     */
    async batchExport(configIds, format = 'json') {
        const configs = [];
        
        for (const id of configIds) {
            try {
                const config = await this.db.getConfig(id);
                if (config) {
                    configs.push(config);
                }
            } catch (error) {
                console.error(`获取配置 ${id} 失败:`, error);
            }
        }

        if (configs.length === 0) {
            throw new Error('没有可导出的配置');
        }

        switch (format) {
            case 'json':
                return this.exportAsJSON(configs);
            case 'zip':
                return this.exportAsZip(configs);
            default:
                throw new Error(`不支持的导出格式: ${format}`);
        }
    }

    /**
     * 导出为JSON格式
     */
    exportAsJSON(configs) {
        const exportData = {
            version: '2.0',
            exportTime: new Date().toISOString(),
            configs: configs.map(config => ({
                fileName: config.fileName,
                type: config.type,
                lastModified: config.lastModified,
                content: config.content
            }))
        };

        return {
            filename: `configs_batch_${Date.now()}.json`,
            content: JSON.stringify(exportData, null, 2),
            mimeType: 'application/json'
        };
    }

    /**
     * 导出为ZIP格式（需要JSZip库）
     */
    async exportAsZip(configs) {
        if (typeof JSZip === 'undefined') {
            throw new Error('需要JSZip库支持ZIP导出功能');
        }

        const zip = new JSZip();

        configs.forEach(config => {
            const filename = `${config.fileName}.json`;
            const content = JSON.stringify(config.content, null, 2);
            zip.file(filename, content);
        });

        // 添加清单文件
        const manifest = {
            version: '2.0',
            exportTime: new Date().toISOString(),
            count: configs.length,
            configs: configs.map(config => ({
                fileName: config.fileName,
                type: config.type,
                lastModified: config.lastModified
            }))
        };
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        return {
            filename: `configs_batch_${Date.now()}.zip`,
            content: zipBlob,
            mimeType: 'application/zip'
        };
    }

    /**
     * 批量更新配置属性
     */
    async batchUpdateProperties(configIds, updates) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of configIds) {
            try {
                const config = await this.db.getConfig(id);
                if (!config) {
                    throw new Error('配置不存在');
                }

                // 合并更新内容
                const updatedContent = {
                    ...config.content,
                    ...updates.content
                };

                const updatedConfig = {
                    ...config,
                    content: updatedContent,
                    lastModified: new Date().toISOString()
                };

                await this.db.saveConfig(updatedConfig);
                results.success.push(updatedConfig);
            } catch (error) {
                results.failed.push({
                    id,
                    error: error.message
                });
            }
        }

        // 更新store状态
        if (results.success.length > 0) {
            const currentState = this.store.getState();
            const updatedConfigs = currentState.configs.map(config => {
                const updated = results.success.find(c => c.id === config.id);
                return updated || config;
            });
            this.store.dispatch({ type: 'SET_CONFIGS', payload: updatedConfigs });
        }

        return results;
    }

    /**
     * 批量替换标签
     */
    async batchReplaceTags(configIds, oldTag, newTag) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of configIds) {
            try {
                const config = await this.db.getConfig(id);
                if (!config) {
                    throw new Error('配置不存在');
                }

                const tags = config.content.Tags || [];
                const tagIndex = tags.indexOf(oldTag);
                
                if (tagIndex > -1) {
                    tags[tagIndex] = newTag;
                    
                    const updatedConfig = {
                        ...config,
                        content: {
                            ...config.content,
                            Tags: tags
                        },
                        lastModified: new Date().toISOString()
                    };

                    await this.db.saveConfig(updatedConfig);
                    results.success.push(updatedConfig);
                } else {
                    results.failed.push({
                        id,
                        error: `未找到标签: ${oldTag}`
                    });
                }
            } catch (error) {
                results.failed.push({
                    id,
                    error: error.message
                });
            }
        }

        // 更新store状态
        if (results.success.length > 0) {
            const currentState = this.store.getState();
            const updatedConfigs = currentState.configs.map(config => {
                const updated = results.success.find(c => c.id === config.id);
                return updated || config;
            });
            this.store.dispatch({ type: 'SET_CONFIGS', payload: updatedConfigs });
        }

        return results;
    }

    /**
     * 批量添加标签
     */
    async batchAddTags(configIds, tagsToAdd) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of configIds) {
            try {
                const config = await this.db.getConfig(id);
                if (!config) {
                    throw new Error('配置不存在');
                }

                const currentTags = config.content.Tags || [];
                const newTags = [...new Set([...currentTags, ...tagsToAdd])];
                
                const updatedConfig = {
                    ...config,
                    content: {
                        ...config.content,
                        Tags: newTags
                    },
                    lastModified: new Date().toISOString()
                };

                await this.db.saveConfig(updatedConfig);
                results.success.push(updatedConfig);
            } catch (error) {
                results.failed.push({
                    id,
                    error: error.message
                });
            }
        }

        // 更新store状态
        if (results.success.length > 0) {
            const currentState = this.store.getState();
            const updatedConfigs = currentState.configs.map(config => {
                const updated = results.success.find(c => c.id === config.id);
                return updated || config;
            });
            this.store.dispatch({ type: 'SET_CONFIGS', payload: updatedConfigs });
        }

        return results;
    }

    /**
     * 批量移除标签
     */
    async batchRemoveTags(configIds, tagsToRemove) {
        const results = {
            success: [],
            failed: []
        };

        for (const id of configIds) {
            try {
                const config = await this.db.getConfig(id);
                if (!config) {
                    throw new Error('配置不存在');
                }

                const currentTags = config.content.Tags || [];
                const newTags = currentTags.filter(tag => !tagsToRemove.includes(tag));
                
                const updatedConfig = {
                    ...config,
                    content: {
                        ...config.content,
                        Tags: newTags
                    },
                    lastModified: new Date().toISOString()
                };

                await this.db.saveConfig(updatedConfig);
                results.success.push(updatedConfig);
            } catch (error) {
                results.failed.push({
                    id,
                    error: error.message
                });
            }
        }

        // 更新store状态
        if (results.success.length > 0) {
            const currentState = this.store.getState();
            const updatedConfigs = currentState.configs.map(config => {
                const updated = results.success.find(c => c.id === config.id);
                return updated || config;
            });
            this.store.dispatch({ type: 'SET_CONFIGS', payload: updatedConfigs });
        }

        return results;
    }

    /**
     * 批量克隆配置
     */
    async batchClone(configIds, nameSuffix = '_copy') {
        const results = {
            success: [],
            failed: []
        };

        for (const id of configIds) {
            try {
                const originalConfig = await this.db.getConfig(id);
                if (!originalConfig) {
                    throw new Error('配置不存在');
                }

                const clonedConfig = {
                    id: generateId(),
                    fileName: originalConfig.fileName + nameSuffix,
                    type: originalConfig.type,
                    lastModified: new Date().toISOString(),
                    content: JSON.parse(JSON.stringify(originalConfig.content))
                };

                // 更新新物品ID
                clonedConfig.content.NewItemId = this.generateNewItemId();

                await this.db.saveConfig(clonedConfig);
                results.success.push(clonedConfig);
            } catch (error) {
                results.failed.push({
                    id,
                    error: error.message
                });
            }
        }

        // 更新store状态
        if (results.success.length > 0) {
            const currentState = this.store.getState();
            const newConfigs = [...currentState.configs, ...results.success];
            this.store.dispatch({ type: 'SET_CONFIGS', payload: newConfigs });
        }

        return results;
    }

    /**
     * 批量验证配置
     */
    async batchValidate(configIds) {
        const results = {
            valid: [],
            invalid: []
        };

        for (const id of configIds) {
            try {
                const config = await this.db.getConfig(id);
                if (!config) {
                    results.invalid.push({
                        id,
                        error: '配置不存在'
                    });
                    continue;
                }

                const validation = this.validateConfig(config);
                if (validation.isValid) {
                    results.valid.push({
                        id,
                        fileName: config.fileName
                    });
                } else {
                    results.invalid.push({
                        id,
                        fileName: config.fileName,
                        errors: validation.errors
                    });
                }
            } catch (error) {
                results.invalid.push({
                    id,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 验证单个配置
     */
    validateConfig(config) {
        const errors = [];
        const content = config.content;

        // 检查必需字段
        const requiredFields = ['NewItemId', 'DisplayName'];
        requiredFields.forEach(field => {
            if (!(field in content) || content[field] === null || content[field] === '') {
                errors.push(`缺少必需字段: ${field}`);
            }
        });

        // 检查ID格式
        if (content.NewItemId && (isNaN(content.NewItemId) || content.NewItemId <= 0)) {
            errors.push('NewItemId必须是正整数');
        }

        // 检查重量
        if (content.Weight && (isNaN(content.Weight) || content.Weight < 0)) {
            errors.push('Weight必须是非负数');
        }

        // 检查价值
        if (content.Value && (isNaN(content.Value) || content.Value < 0)) {
            errors.push('Value必须是非负数');
        }

        // 检查品质
        if (content.Quality && (isNaN(content.Quality) || content.Quality < 0 || content.Quality > 10)) {
            errors.push('Quality必须是0-10之间的数字');
        }

        // 检查标签
        if (content.Tags && !Array.isArray(content.Tags)) {
            errors.push('Tags必须是数组');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 生成新的物品ID
     */
    generateNewItemId() {
        const baseId = 10000;
        const randomId = Math.floor(Math.random() * 90000) + baseId;
        return randomId;
    }

    /**
     * 获取批量操作统计
     */
    getBatchStatistics(configIds) {
        const currentState = this.store.getState();
        const configs = currentState.configs.filter(c => configIds.includes(c.id));
        
        const stats = {
            total: configs.length,
            byType: {},
            totalSize: 0,
            averageSize: 0,
            oldestConfig: null,
            newestConfig: null
        };

        configs.forEach(config => {
            // 按类型统计
            if (!stats.byType[config.type]) {
                stats.byType[config.type] = 0;
            }
            stats.byType[config.type]++;

            // 计算大小
            const size = JSON.stringify(config).length;
            stats.totalSize += size;

            // 查找最旧和最新的配置
            const modifiedTime = new Date(config.lastModified);
            if (!stats.oldestConfig || modifiedTime < new Date(stats.oldestConfig.lastModified)) {
                stats.oldestConfig = config;
            }
            if (!stats.newestConfig || modifiedTime > new Date(stats.newestConfig.lastModified)) {
                stats.newestConfig = config;
            }
        });

        stats.averageSize = stats.total > 0 ? Math.round(stats.totalSize / stats.total) : 0;

        return stats;
    }
}

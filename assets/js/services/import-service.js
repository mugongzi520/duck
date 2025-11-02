/**
 * 导入服务
 * 处理配置的导入功能
 */

import { readFile, validateJSON, generateId } from '../utils/helpers.js';
import { CONFIG_TYPES } from '../utils/constants.js';

export class ImportService {
    constructor(db) {
        this.db = db;
    }

    /**
     * 从文件导入配置
     */
    async importFromFile(file) {
        if (!file) {
            throw new Error('未选择文件');
        }

        if (!file.name.endsWith('.json')) {
            throw new Error('仅支持JSON格式文件');
        }

        const content = await readFile(file);
        
        if (!validateJSON(content)) {
            throw new Error('JSON格式错误');
        }

        const data = JSON.parse(content);
        
        // 检测是单个配置还是批量配置
        if (Array.isArray(data)) {
            return await this.importBatch(data);
        } else {
            return await this.importSingle(data, file.name);
        }
    }

    /**
     * 从剪贴板导入配置
     */
    async importFromClipboard() {
        let text;
        try {
            text = await navigator.clipboard.readText();
        } catch (err) {
            throw new Error('无法读取剪贴板内容');
        }

        if (!text) {
            throw new Error('剪贴板为空');
        }

        if (!validateJSON(text)) {
            throw new Error('剪贴板内容不是有效的JSON');
        }

        const data = JSON.parse(text);
        
        // 检测是单个配置还是批量配置
        if (Array.isArray(data)) {
            return await this.importBatch(data);
        } else {
            return await this.importSingle(data, `clipboard_${Date.now()}`);
        }
    }

    /**
     * 导入单个配置
     */
    async importSingle(data, fileName) {
        const type = this.detectConfigType(data);
        
        const config = {
            id: generateId(),
            fileName: this.sanitizeFileName(fileName),
            type: type,
            lastModified: new Date().toISOString(),
            content: data
        };

        const saved = await this.db.saveConfig(config);
        return saved;
    }

    /**
     * 批量导入配置
     */
    async importBatch(dataArray) {
        const results = {
            success: [],
            failed: []
        };

        for (const item of dataArray) {
            try {
                const fileName = item.fileName || `imported_${Date.now()}`;
                const type = item.type || this.detectConfigType(item.content || item);
                
                const config = {
                    id: generateId(),
                    fileName: this.sanitizeFileName(fileName),
                    type: type,
                    lastModified: new Date().toISOString(),
                    content: item.content || item
                };

                const saved = await this.db.saveConfig(config);
                results.success.push(saved);
            } catch (error) {
                results.failed.push({
                    data: item,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 检测配置类型
     */
    detectConfigType(data) {
        // 根据存在的属性判断类型
        if (data.WeaponProperties) return CONFIG_TYPES.WEAPON;
        if (data.MeleeWeaponProperties) return CONFIG_TYPES.MELEE;
        if (data.AmmoProperties) return CONFIG_TYPES.AMMO;
        if (data.SlotConfiguration) return CONFIG_TYPES.ACCESSORY;
        
        // 默认为物品
        return CONFIG_TYPES.ITEM;
    }

    /**
     * 清理文件名
     */
    sanitizeFileName(fileName) {
        // 移除.json后缀
        let name = fileName.replace(/\.json$/i, '');
        
        // 移除非法字符
        name = name.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '_');
        
        return name || `imported_${Date.now()}`;
    }

    /**
     * 验证配置数据
     */
    validateConfigData(data) {
        const errors = [];

        if (!data || typeof data !== 'object') {
            errors.push('配置数据格式错误');
            return { isValid: false, errors };
        }

        // 检查必要字段
        const requiredFields = ['NewItemId', 'DisplayName'];
        requiredFields.forEach(field => {
            if (!(field in data)) {
                errors.push(`缺少必需字段: ${field}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

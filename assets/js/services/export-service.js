/**
 * 导出服务
 * 处理配置的导出功能
 */

import { downloadFile } from '../utils/helpers.js';

export class ExportService {
    /**
     * 导出单个配置为JSON
     */
    async exportConfig(config) {
        if (!config) {
            throw new Error('没有可导出的配置');
        }

        // 清理配置数据，移除不支持的字段
        const exportData = this.cleanConfigData(config.content);

        const json = JSON.stringify(exportData, null, 2);
        const fileName = `${config.fileName}.json`;
        
        downloadFile(json, fileName, 'application/json');
        return true;
    }

    /**
     * 批量导出配置
     */
    async exportConfigs(configs) {
        if (!configs || configs.length === 0) {
            throw new Error('没有可导出的配置');
        }

        const exportData = configs.map(config => ({
            fileName: config.fileName,
            type: config.type,
            content: config.content
        }));

        const json = JSON.stringify(exportData, null, 2);
        const fileName = `configs_batch_${Date.now()}.json`;
        
        downloadFile(json, fileName, 'application/json');
        return true;
    }

    /**
     * 导出配置到剪贴板
     */
    async exportToClipboard(config) {
        if (!config) {
            throw new Error('没有可复制的配置');
        }

        // 清理配置数据，移除不支持的字段
        const exportData = this.cleanConfigData(config.content);

        const json = JSON.stringify(exportData, null, 2);
        
        try {
            await navigator.clipboard.writeText(json);
            return true;
        } catch (err) {
            // 降级方案
            const textarea = document.createElement('textarea');
            textarea.value = json;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (!success) {
                throw new Error('复制到剪贴板失败');
            }
            return true;
        }
    }

    /**
     * 清理配置数据，移除不支持的字段
     */
    cleanConfigData(content) {
        const cleaned = { ...content };

        // 清理旧格式的合成配方字段，确保只保留新的数组结构
        delete cleaned.FormulaId;
        delete cleaned.CraftingMoney;
        delete cleaned.ResultItemAmount;
        delete cleaned.CraftingTags;
        delete cleaned.RequirePerk;
        delete cleaned.CostItems;
        
        // 清理其他不支持的字段
        delete cleaned.LocalizationDesc;
        delete cleaned.MaxStackCount;
        delete cleaned.Order;
        delete cleaned.DisplayQuality;
        delete cleaned.HealValue;
        delete cleaned.UseDurability;
        delete cleaned.DurabilityUsageDrug;
        delete cleaned.MaxDurability;
        delete cleaned.DurabilityLoss;
        delete cleaned.UseTime;
        delete cleaned.EnergyValue;
        delete cleaned.WaterValue;
        delete cleaned.Stackable;
        delete cleaned.CanBeSold;
        delete cleaned.CanDrop;
        delete cleaned.UnlockByDefault;
        delete cleaned.HideInIndex;
        delete cleaned.LockInDemo;
        delete cleaned.AdditionalSlotTags;
        delete cleaned.AdditionalSlotCount;
        delete cleaned.AdditionalSlotNames;
        delete cleaned.SoundKey;
        delete cleaned.ModuleRootDir;

        // 清理重复的抽奖配置字段，只保留正确的Gacha格式
        delete cleaned.GachaConfigs;
        delete cleaned.ItemProperties;
        
        // 如果没有抽奖配置，确保删除Gacha字段
        if (!cleaned.Gacha || (Array.isArray(cleaned.Gacha) && cleaned.Gacha.length === 0)) {
            delete cleaned.Gacha;
        }
        
        // 如果Gacha是数组格式，转换为对象格式
        if (Array.isArray(cleaned.Gacha)) {
            cleaned.Gacha = {
                Description: '',
                NotificationKey: 'Default',
                Entries: cleaned.Gacha
            };
        }

        // 修复Formulas字段名：改为AdditionalRecipes
        if (cleaned.Formulas && cleaned.Formulas.length > 0) {
            cleaned.AdditionalRecipes = cleaned.Formulas;
            delete cleaned.Formulas;
        }

        // 确保BuffDuration字段格式正确
        if (cleaned.BuffDuration) {
            if (typeof cleaned.BuffDuration !== 'object') {
                const existingValue = cleaned.BuffDuration || 0;
                cleaned.BuffDuration = {
                    "Duration": parseFloat(existingValue) || 0,
                    "ReplaceOriginalBuff": false,
                    "ReplacementBuffId": -1
                };
            } else {
                // 如果已经是对象，确保格式正确
                const existingDuration = cleaned.BuffDuration;
                cleaned.BuffDuration = {
                    "Duration": existingDuration.Duration || existingDuration.DefaultDuration || 0,
                    "ReplaceOriginalBuff": existingDuration.ReplaceOriginalBuff || false,
                    "ReplacementBuffId": existingDuration.ReplacementBuffId || -1
                };
            }
        }

        return cleaned;
    }

    /**
     * 生成配置预览
     */
    generatePreview(config) {
        const content = config.content;
        const preview = {
            基本信息: {
                文件名: config.fileName,
                类型: config.type,
                最后修改: new Date(config.lastModified).toLocaleString()
            },
            核心属性: {
                原始物品ID: content.OriginalItemId,
                新物品ID: content.NewItemId,
                显示名称: content.DisplayName,
                品质: content.Quality,
                重量: content.Weight,
                价值: content.Value
            },
            标签: content.Tags || [],
            其他属性: {}
        };

        // 添加类型特定属性
        const propsKeys = ['WeaponProperties', 'MeleeWeaponProperties', 'AmmoProperties', 'SlotConfiguration', 'mshook'];
        propsKeys.forEach(key => {
            if (content[key] && Object.keys(content[key]).length > 0) {
                preview.其他属性[key] = content[key];
            }
        });

        return preview;
    }
}

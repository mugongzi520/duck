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
            content: this.cleanConfigData(config.content) // 清理每个配置的内容
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
     * 清理配置数据，移除不支持的字段和默认值字段
     * 根据Mod的DefaultValueHandling.Ignore设置，只导出非默认值和非空字段
     */
    cleanConfigData(content) {
        const cleaned = { ...content };

        // 清理旧格式的合成配方字段，确保只保留新的数组结构（AdditionalRecipes）
        delete cleaned.FormulaId;
        delete cleaned.CraftingMoney;
        delete cleaned.ResultItemAmount;
        delete cleaned.CraftingTags;
        delete cleaned.RequirePerk;
        delete cleaned.CostItems;
        
        // 清理Mod不支持的字段（根据Mod的ItemConfig类定义）
        // LocalizationDesc是只读属性，不应该导出
        delete cleaned.LocalizationDesc;
        
        // 以下字段Mod不支持，需要删除
        delete cleaned.Order;
        delete cleaned.DisplayQuality;
        delete cleaned.MaxDurability;
        delete cleaned.DurabilityLoss;
        delete cleaned.UseTime;
        delete cleaned.Repairable;
        
        // 以下字段Mod不支持（这些是旧版本的字段，Mod使用Stackable等）
        delete cleaned.CanBeSold;
        delete cleaned.CanDrop;
        
        // 清理重复的抽奖配置字段，只保留正确的Gacha格式
        delete cleaned.GachaConfigs;
        delete cleaned.ItemProperties;

        // 修复Formulas字段名：改为AdditionalRecipes
        if (cleaned.Formulas && cleaned.Formulas.length > 0) {
            cleaned.AdditionalRecipes = cleaned.Formulas;
            delete cleaned.Formulas;
        }

        // 处理BuffDuration字段格式
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
            // 检查是否为默认值（Duration=30.0, ReplaceOriginalBuff=false, ReplacementBuffId=-1）
            if (cleaned.BuffDuration.Duration === 30.0 && 
                cleaned.BuffDuration.ReplaceOriginalBuff === false && 
                cleaned.BuffDuration.ReplacementBuffId === -1) {
                delete cleaned.BuffDuration;
            }
        }

        // 处理Gacha字段格式
        if (cleaned.Gacha) {
            // 如果Gacha是数组格式，转换为对象格式
            if (Array.isArray(cleaned.Gacha)) {
                cleaned.Gacha = {
                    Description: '',
                    NotificationKey: 'Default',
                    Entries: cleaned.Gacha
                };
            }
            // 检查Gacha是否为空（Entries为空数组或不存在）
            if (!cleaned.Gacha.Entries || 
                (Array.isArray(cleaned.Gacha.Entries) && cleaned.Gacha.Entries.length === 0)) {
                delete cleaned.Gacha;
            }
        }

        // 清理默认值和空值字段（根据Mod的DefaultValueHandling.Ignore）
        this.removeDefaultValues(cleaned);

        return cleaned;
    }

    /**
     * 移除默认值和空值字段
     * 根据Mod代码中的DefaultValueHandling.Ignore设置，只保留非默认值和非空字段
     */
    removeDefaultValues(obj, parentKey = '') {
        // 必填字段列表（这些字段不会被删除，即使值是默认值）
        const requiredFields = ['OriginalItemId', 'NewItemId', 'DisplayName'];
        
        // 定义各字段的默认值（根据Mod的DataModels.cs）
        const defaultValues = {
            // ItemConfig基础字段默认值
            'Weight': 0,
            'Value': 0,
            'Quality': 0,
            'EnergyValue': 0,
            'WaterValue': 0,
            'UseDurability': 0,
            'HealValue': 0,
            'DurabilityUsageDrug': 0,
            'MaxStackCount': 1,
            'Stackable': false,
            'UnlockByDefault': true,
            'HideInIndex': false,
            'LockInDemo': false,
            'UseDurabilityDrug': false,
            'CanUsePartDrug': false,
            'AdditionalSlotCount': 0,
            'ReplaceExistingSlots': false,
            'EnableDecompose': false,
            'DecomposeMoney': 0,
            'ResultItemAmount': 1,
            'RequirePerk': '',
            'ModuleRootDir': '',
            'SoundKey': null,
            'IconFileName': '',
            
            // WeaponProperties默认值（所有倍率默认1.0，加法默认0）
            'DistanceMultiplier': 1.0,
            'BulletSpeedMultiplier': 1.0,
            'ADSTimeMultiplier': 1.0,
            'ShootSpeedMultiplier': 1.0,
            'CapacityMultiplier': 1.0,
            'ReloadSpeedMultiplier': 1.0,
            'BaseDamageMultiplier': 1.0,
            'DamageMultiplier': 1.0,
            'CriticalChanceMultiplier': 1.0,
            'CriticalDamageFactorMultiplier': 1.0,
            'PenetrateMultiplier': 1.0,
            'ArmorPiercingMultiplier': 1.0,
            'ArmorBreakMultiplier': 1.0,
            'ExplosionDamageMultiplier': 1.0,
            'ExplosionRangeMultiplier': 1.0,
            'RangeAddition': 0,
            'BulletSpeedAddition': 0,
            'AccuracyMultiplier': 1.0,
            'ScatterFactorMultiplier': 1.0,
            'ScatterFactorADSMultiplier': 1.0,
            'DefaultScatterMultiplier': 1.0,
            'DefaultScatterADSMultiplier': 1.0,
            'MaxScatterMultiplier': 1.0,
            'MaxScatterADSMultiplier': 1.0,
            'ScatterGrowMultiplier': 1.0,
            'ScatterGrowADSMultiplier': 1.0,
            'ScatterRecoverMultiplier': 1.0,
            'ScatterRecoverADSMultiplier': 1.0,
            'RecoilVMinMultiplier': 1.0,
            'RecoilVMaxMultiplier': 1.0,
            'RecoilHMinMultiplier': 1.0,
            'RecoilHMaxMultiplier': 1.0,
            'RecoilScaleVMultiplier': 1.0,
            'RecoilScaleHMultiplier': 1.0,
            'RecoilRecoverMultiplier': 1.0,
            'RecoilTimeMultiplier': 1.0,
            'RecoilRecoverTimeMultiplier': 1.0,
            'MoveSpeedMultiplierAdd': 0,
            'ADSMoveSpeedMultiplierAdd': 0,
            'ADSAimDistanceFactorMultiplier': 1.0,
            'BuffChanceMultiplier': 1.0,
            'BulletBleedChanceMultiplier': 1.0,
            'BulletDurabilityCostMultiplier': 1.0,
            
            // AmmoProperties默认值
            'NewCritRateGain': 0,
            'NewCritDamageFactorGain': 0,
            'NewArmorPiercingGain': 0,
            'NewDamageMultiplier': 1.0,
            'NewExplosionRange': 0,
            'NewBuffChanceMultiplier': 1.0,
            'NewBleedChance': 0,
            'NewExplosionDamage': 0,
            'NewArmorBreakGain': 0,
            'NewDurabilityCost': 0,
            'NewBulletSpeed': 0,
            'NewBulletDistance': 0,
            
            // MeleeWeaponProperties默认值
            'NewDamage': 0,
            'NewCritRate': 0,
            'NewCritDamageFactor': 0,
            'NewArmorPiercing': 0,
            'NewAttackSpeed': 0,
            'NewAttackRange': 0,
            'NewStaminaCost': 0,
            'NewBleedChance': 0,
            'NewMoveSpeedMultiplier': 1.0,
            
            // BuffDuration默认值
            'Duration': 30.0,
            'ReplaceOriginalBuff': false,
            'ReplacementBuffId': -1,
        };

        // 递归处理对象
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            
            const value = obj[key];
            
            // 处理null值
            if (value === null || value === undefined) {
                delete obj[key];
                continue;
            }
            
            // 处理空字符串
            if (typeof value === 'string' && value.trim() === '') {
                delete obj[key];
                continue;
            }
            
            // 处理空数组
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    delete obj[key];
                    continue;
                }
                // 递归处理数组中的对象
                const originalLength = value.length;
                for (let i = value.length - 1; i >= 0; i--) {
                    const item = value[i];
                    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                        this.removeDefaultValues(item, `${parentKey}.${key}[${i}]`);
                        // 如果对象变成空对象，从数组中移除
                        if (Object.keys(item).length === 0) {
                            value.splice(i, 1);
                        }
                    }
                }
                // 如果数组处理完后为空，删除
                if (value.length === 0) {
                    delete obj[key];
                    continue;
                }
            }
            // 处理对象（递归处理嵌套对象）
            else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                // 递归处理嵌套对象
                this.removeDefaultValues(value, parentKey ? `${parentKey}.${key}` : key);
                
                // 如果对象变成空对象，删除
                if (Object.keys(value).length === 0) {
                    delete obj[key];
                    continue;
                }
            }
            // 处理基本类型值（数字、布尔、字符串）
            else {
                // 必填字段不删除
                if (requiredFields.includes(key)) {
                    continue;
                }
                
                // 检查数值类型字段的默认值
                if (typeof value === 'number') {
                    const defaultValue = defaultValues[key];
                    if (defaultValue !== undefined && Math.abs(value - defaultValue) < 0.0001) {
                        delete obj[key];
                        continue;
                    }
                    // 特殊处理：Hash属性（如果值为0，删除）
                    if (key.includes('Hash') && value === 0) {
                        delete obj[key];
                        continue;
                    }
                }
                
                // 检查布尔类型字段的默认值
                if (typeof value === 'boolean') {
                    const defaultValue = defaultValues[key];
                    if (defaultValue !== undefined && value === defaultValue) {
                        delete obj[key];
                        continue;
                    }
                }
                
                // 对于字符串类型，如果值为空字符串或等于默认值，删除
                if (typeof value === 'string') {
                    const defaultValue = defaultValues[key];
                    if ((defaultValue === '' && value === '') || 
                        (defaultValue === null && value === '')) {
                        delete obj[key];
                        continue;
                    }
                }
            }
        }
        
        return obj;
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

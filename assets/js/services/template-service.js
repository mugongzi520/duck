/**
 * 配置模板服务
 * 提供预设配置模板和快速创建功能
 */

import { CONFIG_TYPES } from '../utils/constants.js';

export class TemplateService {
    constructor() {
        this.templates = new Map();
        this.loadDefaultTemplates();
    }

    /**
     * 加载默认模板
     */
    loadDefaultTemplates() {
        // 武器模板
        this.templates.set('weapon_sniper', {
            name: '狙击步枪模板',
            type: CONFIG_TYPES.WEAPON,
            description: '高伤害、低射速的狙击武器模板',
            content: {
                OriginalItemId: 1,
                NewItemId: 10001,
                DisplayName: '自定义狙击步枪',
                LocalizationKey: 'CustomSniper',
                Weight: 8.0,
                Value: 5000,
                Quality: 7,
                Tags: ['Weapon', 'Gun', 'Sniper'],
                WeaponProperties: {
                    BaseDamageMultiplier: 2.5,
                    AccuracyMultiplier: 1.8,
                    RecoilMultiplier: 0.7,
                    FireRateMultiplier: 0.3,
                    ReloadSpeedMultiplier: 0.8,
                    RangeMultiplier: 3.0,
                    BulletSpeedMultiplier: 2.0,
                    AimTimeMultiplier: 1.5,
                    BulletSpreadMultiplier: 0.5,
                    MagazineSizeMultiplier: 0.5
                }
            }
        });

        this.templates.set('weapon_assault', {
            name: '突击步枪模板',
            type: CONFIG_TYPES.WEAPON,
            description: '平衡的突击武器模板',
            content: {
                OriginalItemId: 2,
                NewItemId: 10002,
                DisplayName: '自定义突击步枪',
                LocalizationKey: 'CustomAssault',
                Weight: 6.0,
                Value: 3000,
                Quality: 5,
                Tags: ['Weapon', 'Gun', 'Assault'],
                WeaponProperties: {
                    BaseDamageMultiplier: 1.2,
                    AccuracyMultiplier: 1.1,
                    RecoilMultiplier: 0.9,
                    FireRateMultiplier: 1.3,
                    ReloadSpeedMultiplier: 1.0,
                    RangeMultiplier: 1.2,
                    BulletSpeedMultiplier: 1.1,
                    AimTimeMultiplier: 0.9,
                    BulletSpreadMultiplier: 0.8,
                    MagazineSizeMultiplier: 1.2
                }
            }
        });

        // 近战武器模板
        this.templates.set('melee_sword', {
            name: '剑类武器模板',
            type: CONFIG_TYPES.MELEE,
            description: '高伤害的剑类近战武器',
            content: {
                OriginalItemId: 100,
                NewItemId: 10100,
                DisplayName: '自定义长剑',
                LocalizationKey: 'CustomSword',
                Weight: 3.0,
                Value: 1500,
                Quality: 6,
                Tags: ['Weapon', 'Melee', 'Sword'],
                MeleeWeaponProperties: {
                    BaseDamageMultiplier: 1.8,
                    AttackSpeedMultiplier: 1.0,
                    CriticalChanceMultiplier: 0.15,
                    CriticalDamageMultiplier: 2.0,
                    RangeMultiplier: 1.5,
                    DurabilityMultiplier: 1.2,
                    StaminaCostMultiplier: 0.9
                }
            }
        });

        // 子弹模板
        this.templates.set('ammo_ap', {
            name: '穿甲弹模板',
            type: CONFIG_TYPES.AMMO,
            description: '高护甲穿透的子弹',
            content: {
                OriginalItemId: 200,
                NewItemId: 10200,
                DisplayName: '自定义穿甲弹',
                LocalizationKey: 'CustomAP',
                Weight: 0.02,
                Value: 50,
                Quality: 5,
                Tags: ['Ammo', 'ArmorPiercing'],
                AmmoProperties: {
                    BaseDamageMultiplier: 1.1,
                    CriticalChanceMultiplier: 0.05,
                    ArmorPenetrationMultiplier: 2.5,
                    BulletSpeedMultiplier: 1.3,
                    RangeMultiplier: 1.2
                }
            }
        });

        // 物品模板
        this.templates.set('item_medkit', {
            name: '医疗包模板',
            type: CONFIG_TYPES.ITEM,
            description: '恢复生命值的医疗物品',
            content: {
                OriginalItemId: 300,
                NewItemId: 10300,
                DisplayName: '自定义医疗包',
                LocalizationKey: 'CustomMedkit',
                Weight: 0.5,
                Value: 200,
                Quality: 4,
                Tags: ['Item', 'Medical', 'Consumable'],
                ItemProperties: {
                    HealValue: 50,
                    UseTime: 2.0,
                    MaxStackCount: 10,
                    CanBeSold: true,
                    CanDrop: true
                }
            }
        });

        // 配件模板
        this.templates.set('accessory_scope', {
            name: '瞄准镜模板',
            type: CONFIG_TYPES.ACCESSORY,
            description: '提升精准度的瞄准镜配件',
            content: {
                OriginalItemId: 400,
                NewItemId: 10400,
                DisplayName: '自定义瞄准镜',
                LocalizationKey: 'CustomScope',
                Weight: 0.3,
                Value: 800,
                Quality: 5,
                Tags: ['Accessory', 'Scope', 'Attachment'],
                SlotConfiguration: {
                    SlotType: 'Scope',
                    DamageMultiplier: 1.0,
                    AccuracyMultiplier: 1.5,
                    RecoilMultiplier: 0.8,
                    AimTimeMultiplier: 0.7,
                    ZoomMultiplier: 2.0
                }
            }
        });

        // Buff模板
        this.templates.set('buff_damage', {
            name: '伤害增益Buff模板',
            type: CONFIG_TYPES.ITEM,
            description: '临时提升伤害的Buff物品',
            content: {
                OriginalItemId: 500,
                NewItemId: 10500,
                DisplayName: '自定义伤害增益',
                LocalizationKey: 'CustomDamageBuff',
                Weight: 0.1,
                Value: 300,
                Quality: 6,
                Tags: ['Item', 'Buff', 'Consumable'],
                BuffDuration: {
                    Duration: 60,
                    ReplaceOriginalBuff: false,
                    ReplacementBuffId: -1
                },
                BuffConfigs: [
                    {
                        BuffId: 1,
                        Value: 1.5,
                        Type: 'DamageMultiplier'
                    }
                ],
                ItemProperties: {
                    UseTime: 1.0,
                    MaxStackCount: 5,
                    CanBeSold: true,
                    CanDrop: true
                }
            }
        });
    }

    /**
     * 获取所有模板
     */
    getAllTemplates() {
        return Array.from(this.templates.entries()).map(([id, template]) => ({
            id,
            ...template
        }));
    }

    /**
     * 根据类型获取模板
     */
    getTemplatesByType(type) {
        return this.getAllTemplates().filter(template => template.type === type);
    }

    /**
     * 获取模板
     */
    getTemplate(id) {
        const template = this.templates.get(id);
        if (!template) return null;
        
        return {
            id,
            ...template,
            content: JSON.parse(JSON.stringify(template.content)) // 深拷贝
        };
    }

    /**
     * 从模板创建配置
     */
    createConfigFromTemplate(templateId, overrides = {}) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error('模板不存在');
        }

        // 合并覆盖内容
        const content = {
            ...template.content,
            ...overrides.content,
            // 确保ID唯一
            NewItemId: overrides.content?.NewItemId || this.generateNewItemId()
        };

        // 合并基本信息
        const config = {
            fileName: overrides.fileName || `${template.name}_${Date.now()}`,
            type: template.type,
            content
        };

        return config;
    }

    /**
     * 创建自定义模板
     */
    createCustomTemplate(name, type, content, description = '') {
        const templateId = `custom_${Date.now()}`;
        
        this.templates.set(templateId, {
            name,
            type,
            description,
            content: JSON.parse(JSON.stringify(content)),
            isCustom: true,
            createdAt: new Date().toISOString()
        });

        return templateId;
    }

    /**
     * 删除自定义模板
     */
    deleteCustomTemplate(templateId) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error('模板不存在');
        }

        if (!template.isCustom) {
            throw new Error('不能删除默认模板');
        }

        this.templates.delete(templateId);
    }

    /**
     * 更新模板
     */
    updateTemplate(templateId, updates) {
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error('模板不存在');
        }

        const updatedTemplate = {
            ...template,
            ...updates,
            lastModified: new Date().toISOString()
        };

        this.templates.set(templateId, updatedTemplate);
        return updatedTemplate;
    }

    /**
     * 导出模板
     */
    exportTemplate(templateId) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error('模板不存在');
        }

        return JSON.stringify(template, null, 2);
    }

    /**
     * 导入模板
     */
    importTemplate(templateData) {
        try {
            const template = typeof templateData === 'string' ? 
                JSON.parse(templateData) : templateData;

            if (!template.name || !template.type || !template.content) {
                throw new Error('模板格式不正确');
            }

            const templateId = this.createCustomTemplate(
                template.name,
                template.type,
                template.content,
                template.description
            );

            return templateId;
        } catch (error) {
            throw new Error(`导入模板失败: ${error.message}`);
        }
    }

    /**
     * 生成新的物品ID
     */
    generateNewItemId() {
        // 从10000开始生成ID，避免与原版冲突
        const baseId = 10000;
        const randomId = Math.floor(Math.random() * 90000) + baseId;
        return randomId;
    }

    /**
     * 搜索模板
     */
    searchTemplates(query) {
        if (!query || query.trim() === '') {
            return this.getAllTemplates();
        }

        const term = query.toLowerCase().trim();
        return this.getAllTemplates().filter(template => 
            template.name.toLowerCase().includes(term) ||
            template.description.toLowerCase().includes(term) ||
            template.type.toLowerCase().includes(term) ||
            template.content.DisplayName.toLowerCase().includes(term)
        );
    }

    /**
     * 获取模板统计
     */
    getStatistics() {
        const templates = this.getAllTemplates();
        const stats = {
            total: templates.length,
            custom: templates.filter(t => t.isCustom).length,
            default: templates.filter(t => !t.isCustom).length,
            byType: {}
        };

        templates.forEach(template => {
            if (!stats.byType[template.type]) {
                stats.byType[template.type] = 0;
            }
            stats.byType[template.type]++;
        });

        return stats;
    }
}

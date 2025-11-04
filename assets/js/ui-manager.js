/**
 * UI管理器
 * 管理所有用户界面交互
 */

import { showNotification, showConfirm, createModal, formatDate, debounce, deepClone } from './utils/helpers.js';
import { CONFIG_TYPES, CONFIG_TYPE_INFO, TAG_DATA, TAG_DATA_GROUPED, TYPE_SPECIFIC_FIELDS, BUFF_DATA, BUFF_CATEGORIES, WEAPON_FIELD_DESCRIPTIONS } from './utils/constants.js';

export class UIManager {
    constructor(store, configService, exportService, importService, searchManager, gachaService, undoRedoService, templateService, batchService) {
        this.store = store;
        this.configService = configService;
        this.exportService = exportService;
        this.importService = importService;
        this.searchManager = searchManager;
        this.gachaService = gachaService;
        this.undoRedoService = undoRedoService;
        this.templateService = templateService;
        this.batchService = batchService;
        this.currentModal = null;
    }

    /**
     * 初始化UI管理器
     */
    async init() {
        this.setupEventListeners();
        this.store.subscribe(this.handleStateChange.bind(this));
        console.log('✅ UI管理器初始化完成');
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 头部按钮
        this.bindEvent('btn-theme-toggle', 'click', this.handleThemeToggle);
        this.bindEvent('btn-feed-cat', 'click', this.handleFeedCat);
        this.bindEvent('btn-new-config', 'click', this.handleNewConfig);
        this.bindEvent('btn-import-config', 'click', () => document.getElementById('file-input').click());
        this.bindEvent('btn-clipboard-import', 'click', this.handleClipboardImport);
        this.bindEvent('file-input', 'change', this.handleFileImport);

        // 欢迎页按钮
        this.bindEvent('welcome-new-config', 'click', this.handleNewConfig);
        this.bindEvent('welcome-import-config', 'click', () => document.getElementById('file-input').click());

        // 编辑器按钮
        this.bindEvent('btn-save', 'click', this.handleSave);
        this.bindEvent('btn-export', 'click', this.handleExport);
        this.bindEvent('btn-copy-clipboard', 'click', this.handleCopyClipboard);
        this.bindEvent('btn-duplicate', 'click', this.handleDuplicate);
        this.bindEvent('btn-delete', 'click', this.handleDelete);
        this.bindEvent('btn-undo', 'click', this.handleUndo);
        this.bindEvent('btn-redo', 'click', this.handleRedo);
        this.bindEvent('btn-batch-import', 'click', this.handleBatchImport);
        this.bindEvent('btn-batch-export', 'click', this.handleBatchExport);
        this.bindEvent('batch-file-input', 'change', this.handleBatchFileImport);

        // 搜索和筛选
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(this.handleSearch.bind(this), 300));
        }

        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => this.handleFilterChange(tab.dataset.type));
        });
    }

    /**
     * 绑定事件的辅助函数
     */
    bindEvent(elementId, eventName, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventName, handler.bind(this));
        }
    }

    /**
     * 状态变化处理
     */
    handleStateChange(state) {
        this.updateConfigList(state);
        this.updateStatistics(state);
    }

    /**
     * 加载所有配置
     */
    async loadConfigs() {
        try {
            const configs = await this.configService.db.getAllConfigs();
            this.store.dispatch({ type: 'SET_CONFIGS', payload: configs });
            console.log(`📦 加载了 ${configs.length} 个配置`);
        } catch (error) {
            console.error('加载配置失败:', error);
            throw error;
        }
    }

    /**
     * 更新配置列表显示
     */
    updateConfigList(state) {
        const listEl = document.getElementById('config-list');
        if (!listEl) return;

        const configs = state.filteredConfigs;

        if (configs.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="fa fa-folder-open-o empty-icon"></i>
                    <p class="empty-text">暂无配置</p>
                    <p class="empty-hint">尝试调整搜索或筛选条件</p>
                </div>
            `;
            // 隐藏批量操作工具栏
            this.updateBatchActionsBar([]);
            return;
        }

        // 检查是否有批量操作工具栏，如果没有则添加
        this.ensureBatchActionsBar();

        listEl.innerHTML = '';
        configs.forEach(config => {
            const item = this.createConfigListItem(config, state.currentConfig);
            listEl.appendChild(item);
        });

        // 更新批量操作工具栏
        const selectedCount = this.getSelectedConfigIds().length;
        this.updateBatchActionsBar(selectedCount > 0 ? this.getSelectedConfigIds() : []);

        // 检查ID冲突
        this.checkIdConflicts();
    }

    /**
     * 创建配置列表项
     */
    createConfigListItem(config, currentConfig) {
        const typeInfo = CONFIG_TYPE_INFO[config.type] || CONFIG_TYPE_INFO[CONFIG_TYPES.ITEM];
        const isActive = currentConfig && currentConfig.id === config.id;
        const newItemId = config.content?.NewItemId;

        const item = document.createElement('div');
        item.className = `config-item ${isActive ? 'active' : ''}`;
        item.dataset.configId = config.id;
        item.style.cssText = 'display: flex; align-items: center; padding: 12px; cursor: pointer;';
        item.innerHTML = `
            <div class="config-item-checkbox" style="margin-right: 8px; flex-shrink: 0;">
                <input type="checkbox" class="config-select-checkbox" data-config-id="${config.id}" 
                       onclick="event.stopPropagation(); window.uiManager.handleConfigSelect(event);">
            </div>
            <div class="config-item-content" style="flex: 1; min-width: 0;">
                <div class="config-item-header" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <i class="fa ${typeInfo.icon} config-item-icon" style="flex-shrink: 0; color: var(--text-secondary);"></i>
                    <div class="config-item-title" style="font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${config.fileName}
                    </div>
                </div>
                <div class="config-item-meta" style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--text-secondary);">
                    <span class="config-item-type">${typeInfo.name}</span>
                    ${newItemId ? `<span class="config-item-id" style="background: var(--bg-tertiary, #e9ecef); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px;">ID: ${newItemId}</span>` : ''}
                    <span class="config-item-date" style="margin-left: auto;">${formatDate(config.lastModified, 'MM-DD HH:mm')}</span>
                </div>
            </div>
        `;

        // 点击项时，如果不是点击复选框，则选择配置
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.config-item-checkbox')) {
                this.selectConfig(config.id);
            }
        });
        return item;
    }

    /**
     * 更新统计信息
     */
    updateStatistics(state) {
        const stats = this.configService.getStatistics(state.configs);
        
        document.getElementById('count-all').textContent = stats.total;
        
        Object.keys(CONFIG_TYPES).forEach(key => {
            const type = CONFIG_TYPES[key];
            const countEl = document.getElementById(`count-${type}`);
            if (countEl) {
                countEl.textContent = stats.byType[type] || 0;
            }
        });
    }

    /**
     * 选择配置
     */
    async selectConfig(id) {
        const config = await this.configService.db.getConfig(id);
        if (!config) return;

        this.store.dispatch({ type: 'SET_CURRENT_CONFIG', payload: config });
        this.showEditor(config);
    }

    /**
     * 显示编辑器
     */
    showEditor(config) {
        document.getElementById('welcome-state').style.display = 'none';
        document.getElementById('editor').style.display = 'flex';
        
        document.getElementById('editor-title-text').textContent = config.fileName;
        
        this.renderEditorForm(config);
    }

    /**
     * 渲染编辑器表单
     */
    renderEditorForm(config) {
        const content = document.getElementById('editor-content');
        if (!content) return;

        const html = `
            ${this.renderBasicInfo(config)}
            ${this.renderBasicFields(config)}
            ${this.renderItemFields(config)}
            ${this.renderLimitFields(config)}
            ${this.renderTagsField(config)}
            ${this.renderBuffConfigs(config)}
            ${this.renderCraftingRecipes(config)}
            ${this.renderDecomposeRecipe(config)}
            ${this.renderGachaConfigs(config)}
            ${this.renderSpecificFields(config)}
        `;

        content.innerHTML = html;
        this.bindFormEvents();
        
        // 延迟添加帮助图标，确保DOM已完全渲染
        setTimeout(() => {
            this.addHelpIconsToWeaponFields();
        }, 100);
    }

    /**
     * 渲染基本信息
     */
    renderBasicInfo(config) {
        return `
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">📋 基本信息</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2">
                        <div class="form-group">
                            <label class="form-label form-label-required">文件名</label>
                            <input type="text" class="form-input" id="fileName" value="${config.fileName}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label form-label-required">配置类型</label>
                            <select class="form-select" id="configType" required>
                                <option value="weapon" ${config.type === 'weapon' ? 'selected' : ''}>枪械配置</option>
                                <option value="melee" ${config.type === 'melee' ? 'selected' : ''}>近战武器</option>
                                <option value="ammo" ${config.type === 'ammo' ? 'selected' : ''}>子弹配置</option>
                                <option value="item" ${config.type === 'item' ? 'selected' : ''}>物品配置</option>
                                <option value="accessory" ${config.type === 'accessory' ? 'selected' : ''}>配件配置</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染基础字段
     */
    renderBasicFields(config) {
        const c = config.content;
        return `
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">⚙️ 基础属性</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-2 mb-3">
                        <div class="form-group">
                            <label class="form-label">原始物品ID</label>
                            <div style="display: flex; gap: 4px;">
                                <input type="number" class="form-input" id="OriginalItemId" value="${c.OriginalItemId || 0}">
                                <button type="button" class="btn btn-icon" onclick="window.searchManager.showSearchModal(document.getElementById('OriginalItemId'))" title="搜索物品">
                                    <i class="fa fa-search"></i>
                                </button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label form-label-required">新物品ID</label>
                            <input type="number" class="form-input" id="NewItemId" value="${c.NewItemId || 0}" required>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 mb-3">
                        <div class="form-group">
                            <label class="form-label">显示名称</label>
                            <div style="position: relative; display: flex; gap: 8px;">
                                <input type="text" class="form-input" id="DisplayName" value="${c.DisplayName || ''}" style="flex: 1;">
                                <button type="button" class="btn btn-outline rich-text-btn" data-target="DisplayName" title="Unity富文本工具">
                                    <i class="fa fa-paint-brush"></i> 富文本
                                </button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">本地化键名</label>
                            <input type="text" class="form-input" id="LocalizationKey" value="${c.LocalizationKey || ''}">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 mb-3">
                        <div class="form-group">
                            <label class="form-label">物品描述</label>
                            <div style="position: relative; display: flex; gap: 8px;">
                                <input type="text" class="form-input" id="LocalizationDescValue" value="${c.LocalizationDescValue || ''}" placeholder="输入物品描述" style="flex: 1;">
                                <button type="button" class="btn btn-outline rich-text-btn" data-target="LocalizationDescValue" title="Unity富文本工具">
                                    <i class="fa fa-paint-brush"></i> 富文本
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 mb-3">
                        <div class="form-group">
                            <label class="form-label">图标文件名</label>
                            <input type="text" class="form-input" id="IconFileName" value="${c.IconFileName || ''}" placeholder="输入图标文件名">
                        </div>
                    </div>
                    <div class="grid grid-cols-3 mb-3">
                        <div class="form-group">
                            <label class="form-label">重量</label>
                            <input type="number" step="0.1" class="form-input" id="Weight" value="${c.Weight || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">价值</label>
                            <input type="number" class="form-input" id="Value" value="${c.Value || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">品质 (1-7)</label>
                            <input type="number" min="1" max="7" class="form-input" id="Quality" value="${c.Quality || 1}">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 mb-3">
                        <div class="form-group">
                            <label class="form-label">Buff持续时间</label>
                            <input type="number" step="0.1" class="form-input" id="BuffDuration" value="${c.BuffDuration?.Duration || 0}" placeholder="秒">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染限制字段
     */
    renderLimitFields(config) {
        const c = config.content;
        return `
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">🔒 限制设置</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-3">
                        <div class="form-checkbox">
                            <input type="checkbox" id="Stackable" ${c.Stackable ? 'checked' : ''}>
                            <label>可堆叠</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" id="CanBeSold" ${c.CanBeSold ? 'checked' : ''}>
                            <label>可出售</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" id="CanDrop" ${c.CanDrop ? 'checked' : ''}>
                            <label>可丢弃</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" id="UnlockByDefault" ${c.UnlockByDefault ? 'checked' : ''}>
                            <label>默认解锁</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" id="HideInIndex" ${c.HideInIndex ? 'checked' : ''}>
                            <label>列表隐藏</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" id="LockInDemo" ${c.LockInDemo ? 'checked' : ''}>
                            <label>演示锁定</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染标签字段
     */
    renderTagsField(config) {
        const selectedTags = config.content.Tags || [];
        
        // 渲染已选中的标签
        const selectedTagsHtml = selectedTags.map(tag => {
            // 查找标签的中文名称
            let tagName = tag;
            for (const category of TAG_DATA_GROUPED) {
                const foundTag = category.tags.find(t => t.id === tag);
                if (foundTag) {
                    tagName = foundTag.name;
                    break;
                }
            }
            // 如果没找到，尝试在扁平数组中查找
            if (tagName === tag) {
                const flatTag = TAG_DATA.find(([key]) => key === tag);
                if (flatTag) {
                    tagName = flatTag[1];
                }
            }
            
            return `
                <span class="tag tag-primary" data-tag-id="${tag}" title="${tag}">
                    ${tagName}
                    <button class="tag-remove" onclick="this.closest('.tag').remove(); window.uiManager.updateTagSelection(); window.uiManager.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });">
                        <i class="fa fa-times"></i>
                    </button>
                </span>
            `;
        }).join('');

        return `
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">🏷️ 标签</h3>
                </div>
                <div class="card-body">
                    <!-- 标签输入和下拉菜单 -->
                    <div class="tag-input-container" style="position: relative; margin-bottom: 12px;">
                        <div class="flex" style="gap: 8px;">
                            <input type="text" 
                                   id="tagInput" 
                                   class="form-input" 
                                   placeholder="输入标签并按回车添加"
                                   style="flex: 1;">
                            <button type="button" 
                                    id="tagDropdownBtn" 
                                    class="btn btn-outline"
                                    style="white-space: nowrap;">
                                <i class="fa fa-list-ul"></i> 浏览标签
                            </button>
                            <button type="button" 
                                    id="addTagBtn" 
                                    class="btn btn-outline"
                                    style="white-space: nowrap;">
                                <i class="fa fa-plus"></i> 添加
                            </button>
                    </div>
                        <!-- 标签下拉菜单 -->
                        <div id="tagDropdown" 
                             class="tag-dropdown hidden" 
                             style="position: fixed; z-index: 10000; 
                                    background: var(--bg-primary, #fff); border: 1px solid var(--border-color, #ddd); 
                                    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
                                    max-height: 500px; min-width: 400px; overflow-y: auto; margin-top: 4px;">
                            <div style="padding: 8px; border-bottom: 1px solid var(--border-color, #ddd);">
                                <input type="text" 
                                       id="tagSearchInput" 
                                       class="form-input" 
                                       placeholder="搜索标签..."
                                       style="width: 100%;">
                            </div>
                            <div id="tagDropdownContent" style="max-height: 440px; overflow-y: auto;">
                                <!-- 标签列表将在这里动态添加 -->
                            </div>
                        </div>
                    </div>
                    <!-- 已选标签显示 -->
                    <div id="tagsContainer" style="display: flex; flex-wrap: wrap; gap: 8px; min-height: 40px;">
                        ${selectedTagsHtml}
                        ${selectedTagsHtml === '' ? '<p style="color: var(--text-secondary, #999); font-size: 14px;">暂无标签，请添加标签</p>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染特定字段
     */
    renderSpecificFields(config) {
        let specificFieldsHtml = '';
        
        // 根据配置类型渲染不同的特殊属性
        switch (config.type) {
            case 'weapon':
                specificFieldsHtml = this.renderWeaponFields(config);
                break;
            case 'ammo':
                specificFieldsHtml = this.renderAmmoFields(config);
                break;
            case 'melee':
                specificFieldsHtml = this.renderMeleeFields(config);
                break;
            case 'accessory':
                specificFieldsHtml = this.renderAccessoryFields(config);
                break;
            default:
                // 物品属性类型已经在renderForm中通过renderItemFields渲染了，这里不需要重复
                specificFieldsHtml = '';
        }

        // 添加mshook修改器配置
        specificFieldsHtml += this.renderMshookFields(config);

        return specificFieldsHtml;
    }

    /**
     * 渲染枪械属性
     */
    renderWeaponFields(config) {
        const weaponProps = config.content.WeaponProperties || {};
        
        return `
            <div class="card mb-3">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">🔫 枪械属性</h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="text" id="weapon-fields-search" class="form-input" placeholder="搜索属性..." style="width: 200px; padding: 6px 12px; font-size: 13px;">
                        <button type="button" id="weapon-fields-search-clear" class="btn btn-icon" style="display: none;" title="清除搜索">
                            <i class="fa fa-times"></i>
                        </button>
                </div>
                </div>
                <div class="card-body" id="weapon-fields-container">
                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">基础性能</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
                                    射程倍率-DistanceMultiplier
                                    <i class="fa fa-question-circle weapon-field-help" data-key="DistanceMultiplier" style="cursor: pointer; color: var(--text-secondary, #666); font-size: 14px;" title="点击查看说明"></i>
                                </label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="DistanceMultiplier" value="${weaponProps.DistanceMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹速度倍率-BulletSpeedMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BulletSpeedMultiplier" value="${weaponProps.BulletSpeedMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准时间倍率-ADSTimeMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ADSTimeMultiplier" value="${weaponProps.ADSTimeMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">射击速度倍率-ShootSpeedMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ShootSpeedMultiplier" value="${weaponProps.ShootSpeedMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">容量倍率-CapacityMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="CapacityMultiplier" value="${weaponProps.CapacityMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">换弹速度倍率-ReloadSpeedMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ReloadSpeedMultiplier" value="${weaponProps.ReloadSpeedMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">伤害系统</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">基础伤害倍率-BaseDamageMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BaseDamageMultiplier" value="${weaponProps.BaseDamageMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">伤害倍率-DamageMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="DamageMultiplier" value="${weaponProps.DamageMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">暴击几率倍率-CriticalChanceMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="CriticalChanceMultiplier" value="${weaponProps.CriticalChanceMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">暴击伤害倍率-CriticalDamageFactorMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="CriticalDamageFactorMultiplier" value="${weaponProps.CriticalDamageFactorMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">穿透倍率-PenetrateMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="PenetrateMultiplier" value="${weaponProps.PenetrateMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">穿甲倍率-ArmorPiercingMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ArmorPiercingMultiplier" value="${weaponProps.ArmorPiercingMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">破甲倍率-ArmorBreakMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ArmorBreakMultiplier" value="${weaponProps.ArmorBreakMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">爆炸伤害倍率-ExplosionDamageMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ExplosionDamageMultiplier" value="${weaponProps.ExplosionDamageMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">爆炸范围倍率-ExplosionRangeMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ExplosionRangeMultiplier" value="${weaponProps.ExplosionRangeMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">射程加成-RangeAddition</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RangeAddition" value="${weaponProps.RangeAddition || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹速度加成-BulletSpeedAddition</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BulletSpeedAddition" value="${weaponProps.BulletSpeedAddition || 0}">
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">精度系统</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">精度倍率-AccuracyMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="AccuracyMultiplier" value="${weaponProps.AccuracyMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">散射因子倍率-ScatterFactorMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterFactorMultiplier" value="${weaponProps.ScatterFactorMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准散射因子倍率-ScatterFactorADSMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterFactorADSMultiplier" value="${weaponProps.ScatterFactorADSMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">默认散射倍率-DefaultScatterMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="DefaultScatterMultiplier" value="${weaponProps.DefaultScatterMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准默认散射倍率-DefaultScatterADSMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="DefaultScatterADSMultiplier" value="${weaponProps.DefaultScatterADSMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">最大散射倍率-MaxScatterMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="MaxScatterMultiplier" value="${weaponProps.MaxScatterMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准最大散射倍率-MaxScatterADSMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="MaxScatterADSMultiplier" value="${weaponProps.MaxScatterADSMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">散射增长倍率-ScatterGrowMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterGrowMultiplier" value="${weaponProps.ScatterGrowMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准散射增长倍率-ScatterGrowADSMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterGrowADSMultiplier" value="${weaponProps.ScatterGrowADSMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">散射恢复倍率-ScatterRecoverMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterRecoverMultiplier" value="${weaponProps.ScatterRecoverMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准散射恢复倍率-ScatterRecoverADSMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterRecoverADSMultiplier" value="${weaponProps.ScatterRecoverADSMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">后坐力系统</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">垂直最小后坐力倍率-RecoilVMinMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilVMinMultiplier" value="${weaponProps.RecoilVMinMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">垂直最大后坐力倍率-RecoilVMaxMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilVMaxMultiplier" value="${weaponProps.RecoilVMaxMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">水平最小后坐力倍率-RecoilHMinMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilHMinMultiplier" value="${weaponProps.RecoilHMinMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">水平最大后坐力倍率-RecoilHMaxMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilHMaxMultiplier" value="${weaponProps.RecoilHMaxMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">垂直后坐力缩放倍率-RecoilScaleVMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilScaleVMultiplier" value="${weaponProps.RecoilScaleVMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">水平后坐力缩放倍率-RecoilScaleHMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilScaleHMultiplier" value="${weaponProps.RecoilScaleHMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力恢复倍率-RecoilRecoverMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilRecoverMultiplier" value="${weaponProps.RecoilRecoverMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力时间倍率-RecoilTimeMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilTimeMultiplier" value="${weaponProps.RecoilTimeMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力恢复时间倍率-RecoilRecoverTimeMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilRecoverTimeMultiplier" value="${weaponProps.RecoilRecoverTimeMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">移动性能</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">移动速度倍率加成-MoveSpeedMultiplierAdd</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="MoveSpeedMultiplierAdd" value="${weaponProps.MoveSpeedMultiplierAdd || 0.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准移动速度倍率加成-ADSMoveSpeedMultiplierAdd</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ADSMoveSpeedMultiplierAdd" value="${weaponProps.ADSMoveSpeedMultiplierAdd || 0.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准距离因子倍率-ADSAimDistanceFactorMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ADSAimDistanceFactorMultiplier" value="${weaponProps.ADSAimDistanceFactorMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-secondary mb-2">其他属性</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">射击数量倍率-ShotCountMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ShotCountMultiplier" value="${weaponProps.ShotCountMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">射击角度倍率-ShotAngleMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ShotAngleMultiplier" value="${weaponProps.ShotAngleMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">连发数量倍率-BurstCountMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BurstCountMultiplier" value="${weaponProps.BurstCountMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">声音范围倍率-SoundRangeMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="SoundRangeMultiplier" value="${weaponProps.SoundRangeMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">增益几率倍率-BuffChanceMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BuffChanceMultiplier" value="${weaponProps.BuffChanceMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹流血几率倍率-BulletBleedChanceMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BulletBleedChanceMultiplier" value="${weaponProps.BulletBleedChanceMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹耐久度消耗倍率-BulletDurabilityCostMultiplier</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BulletDurabilityCostMultiplier" value="${weaponProps.BulletDurabilityCostMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">Hash属性（直接值，非倍率）</h4>
                        <div class="grid grid-cols-2" style="max-height: 600px; overflow-y: auto; padding-right: 8px;">
                            <div class="form-group">
                                <label class="form-label">暴击伤害系数-CritDamageFactorHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="CritDamageFactorHash" ${weaponProps.CritDamageFactorHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="CritDamageFactorHash" value="${weaponProps.CritDamageFactorHash || ''}" placeholder="例如：2.0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">穿透能力-PenetrateHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="PenetrateHash" ${weaponProps.PenetrateHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="PenetrateHash" value="${weaponProps.PenetrateHash || ''}" placeholder="例如：2">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">护甲穿透-ArmorPiercingHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ArmorPiercingHash" ${weaponProps.ArmorPiercingHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ArmorPiercingHash" value="${weaponProps.ArmorPiercingHash || ''}" placeholder="例如：0.3">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">护甲破坏-ArmorBreakHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ArmorBreakHash" ${weaponProps.ArmorBreakHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ArmorBreakHash" value="${weaponProps.ArmorBreakHash || ''}" placeholder="例如：0.2">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">爆炸伤害乘数-explosionDamageMultiplierHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="explosionDamageMultiplierHash" ${weaponProps.explosionDamageMultiplierHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="explosionDamageMultiplierHash" value="${weaponProps.explosionDamageMultiplierHash || ''}" placeholder="例如：1.5">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">射击次数-ShotCountHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ShotCountHash" ${weaponProps.ShotCountHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ShotCountHash" value="${weaponProps.ShotCountHash || ''}" placeholder="例如：8">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">射击角度-ShotAngleHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ShotAngleHash" ${weaponProps.ShotAngleHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ShotAngleHash" value="${weaponProps.ShotAngleHash || ''}" placeholder="例如：15">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Burst次数-BurstCountHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="BurstCountHash" ${weaponProps.BurstCountHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="BurstCountHash" value="${weaponProps.BurstCountHash || ''}" placeholder="例如：3">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">声音范围-SoundRangeHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="SoundRangeHash" ${weaponProps.SoundRangeHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="SoundRangeHash" value="${weaponProps.SoundRangeHash || ''}" placeholder="例如：200">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准距离系数-ADSAimDistanceFactorHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ADSAimDistanceFactorHash" ${weaponProps.ADSAimDistanceFactorHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ADSAimDistanceFactorHash" value="${weaponProps.ADSAimDistanceFactorHash || ''}" placeholder="例如：1.5">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">换弹时间-ReloadTimeHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ReloadTimeHash" ${weaponProps.ReloadTimeHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ReloadTimeHash" value="${weaponProps.ReloadTimeHash || ''}" placeholder="例如：2.5">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">常规散布系数-ScatterFactorHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ScatterFactorHash" ${weaponProps.ScatterFactorHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ScatterFactorHash" value="${weaponProps.ScatterFactorHash || ''}" placeholder="例如：0.8">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准散布系数-ScatterFactorHashADS</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ScatterFactorHashADS" ${weaponProps.ScatterFactorHashADS !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ScatterFactorHashADS" value="${weaponProps.ScatterFactorHashADS || ''}" placeholder="例如：0.4">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准默认散布-DefaultScatterHashADS</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="DefaultScatterHashADS" ${weaponProps.DefaultScatterHashADS !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="DefaultScatterHashADS" value="${weaponProps.DefaultScatterHashADS || ''}" placeholder="例如：0.2">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">常规最大散布-MaxScatterHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="MaxScatterHash" ${weaponProps.MaxScatterHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="MaxScatterHash" value="${weaponProps.MaxScatterHash || ''}" placeholder="例如：2.0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准最大散布-MaxScatterHashADS</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="MaxScatterHashADS" ${weaponProps.MaxScatterHashADS !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="MaxScatterHashADS" value="${weaponProps.MaxScatterHashADS || ''}" placeholder="例如：1.0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">散布增长-ScatterGrowHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ScatterGrowHash" ${weaponProps.ScatterGrowHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ScatterGrowHash" value="${weaponProps.ScatterGrowHash || ''}" placeholder="例如：0.1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准散布增长-ScatterGrowHashADS</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ScatterGrowHashADS" ${weaponProps.ScatterGrowHashADS !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ScatterGrowHashADS" value="${weaponProps.ScatterGrowHashADS || ''}" placeholder="例如：0.05">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">常规散布恢复-ScatterRecoverHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="ScatterRecoverHash" ${weaponProps.ScatterRecoverHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="ScatterRecoverHash" value="${weaponProps.ScatterRecoverHash || ''}" placeholder="例如：0.5">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">垂直后坐力最小值-RecoilVMiniHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="RecoilVMiniHash" ${weaponProps.RecoilVMiniHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="RecoilVMiniHash" value="${weaponProps.RecoilVMiniHash || ''}" placeholder="例如：0.5">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">垂直后坐力最大值-RecoilVMaxHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="RecoilVMaxHash" ${weaponProps.RecoilVMaxHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="RecoilVMaxHash" value="${weaponProps.RecoilVMaxHash || ''}" placeholder="例如：1.0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">水平后坐力最小值-RecoilHMinHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="RecoilHMinHash" ${weaponProps.RecoilHMinHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="RecoilHMinHash" value="${weaponProps.RecoilHMinHash || ''}" placeholder="例如：-0.3">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">水平后坐力最大值-RecoilHMaxHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="RecoilHMaxHash" ${weaponProps.RecoilHMaxHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="RecoilHMaxHash" value="${weaponProps.RecoilHMaxHash || ''}" placeholder="例如：0.3">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力缩放-RecoilScaleHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="RecoilScaleHash" ${weaponProps.RecoilScaleHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="RecoilScaleHash" value="${weaponProps.RecoilScaleHash || ''}" placeholder="例如：1.0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准后坐力缩放-RecoilScaleHashADS</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="RecoilScaleHashADS" ${weaponProps.RecoilScaleHashADS !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="RecoilScaleHashADS" value="${weaponProps.RecoilScaleHashADS || ''}" placeholder="例如：0.8">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力恢复-RecoilRecoverHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="RecoilRecoverHash" ${weaponProps.RecoilRecoverHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="RecoilRecoverHash" value="${weaponProps.RecoilRecoverHash || ''}" placeholder="例如：2.0">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力时间-RecoilTimeHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="RecoilTimeHash" ${weaponProps.RecoilTimeHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="RecoilTimeHash" value="${weaponProps.RecoilTimeHash || ''}" placeholder="例如：0.1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力恢复时间-RecoilRecoverTimeHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="RecoilRecoverTimeHash" ${weaponProps.RecoilRecoverTimeHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="RecoilRecoverTimeHash" value="${weaponProps.RecoilRecoverTimeHash || ''}" placeholder="例如：0.5">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">弹匣容量-CapacityHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="CapacityHash" ${weaponProps.CapacityHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="CapacityHash" value="${weaponProps.CapacityHash || ''}" placeholder="例如：30">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">增益触发概率-BuffChanceHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="BuffChanceHash" ${weaponProps.BuffChanceHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="BuffChanceHash" value="${weaponProps.BuffChanceHash || ''}" placeholder="例如：0.1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹出血概率-BulletBleedChanceHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="BulletBleedChanceHash" ${weaponProps.BulletBleedChanceHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="BulletBleedChanceHash" value="${weaponProps.BulletBleedChanceHash || ''}" placeholder="例如：0.2">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹耐久消耗-bulletDurabilityCostHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="bulletDurabilityCostHash" ${weaponProps.bulletDurabilityCostHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="bulletDurabilityCostHash" value="${weaponProps.bulletDurabilityCostHash || ''}" placeholder="例如：1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹爆炸范围-BulletExplosionRangeHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="BulletExplosionRangeHash" ${weaponProps.BulletExplosionRangeHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="BulletExplosionRangeHash" value="${weaponProps.BulletExplosionRangeHash || ''}" placeholder="例如：5">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹增益概率乘数-BulletBuffChanceMultiplierHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="weapon-hash-check" data-key="BulletBuffChanceMultiplierHash" ${weaponProps.BulletBuffChanceMultiplierHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input weapon-hash-field" data-key="BulletBuffChanceMultiplierHash" value="${weaponProps.BulletBuffChanceMultiplierHash || ''}" placeholder="例如：1.2">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染弹药属性
     */
    renderAmmoFields(config) {
        const ammoProps = config.content.AmmoProperties || {};
        
        return `
            <div class="card mb-3">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">🩸 弹药属性</h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="text" id="ammo-fields-search" class="form-input" placeholder="搜索属性..." style="width: 200px; padding: 6px 12px; font-size: 13px;">
                        <button type="button" id="ammo-fields-search-clear" class="btn btn-icon" style="display: none;" title="清除搜索">
                            <i class="fa fa-times"></i>
                        </button>
                </div>
                </div>
                <div class="card-body" id="ammo-fields-container">
                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">基础属性</h4>
                        <div class="grid grid-cols-2" style="max-height: 400px; overflow-y: auto; padding-right: 8px;">
                        <div class="form-group">
                                <label class="form-label">新增暴击率-NewCritRateGain</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewCritRateGain" value="${ammoProps.NewCritRateGain || 0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增暴击伤害系数-NewCritDamageFactorGain</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewCritDamageFactorGain" value="${ammoProps.NewCritDamageFactorGain || 0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增穿甲值-NewArmorPiercingGain</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewArmorPiercingGain" value="${ammoProps.NewArmorPiercingGain || 0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增伤害倍率-NewDamageMultiplier</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewDamageMultiplier" value="${ammoProps.NewDamageMultiplier || 1.0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增爆炸范围-NewExplosionRange</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewExplosionRange" value="${ammoProps.NewExplosionRange || 0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增增益几率倍率-NewBuffChanceMultiplier</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewBuffChanceMultiplier" value="${ammoProps.NewBuffChanceMultiplier || 1.0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增流血几率-NewBleedChance</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewBleedChance" value="${ammoProps.NewBleedChance || 0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增爆炸伤害-NewExplosionDamage</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewExplosionDamage" value="${ammoProps.NewExplosionDamage || 0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增破甲值-NewArmorBreakGain</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewArmorBreakGain" value="${ammoProps.NewArmorBreakGain || 0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增耐久度消耗-NewDurabilityCost</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewDurabilityCost" value="${ammoProps.NewDurabilityCost || 0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增子弹速度-NewBulletSpeed</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewBulletSpeed" value="${ammoProps.NewBulletSpeed || 0}">
                        </div>
                        <div class="form-group">
                                <label class="form-label">新增子弹射程-NewBulletDistance</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewBulletDistance" value="${ammoProps.NewBulletDistance || 0}">
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">Hash属性（直接值）</h4>
                        <div class="grid grid-cols-2" style="max-height: 500px; overflow-y: auto; padding-right: 8px;">
                            <div class="form-group">
                                <label class="form-label">护甲穿透增益-bulletArmorPiercingGainHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="bulletArmorPiercingGainHash" ${ammoProps.bulletArmorPiercingGainHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="bulletArmorPiercingGainHash" value="${ammoProps.bulletArmorPiercingGainHash || ''}" placeholder="例如：0.1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹伤害乘数-BulletDamageMultiplierHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="BulletDamageMultiplierHash" ${ammoProps.BulletDamageMultiplierHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="BulletDamageMultiplierHash" value="${ammoProps.BulletDamageMultiplierHash || ''}" placeholder="例如：1.2">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">暴击伤害系数增益-bulletCritDamageFactorGainHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="bulletCritDamageFactorGainHash" ${ammoProps.bulletCritDamageFactorGainHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="bulletCritDamageFactorGainHash" value="${ammoProps.bulletCritDamageFactorGainHash || ''}" placeholder="例如：0.2">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">暴击率增益-bulletCritRateGainHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="bulletCritRateGainHash" ${ammoProps.bulletCritRateGainHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="bulletCritRateGainHash" value="${ammoProps.bulletCritRateGainHash || ''}" placeholder="例如：0.05">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">爆炸范围-bulletExplosionRangeHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="bulletExplosionRangeHash" ${ammoProps.bulletExplosionRangeHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="bulletExplosionRangeHash" value="${ammoProps.bulletExplosionRangeHash || ''}" placeholder="例如：3">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹增益概率乘数-BulletBuffChanceMultiplierHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="BulletBuffChanceMultiplierHash" ${ammoProps.BulletBuffChanceMultiplierHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="BulletBuffChanceMultiplierHash" value="${ammoProps.BulletBuffChanceMultiplierHash || ''}" placeholder="例如：1.1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹出血概率-BulletBleedChanceHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="BulletBleedChanceHash" ${ammoProps.BulletBleedChanceHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="BulletBleedChanceHash" value="${ammoProps.BulletBleedChanceHash || ''}" placeholder="例如：0.1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">爆炸伤害-bulletExplosionDamageHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="bulletExplosionDamageHash" ${ammoProps.bulletExplosionDamageHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="bulletExplosionDamageHash" value="${ammoProps.bulletExplosionDamageHash || ''}" placeholder="例如：10">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">护甲破坏增益-armorBreakGainHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="armorBreakGainHash" ${ammoProps.armorBreakGainHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="armorBreakGainHash" value="${ammoProps.armorBreakGainHash || ''}" placeholder="例如：0.1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹耐久消耗-bulletDurabilityCostHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="bulletDurabilityCostHash" ${ammoProps.bulletDurabilityCostHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="bulletDurabilityCostHash" value="${ammoProps.bulletDurabilityCostHash || ''}" placeholder="例如：1">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹速度-BulletSpeedHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="BulletSpeedHash" ${ammoProps.BulletSpeedHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="BulletSpeedHash" value="${ammoProps.BulletSpeedHash || ''}" placeholder="例如：300">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹距离-BulletDistanceHash</label>
                                <div class="flex items-center" style="gap: 8px;">
                                    <input type="checkbox" class="ammo-hash-check" data-key="BulletDistanceHash" ${ammoProps.BulletDistanceHash !== undefined ? 'checked' : ''}>
                                    <input type="number" step="0.1" class="form-input ammo-hash-field" data-key="BulletDistanceHash" value="${ammoProps.BulletDistanceHash || ''}" placeholder="例如：500">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染近战武器属性
     */
    renderMeleeFields(config) {
        const meleeProps = config.content.MeleeWeaponProperties || {};
        
        return `
            <div class="card mb-3">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">🗡️ 近战武器属性</h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="text" id="melee-fields-search" class="form-input" placeholder="搜索属性..." style="width: 200px; padding: 6px 12px; font-size: 13px;">
                        <button type="button" id="melee-fields-search-clear" class="btn btn-icon" style="display: none;" title="清除搜索">
                            <i class="fa fa-times"></i>
                        </button>
                </div>
                </div>
                <div class="card-body" id="melee-fields-container">
                    <div class="grid grid-cols-3">
                        <div class="form-group">
                            <label class="form-label">新增伤害值</label>
                            <input type="number" step="0.1" class="form-input melee-field" data-key="NewDamage" value="${meleeProps.NewDamage || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增暴击率</label>
                            <input type="number" step="0.1" class="form-input melee-field" data-key="NewCritRate" value="${meleeProps.NewCritRate || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增暴击伤害系数</label>
                            <input type="number" step="0.1" class="form-input melee-field" data-key="NewCritDamageFactor" value="${meleeProps.NewCritDamageFactor || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增穿甲值</label>
                            <input type="number" step="0.1" class="form-input melee-field" data-key="NewArmorPiercing" value="${meleeProps.NewArmorPiercing || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增攻击速度</label>
                            <input type="number" step="0.1" class="form-input melee-field" data-key="NewAttackSpeed" value="${meleeProps.NewAttackSpeed || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增攻击范围</label>
                            <input type="number" step="0.1" class="form-input melee-field" data-key="NewAttackRange" value="${meleeProps.NewAttackRange || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增体力消耗</label>
                            <input type="number" step="0.1" class="form-input melee-field" data-key="NewStaminaCost" value="${meleeProps.NewStaminaCost || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增流血几率</label>
                            <input type="number" step="0.1" class="form-input melee-field" data-key="NewBleedChance" value="${meleeProps.NewBleedChance || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增移动速度倍率</label>
                            <input type="number" step="0.1" class="form-input melee-field" data-key="NewMoveSpeedMultiplier" value="${meleeProps.NewMoveSpeedMultiplier || 1.0}">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染配件槽位配置
     */
    renderAccessoryFields(config) {
        const slotConfig = config.content.SlotConfiguration || {};
        
        return `
            <div class="card mb-3">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">🔧 配件槽位配置</h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="text" id="accessory-fields-search" class="form-input" placeholder="搜索属性..." style="width: 200px; padding: 6px 12px; font-size: 13px;">
                        <button type="button" id="accessory-fields-search-clear" class="btn btn-icon" style="display: none;" title="清除搜索">
                            <i class="fa fa-times"></i>
                        </button>
                </div>
                </div>
                <div class="card-body" id="accessory-fields-container">
                    <div class="grid grid-cols-2 mb-3">
                        <div class="form-group">
                            <label class="form-label">额外槽位标签</label>
                            <input type="text" class="form-input accessory-field" data-key="AdditionalSlotTags" value="${(slotConfig.AdditionalSlotTags || []).join(', ')}" placeholder="逗号分隔，如: Scope, Magazine">
                        </div>
                        <div class="form-group">
                            <label class="form-label">额外槽位数量</label>
                            <input type="number" class="form-input accessory-field" data-key="AdditionalSlotCount" value="${slotConfig.AdditionalSlotCount || 0}">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 mb-3">
                        <div class="form-group">
                            <label class="form-label">额外槽位自定义名称</label>
                            <input type="text" class="form-input accessory-field" data-key="AdditionalSlotNames" value="${(slotConfig.AdditionalSlotNames || []).join(', ')}" placeholder="逗号分隔，如: 瞄准镜槽, 弹匣槽">
                        </div>
                    </div>
                    <div class="grid grid-cols-1">
                        <div class="form-checkbox">
                            <input type="checkbox" class="accessory-field" data-key="ReplaceExistingSlots" ${slotConfig.ReplaceExistingSlots ? 'checked' : ''}>
                            <label>替换现有槽位</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 收集表单数据
     */
    collectFormData() {
        const state = this.store.getState();
        if (!state.currentConfig) return null;

        const config = deepClone(state.currentConfig);
        
        // 基本信息
        config.fileName = document.getElementById('fileName').value;
        config.type = document.getElementById('configType').value;

        // 基础字段 - 已移至2692行的collectFormData方法中，这里保留作为备份逻辑
        // 注意：实际使用的是2692行的完整版本，包含所有基础字段

        // 修复BuffDuration字段：从表单获取值并确保为对象格式
        const buffDurationElement = document.getElementById('BuffDuration');
        if (buffDurationElement) {
            const duration = parseFloat(buffDurationElement.value) || 0;
            config.content.BuffDuration = {
                "DefaultDuration": duration,
                "Duration": duration
            };
        } else {
            // 如果没有表单元素，确保BuffDuration为正确的对象格式
            if (!config.content.BuffDuration || typeof config.content.BuffDuration !== 'object') {
                config.content.BuffDuration = {
                    "DefaultDuration": 0,
                    "Duration": 0
                };
            }
        }

        // 布尔字段
        const boolFields = ['Stackable', 'CanBeSold', 'CanDrop', 'UnlockByDefault', 'HideInIndex', 'LockInDemo'];
        boolFields.forEach(field => {
            const el = document.getElementById(field);
            if (el) config.content[field] = el.checked;
        });

        // 标签 - 从新的标签容器中收集
        const tagsContainer = document.getElementById('tagsContainer');
        const selectedTags = [];
        if (tagsContainer) {
            const tagElements = tagsContainer.querySelectorAll('.tag[data-tag-id]');
            tagElements.forEach(tag => {
                const tagId = tag.getAttribute('data-tag-id');
                if (tagId) {
                    selectedTags.push(tagId);
                }
            });
        }
        config.content.Tags = selectedTags;

        // 添加缺失的基础字段
        this.collectMissingBasicFields(config);

        // Buff配置
        const buffConfigs = [];
        document.querySelectorAll('.buff-config-item').forEach(item => {
            const originalId = item.querySelector('.buff-original-id')?.value;
            const newId = item.querySelector('.buff-new-id')?.value;
            const duration = item.querySelector('.buff-duration')?.value;
            
            if (originalId && newId) {
                buffConfigs.push({
                    originalBuffId: String(originalId),
                    newBuffId: String(newId),
                    newDuration: parseFloat(duration) || 900
                });
            }
        });
        if (buffConfigs.length > 0) {
            config.content.BuffCopyConfigs = buffConfigs;
        }

        // 合成配方
        const recipes = [];
        document.querySelectorAll('.recipe-item').forEach(item => {
            const formulaId = item.querySelector('.recipe-formula-id')?.value;
            const money = item.querySelector('.recipe-money')?.value;
            const resultAmount = item.querySelector('.recipe-result-amount')?.value;
            // 合成标签固定为高级工作台
            const perk = item.querySelector('.recipe-perk')?.value;
            const unlockDefault = item.querySelector('.recipe-unlock-default')?.checked;
            const hideIndex = item.querySelector('.recipe-hide-index')?.checked;

            // 收集材料
            const costItems = [];
            item.querySelectorAll('.cost-item-row').forEach(row => {
                const itemId = row.querySelector('.cost-item-id')?.value;
                const amount = row.querySelector('.cost-item-amount')?.value;
                if (itemId) {
                    costItems.push({
                        ItemId: parseInt(itemId),
                        Amount: parseInt(amount) || 1
                    });
                }
            });

            if (formulaId || costItems.length > 0) {
                recipes.push({
                    FormulaId: formulaId || '',
                    CraftingMoney: parseInt(money) || 0,
                    ResultItemAmount: parseInt(resultAmount) || 1,
                    CraftingTags: ['WorkBenchAdvanced'], // 固定为高级工作台
                    RequirePerk: perk || '',
                    UnlockByDefault: unlockDefault,
                    HideInIndex: hideIndex,
                    CostItems: costItems
                });
            }
        });
        if (recipes.length > 0) {
            config.content.AdditionalRecipes = recipes;
        }

        // 清理旧格式的合成配方字段，确保只保留新的数组结构
        delete config.content.FormulaId;
        delete config.content.CraftingMoney;
        delete config.content.ResultItemAmount;
        delete config.content.CraftingTags;
        delete config.content.RequirePerk;
        delete config.content.CostItems;
        
        // 清理其他不支持的字段（LocalizationDesc和SoundKey已保留在基础字段中）
        // 这些字段现在在ItemProperties中，不需要删除
        // delete config.content.MaxStackCount;
        // delete config.content.Order;
        // delete config.content.DisplayQuality;
        // delete config.content.HealValue;
        // delete config.content.UseDurability;
        // delete config.content.DurabilityUsageDrug;
        // delete config.content.MaxDurability;
        // delete config.content.DurabilityLoss;
        // delete config.content.UseTime;
        // delete config.content.EnergyValue;
        // delete config.content.WaterValue;
        delete config.content.Stackable;
        delete config.content.CanBeSold;
        delete config.content.CanDrop;
        delete config.content.UnlockByDefault;
        delete config.content.HideInIndex;
        delete config.content.LockInDemo;
        delete config.content.AdditionalSlotTags;
        delete config.content.AdditionalSlotCount;
        delete config.content.AdditionalSlotNames;

        // 分解配方
        const enableDecompose = document.getElementById('EnableDecompose')?.checked;
        const decomposeFormulaId = document.getElementById('DecomposeFormulaId')?.value;
        const decomposeTime = document.getElementById('DecomposeTime')?.value;
        const decomposeMoney = document.getElementById('DecomposeMoney')?.value;

        config.content.EnableDecompose = enableDecompose || false;
        
        // 修复DecomposeFormulaId：确保为数值类型或移除空值
        if (decomposeFormulaId && decomposeFormulaId.trim() !== '') {
            config.content.DecomposeFormulaId = parseInt(decomposeFormulaId) || 0;
        } else {
            delete config.content.DecomposeFormulaId;
        }
        
        config.content.DecomposeTime = parseFloat(decomposeTime) || 0;
        config.content.DecomposeMoney = parseInt(decomposeMoney) || 0;

        const decomposeResults = [];
        document.querySelectorAll('.decompose-result-row').forEach(row => {
            const itemId = row.querySelector('.decompose-item-id')?.value;
            const amount = row.querySelector('.decompose-item-amount')?.value;
            if (itemId) {
                decomposeResults.push({
                    ItemId: parseInt(itemId),
                    Amount: parseInt(amount) || 1
                });
            }
        });
        if (decomposeResults.length > 0) {
            config.content.DecomposeResults = decomposeResults;
        }

        // 抽奖配置 - 修复格式：改为Gacha单数格式
        const gachaConfigs = [];
        document.querySelectorAll('.gacha-config-item').forEach(item => {
            const name = item.querySelector('.gacha-name')?.value;
            const notificationKey = item.querySelector('.gacha-notification-key')?.value;
            const description = item.querySelector('.gacha-description')?.value;

            // 收集抽奖条目
            const entries = [];
            item.querySelectorAll('.gacha-entry-row').forEach(row => {
                const itemId = row.querySelector('.gacha-item-id')?.value;
                const weight = parseFloat(row.querySelector('.gacha-weight').value) || 0;
                if (itemId && weight > 0) {
                    entries.push({
                        ItemId: parseInt(itemId),  // 修复字段名：itemId -> ItemId
                        Weight: weight              // 修复字段名：weight -> Weight
                    });
                }
            });

            if (name || entries.length > 0) {
                gachaConfigs.push({
                    Name: name || '',                    // 修复字段名：name -> Name
                    NotificationKey: notificationKey || '', // 修复字段名：notificationKey -> NotificationKey
                    Description: description || '',      // 修复字段名：description -> Description
                    Entries: entries                    // 修复字段名：entries -> Entries
                });
            }
        });
        if (gachaConfigs.length > 0) {
            config.content.Gacha = gachaConfigs;  // 修复字段名：GachaConfigs -> Gacha
        }

        // 特定属性 - 根据类型收集不同的属性
        switch (config.type) {
            case 'weapon':
                const weaponFields = document.querySelectorAll('.weapon-field');
                const weaponProps = {};
                weaponFields.forEach(field => {
                    const key = field.dataset.key;
                    const value = parseFloat(field.value) || 0;
                    if (value !== 0 && value !== 1.0) { // 只保存非默认值
                        weaponProps[key] = value;
                    }
                });
                if (Object.keys(weaponProps).length > 0) {
                    config.content.WeaponProperties = weaponProps;
                }
                break;

            case 'ammo':
                const ammoFields = document.querySelectorAll('.ammo-field');
                const ammoProps = {};
                ammoFields.forEach(field => {
                    const key = field.dataset.key;
                    const value = parseFloat(field.value);
                    if (!isNaN(value) && (value !== 0 || key.includes('NewDamageMultiplier') || key.includes('NewBuffChanceMultiplier'))) {
                        // 对于倍率类型，只有非1.0才保存；对于增益类型，只有非0才保存
                        if (key.includes('Multiplier')) {
                            if (value !== 1.0) ammoProps[key] = value;
                        } else {
                            if (value !== 0) ammoProps[key] = value;
                        }
                    }
                });
                
                // 收集Hash属性（只有勾选时才保存）
                const ammoHashFields = document.querySelectorAll('.ammo-hash-field');
                ammoHashFields.forEach(field => {
                    const key = field.dataset.key;
                    const checkbox = field.previousElementSibling;
                    if (checkbox && checkbox.classList.contains('ammo-hash-check') && checkbox.checked) {
                        const value = parseFloat(field.value);
                        if (value !== undefined && !isNaN(value) && field.value.trim() !== '') {
                        ammoProps[key] = value;
                        }
                    }
                });
                
                if (Object.keys(ammoProps).length > 0) {
                    config.content.AmmoProperties = ammoProps;
                }
                break;

            case 'melee':
                const meleeFields = document.querySelectorAll('.melee-field');
                const meleeProps = {};
                meleeFields.forEach(field => {
                    const key = field.dataset.key;
                    const value = parseFloat(field.value) || 0;
                    if (value !== 0 && value !== 1.0) { // 只保存非默认值
                        meleeProps[key] = value;
                    }
                });
                if (Object.keys(meleeProps).length > 0) {
                    config.content.MeleeWeaponProperties = meleeProps;
                }
                break;

            case 'accessory':
                const accessoryFields = document.querySelectorAll('.accessory-field');
                const slotConfig = {};
                accessoryFields.forEach(field => {
                    const key = field.dataset.key;
                    if (field.type === 'checkbox') {
                        slotConfig[key] = field.checked;
                    } else if (field.type === 'number') {
                        const value = parseInt(field.value) || 0;
                        if (value !== 0) slotConfig[key] = value;
                    } else {
                        const value = field.value.trim();
                        if (value) {
                            // 处理逗号分隔的数组
                            if (key.includes('Tags') || key.includes('Names')) {
                                slotConfig[key] = value.split(',').map(v => v.trim()).filter(v => v);
                            } else {
                                slotConfig[key] = value;
                            }
                        }
                    }
                });
                if (Object.keys(slotConfig).length > 0) {
                    config.content.SlotConfiguration = slotConfig;
                }
                break;

            default:
                // 基础物品属性 - 根据Mod的ItemConfig类，这些字段应该在根级别，而不是ItemProperties中
                const itemFields = document.querySelectorAll('.item-field');
                
                // Mod不支持的字段列表（这些字段会被忽略）
                const unsupportedFields = ['Order', 'DisplayQuality', 'MaxDurability', 'DurabilityLoss', 'UseTime', 'Repairable'];
                
                itemFields.forEach(field => {
                    const key = field.dataset.key;
                    
                    // 跳过不支持的字段和禁用的字段
                    if (unsupportedFields.includes(key) || field.disabled) {
                        return;
                    }
                    
                    // 根据Mod的ItemConfig类，这些字段应该在根级别
                    const rootLevelFields = [
                        'MaxStackCount', 'EnergyValue', 'WaterValue', 'UseDurability',
                        'HealValue', 'UseDurabilityDrug', 'DurabilityUsageDrug', 'CanUsePartDrug'
                    ];
                    
                    if (rootLevelFields.includes(key)) {
                    if (field.type === 'checkbox') {
                            if (field.checked) {
                                config.content[key] = field.checked;
                            } else {
                                // 根据Mod的默认值处理：只删除非默认值
                                if (key === 'UseDurabilityDrug' || key === 'CanUsePartDrug') {
                                    delete config.content[key];
                                }
                            }
                    } else if (field.type === 'number') {
                        const value = parseFloat(field.value) || 0;
                            // 根据Mod的默认值处理：只保存非默认值
                            const defaultValue = key === 'MaxStackCount' ? 1 : 0;
                            if (value !== defaultValue) {
                                config.content[key] = value;
                            } else {
                                delete config.content[key];
                            }
                    } else {
                        const value = field.value.trim();
                            if (value) {
                                config.content[key] = value;
                            } else {
                                delete config.content[key];
                    }
                }
                    }
                });
                
                // 移除ItemProperties字段（Mod不支持）
                delete config.content.ItemProperties;
        }

        // mshook修改器
        const mshookFields = document.querySelectorAll('.mshook-field');
        const mshook = {};
        mshookFields.forEach(field => {
            const key = field.dataset.key;
            const value = parseFloat(field.value) || 0;
            if (value !== 0) mshook[key] = value;
        });
        if (Object.keys(mshook).length > 0) {
            config.content.mshook = mshook;
        }

        return config;
    }

    /**
     * 收集缺失的基础字段，确保配置文件包含所有必需字段
     * @param {Object} content - 配置内容对象
     */
    collectMissingBasicFields(content) {
        // 确保所有必需的基础字段都存在
        const requiredFields = {
            // 基础属性
            EnergyValue: typeof content.EnergyValue === 'number' ? content.EnergyValue : 0,
            WaterValue: typeof content.WaterValue === 'number' ? content.WaterValue : 0,
            IconFileName: content.IconFileName || '',
            MaxStackCount: typeof content.MaxStackCount === 'number' ? content.MaxStackCount : 1,
            
            // BuffDuration 确保为对象格式
            BuffDuration: content.BuffDuration && typeof content.BuffDuration === 'object' ? 
                content.BuffDuration : {
                    "DefaultDuration": 0,
                    "Duration": 0
                },
            
            // 其他必需字段
            DecomposeFormulaId: typeof content.DecomposeFormulaId === 'number' ? content.DecomposeFormulaId : 0,
            IsConsumable: typeof content.IsConsumable === 'boolean' ? content.IsConsumable : false,
            IsEquipable: typeof content.IsEquipable === 'boolean' ? content.IsEquipable : false,
            IsSellable: typeof content.IsSellable === 'boolean' ? content.IsSellable : true,
            SellPrice: typeof content.SellPrice === 'number' ? content.SellPrice : 0,
            
            // 确保Effects和Requirements存在
            Effects: Array.isArray(content.Effects) ? content.Effects : [],
            Requirements: content.Requirements && typeof content.Requirements === 'object' ? 
                content.Requirements : {
                    Level: 1,
                    Skills: [],
                    Items: []
                }
        };

        // 将缺失的字段合并到内容对象中
        Object.keys(requiredFields).forEach(field => {
            if (content[field] === undefined || content[field] === null) {
                content[field] = requiredFields[field];
            }
        });

        // 特别处理BuffDuration字段，确保格式正确
        if (content.BuffDuration && typeof content.BuffDuration !== 'object') {
            content.BuffDuration = {
                "DefaultDuration": parseFloat(content.BuffDuration) || 0,
                "Duration": parseFloat(content.BuffDuration) || 0
            };
        }

        // 确保Metadata字段存在
        if (!content.Metadata || typeof content.Metadata !== 'object') {
            content.Metadata = {
                CreatedBy: 'System',
                CreatedDate: new Date().toISOString(),
                LastModified: new Date().toISOString(),
                Version: '1.0',
                Tags: []
            };
        }
    }

    /**
     * 渲染基础物品属性
     */
    renderItemFields(config) {
        // 根据Mod的ItemConfig类，这些字段在根级别，不在ItemProperties中
        // 为了向后兼容，先从ItemProperties读取，如果没有则从根级别读取
        const itemProps = config.content.ItemProperties || {};
        const rootContent = config.content;
        
        return `
            <div class="card mb-3">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">📦 物品属性</h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="text" id="item-fields-search" class="form-input" placeholder="搜索属性..." style="width: 200px; padding: 6px 12px; font-size: 13px;">
                        <button type="button" id="item-fields-search-clear" class="btn btn-icon" style="display: none;" title="清除搜索">
                            <i class="fa fa-times"></i>
                        </button>
                </div>
                </div>
                <div class="card-body" id="item-fields-container">
                    <div class="grid grid-cols-3">
                        <div class="form-group">
                            <label class="form-label">最大堆叠数量-MaxStackCount</label>
                            <input type="number" class="form-input item-field" data-key="MaxStackCount" value="${rootContent.MaxStackCount ?? itemProps.MaxStackCount ?? 1}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">最大耐久度-MaxDurability <span style="color: #999; font-size: 12px;">(Mod不支持)</span></label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="MaxDurability" value="${itemProps.MaxDurability || 0}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">耐久度损失率-DurabilityLoss <span style="color: #999; font-size: 12px;">(Mod不支持)</span></label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="DurabilityLoss" value="${itemProps.DurabilityLoss || 0}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">使用时间（秒）-UseTime <span style="color: #999; font-size: 12px;">(Mod不支持)</span></label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="UseTime" value="${itemProps.UseTime || 0}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">能量值-EnergyValue</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="EnergyValue" value="${rootContent.EnergyValue ?? itemProps.EnergyValue ?? 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">口渴值-WaterValue</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="WaterValue" value="${rootContent.WaterValue ?? itemProps.WaterValue ?? 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">治疗值-HealValue</label>
                            <input type="number" class="form-input item-field" data-key="HealValue" value="${rootContent.HealValue ?? itemProps.HealValue ?? 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">使用耐久度消耗-UseDurability</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="UseDurability" value="${rootContent.UseDurability ?? itemProps.UseDurability ?? 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">耐久消耗量-DurabilityUsageDrug</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="DurabilityUsageDrug" value="${rootContent.DurabilityUsageDrug ?? itemProps.DurabilityUsageDrug ?? 0}" placeholder="例如：100">
                        </div>
                        <div class="form-group">
                            <label class="form-label">排序顺序-Order <span style="color: #999; font-size: 12px;">(Mod不支持)</span></label>
                            <input type="number" class="form-input item-field" data-key="Order" value="${itemProps.Order || 0}" disabled>
                        </div>
                        <div class="form-group">
                            <label class="form-label">显示品质等级-DisplayQuality <span style="color: #999; font-size: 12px;">(Mod不支持)</span></label>
                            <input type="number" class="form-input item-field" data-key="DisplayQuality" value="${itemProps.DisplayQuality || 0}" disabled>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 mt-3">
                        <div class="form-checkbox">
                            <input type="checkbox" class="item-field" data-key="Repairable" ${itemProps.Repairable ? 'checked' : ''} disabled>
                            <label>可修复 <span style="color: #999; font-size: 12px;">(Mod不支持)</span></label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" class="item-field" data-key="UseDurabilityDrug" ${rootContent.UseDurabilityDrug ?? itemProps.UseDurabilityDrug ? 'checked' : ''}>
                            <label>药物消耗耐久度-UseDurabilityDrug</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" class="item-field" data-key="CanUsePartDrug" ${rootContent.CanUsePartDrug ?? itemProps.CanUsePartDrug ? 'checked' : ''}>
                            <label>可部分使用药物-CanUsePartDrug</label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染mshook修改器字段
     */
    renderMshookFields(config) {
        const mshook = config.content.mshook || {};
        
        return `
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">🔧 通用属性 (mshook)</h3>
                </div>
                <div class="card-body">
                    <!-- 移动相关属性 -->
                    <details open>
                        <summary style="font-weight: 600; margin-bottom: 12px; cursor: pointer;">▼ 移动相关属性</summary>
                        <div class="grid grid-cols-3 mb-4">
                            <div class="form-group">
                                <label class="form-label">行走速度 (WalkSpeed)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="WalkSpeed" value="${mshook.WalkSpeed || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">行走加速度 (WalkAcc)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="WalkAcc" value="${mshook.WalkAcc || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">奔跑速度 (RunSpeed)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="RunSpeed" value="${mshook.RunSpeed || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">奔跑加速度 (RunAcc)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="RunAcc" value="${mshook.RunAcc || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">转身速度 (TurnSpeed)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="TurnSpeed" value="${mshook.TurnSpeed || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准转身速度 (AimTurnSpeed)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="AimTurnSpeed" value="${mshook.AimTurnSpeed || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">冲刺速度 (DashSpeed)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="DashSpeed" value="${mshook.DashSpeed || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">冲刺时是否可以控制 (DashCanControl)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="DashCanControl" value="${mshook.DashCanControl || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">移动能力值 (Moveability)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="Moveability" value="${mshook.Moveability || 0}">
                            </div>
                        </div>
                    </details>

                    <!-- 耐力相关属性 -->
                    <details open>
                        <summary style="font-weight: 600; margin-bottom: 12px; cursor: pointer;">▼ 耐力相关属性</summary>
                        <div class="grid grid-cols-3 mb-4">
                            <div class="form-group">
                                <label class="form-label">最大耐力值 (Stamina)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="Stamina" value="${mshook.Stamina || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">耐力消耗率 (StaminaDrainRate)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="StaminaDrainRate" value="${mshook.StaminaDrainRate || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">耐力恢复率 (StaminaRecoverRate)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="StaminaRecoverRate" value="${mshook.StaminaRecoverRate || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">耐力恢复时间 (StaminaRecoverTime)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="StaminaRecoverTime" value="${mshook.StaminaRecoverTime || 0}">
                            </div>
                        </div>
                    </details>

                    <!-- 能量和资源相关属性 -->
                    <details open>
                        <summary style="font-weight: 600; margin-bottom: 12px; cursor: pointer;">▼ 能量和资源相关属性</summary>
                        <div class="grid grid-cols-3 mb-4">
                            <div class="form-group">
                                <label class="form-label">最大能量值 (MaxEnergy)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="MaxEnergy" value="${mshook.MaxEnergy || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">当前能量值 (CurrentEnergy)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="CurrentEnergy" value="${mshook.CurrentEnergy || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">每分钟能量消耗 (EnergyCost)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="EnergyCost" value="${mshook.EnergyCost || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">最大水分值 (MaxWater)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="MaxWater" value="${mshook.MaxWater || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">当前水分值 (CurrentWater)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="CurrentWater" value="${mshook.CurrentWater || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">每分钟水分消耗 (WaterCost)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="WaterCost" value="${mshook.WaterCost || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">食物增益 (FoodGain)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="FoodGain" value="${mshook.FoodGain || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">治疗增益 (HealGain)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="HealGain" value="${mshook.HealGain || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">水分能量恢复乘数 (WaterEnergyRecoverMultiplier)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="WaterEnergyRecoverMultiplier" value="${mshook.WaterEnergyRecoverMultiplier || 0}">
                            </div>
                        </div>
                    </details>

                    <!-- 生命值和护甲属性 -->
                    <details open>
                        <summary style="font-weight: 600; margin-bottom: 12px; cursor: pointer;">▼ 生命值和护甲属性</summary>
                        <div class="grid grid-cols-3 mb-4">
                            <div class="form-group">
                                <label class="form-label">最大生命值 (MaxHealth)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="MaxHealth" value="${mshook.MaxHealth || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">身体护甲 (BodyArmor)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="BodyArmor" value="${mshook.BodyArmor || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">头部护甲 (HeadArmor)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="HeadArmor" value="${mshook.HeadArmor || 0}">
                            </div>
                        </div>
                    </details>

                    <!-- 元素抵抗属性 -->
                    <details open>
                        <summary style="font-weight: 600; margin-bottom: 12px; cursor: pointer;">▼ 元素抵抗属性</summary>
                        <div class="grid grid-cols-3 mb-4">
                            <div class="form-group">
                                <label class="form-label">物理元素抵抗 (ElementFactor_Physics)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="ElementFactor_Physics" value="${mshook.ElementFactor_Physics || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">火焰元素抵抗 (ElementFactor_Fire)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="ElementFactor_Fire" value="${mshook.ElementFactor_Fire || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">毒素元素抵抗 (ElementFactor_Poison)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="ElementFactor_Poison" value="${mshook.ElementFactor_Poison || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">电击元素抵抗 (ElementFactor_Electricity)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="ElementFactor_Electricity" value="${mshook.ElementFactor_Electricity || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">空间元素抵抗 (ElementFactor_Space)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="ElementFactor_Space" value="${mshook.ElementFactor_Space || 0}">
                            </div>
                        </div>
                    </details>

                    <!-- 战斗相关属性 -->
                    <details open>
                        <summary style="font-weight: 600; margin-bottom: 12px; cursor: pointer;">▼ 战斗相关属性</summary>
                        <div class="grid grid-cols-3 mb-4">
                            <div class="form-group">
                                <label class="form-label">近战伤害乘数 (MeleeDamageMultiplier)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="MeleeDamageMultiplier" value="${mshook.MeleeDamageMultiplier || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">近战暴击率增益 (MeleeCritRateGain)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="MeleeCritRateGain" value="${mshook.MeleeCritRateGain || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">近战暴击伤害增益 (MeleeCritDamageGain)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="MeleeCritDamageGain" value="${mshook.MeleeCritDamageGain || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">枪械伤害乘数 (GunDamageMultiplier)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="GunDamageMultiplier" value="${mshook.GunDamageMultiplier || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">装填速度增益 (ReloadSpeedGain)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="ReloadSpeedGain" value="${mshook.ReloadSpeedGain || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">枪械暴击率增益 (GunCritRateGain)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="GunCritRateGain" value="${mshook.GunCritRateGain || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">枪械暴击伤害增益 (GunCritDamageGain)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="GunCritDamageGain" value="${mshook.GunCritDamageGain || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹速度乘数 (BulletSpeedMultiplier)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="BulletSpeedMultiplier" value="${mshook.BulletSpeedMultiplier || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力控制 (RecoilControl)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="RecoilControl" value="${mshook.RecoilControl || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">枪械散射乘数 (GunScatterMultiplier)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="GunScatterMultiplier" value="${mshook.GunScatterMultiplier || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">枪械射程乘数 (GunDistanceMultiplier)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="GunDistanceMultiplier" value="${mshook.GunDistanceMultiplier || 0}">
                            </div>
                        </div>
                    </details>

                    <!-- 感知相关属性 -->
                    <details open>
                        <summary style="font-weight: 600; margin-bottom: 12px; cursor: pointer;">▼ 感知相关属性</summary>
                        <div class="grid grid-cols-3 mb-4">
                            <div class="form-group">
                                <label class="form-label">夜视能力 (NightVisionAbility)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="NightVisionAbility" value="${mshook.NightVisionAbility || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">夜视类型 (NightVisionType)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="NightVisionType" value="${mshook.NightVisionType || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">听力能力 (HearingAbility)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="HearingAbility" value="${mshook.HearingAbility || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">声音可见性 (SoundVisable)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="SoundVisable" value="${mshook.SoundVisable || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">视野角度 (ViewAngle)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="ViewAngle" value="${mshook.ViewAngle || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">视野距离 (ViewDistance)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="ViewDistance" value="${mshook.ViewDistance || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">感知范围 (SenseRange)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="SenseRange" value="${mshook.SenseRange || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">可见距离因子 (VisableDistanceFactor)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="VisableDistanceFactor" value="${mshook.VisableDistanceFactor || 0}">
                            </div>
                        </div>
                    </details>

                    <!-- 物品和装备属性 -->
                    <details open>
                        <summary style="font-weight: 600; margin-bottom: 12px; cursor: pointer;">▼ 物品和装备属性</summary>
                        <div class="grid grid-cols-3 mb-4">
                            <div class="form-group">
                                <label class="form-label">最大重量 (MaxWeight)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="MaxWeight" value="${mshook.MaxWeight || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">背包容量 (InventoryCapacity)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="InventoryCapacity" value="${mshook.InventoryCapacity || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">宠物容量 (PetCapcity)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="PetCapcity" value="${mshook.PetCapcity || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">风暴保护 (StormProtection)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="StormProtection" value="${mshook.StormProtection || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">防毒面具 (GasMask) >0.1为true</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="GasMask" value="${mshook.GasMask || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">手电筒 (FlashLight) >0为true</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="FlashLight" value="${mshook.FlashLight || 0}">
                            </div>
                        </div>
                    </details>

                    <!-- 声音相关属性 -->
                    <details open>
                        <summary style="font-weight: 600; margin-bottom: 12px; cursor: pointer;">▼ 声音相关属性</summary>
                        <div class="grid grid-cols-3 mb-4">
                            <div class="form-group">
                                <label class="form-label">行走声音范围 (WalkSoundRange)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="WalkSoundRange" value="${mshook.WalkSoundRange || 0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">奔跑声音范围 (RunSoundRange)</label>
                                <input type="number" step="0.1" class="form-input mshook-field" data-key="RunSoundRange" value="${mshook.RunSoundRange || 0}">
                            </div>
                        </div>
                    </details>

                    <small class="text-secondary mt-3" style="display: block;">这些属性将影响装备物品时的角色属性。值为0表示不改变该属性。</small>
                </div>
            </div>
        `;
    }

    /**
     * 绑定表单事件
     */
    bindFormEvents() {
        // 表单输入监听（标记未保存）
        const inputs = document.querySelectorAll('#editor-content input, #editor-content select, #editor-content textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
            });
            input.addEventListener('input', () => {
                this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
            });
        });

        // 初始化标签管理功能
        this.initTagManager();

        // 初始化富文本工具
        this.initRichTextTools();

        // 初始化武器属性提示
        this.initWeaponFieldTooltips();

        // 初始化属性搜索功能
        this.initFieldsSearch();

        // Buff配置按钮
        const btnAddBuffConfig = document.getElementById('btn-add-buff-config');
        if (btnAddBuffConfig) {
            btnAddBuffConfig.addEventListener('click', () => this.addBuffConfig());
        }

        // 合成配方按钮
        const btnAddRecipe = document.getElementById('btn-add-recipe');
        if (btnAddRecipe) {
            btnAddRecipe.addEventListener('click', () => this.addRecipe());
        }

        // 分解配方按钮
        const btnAddDecomposeResult = document.getElementById('btn-add-decompose-result');
        if (btnAddDecomposeResult) {
            btnAddDecomposeResult.addEventListener('click', () => this.addDecomposeResult());
        }

        // 抽奖配置按钮
        const btnAddGachaConfig = document.getElementById('btn-add-gacha-config');
        if (btnAddGachaConfig) {
            btnAddGachaConfig.addEventListener('click', () => this.addGachaConfig());
        }

        // 图标文件选择器
        this.initIconFileSelector();
    }

    /**
     * 初始化标签管理器
     */
    initTagManager() {
        const tagInput = document.getElementById('tagInput');
        const tagDropdownBtn = document.getElementById('tagDropdownBtn');
        const tagDropdown = document.getElementById('tagDropdown');
        const tagSearchInput = document.getElementById('tagSearchInput');
        const tagDropdownContent = document.getElementById('tagDropdownContent');
        const addTagBtn = document.getElementById('addTagBtn');
        const tagsContainer = document.getElementById('tagsContainer');

        if (!tagInput || !tagDropdownBtn || !tagDropdown) return;

        // 渲染标签下拉菜单
        const renderTagDropdown = (searchTerm = '') => {
            if (!tagDropdownContent) return;
            tagDropdownContent.innerHTML = '';
            
            TAG_DATA_GROUPED.forEach(category => {
                const matchingTags = category.tags.filter(tag => 
                    tag.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                if (matchingTags.length === 0 && searchTerm !== '') {
                    return;
                }
                
                // 添加类别标题
                const categoryHeader = document.createElement('div');
                categoryHeader.style.cssText = 'padding: 8px 12px; font-weight: 600; color: var(--text-secondary, #666); background: var(--bg-secondary, #f5f5f5); border-bottom: 1px solid var(--border-color, #ddd);';
                categoryHeader.textContent = category.category;
                tagDropdownContent.appendChild(categoryHeader);
                
                // 添加标签项
                matchingTags.forEach(tag => {
                    if (searchTerm !== '' && 
                        !tag.id.toLowerCase().includes(searchTerm.toLowerCase()) && 
                        !tag.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return;
                    }
                    
                    const tagItem = document.createElement('div');
                    const isSelected = this.isTagSelected(tag.id);
                    tagItem.style.cssText = `padding: 8px 12px; cursor: pointer; ${isSelected ? 'background: var(--primary-light, #e3f2fd); color: var(--primary, #2196f3);' : ''}`;
                    tagItem.innerHTML = `
                        <span>${tag.id}</span>
                        <span style="color: var(--text-secondary, #999); margin-left: 8px;">(${tag.name})</span>
                    `;
                    
                    tagItem.addEventListener('click', () => {
                        this.toggleTag(tag.id);
                        renderTagDropdown(tagSearchInput.value);
                    });
                    
                    tagItem.addEventListener('mouseenter', () => {
                        if (!isSelected) {
                            tagItem.style.background = 'var(--bg-hover, #f5f5f5)';
                        }
                    });
                    
                    tagItem.addEventListener('mouseleave', () => {
                        if (!isSelected) {
                            tagItem.style.background = '';
                        }
                    });
                    
                    tagDropdownContent.appendChild(tagItem);
                });
            });
        };

        // 下拉菜单按钮点击事件
        tagDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tagDropdown.classList.toggle('hidden');
            if (!tagDropdown.classList.contains('hidden')) {
                // 先渲染下拉菜单内容，以便计算尺寸
                renderTagDropdown();
                
                // 计算下拉菜单位置（使用fixed定位，相对于视窗）
                const rect = tagDropdownBtn.getBoundingClientRect();
                
                // 设置下拉菜单位置（fixed定位不需要滚动偏移）
                tagDropdown.style.left = `${rect.left}px`;
                tagDropdown.style.top = `${rect.bottom + 4}px`;
                
                // 确保下拉菜单不会超出视窗
                const dropdownRect = tagDropdown.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;
                
                // 如果下拉菜单超出视窗底部，则显示在按钮上方
                if (dropdownRect.bottom > viewportHeight) {
                    tagDropdown.style.top = `${rect.top - dropdownRect.height - 4}px`;
                }
                
                // 如果下拉菜单超出视窗右侧，则调整位置
                if (dropdownRect.right > viewportWidth) {
                    tagDropdown.style.left = `${viewportWidth - dropdownRect.width - 10}px`;
                }
                
                // 如果下拉菜单超出视窗左侧，则调整位置
                if (dropdownRect.left < 0) {
                    tagDropdown.style.left = '10px';
                }
                
                tagSearchInput.focus();
            }
        });

        // 搜索输入事件
        tagSearchInput.addEventListener('input', (e) => {
            renderTagDropdown(e.target.value);
        });

        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!tagDropdown.contains(e.target) && !tagDropdownBtn.contains(e.target)) {
                tagDropdown.classList.add('hidden');
            }
        });

        // 标签输入框回车事件
        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTagFromInput();
            }
        });

        // 添加标签按钮
        addTagBtn.addEventListener('click', () => {
            this.addTagFromInput();
        });

        // 初始化下拉菜单
        renderTagDropdown();
    }

    /**
     * 检查标签是否已选中
     */
    isTagSelected(tagId) {
        const tagsContainer = document.getElementById('tagsContainer');
        if (!tagsContainer) return false;
        return Array.from(tagsContainer.querySelectorAll('.tag[data-tag-id]'))
            .some(tag => tag.getAttribute('data-tag-id') === tagId);
    }

    /**
     * 切换标签选中状态
     */
    toggleTag(tagId) {
        const tagsContainer = document.getElementById('tagsContainer');
        if (!tagsContainer) return;

        const existingTag = tagsContainer.querySelector(`.tag[data-tag-id="${tagId}"]`);
        
        if (existingTag) {
            // 移除标签
            existingTag.remove();
        } else {
            // 添加标签
            this.addTagToContainer(tagId);
        }

        this.updateTagSelection();
        this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
    }

    /**
     * 从输入框添加标签
     */
    addTagFromInput() {
        const tagInput = document.getElementById('tagInput');
        if (!tagInput) return;

        const tagText = tagInput.value.trim();
        if (!tagText) return;

        // 查找匹配的标签ID
        let tagId = tagText;
        let foundTag = null;

        // 在分组数据中查找
        for (const category of TAG_DATA_GROUPED) {
            for (const tag of category.tags) {
                if (tag.id.toLowerCase() === tagText.toLowerCase() || 
                    tag.name.toLowerCase() === tagText.toLowerCase()) {
                    foundTag = tag;
                    break;
                }
            }
            if (foundTag) break;
        }

        // 在扁平数组中查找
        if (!foundTag) {
            const flatTag = TAG_DATA.find(([key, value]) => 
                key.toLowerCase() === tagText.toLowerCase() || 
                value.toLowerCase() === tagText.toLowerCase()
            );
            if (flatTag) {
                tagId = flatTag[0];
            }
        } else {
            tagId = foundTag.id;
        }

        // 如果标签不存在，直接使用输入的文本
        if (!this.isTagSelected(tagId)) {
            this.addTagToContainer(tagId);
            this.updateTagSelection();
            this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
        }

        tagInput.value = '';
    }

    /**
     * 添加标签到容器
     */
    addTagToContainer(tagId) {
        const tagsContainer = document.getElementById('tagsContainer');
        if (!tagsContainer) return;

        // 查找标签的中文名称
        let tagName = tagId;
        for (const category of TAG_DATA_GROUPED) {
            const foundTag = category.tags.find(t => t.id === tagId);
            if (foundTag) {
                tagName = foundTag.name;
                break;
            }
        }
        if (tagName === tagId) {
            const flatTag = TAG_DATA.find(([key]) => key === tagId);
            if (flatTag) {
                tagName = flatTag[1];
            }
        }

        // 移除空状态提示
        const emptyHint = tagsContainer.querySelector('p');
        if (emptyHint) {
            emptyHint.remove();
        }

        const tagElement = document.createElement('span');
        tagElement.className = 'tag tag-primary';
        tagElement.setAttribute('data-tag-id', tagId);
        tagElement.setAttribute('title', tagId); // 鼠标悬停显示原始ID
        tagElement.innerHTML = `
            ${tagName}
            <button class="tag-remove" onclick="window.uiManager.removeTag('${tagId}')" style="margin-left: 4px; background: none; border: none; cursor: pointer; color: inherit;">
                <i class="fa fa-times"></i>
            </button>
        `;
        tagsContainer.appendChild(tagElement);
    }

    /**
     * 移除标签
     */
    removeTag(tagId) {
        const tagsContainer = document.getElementById('tagsContainer');
        if (!tagsContainer) return;

        const tagElement = tagsContainer.querySelector(`.tag[data-tag-id="${tagId}"]`);
        if (tagElement) {
            tagElement.remove();
            this.updateTagSelection();
            this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });

            // 如果没有标签了，显示提示
            if (tagsContainer.children.length === 0) {
                const emptyHint = document.createElement('p');
                emptyHint.style.cssText = 'color: var(--text-secondary, #999); font-size: 14px;';
                emptyHint.textContent = '暂无标签，请添加标签';
                tagsContainer.appendChild(emptyHint);
            }
        }
    }

    /**
     * 更新标签选择（用于collectFormData）
     */
    updateTagSelection() {
        // 这个方法会在collectFormData时被调用，不需要在这里实现
        // 但保留它以便从onclick中调用
    }

    /**
     * 初始化图标文件选择器
     */
    initIconFileSelector() {
        const iconFileNameInput = document.getElementById('IconFileName');
        if (!iconFileNameInput) return;

        // 检查是否已经有浏览按钮
        const existingBrowseBtn = iconFileNameInput.parentElement.querySelector('.icon-browse-btn');
        if (existingBrowseBtn) return;

        // 创建文件输入
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.id = 'iconFileInput';

        // 创建浏览按钮
        const browseBtn = document.createElement('button');
        browseBtn.type = 'button';
        browseBtn.className = 'btn btn-outline icon-browse-btn';
        browseBtn.innerHTML = '<i class="fa fa-folder-open"></i> 浏览';
        browseBtn.style.marginLeft = '8px';
        browseBtn.style.whiteSpace = 'nowrap';

        // 插入文件输入和按钮
        iconFileNameInput.parentElement.appendChild(fileInput);
        iconFileNameInput.parentElement.appendChild(browseBtn);

        // 事件处理
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const fileName = e.target.files[0].name;
                iconFileNameInput.value = fileName;
                this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
            }
        });
    }

    /**
     * 添加Buff配置项
     */
    addBuffConfig() {
        const container = document.getElementById('buffConfigsContainer');
        if (!container) return;

        // 移除空提示
        const emptyMsg = container.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        const index = container.children.length;
        const item = document.createElement('div');
        item.className = 'buff-config-item';
        item.dataset.index = index;
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-weight: 500;">Buff配置 #${index + 1}</span>
                <button type="button" class="btn btn-sm btn-outline" onclick="this.closest('.buff-config-item').remove()">
                    <i class="fa fa-trash"></i> 删除
                </button>
            </div>
            <div class="grid grid-cols-3">
                <div class="form-group">
                    <label class="form-label">原始Buff ID</label>
                    <div style="display: flex; gap: 4px;">
                        <input type="number" class="form-input buff-original-id" placeholder="输入ID">
                        <button type="button" class="btn btn-icon" onclick="window.uiManager.showBuffSelector(this.previousElementSibling)">
                            <i class="fa fa-search"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">新Buff ID</label>
                    <div style="display: flex; gap: 4px;">
                        <input type="number" class="form-input buff-new-id" placeholder="输入ID">
                        <button type="button" class="btn btn-icon" onclick="window.uiManager.showBuffSelector(this.previousElementSibling)">
                            <i class="fa fa-search"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">持续时间(秒)</label>
                    <input type="number" step="0.1" class="form-input buff-duration" value="900" placeholder="900.0">
                </div>
            </div>
        `;

        container.appendChild(item);
        this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
    }

    /**
     * 添加配方项
     */
    addRecipe() {
        const container = document.getElementById('recipesContainer');
        if (!container) return;

        // 移除空提示
        const emptyMsg = container.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        const index = container.children.length;
        const item = document.createElement('div');
        item.className = 'recipe-item';
        item.dataset.index = index;
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-weight: 500;">配方 #${index + 1}</span>
                <button type="button" class="btn btn-sm btn-outline" onclick="this.closest('.recipe-item').remove()">
                    <i class="fa fa-trash"></i> 删除配方
                </button>
            </div>
            <div class="grid grid-cols-3 mb-3">
                <div class="form-group">
                    <label class="form-label">配方ID</label>
                    <input type="text" class="form-input recipe-formula-id" placeholder="配方ID">
                </div>
                <div class="form-group">
                    <label class="form-label">合成费用</label>
                    <input type="number" class="form-input recipe-money" value="0">
                </div>
                <div class="form-group">
                    <label class="form-label">产出数量</label>
                    <input type="number" class="form-input recipe-result-amount" value="1">
                </div>
            </div>
            <div class="grid grid-cols-2 mb-3">
                <div class="form-group">
                    <label class="form-label">合成标签</label>
                    <input type="text" class="form-input recipe-tags" value="WorkBenchAdvanced" readonly style="background: var(--bg-secondary, #f5f5f5); cursor: not-allowed;">
                    <small style="color: var(--text-secondary, #999); font-size: 12px;">固定为高级工作台</small>
                </div>
                <div class="form-group">
                    <label class="form-label">需要技能</label>
                    <input type="text" class="form-input recipe-perk" placeholder="技能名称">
                </div>
            </div>
            <div class="form-group mb-3">
                <label class="form-label">材料清单</label>
                <div class="cost-items-container">
                    <p style="color: var(--text-secondary); text-align: center; padding: 10px;">暂无材料</p>
                </div>
                <button type="button" class="btn btn-sm btn-outline" onclick="window.uiManager.addCostItem(this.previousElementSibling)">
                    <i class="fa fa-plus"></i> 添加材料
                </button>
            </div>
            <div class="grid grid-cols-3">
                <div class="form-checkbox">
                    <input type="checkbox" class="recipe-unlock-default" checked>
                    <label>默认解锁</label>
                </div>
                <div class="form-checkbox">
                    <input type="checkbox" class="recipe-hide-index">
                    <label>列表隐藏</label>
                </div>
            </div>
        `;

        container.appendChild(item);
        this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
    }

    /**
     * 添加分解产出项
     */
    addDecomposeResult() {
        const container = document.getElementById('decomposeResultsContainer');
        if (!container) return;

        // 移除空提示
        const emptyMsg = container.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        const row = document.createElement('div');
        row.className = 'decompose-result-row';
        row.innerHTML = `
            <div class="form-group" style="flex: 1;">
                <div style="display: flex; gap: 4px;">
                    <input type="number" class="form-input decompose-item-id" placeholder="物品ID">
                    <button type="button" class="btn btn-icon" onclick="window.searchManager.showSearchModal(this.previousElementSibling)" title="搜索物品">
                        <i class="fa fa-search"></i>
                    </button>
                </div>
            </div>
            <div class="form-group" style="width: 100px;">
                <input type="number" class="form-input decompose-item-amount" value="1" placeholder="数量">
            </div>
            <button type="button" class="btn btn-icon" onclick="this.closest('.decompose-result-row').remove()">
                <i class="fa fa-minus"></i>
            </button>
        `;

        container.appendChild(row);
        this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
    }

    /**
     * 添加抽奖配置
     */
    addGachaConfig() {
        const container = document.getElementById('gachaConfigsContainer');
        if (!container) return;

        // 移除空提示
        const emptyMsg = container.querySelector('p');
        if (emptyMsg) emptyMsg.remove();

        const index = container.children.length;
        const item = document.createElement('div');
        item.className = 'gacha-config-item';
        item.dataset.index = index;
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-weight: 500;">抽奖配置 #${index + 1}</span>
                <button type="button" class="btn btn-sm btn-outline" onclick="this.closest('.gacha-config-item').remove()">
                    <i class="fa fa-trash"></i> 删除
                </button>
            </div>
            <div class="grid grid-cols-2 mb-3">
                <div class="form-group">
                    <label class="form-label">配置名称</label>
                    <input type="text" class="form-input gacha-name" placeholder="抽奖配置名称">
                </div>
                <div class="form-group">
                    <label class="form-label">通知键名</label>
                    <input type="text" class="form-input gacha-notification-key" placeholder="通知键名">
                </div>
            </div>
            <div class="form-group mb-3">
                <label class="form-label">描述</label>
                <textarea class="form-input gacha-description" rows="2" placeholder="抽奖配置描述"></textarea>
            </div>
            <div class="form-group mb-3">
                <label class="form-label">抽奖条目</label>
                <div class="gacha-entries-container">
                    <p style="color: var(--text-secondary); text-align: center; padding: 10px;">暂无条目</p>
                </div>
                <button type="button" class="btn btn-sm btn-outline" onclick="window.uiManager.addGachaEntry(this.previousElementSibling)">
                    <i class="fa fa-plus"></i> 添加条目
                </button>
            </div>
            <div class="form-group mb-3">
                <label class="form-label">概率分布</label>
                <div class="probability-container">
                    <p style="color: var(--text-secondary); text-align: center; padding: 10px;">暂无数据</p>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button type="button" class="btn btn-sm btn-primary" onclick="window.uiManager.simulateGacha(${index})">
                    <i class="fa fa-dice"></i> 模拟抽奖
                </button>
                <button type="button" class="btn btn-sm btn-outline" onclick="window.uiManager.updateProbabilities(${index})">
                    <i class="fa fa-refresh"></i> 更新概率
                </button>
            </div>
        `;

        container.appendChild(item);
        this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
    }

    /**
     * 收集表单数据
     */
    collectFormData() {
        const state = this.store.getState();
        if (!state.currentConfig) return null;

        const config = deepClone(state.currentConfig);
        
        // 基本信息
        config.fileName = document.getElementById('fileName').value;
        config.type = document.getElementById('configType').value;

        // 基础字段 - 只保留mod支持的字段
        const basicFields = [
            'OriginalItemId', 'NewItemId', 'DisplayName', 'LocalizationKey',
            'Weight', 'Value', 'Quality', 'LocalizationDescValue',
            'IconFileName'
        ];

        basicFields.forEach(field => {
            const el = document.getElementById(field);
            if (el) {
                const value = el.type === 'number' ? parseFloat(el.value) || 0 : el.value.trim();
                // 只保存非空值（但保留LocalizationDescValue，因为它可能包含富文本）
                if (field === 'LocalizationDescValue' || field === 'DisplayName') {
                    // 显示名称和描述值总是保存（可能包含富文本标签）
                config.content[field] = value;
                } else if (value !== '' && value !== 0) {
                    config.content[field] = value;
                } else if (field === 'IconFileName') {
                    // 这些字段如果为空则删除
                    delete config.content[field];
                } else {
                    delete config.content[field];
                }
            }
        });

        // 修复BuffDuration字段：确保为正确的对象格式
        // 根据用户分析报告，正确的格式应该是：
        // "BuffDuration": {
        //   "Duration": 300.0,
        //   "ReplaceOriginalBuff": false,
        //   "ReplacementBuffId": -1
        // }
        
        // 首先检查表单中是否有BuffDuration元素
        const buffDurationElement = document.getElementById('BuffDuration');
        if (buffDurationElement) {
            const duration = parseFloat(buffDurationElement.value) || 0;
            config.content.BuffDuration = {
                "Duration": duration,
                "ReplaceOriginalBuff": false,
                "ReplacementBuffId": -1
            };
        } else {
            // 如果表单中没有BuffDuration元素，确保现有值是正确的对象格式
            if (!config.content.BuffDuration || typeof config.content.BuffDuration !== 'object') {
                const existingValue = config.content.BuffDuration || 0;
                config.content.BuffDuration = {
                    "Duration": parseFloat(existingValue) || 0,
                    "ReplaceOriginalBuff": false,
                    "ReplacementBuffId": -1
                };
            } else {
                // 如果已经是对象，确保格式正确
                const existingDuration = config.content.BuffDuration;
                config.content.BuffDuration = {
                    "Duration": existingDuration.Duration || existingDuration.DefaultDuration || 0,
                    "ReplaceOriginalBuff": existingDuration.ReplaceOriginalBuff || false,
                    "ReplacementBuffId": existingDuration.ReplacementBuffId || -1
                };
            }
        }

        // 布尔字段
        const boolFields = ['Stackable', 'CanBeSold', 'CanDrop', 'UnlockByDefault', 'HideInIndex', 'LockInDemo'];
        boolFields.forEach(field => {
            const el = document.getElementById(field);
            if (el) config.content[field] = el.checked;
        });

        // 标签 - 从新的标签容器中收集
        const tagsContainer = document.getElementById('tagsContainer');
        const selectedTags = [];
        if (tagsContainer) {
            const tagElements = tagsContainer.querySelectorAll('.tag[data-tag-id]');
            tagElements.forEach(tag => {
                const tagId = tag.getAttribute('data-tag-id');
                if (tagId) {
                    selectedTags.push(tagId);
                }
            });
        }
        config.content.Tags = selectedTags;

        // 添加缺失的基础字段
        this.collectMissingBasicFields(config);

        // Buff配置
        const buffConfigs = [];
        document.querySelectorAll('.buff-config-item').forEach(item => {
            const originalId = item.querySelector('.buff-original-id')?.value;
            const newId = item.querySelector('.buff-new-id')?.value;
            const duration = item.querySelector('.buff-duration')?.value;
            
            if (originalId && newId) {
                buffConfigs.push({
                    originalBuffId: String(originalId),
                    newBuffId: String(newId),
                    newDuration: parseFloat(duration) || 900
                });
            }
        });
        if (buffConfigs.length > 0) {
            config.content.BuffCopyConfigs = buffConfigs;
        }

        // 合成配方
        const recipes = [];
        document.querySelectorAll('.recipe-item').forEach(item => {
            const formulaId = item.querySelector('.recipe-formula-id')?.value;
            const money = item.querySelector('.recipe-money')?.value;
            const resultAmount = item.querySelector('.recipe-result-amount')?.value;
            // 合成标签固定为高级工作台
            const perk = item.querySelector('.recipe-perk')?.value;
            const unlockDefault = item.querySelector('.recipe-unlock-default')?.checked;
            const hideIndex = item.querySelector('.recipe-hide-index')?.checked;

            // 收集材料
            const costItems = [];
            item.querySelectorAll('.cost-item-row').forEach(row => {
                const itemId = row.querySelector('.cost-item-id')?.value;
                const amount = row.querySelector('.cost-item-amount')?.value;
                if (itemId) {
                    costItems.push({
                        ItemId: parseInt(itemId),
                        Amount: parseInt(amount) || 1
                    });
                }
            });

            if (formulaId || costItems.length > 0) {
                recipes.push({
                    FormulaId: formulaId || '',
                    CraftingMoney: parseInt(money) || 0,
                    ResultItemAmount: parseInt(resultAmount) || 1,
                    CraftingTags: ['WorkBenchAdvanced'], // 固定为高级工作台
                    RequirePerk: perk || '',
                    UnlockByDefault: unlockDefault,
                    HideInIndex: hideIndex,
                    CostItems: costItems
                });
            }
        });
        if (recipes.length > 0) {
            config.content.AdditionalRecipes = recipes;
        }

        // 分解配方
        const enableDecompose = document.getElementById('EnableDecompose')?.checked;
        const decomposeFormulaId = document.getElementById('DecomposeFormulaId')?.value;
        const decomposeTime = document.getElementById('DecomposeTime')?.value;
        const decomposeMoney = document.getElementById('DecomposeMoney')?.value;

        config.content.EnableDecompose = enableDecompose || false;
        
        // 修复DecomposeFormulaId：确保为数值类型或移除空值
        if (decomposeFormulaId && decomposeFormulaId.trim() !== '') {
            config.content.DecomposeFormulaId = parseInt(decomposeFormulaId) || 0;
        } else {
            delete config.content.DecomposeFormulaId;
        }
        
        config.content.DecomposeTime = parseFloat(decomposeTime) || 0;
        config.content.DecomposeMoney = parseInt(decomposeMoney) || 0;

        const decomposeResults = [];
        document.querySelectorAll('.decompose-result-row').forEach(row => {
            const itemId = row.querySelector('.decompose-item-id')?.value;
            const amount = row.querySelector('.decompose-item-amount')?.value;
            if (itemId) {
                decomposeResults.push({
                    ItemId: parseInt(itemId),
                    Amount: parseInt(amount) || 1
                });
            }
        });
        if (decomposeResults.length > 0) {
            config.content.DecomposeResults = decomposeResults;
        }

        // 抽奖配置 - 修复为单个Gacha对象格式
        const gachaEntries = [];
        let gachaDescription = '';
        let gachaNotificationKey = 'Default';
        
        document.querySelectorAll('.gacha-config-item').forEach(item => {
            // 收集描述和通知键（只取第一个配置的）
            if (!gachaDescription) {
                gachaDescription = item.querySelector('.gacha-description')?.value || '';
            }
            if (!gachaNotificationKey || gachaNotificationKey === 'Default') {
                gachaNotificationKey = item.querySelector('.gacha-notification-key')?.value || 'Default';
            }
            
            // 收集抽奖条目
            item.querySelectorAll('.gacha-entry-row').forEach(row => {
                const itemId = row.querySelector('.gacha-item-id')?.value;
                const weight = parseFloat(row.querySelector('.gacha-weight').value) || 0;
                if (itemId && weight > 0) {
                    gachaEntries.push({
                        ItemId: parseInt(itemId),
                        Weight: weight
                    });
                }
            });
        });

        // 清理重复的抽奖配置字段，只保留正确的Gacha格式
        delete config.content.GachaConfigs;
        delete config.content.ItemProperties;
        
        if (gachaEntries.length > 0) {
            // 根据C#代码，Gacha应该是单个对象，包含Description、NotificationKey和Entries
            config.content.Gacha = {
                Description: gachaDescription,
                NotificationKey: gachaNotificationKey,
                Entries: gachaEntries
            };
        } else {
            // 如果没有抽奖配置，确保删除Gacha字段
            delete config.content.Gacha;
        }

        // 特定属性 - 根据类型收集不同的属性
        switch (config.type) {
            case 'weapon':
                const weaponFields = document.querySelectorAll('.weapon-field');
                const weaponProps = {};
                weaponFields.forEach(field => {
                    const key = field.dataset.key;
                    const value = parseFloat(field.value) || 0;
                    if (value !== 0 && value !== 1.0) { // 只保存非默认值
                        weaponProps[key] = value;
                    }
                });
                
                // 收集Hash属性（只有勾选时才保存）
                const weaponHashFields = document.querySelectorAll('.weapon-hash-field');
                weaponHashFields.forEach(field => {
                    const key = field.dataset.key;
                    const checkbox = field.previousElementSibling;
                    if (checkbox && checkbox.classList.contains('weapon-hash-check') && checkbox.checked) {
                        const value = parseFloat(field.value);
                        if (value !== undefined && !isNaN(value) && field.value.trim() !== '') {
                            weaponProps[key] = value;
                        }
                    }
                });
                
                if (Object.keys(weaponProps).length > 0) {
                    config.content.WeaponProperties = weaponProps;
                }
                break;

            case 'ammo':
                const ammoFields = document.querySelectorAll('.ammo-field');
                const ammoProps = {};
                ammoFields.forEach(field => {
                    const key = field.dataset.key;
                    const value = parseFloat(field.value);
                    if (!isNaN(value) && (value !== 0 || key.includes('NewDamageMultiplier') || key.includes('NewBuffChanceMultiplier'))) {
                        // 对于倍率类型，只有非1.0才保存；对于增益类型，只有非0才保存
                        if (key.includes('Multiplier')) {
                            if (value !== 1.0) ammoProps[key] = value;
                        } else {
                            if (value !== 0) ammoProps[key] = value;
                        }
                    }
                });
                
                // 收集Hash属性（只有勾选时才保存）
                const ammoHashFields = document.querySelectorAll('.ammo-hash-field');
                ammoHashFields.forEach(field => {
                    const key = field.dataset.key;
                    const checkbox = field.previousElementSibling;
                    if (checkbox && checkbox.classList.contains('ammo-hash-check') && checkbox.checked) {
                        const value = parseFloat(field.value);
                        if (value !== undefined && !isNaN(value) && field.value.trim() !== '') {
                        ammoProps[key] = value;
                        }
                    }
                });
                
                if (Object.keys(ammoProps).length > 0) {
                    config.content.AmmoProperties = ammoProps;
                }
                break;

            case 'melee':
                const meleeFields = document.querySelectorAll('.melee-field');
                const meleeProps = {};
                meleeFields.forEach(field => {
                    const key = field.dataset.key;
                    const value = parseFloat(field.value) || 0;
                    if (value !== 0 && value !== 1.0) { // 只保存非默认值
                        meleeProps[key] = value;
                    }
                });
                if (Object.keys(meleeProps).length > 0) {
                    config.content.MeleeWeaponProperties = meleeProps;
                }
                break;

            case 'accessory':
                const accessoryFields = document.querySelectorAll('.accessory-field');
                const slotConfig = {};
                accessoryFields.forEach(field => {
                    const key = field.dataset.key;
                    if (field.type === 'checkbox') {
                        slotConfig[key] = field.checked;
                    } else if (field.type === 'number') {
                        const value = parseInt(field.value) || 0;
                        if (value !== 0) slotConfig[key] = value;
                    } else {
                        const value = field.value.trim();
                        if (value) {
                            // 处理逗号分隔的数组
                            if (key.includes('Tags') || key.includes('Names')) {
                                slotConfig[key] = value.split(',').map(v => v.trim()).filter(v => v);
                            } else {
                                slotConfig[key] = value;
                            }
                        }
                    }
                });
                if (Object.keys(slotConfig).length > 0) {
                    config.content.SlotConfiguration = slotConfig;
                }
                break;

            default:
                // 基础物品属性
                const itemFields = document.querySelectorAll('.item-field');
                const itemProps = {};
                itemFields.forEach(field => {
                    const key = field.dataset.key;
                    if (field.type === 'checkbox') {
                        if (field.checked) itemProps[key] = field.checked;
                    } else if (field.type === 'number') {
                        const value = parseFloat(field.value) || 0;
                        if (value !== 0) itemProps[key] = value;
                    } else {
                        const value = field.value.trim();
                        if (value) itemProps[key] = value;
                    }
                });
                if (Object.keys(itemProps).length > 0) {
                    config.content.ItemProperties = itemProps;
                }
        }

        // mshook修改器
        const mshookFields = document.querySelectorAll('.mshook-field');
        const mshook = {};
        mshookFields.forEach(field => {
            const key = field.dataset.key;
            const value = parseFloat(field.value) || 0;
            if (value !== 0) mshook[key] = value;
        });
        if (Object.keys(mshook).length > 0) {
            config.content.mshook = mshook;
        }

        return config;
    }

    // ===== 事件处理函数 =====

    handleThemeToggle() {
        const current = this.store.getState().theme;
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.store.dispatch({ type: 'SET_THEME', payload: newTheme });
        showNotification('主题', `已切换到${newTheme === 'light' ? '浅色' : '深色'}模式`, 'info');
    }

    handleFeedCat() {
        const modal = createModal({
            title: '💝 投喂猫猫',
            content: `
                <div style="text-align: center;">
                    <img src="shoukuan.png" alt="收款码" style="max-width: 100%; border-radius: 8px;">
                    <p style="margin-top: 16px; color: var(--text-secondary);">感谢您的支持！</p>
                </div>
            `,
            width: '400px'
        });
        modal.show();
        this.currentModal = modal;
    }

    async handleNewConfig() {
        const modal = createModal({
            title: '新建配置',
            content: `
                <div class="form-group mb-3">
                    <label class="form-label">配置类型</label>
                    <select class="form-select" id="newConfigType">
                        <option value="item">物品配置</option>
                        <option value="weapon">枪械配置</option>
                        <option value="melee">近战武器</option>
                        <option value="ammo">子弹配置</option>
                        <option value="accessory">配件配置</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">文件名</label>
                    <input type="text" class="form-input" id="newConfigName" placeholder="例如: my_custom_item">
                </div>
            `,
            buttons: [
                { text: '取消', className: 'btn btn-outline', onClick: () => modal.close() },
                {
                    text: '创建',
                    className: 'btn btn-primary',
                    onClick: async () => {
                        const type = document.getElementById('newConfigType').value;
                        const name = document.getElementById('newConfigName').value || `new_${type}_${Date.now()}`;
                        modal.close();
                        
                        try {
                            const config = await this.configService.createConfig(type, name);
                            await this.selectConfig(config.id);
                            showNotification('成功', '配置创建成功', 'success');
                        } catch (error) {
                            showNotification('错误', error.message, 'error');
                        }
                    }
                }
            ]
        });
        modal.show();
        this.currentModal = modal;
    }

    async handleSave() {
        const config = this.collectFormData();
        if (!config) return;

        const validation = this.configService.validateConfig(config);
        if (!validation.isValid) {
            showNotification('验证失败', validation.errors.join('\n'), 'error');
            return;
        }

        try {
            // 更新配置，包括文件名和类型
            const savedConfig = await this.configService.updateConfig(config.id, config.content, {
                fileName: config.fileName,
                type: config.type
            });
            
            // 更新编辑器标题和表单中的文件名显示
            const titleElement = document.getElementById('editor-title-text');
            if (titleElement) {
                titleElement.textContent = savedConfig.fileName;
            }
            
            // 更新表单中的文件名输入框（确保显示最新值）
            const fileNameInput = document.getElementById('fileName');
            if (fileNameInput) {
                fileNameInput.value = savedConfig.fileName;
            }
            
            // 更新表单中的配置类型下拉框
            const configTypeSelect = document.getElementById('configType');
            if (configTypeSelect) {
                configTypeSelect.value = savedConfig.type;
            }
            
            this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
            await this.loadConfigs();
            this.checkIdConflicts();
            showNotification('成功', '配置已保存', 'success');
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
    }

    async handleExport() {
        const state = this.store.getState();
        if (!state.currentConfig) return;

        try {
            // 先收集最新的表单数据，确保导出的是完整的最新配置
            const latestConfig = this.collectFormData();
            if (!latestConfig) {
                showNotification('错误', '无法收集配置数据', 'error');
                return;
            }
            
            await this.exportService.exportConfig(latestConfig);
            showNotification('成功', '配置已导出', 'success');
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
    }

    async handleCopyClipboard() {
        const state = this.store.getState();
        if (!state.currentConfig) return;

        try {
            // 先收集最新的表单数据，确保复制的是完整的最新配置
            const latestConfig = this.collectFormData();
            if (!latestConfig) {
                showNotification('错误', '无法收集配置数据', 'error');
                return;
            }
            
            await this.exportService.exportToClipboard(latestConfig);
            showNotification('成功', '已复制到剪贴板', 'success');
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
    }

    async handleDuplicate() {
        const state = this.store.getState();
        if (!state.currentConfig) return;

        try {
            const duplicate = await this.configService.duplicateConfig(state.currentConfig.id);
            await this.selectConfig(duplicate.id);
            showNotification('成功', '配置已复制', 'success');
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
    }

    async handleDelete() {
        const state = this.store.getState();
        if (!state.currentConfig) return;

        const confirmed = await showConfirm(`确定要删除配置"${state.currentConfig.fileName}"吗？此操作不可撤销。`);
        if (!confirmed) return;

        try {
            await this.configService.deleteConfig(state.currentConfig.id);
            document.getElementById('editor').style.display = 'none';
            document.getElementById('welcome-state').style.display = 'flex';
            await this.loadConfigs();
            this.checkIdConflicts();
            showNotification('成功', '配置已删除', 'success');
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
    }

    handleUndo() {
        if (this.undoRedoService.canUndo()) {
            this.undoRedoService.undo();
            showNotification('成功', '已撤销', 'success');
        } else {
            showNotification('提示', '没有可撤销的操作', 'info');
        }
    }

    handleRedo() {
        if (this.undoRedoService.canRedo()) {
            this.undoRedoService.redo();
            showNotification('成功', '已重做', 'success');
        } else {
            showNotification('提示', '没有可重做的操作', 'info');
        }
    }

    handleSearch(e) {
        this.store.dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
    }

    handleFilterChange(type) {
        this.store.dispatch({ type: 'SET_FILTER_TYPE', payload: type });
        
        // 更新UI
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });
    }

    async handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const config = await this.importService.importFromFile(file);
            if (Array.isArray(config)) {
                // 多个配置，显示详细结果
                const results = {
                    success: config,
                    failed: []
                };
                this.showImportResults(results);
            } else {
                // 单个配置，直接打开
                await this.selectConfig(config.id);
                showNotification('成功', '配置导入成功', 'success');
            }
            e.target.value = '';
        } catch (error) {
            // 导入失败，显示错误结果
            const results = {
                success: [],
                failed: [{
                    fileName: file.name,
                    error: error.message
                }]
            };
            this.showImportResults(results);
            e.target.value = '';
        }
    }

    async handleClipboardImport() {
        try {
            const config = await this.importService.importFromClipboard();
            if (Array.isArray(config)) {
                // 多个配置，显示详细结果
                const results = {
                    success: config,
                    failed: []
                };
                this.showImportResults(results);
            } else {
                // 单个配置，直接打开
                await this.selectConfig(config.id);
                showNotification('成功', '从剪贴板导入成功', 'success');
            }
        } catch (error) {
            // 导入失败，显示错误结果
            const results = {
                success: [],
                failed: [{
                    fileName: '剪贴板内容',
                    error: error.message
                }]
            };
            this.showImportResults(results);
        }
    }

    /**
     * 处理批量导入
     */
    handleBatchImport() {
        document.getElementById('batch-file-input').click();
    }

    /**
     * 处理批量文件导入
     */
    async handleBatchFileImport(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            const results = {
                success: [],
                failed: []
            };

            for (const file of files) {
                try {
                    const config = await this.importService.importFromFile(file);
                    if (Array.isArray(config)) {
                        results.success.push(...config);
                    } else {
                        results.success.push(config);
                    }
                } catch (error) {
                    results.failed.push({
                        fileName: file.name,
                        error: error.message
                    });
                }
            }

            // 显示详细的导入结果
            this.showImportResults(results);

            // 刷新列表
            await this.loadConfigs();
            this.checkIdConflicts();

            e.target.value = '';
        } catch (error) {
            showNotification('错误', error.message, 'error');
            e.target.value = '';
        }
    }

    /**
     * 处理批量导出
     */
    async handleBatchExport() {
        const state = this.store.getState();
        const configs = state.configs || [];
        
        if (configs.length === 0) {
            showNotification('提示', '没有可导出的配置', 'info');
            return;
        }

        // 显示批量导出对话框
        const modal = createModal({
            title: '批量导出配置',
            content: `
                <div style="margin-bottom: 16px;">
                    <p>当前共有 <strong>${configs.length}</strong> 个配置</p>
                    <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
                        选择导出格式：
                    </p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                    <button class="btn btn-primary" id="batch-export-json" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px;">
                        <i class="fa fa-file-text-o" style="font-size: 24px;"></i>
                        <div>
                            <div style="font-weight: 600;">JSON格式</div>
                            <div style="font-size: 12px; opacity: 0.8;">合并为一个文件</div>
                        </div>
                    </button>
                    <button class="btn btn-outline" id="batch-export-zip" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px;">
                        <i class="fa fa-file-archive-o" style="font-size: 24px;"></i>
                        <div>
                            <div style="font-weight: 600;">ZIP格式</div>
                            <div style="font-size: 12px; opacity: 0.8;">每个配置单独文件</div>
                        </div>
                    </button>
                </div>
            `,
            buttons: [
                { text: '取消', class: 'btn-outline', action: (modal) => modal.remove() }
            ]
        });

        modal.show();

        // 绑定导出按钮
        setTimeout(() => {
            const jsonBtn = document.getElementById('batch-export-json');
            const zipBtn = document.getElementById('batch-export-zip');
            
            if (jsonBtn) {
                jsonBtn.addEventListener('click', async () => {
                    try {
                        const configIds = configs.map(c => c.id);
                        const result = await this.batchService.batchExport(configIds, 'json');
                        
                        // 下载文件
                        this.downloadFile(result.content, result.filename, result.mimeType);

                        showNotification('成功', `已导出 ${configs.length} 个配置`, 'success');
                        modal.close();
                    } catch (error) {
                        showNotification('错误', error.message, 'error');
                    }
                });
            }

            if (zipBtn) {
                zipBtn.addEventListener('click', async () => {
                    try {
                        // 检查JSZip是否加载
                        if (typeof JSZip === 'undefined') {
                            showNotification('错误', 'JSZip库未加载，请刷新页面后重试', 'error');
                            return;
                        }

                        const configIds = configs.map(c => c.id);
                        const result = await this.batchService.batchExport(configIds, 'zip');
                        
                        // 下载文件
                        this.downloadFile(result.content, result.filename, result.mimeType);

                        showNotification('成功', `已导出 ${configs.length} 个配置为ZIP文件（每个配置单独文件）`, 'success');
                        modal.close();
                    } catch (error) {
                        console.error('ZIP导出错误:', error);
                        showNotification('错误', error.message || 'ZIP导出失败，请检查JSZip库是否加载', 'error');
                    }
                });
            }
        }, 100);
    }

    /**
     * 检查ID冲突
     */
    checkIdConflicts() {
        const state = this.store.getState();
        const configs = state.configs || [];
        
        // 收集所有NewItemId
        const idMap = new Map(); // NewItemId -> [configId1, configId2, ...]
        
        configs.forEach(config => {
            const newItemId = config.content?.NewItemId;
            if (newItemId !== undefined && newItemId !== null && newItemId !== 0) {
                if (!idMap.has(newItemId)) {
                    idMap.set(newItemId, []);
                }
                idMap.get(newItemId).push(config.id);
            }
        });

        // 找出冲突的ID
        const conflicts = [];
        idMap.forEach((configIds, newItemId) => {
            if (configIds.length > 1) {
                conflicts.push({
                    newItemId: newItemId,
                    configIds: configIds,
                    configs: configIds.map(id => {
                        const config = configs.find(c => c.id === id);
                        return {
                            id: id,
                            fileName: config?.fileName || '未知',
                            type: config?.type || '未知'
                        };
                    })
                });
            }
        });

        // 更新UI显示冲突
        this.renderIdConflicts(conflicts);
        
        return conflicts;
    }

    /**
     * 渲染ID冲突提示
     */
    renderIdConflicts(conflicts) {
        // 移除旧的冲突提示
        const oldConflict = document.getElementById('id-conflict-warning');
        if (oldConflict) {
            oldConflict.remove();
        }

        if (conflicts.length === 0) {
            return;
        }

        // 在配置列表上方显示冲突警告
        const configList = document.getElementById('config-list');
        if (!configList) return;

        const conflictHtml = `
            <div id="id-conflict-warning" class="conflict-warning" style="
                background: var(--bg-warning, #fff3cd);
                border: 1px solid var(--border-warning, #ffc107);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                cursor: pointer;
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fa fa-exclamation-triangle" style="color: var(--color-warning, #ff9800);"></i>
                    <strong style="color: var(--text-primary);">发现 ${conflicts.length} 个ID冲突</strong>
                    <span style="margin-left: auto; color: var(--text-secondary); font-size: 12px;">
                        点击查看详情
                    </span>
                </div>
            </div>
        `;

        configList.insertAdjacentHTML('beforebegin', conflictHtml);

        // 绑定点击事件显示详情
        document.getElementById('id-conflict-warning').addEventListener('click', () => {
            this.showIdConflictDetails(conflicts);
        });

        // 高亮冲突的配置项
        const state = this.store.getState();
        conflicts.forEach(conflict => {
            conflict.configIds.forEach(configId => {
                const configItem = document.querySelector(`.config-item[data-config-id="${configId}"]`);
                if (configItem) {
                    configItem.style.borderLeft = '4px solid var(--color-warning, #ff9800)';
                    configItem.style.background = 'var(--bg-warning-light, rgba(255, 193, 7, 0.1))';
                }
            });
        });
    }

    /**
     * 显示ID冲突详情
     */
    showIdConflictDetails(conflicts) {
        const state = this.store.getState();
        const configs = state.configs || [];

        const detailsHtml = conflicts.map(conflict => `
            <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-secondary, #f5f5f5); border-radius: 8px;">
                <div style="font-weight: 600; color: var(--color-warning, #ff9800); margin-bottom: 8px;">
                    <i class="fa fa-exclamation-circle"></i> NewItemId: ${conflict.newItemId}
                </div>
                <div style="margin-left: 20px;">
                    ${conflict.configs.map(c => `
                        <div style="padding: 4px 0; color: var(--text-primary);">
                            • ${c.fileName} (${c.type})
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        const modal = createModal({
            title: 'ID冲突详情',
            content: `
                <div style="max-height: 400px; overflow-y: auto;">
                    ${detailsHtml}
                </div>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <small style="color: var(--text-secondary);">
                        提示：请修改冲突的配置项，确保每个配置的NewItemId都是唯一的。
                    </small>
                </div>
            `,
            buttons: [
                { text: '关闭', class: 'btn-primary', action: (modal) => modal.remove() }
            ]
        });

        modal.show();
    }

    /**
     * 渲染Buff配置
     */
    renderBuffConfigs(config) {
        const buffConfigs = config.content.BuffCopyConfigs || [];
        
        const buffConfigsHtml = buffConfigs.map((buff, index) => `
            <div class="buff-config-item" data-index="${index}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: 500;">Buff配置 #${index + 1}</span>
                    <button type="button" class="btn btn-sm btn-outline" onclick="this.closest('.buff-config-item').remove()">
                        <i class="fa fa-trash"></i> 删除
                    </button>
                </div>
                <div class="grid grid-cols-3">
                    <div class="form-group">
                        <label class="form-label">原始Buff ID</label>
                        <div style="display: flex; gap: 4px;">
                            <input type="number" class="form-input buff-original-id" value="${buff.originalBuffId || ''}" placeholder="输入ID">
                            <button type="button" class="btn btn-icon" onclick="window.uiManager.showBuffSelector(this.previousElementSibling)">
                                <i class="fa fa-search"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">新Buff ID</label>
                        <div style="display: flex; gap: 4px;">
                            <input type="number" class="form-input buff-new-id" value="${buff.newBuffId || ''}" placeholder="输入ID">
                            <button type="button" class="btn btn-icon" onclick="window.uiManager.showBuffSelector(this.previousElementSibling)">
                                <i class="fa fa-search"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">持续时间(秒)</label>
                        <input type="number" step="0.1" class="form-input buff-duration" value="${buff.newDuration || 900}" placeholder="900.0">
                    </div>
                </div>
            </div>
        `).join('');

        return `
            <div class="card mb-3">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">✨ Buff配置</h3>
                    <button type="button" class="btn btn-sm btn-primary" id="btn-add-buff-config">
                        <i class="fa fa-plus"></i> 添加Buff
                    </button>
                </div>
                <div class="card-body">
                    <div id="buffConfigsContainer">
                        ${buffConfigsHtml || '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">暂无Buff配置，点击上方"添加Buff"按钮添加</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染合成配方
     */
    renderCraftingRecipes(config) {
        const recipes = config.content.AdditionalRecipes || [];
        
        // 如果没有配方但有旧格式数据，转换为新格式
        if (recipes.length === 0 && config.content.FormulaId) {
            recipes.push({
                FormulaId: config.content.FormulaId,
                CraftingMoney: config.content.CraftingMoney || 0,
                ResultItemAmount: config.content.ResultItemAmount || 1,
                CraftingTags: config.content.CraftingTags || [],
                RequirePerk: config.content.RequirePerk || '',
                UnlockByDefault: config.content.UnlockByDefault || false,
                HideInIndex: config.content.HideInIndex || false,
                CostItems: config.content.CostItems || []
            });
        }

        const recipesHtml = recipes.map((recipe, rIndex) => {
            const costItemsHtml = (recipe.CostItems || []).map((item, iIndex) => `
                <div class="cost-item-row" data-index="${iIndex}">
                    <div class="form-group" style="flex: 1;">
                        <input type="number" class="form-input cost-item-id" value="${item.ItemId || ''}" placeholder="物品ID">
                    </div>
                    <div class="form-group" style="width: 100px;">
                        <input type="number" class="form-input cost-item-amount" value="${item.Amount || 1}" placeholder="数量">
                    </div>
                    <button type="button" class="btn btn-icon" onclick="this.closest('.cost-item-row').remove()">
                        <i class="fa fa-minus"></i>
                    </button>
                </div>
            `).join('');

            return `
                <div class="recipe-item" data-index="${rIndex}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-weight: 500;">配方 #${rIndex + 1}</span>
                        <button type="button" class="btn btn-sm btn-outline" onclick="this.closest('.recipe-item').remove()">
                            <i class="fa fa-trash"></i> 删除配方
                        </button>
                    </div>
                    <div class="grid grid-cols-3 mb-3">
                        <div class="form-group">
                            <label class="form-label">配方ID</label>
                            <input type="text" class="form-input recipe-formula-id" value="${recipe.FormulaId || ''}" placeholder="配方ID">
                        </div>
                        <div class="form-group">
                            <label class="form-label">合成费用</label>
                            <input type="number" class="form-input recipe-money" value="${recipe.CraftingMoney || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">产出数量</label>
                            <input type="number" class="form-input recipe-result-amount" value="${recipe.ResultItemAmount || 1}">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 mb-3">
                        <div class="form-group">
                            <label class="form-label">合成标签</label>
                            <input type="text" class="form-input recipe-tags" value="WorkBenchAdvanced" readonly style="background: var(--bg-secondary, #f5f5f5); cursor: not-allowed;">
                            <small style="color: var(--text-secondary, #999); font-size: 12px;">固定为高级工作台</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">需要技能</label>
                            <input type="text" class="form-input recipe-perk" value="${recipe.RequirePerk || ''}" placeholder="技能名称">
                        </div>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">材料清单</label>
                        <div class="cost-items-container">
                            ${costItemsHtml || '<p style="color: var(--text-secondary); text-align: center; padding: 10px;">暂无材料</p>'}
                        </div>
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.uiManager.addCostItem(this.previousElementSibling)">
                            <i class="fa fa-plus"></i> 添加材料
                        </button>
                    </div>
                    <div class="grid grid-cols-3">
                        <div class="form-checkbox">
                            <input type="checkbox" class="recipe-unlock-default" ${recipe.UnlockByDefault ? 'checked' : ''}>
                            <label>默认解锁</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" class="recipe-hide-index" ${recipe.HideInIndex ? 'checked' : ''}>
                            <label>列表隐藏</label>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="card mb-3">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">🔨 合成配方</h3>
                    <button type="button" class="btn btn-sm btn-primary" id="btn-add-recipe">
                        <i class="fa fa-plus"></i> 添加配方
                    </button>
                </div>
                <div class="card-body">
                    <div id="recipesContainer">
                        ${recipesHtml || '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">暂无合成配方，点击上方"添加配方"按钮添加</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染分解配方
     */
    renderDecomposeRecipe(config) {
        const decomposeResults = config.content.DecomposeResults || [];
        
        const resultsHtml = decomposeResults.map((item, index) => `
            <div class="decompose-result-row" data-index="${index}">
                <div class="form-group" style="flex: 1;">
                    <div style="display: flex; gap: 4px;">
                        <input type="number" class="form-input decompose-item-id" value="${item.ItemId || ''}" placeholder="物品ID">
                        <button type="button" class="btn btn-icon" onclick="window.searchManager.showSearchModal(this.previousElementSibling)" title="搜索物品">
                            <i class="fa fa-search"></i>
                        </button>
                    </div>
                </div>
                <div class="form-group" style="width: 100px;">
                    <input type="number" class="form-input decompose-item-amount" value="${item.Amount || 1}" placeholder="数量">
                </div>
                <button type="button" class="btn btn-icon" onclick="this.closest('.decompose-result-row').remove()">
                    <i class="fa fa-minus"></i>
                </button>
            </div>
        `).join('');

        return `
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">♻️ 分解配方</h3>
                </div>
                <div class="card-body">
                    <div class="form-checkbox mb-3">
                        <input type="checkbox" id="EnableDecompose" ${config.content.EnableDecompose ? 'checked' : ''}>
                        <label>启用分解</label>
                    </div>
                    <div class="grid grid-cols-3 mb-3">
                        <div class="form-group">
                            <label class="form-label">分解配方ID</label>
                            <input type="text" class="form-input" id="DecomposeFormulaId" value="${config.content.DecomposeFormulaId || ''}" placeholder="配方ID">
                        </div>
                        <div class="form-group">
                            <label class="form-label">分解时间(秒)</label>
                            <input type="number" step="0.1" class="form-input" id="DecomposeTime" value="${config.content.DecomposeTime || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">分解费用</label>
                            <input type="number" class="form-input" id="DecomposeMoney" value="${config.content.DecomposeMoney || 0}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">分解产出</label>
                        <div id="decomposeResultsContainer">
                            ${resultsHtml || '<p style="color: var(--text-secondary); text-align: center; padding: 10px;">暂无产出物品</p>'}
                        </div>
                        <button type="button" class="btn btn-sm btn-outline" id="btn-add-decompose-result">
                            <i class="fa fa-plus"></i> 添加产出
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 显示Buff选择器模态框
     */
    showBuffSelector(targetInput) {
        const buffsByCategory = BUFF_CATEGORIES.map(category => {
            const buffs = BUFF_DATA.filter(b => b.分类 === category);
            return { category, buffs };
        });

        const categoriesHtml = BUFF_CATEGORIES.map(cat => 
            `<button class="btn btn-sm btn-outline buff-category-btn" data-category="${cat}">${cat}</button>`
        ).join('');

        const buffsListHtml = BUFF_DATA.map(buff => `
            <div class="buff-item" data-id="${buff['Buff ID']}" data-category="${buff.分类}">
                <div style="font-weight: 500;">${buff.DisplayName} (ID: ${buff['Buff ID']})</div>
                <div style="font-size: 12px; color: var(--text-secondary);">${buff.Name}</div>
                <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">${buff.说明}</div>
            </div>
        `).join('');

        const modal = createModal({
            title: '选择Buff',
            content: `
                <div style="margin-bottom: 16px;">
                    <input type="text" class="form-input" id="buffSearchInput" placeholder="搜索Buff名称、ID或说明...">
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                    <button class="btn btn-sm btn-primary buff-category-btn active" data-category="all">全部</button>
                    ${categoriesHtml}
                </div>
                <div id="buffsListContainer" style="max-height: 400px; overflow-y: auto;">
                    ${buffsListHtml}
                </div>
            `,
            width: '600px',
            buttons: [
                { text: '取消', className: 'btn btn-outline', onClick: () => modal.close() }
            ]
        });

        modal.show();

        // 绑定搜索事件
        setTimeout(() => {
            const searchInput = document.getElementById('buffSearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', debounce((e) => {
                    const query = e.target.value.toLowerCase();
                    document.querySelectorAll('.buff-item').forEach(item => {
                        const text = item.textContent.toLowerCase();
                        item.style.display = text.includes(query) ? 'block' : 'none';
                    });
                }, 300));
            }

            // 绑定分类筛选
            document.querySelectorAll('.buff-category-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.buff-category-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const category = btn.dataset.category;
                    document.querySelectorAll('.buff-item').forEach(item => {
                        if (category === 'all') {
                            item.style.display = 'block';
                        } else {
                            item.style.display = item.dataset.category === category ? 'block' : 'none';
                        }
                    });
                });
            });

            // 绑定Buff选择
            document.querySelectorAll('.buff-item').forEach(item => {
                item.addEventListener('click', () => {
                    const buffId = item.dataset.id;
                    if (targetInput) {
                        targetInput.value = buffId;
                        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    modal.close();
                    showNotification('成功', `已选择Buff ID: ${buffId}`, 'success');
                });
            });
        }, 100);

        this.currentModal = modal;
    }

    /**
     * 添加材料项
     */
    addCostItem(container) {
        const row = document.createElement('div');
        row.className = 'cost-item-row';
        row.innerHTML = `
            <div class="form-group" style="flex: 1;">
                <div style="display: flex; gap: 4px;">
                    <input type="number" class="form-input cost-item-id" placeholder="物品ID">
                    <button type="button" class="btn btn-icon" onclick="window.searchManager.showSearchModal(this.previousElementSibling)" title="搜索物品">
                        <i class="fa fa-search"></i>
                    </button>
                </div>
            </div>
            <div class="form-group" style="width: 100px;">
                <input type="number" class="form-input cost-item-amount" value="1" placeholder="数量">
            </div>
            <button type="button" class="btn btn-icon" onclick="this.closest('.cost-item-row').remove()">
                <i class="fa fa-minus"></i>
            </button>
        `;
        
        // 移除"暂无材料"提示
        const emptyMsg = container.querySelector('p');
        if (emptyMsg) emptyMsg.remove();
        
        container.appendChild(row);
        this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
    }

    /**
     * 渲染抽奖配置
     */
    renderGachaConfigs(config) {
        // 修复：根据C#代码，Gacha应该是单个对象，不是数组
        // 支持两种格式：旧的GachaConfigs数组和新的Gacha对象
        let gachaData = null;
        
        if (config.content.Gacha && typeof config.content.Gacha === 'object') {
            // 新格式：单个Gacha对象
            gachaData = [config.content.Gacha];
        } else if (config.content.GachaConfigs && Array.isArray(config.content.GachaConfigs)) {
            // 旧格式：GachaConfigs数组
            gachaData = config.content.GachaConfigs;
        }
        
        if (!gachaData || gachaData.length === 0) {
            return `
                <div class="card mb-3">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 class="card-title">🎰 抽奖配置</h3>
                        <button type="button" class="btn btn-sm btn-primary" id="btn-add-gacha-config">
                            <i class="fa fa-plus"></i> 添加抽奖配置
                        </button>
                    </div>
                    <div class="card-body">
                        <div id="gachaConfigsContainer">
                            <p style="color: var(--text-secondary); text-align: center; padding: 20px;">暂无抽奖配置，点击上方"添加抽奖配置"按钮添加</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const gachaConfigsHtml = gachaData.map((gacha, index) => {
            // 修复：支持新的字段名 Entries 和 entries
            // 确保entries始终是数组，避免TypeError: entries.map is not a function
            let entries = gacha.Entries || gacha.entries || [];
            if (!Array.isArray(entries)) {
                entries = [];
            }
            
            const entriesHtml = entries.map((entry, entryIndex) => `
                <div class="gacha-entry-row" data-index="${entryIndex}">
                    <div class="form-group" style="flex: 1;">
                        <div style="display: flex; gap: 4px;">
                            <input type="number" class="form-input gacha-item-id" value="${entry.ItemId || entry.itemId || ''}" placeholder="物品ID">
                            <button type="button" class="btn btn-icon" onclick="window.searchManager.showSearchModal(this.previousElementSibling)" title="搜索物品">
                                <i class="fa fa-search"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group" style="width: 120px;">
                        <input type="number" step="0.1" class="form-input gacha-weight" value="${entry.Weight || entry.weight || 1}" placeholder="权重">
                    </div>
                    <button type="button" class="btn btn-icon" onclick="this.closest('.gacha-entry-row').remove()">
                        <i class="fa fa-minus"></i>
                    </button>
                </div>
            `).join('');

            const totalWeight = entries.reduce((sum, entry) => sum + (entry.Weight || entry.weight || 0), 0);
            const probabilityHtml = entries.map(entry => {
                const weight = entry.Weight || entry.weight || 0;
                const itemId = entry.ItemId || entry.itemId;
                const probability = totalWeight > 0 ? (weight / totalWeight * 100).toFixed(2) : '0.00';
                return `<div class="probability-item">${itemId}: ${probability}%</div>`;
            }).join('');

            return `
                <div class="gacha-config-item" data-index="${index}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <span style="font-weight: 500;">抽奖配置 #${index + 1}</span>
                        <button type="button" class="btn btn-sm btn-outline" onclick="this.closest('.gacha-config-item').remove()">
                            <i class="fa fa-trash"></i> 删除
                        </button>
                    </div>
                    <div class="grid grid-cols-2 mb-3">
                        <div class="form-group">
                            <label class="form-label">配置名称</label>
                            <input type="text" class="form-input gacha-name" value="${gacha.Name || gacha.name || ''}" placeholder="抽奖配置名称">
                        </div>
                        <div class="form-group">
                            <label class="form-label">通知键名</label>
                            <input type="text" class="form-input gacha-notification-key" value="${gacha.NotificationKey || gacha.notificationKey || 'Default'}" placeholder="通知键名">
                        </div>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">描述</label>
                        <textarea class="form-input gacha-description" rows="2" placeholder="抽奖配置描述">${gacha.Description || gacha.description || ''}</textarea>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">抽奖条目</label>
                        <div class="gacha-entries-container">
                            ${entriesHtml || '<p style="color: var(--text-secondary); text-align: center; padding: 10px;">暂无条目</p>'}
                        </div>
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.uiManager.addGachaEntry(this.previousElementSibling)">
                            <i class="fa fa-plus"></i> 添加条目
                        </button>
                    </div>
                    <div class="form-group mb-3">
                        <label class="form-label">概率分布</label>
                        <div class="probability-container">
                            ${probabilityHtml || '<p style="color: var(--text-secondary); text-align: center; padding: 10px;">暂无数据</p>'}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="btn btn-sm btn-primary" onclick="window.uiManager.simulateGacha(${index})">
                            <i class="fa fa-dice"></i> 模拟抽奖
                        </button>
                        <button type="button" class="btn btn-sm btn-outline" onclick="window.uiManager.updateProbabilities(${index})">
                            <i class="fa fa-refresh"></i> 更新概率
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="card mb-3">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="card-title">🎰 抽奖配置</h3>
                    <button type="button" class="btn btn-sm btn-primary" id="btn-add-gacha-config">
                        <i class="fa fa-plus"></i> 添加抽奖配置
                    </button>
                </div>
                <div class="card-body">
                    <div id="gachaConfigsContainer">
                        ${gachaConfigsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 添加抽奖条目
     */
    addGachaEntry(container) {
        const row = document.createElement('div');
        row.className = 'gacha-entry-row';
        row.innerHTML = `
            <div class="form-group" style="flex: 1;">
                <div style="display: flex; gap: 4px;">
                    <input type="number" class="form-input gacha-item-id" placeholder="物品ID">
                    <button type="button" class="btn btn-icon" onclick="window.searchManager.showSearchModal(this.previousElementSibling)" title="搜索物品">
                        <i class="fa fa-search"></i>
                    </button>
                </div>
            </div>
            <div class="form-group" style="width: 120px;">
                <input type="number" step="0.1" class="form-input gacha-weight" value="1" placeholder="权重">
            </div>
            <button type="button" class="btn btn-icon" onclick="this.closest('.gacha-entry-row').remove()">
                <i class="fa fa-minus"></i>
            </button>
        `;
        
        // 移除"暂无条目"提示
        const emptyMsg = container.querySelector('p');
        if (emptyMsg) emptyMsg.remove();
        
        container.appendChild(row);
        this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
    }

    /**
     * 模拟抽奖
     */
    simulateGacha(configIndex) {
        const configItem = document.querySelectorAll('.gacha-config-item')[configIndex];
        if (!configItem) return;

        const entries = [];
        configItem.querySelectorAll('.gacha-entry-row').forEach(row => {
            const itemId = row.querySelector('.gacha-item-id').value;
            const weight = parseFloat(row.querySelector('.gacha-weight').value) || 0;
            if (itemId && weight > 0) {
                entries.push({ itemId: parseInt(itemId), weight });
            }
        });

        if (entries.length === 0) {
            showNotification('错误', '请先添加抽奖条目', 'error');
            return;
        }

        // 计算总权重
        const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
        
        // 随机抽奖
        const random = Math.random() * totalWeight;
        let currentWeight = 0;
        let winner = null;

        for (const entry of entries) {
            currentWeight += entry.weight;
            if (random <= currentWeight) {
                winner = entry;
                break;
            }
        }

        if (winner) {
            const probability = ((winner.weight / totalWeight) * 100).toFixed(2);
            showNotification('抽奖结果', `恭喜！抽中了物品 ${winner.itemId} (概率: ${probability}%)`, 'success');
        }
    }

    /**
     * 更新概率显示
     */
    updateProbabilities(configIndex) {
        const configItem = document.querySelectorAll('.gacha-config-item')[configIndex];
        if (!configItem) return;

        const entries = [];
        configItem.querySelectorAll('.gacha-entry-row').forEach(row => {
            const itemId = row.querySelector('.gacha-item-id').value;
            const weight = parseFloat(row.querySelector('.gacha-weight').value) || 0;
            if (itemId && weight > 0) {
                entries.push({ itemId: parseInt(itemId), weight });
            }
        });

        const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
        const probabilityContainer = configItem.querySelector('.probability-container');
        
        if (entries.length === 0) {
            probabilityContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 10px;">暂无数据</p>';
            return;
        }

        const probabilityHtml = entries.map(entry => {
            const probability = totalWeight > 0 ? ((entry.weight / totalWeight) * 100).toFixed(2) : '0.00';
            return `<div class="probability-item">${entry.itemId}: ${probability}%</div>`;
        }).join('');

        probabilityContainer.innerHTML = probabilityHtml;
        showNotification('成功', '概率已更新', 'success');
    }

    closeAllModals() {
        if (this.currentModal) {
            this.currentModal.close();
            this.currentModal = null;
        }
    }

    /**
     * 初始化富文本工具
     */
    initRichTextTools() {
        const richTextButtons = document.querySelectorAll('.rich-text-btn');
        
        richTextButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetId = btn.dataset.target;
                // 如果点击的是已经打开的面板的按钮，则关闭面板（切换功能）
                if (this.currentRichTextPanel && this.currentRichTextTarget && this.currentRichTextTarget.id === targetId) {
                    this.closeRichTextTool();
                } else {
                    this.showRichTextTool(targetId, btn);
                }
            });
        });
    }

    /**
     * 显示富文本工具面板
     */
    showRichTextTool(targetId, button) {
        // 关闭已存在的面板
        this.closeRichTextTool();

        const input = document.getElementById(targetId);
        if (!input) return;

        // 创建工具面板
        const panel = document.createElement('div');
        panel.className = 'rich-text-tool-panel';
        panel.style.cssText = `
            position: fixed;
            background: var(--bg-primary, #fff);
            border: 1px solid var(--border-color, #ddd);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 12px;
            z-index: 10001;
            min-width: 300px;
            max-width: 400px;
        `;

        // 常用颜色（扩展颜色列表）
        const colors = [
            { name: '红色', value: '#FF0000', hex: 'FF0000' },
            { name: '绿色', value: '#00FF00', hex: '00FF00' },
            { name: '蓝色', value: '#0000FF', hex: '0000FF' },
            { name: '黄色', value: '#FFFF00', hex: 'FFFF00' },
            { name: '橙色', value: '#FFA500', hex: 'FFA500' },
            { name: '紫色', value: '#800080', hex: '800080' },
            { name: '青色', value: '#00FFFF', hex: '00FFFF' },
            { name: '粉色', value: '#FFC0CB', hex: 'FFC0CB' },
            { name: '金色', value: '#FFD700', hex: 'FFD700' },
            { name: '白色', value: '#FFFFFF', hex: 'FFFFFF' },
            { name: '黑色', value: '#000000', hex: '000000' },
            { name: '灰色', value: '#808080', hex: '808080' },
            { name: '银色', value: '#C0C0C0', hex: 'C0C0C0' },
            { name: '棕色', value: '#8B4513', hex: '8B4513' },
            { name: '深蓝', value: '#00008B', hex: '00008B' },
            { name: '深绿', value: '#006400', hex: '006400' },
            { name: '深红', value: '#8B0000', hex: '8B0000' },
            { name: '浅蓝', value: '#87CEEB', hex: '87CEEB' },
            { name: '浅绿', value: '#90EE90', hex: '90EE90' },
            { name: '浅红', value: '#FFB6C1', hex: 'FFB6C1' },
        ];

        // 工具按钮HTML
        let panelHTML = `
            <div style="margin-bottom: 12px;">
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">常用颜色</div>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; max-height: 200px; overflow-y: auto; padding-right: 4px;">
        `;

        colors.forEach(color => {
            panelHTML += `
                <button type="button" 
                        class="btn" 
                        style="background: ${color.value}; color: ${color.value === '#FFFFFF' ? '#000' : '#fff'}; border: 1px solid ${color.value}; padding: 8px; font-size: 12px;"
                        data-color="${color.hex}"
                        data-action="insert-color"
                        title="${color.name}">
                    ${color.name}
                </button>
            `;
        });

        panelHTML += `
                </div>
            </div>
            <div style="margin-bottom: 12px;">
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">自定义颜色</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="color" id="custom-color-picker" value="#FF0000" style="width: 50px; height: 36px; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
                    <input type="text" id="custom-color-hex" placeholder="#FF0000" value="#FF0000" style="flex: 1; padding: 6px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 12px;">
                    <button type="button" class="btn btn-primary" data-action="insert-custom-color" style="padding: 6px 12px;">应用</button>
                </div>
            </div>
            <div style="margin-bottom: 12px;">
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">文本样式</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-outline" data-action="insert-bold" style="font-size: 12px; padding: 6px 10px;">
                        <i class="fa fa-bold"></i> 粗体
                    </button>
                    <button type="button" class="btn btn-outline" data-action="insert-italic" style="font-size: 12px; padding: 6px 10px;">
                        <i class="fa fa-italic"></i> 斜体
                    </button>
                    <button type="button" class="btn btn-outline" data-action="insert-size" style="font-size: 12px; padding: 6px 10px;">
                        <i class="fa fa-text-height"></i> 大小
                    </button>
                    <button type="button" class="btn btn-outline" data-action="insert-underline" style="font-size: 12px; padding: 6px 10px;">
                        <i class="fa fa-underline"></i> 下划线
                    </button>
                </div>
            </div>
            <div style="margin-bottom: 12px;">
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">常用文本模板</div>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-outline" data-action="insert-template" data-template="legendary" style="font-size: 12px; padding: 6px 10px;">
                        <i class="fa fa-star"></i> 传说
                    </button>
                    <button type="button" class="btn btn-outline" data-action="insert-template" data-template="epic" style="font-size: 12px; padding: 6px 10px;">
                        <i class="fa fa-star-o"></i> 史诗
                    </button>
                    <button type="button" class="btn btn-outline" data-action="insert-template" data-template="rare" style="font-size: 12px; padding: 6px 10px;">
                        <i class="fa fa-diamond"></i> 稀有
                    </button>
                    <button type="button" class="btn btn-outline" data-action="insert-template" data-template="damage" style="font-size: 12px; padding: 6px 10px;">
                        <i class="fa fa-bolt"></i> 伤害
                    </button>
                </div>
            </div>
            <div style="border-top: 1px solid var(--border-color); padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                <small style="color: var(--text-secondary);">提示：选中文本后点击颜色按钮，或直接插入标签</small>
                <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-sm btn-outline" data-action="preview-text" style="font-size: 11px; padding: 4px 8px;">
                        <i class="fa fa-eye"></i> 预览
                    </button>
                    <button type="button" class="btn btn-sm btn-outline rich-text-close-btn" style="font-size: 11px; padding: 4px 8px;" title="关闭">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        panel.innerHTML = panelHTML;

        // 计算面板位置（使用fixed定位，相对于视窗）
        const inputRect = input.getBoundingClientRect();
        
        // 先插入到body中，以便计算尺寸
        document.body.appendChild(panel);
        
        // 确保面板不会超出视窗
        setTimeout(() => {
            const panelRect = panel.getBoundingClientRect();
            const panelWidth = panelRect.width;
            const panelHeight = panelRect.height;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const padding = 8; // 边距
            
            // 计算水平位置：优先显示在输入框右侧
            let left = inputRect.right + padding;
            
            // 如果右侧超出，则显示在左侧
            if (left + panelWidth > viewportWidth - padding) {
                left = inputRect.left - panelWidth - padding;
            }
            
            // 如果左侧也超出，则靠左对齐
            if (left < padding) {
                left = padding;
            }
            
            // 如果左侧超出，则靠右对齐
            if (left + panelWidth > viewportWidth - padding) {
                left = viewportWidth - panelWidth - padding;
            }
            
            // 计算垂直位置：智能选择显示位置
            let top;
            const spaceAbove = inputRect.top - padding;
            const spaceBelow = viewportHeight - inputRect.bottom - padding;
            const inputCenterY = inputRect.top + inputRect.height / 2;
            
            // 如果输入框在视窗下半部分，优先显示在输入框上方
            if (inputCenterY > viewportHeight / 2) {
                // 优先显示在上方
                if (spaceAbove >= panelHeight) {
                    // 上方空间足够，显示在上方
                    top = inputRect.top - panelHeight - padding;
                } else if (spaceBelow >= panelHeight) {
                    // 上方不够，但下方足够，显示在下方
                    top = inputRect.bottom + padding;
                } else {
                    // 上下都不够，选择空间更大的一侧，并确保完全在视窗内
                    if (spaceAbove > spaceBelow) {
                        top = padding; // 靠顶部对齐
                    } else {
                        top = viewportHeight - panelHeight - padding; // 靠底部对齐
                    }
                }
            } else {
                // 输入框在视窗上半部分，优先显示在输入框下方
                if (spaceBelow >= panelHeight) {
                    // 下方空间足够，显示在下方
                    top = inputRect.bottom + padding;
                } else if (spaceAbove >= panelHeight) {
                    // 下方不够，但上方足够，显示在上方
                    top = inputRect.top - panelHeight - padding;
                } else {
                    // 上下都不够，选择空间更大的一侧，并确保完全在视窗内
                    if (spaceBelow > spaceAbove) {
                        top = viewportHeight - panelHeight - padding; // 靠底部对齐
                    } else {
                        top = padding; // 靠顶部对齐
                    }
                }
            }
            
            // 最终边界检查，确保面板完全在视窗内
            if (top < padding) {
                top = padding;
            }
            if (top + panelHeight > viewportHeight - padding) {
                top = viewportHeight - panelHeight - padding;
            }
            if (left < padding) {
                left = padding;
            }
            if (left + panelWidth > viewportWidth - padding) {
                left = viewportWidth - panelWidth - padding;
            }
            
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
        }, 0);
        this.currentRichTextPanel = panel;
        this.currentRichTextTarget = input;

        // 绑定事件
        panel.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const action = btn.dataset.action;
                this.handleRichTextAction(action, input, btn);
            });
        });

        // 绑定关闭按钮
        const closeBtn = panel.querySelector('.rich-text-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeRichTextTool();
            });
        }

        // 阻止面板内部点击事件冒泡
        panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 颜色选择器同步
        const colorPicker = panel.querySelector('#custom-color-picker');
        const colorHex = panel.querySelector('#custom-color-hex');
        
        if (colorPicker && colorHex) {
            colorPicker.addEventListener('input', (e) => {
                colorHex.value = e.target.value.toUpperCase();
            });
            
            colorHex.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    colorPicker.value = value;
                }
            });
        }
    }

    /**
     * 处理富文本工具操作
     */
    handleRichTextAction(action, input, button) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const selectedText = input.value.substring(start, end);
        const beforeText = input.value.substring(0, start);
        const afterText = input.value.substring(end);

        let insertText = '';

        switch (action) {
            case 'insert-color':
                const colorHex = button.dataset.color;
                if (selectedText) {
                    insertText = `<color=#${colorHex}>${selectedText}</color>`;
                } else {
                    insertText = `<color=#${colorHex}>文本</color>`;
                }
                break;

            case 'insert-custom-color':
                const customColorHex = document.querySelector('#custom-color-hex').value.replace('#', '');
                if (selectedText) {
                    insertText = `<color=#${customColorHex}>${selectedText}</color>`;
                } else {
                    insertText = `<color=#${customColorHex}>文本</color>`;
                }
                break;

            case 'insert-bold':
                if (selectedText) {
                    insertText = `<b>${selectedText}</b>`;
                } else {
                    insertText = `<b>文本</b>`;
                }
                break;

            case 'insert-italic':
                if (selectedText) {
                    insertText = `<i>${selectedText}</i>`;
                } else {
                    insertText = `<i>文本</i>`;
                }
                break;

            case 'insert-size':
                const size = prompt('请输入字体大小 (例如: 20, 30, 50):', '20');
                if (size && /^\d+$/.test(size)) {
                    if (selectedText) {
                        insertText = `<size=${size}>${selectedText}</size>`;
                    } else {
                        insertText = `<size=${size}>文本</size>`;
                    }
                } else {
                    return;
                }
                break;

            case 'insert-underline':
                if (selectedText) {
                    insertText = `<u>${selectedText}</u>`;
                } else {
                    insertText = `<u>文本</u>`;
                }
                break;

            case 'insert-template':
                const template = button.dataset.template;
                const templates = {
                    legendary: '<color=#FFD700>传说</color>',
                    epic: '<color=#800080>史诗</color>',
                    rare: '<color=#0000FF>稀有</color>',
                    damage: '<color=#FF0000>伤害</color>'
                };
                insertText = templates[template] || '';
                break;

            case 'preview-text':
                this.showRichTextPreview(input);
                return;
        }

        if (insertText) {
            input.value = beforeText + insertText + afterText;
            input.focus();
            
            // 设置光标位置到插入文本的末尾
            const newCursorPos = beforeText.length + insertText.length;
            input.setSelectionRange(newCursorPos, newCursorPos);
            
            // 标记为已修改
            this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
            
            // 插入文本后不自动关闭面板，方便连续操作
            // 用户可以通过点击关闭按钮手动关闭
        }
    }

    /**
     * 关闭富文本工具面板
     */
    closeRichTextTool() {
        if (this.currentRichTextPanel) {
            this.currentRichTextPanel.remove();
            this.currentRichTextPanel = null;
            this.currentRichTextTarget = null;
        }
    }

    /**
     * 显示富文本预览
     */
    showRichTextPreview(input) {
        const text = input.value;
        if (!text) {
            showNotification('提示', '请输入要预览的文本', 'info');
            return;
        }

        // 创建预览模态框
        const modal = createModal({
            title: '富文本预览',
            content: `
                <div style="padding: 20px; background: var(--bg-secondary, #f5f5f5); border-radius: 8px; min-height: 100px; max-height: 400px; overflow-y: auto;">
                    <div id="rich-text-preview-content" style="font-size: 16px; line-height: 1.6;">
                        ${this.parseRichTextToHTML(text)}
                    </div>
                </div>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    <small style="color: var(--text-secondary);">原始文本:</small>
                    <pre style="background: var(--bg-secondary); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; margin-top: 8px;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </div>
            `,
            buttons: [
                { text: '关闭', class: 'btn-primary', action: () => modal.remove() }
            ]
        });

        modal.show();
    }

    /**
     * 将Unity富文本转换为HTML用于预览
     */
    parseRichTextToHTML(text) {
        // 简单的Unity富文本标签转换
        let html = text;
        
        // 颜色标签: <color=#FF0000>文本</color>
        html = html.replace(/<color=#([0-9A-Fa-f]{6})>(.*?)<\/color>/g, '<span style="color: #$1;">$2</span>');
        html = html.replace(/<color=#([0-9A-Fa-f]{3})>(.*?)<\/color>/g, (match, color, text) => {
            // 3位hex转6位
            const r = color[0] + color[0];
            const g = color[1] + color[1];
            const b = color[2] + color[2];
            return `<span style="color: #${r}${g}${b};">${text}</span>`;
        });
        
        // 粗体: <b>文本</b>
        html = html.replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>');
        
        // 斜体: <i>文本</i>
        html = html.replace(/<i>(.*?)<\/i>/g, '<em>$1</em>');
        
        // 大小: <size=20>文本</size>
        html = html.replace(/<size=(\d+)>(.*?)<\/size>/g, '<span style="font-size: $1px;">$2</span>');
        
        // 下划线: <u>文本</u>
        html = html.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
        
        return html;
    }

    /**
     * 初始化属性搜索功能
     */
    initFieldsSearch() {
        // 定义各个搜索区域的配置
        const searchConfigs = [
            { searchId: 'item-fields-search', containerId: 'item-fields-container', clearId: 'item-fields-search-clear', fieldClass: 'item-field' },
            { searchId: 'weapon-fields-search', containerId: 'weapon-fields-container', clearId: 'weapon-fields-search-clear', fieldClass: 'weapon-field' },
            { searchId: 'ammo-fields-search', containerId: 'ammo-fields-container', clearId: 'ammo-fields-search-clear', fieldClass: 'ammo-field' },
            { searchId: 'melee-fields-search', containerId: 'melee-fields-container', clearId: 'melee-fields-search-clear', fieldClass: 'melee-field' },
            { searchId: 'accessory-fields-search', containerId: 'accessory-fields-container', clearId: 'accessory-fields-search-clear', fieldClass: 'accessory-field' }
        ];

        searchConfigs.forEach(config => {
            const searchInput = document.getElementById(config.searchId);
            const clearBtn = document.getElementById(config.clearId);
            
            if (!searchInput) return;

            // 搜索输入事件
            searchInput.addEventListener('input', debounce((e) => {
                const query = e.target.value.trim().toLowerCase();
                this.filterFields(config.containerId, config.fieldClass, query);
                
                // 显示/隐藏清除按钮
                if (clearBtn) {
                    clearBtn.style.display = query ? 'block' : 'none';
                }
            }, 300));

            // 清除按钮事件
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    searchInput.value = '';
                    this.filterFields(config.containerId, config.fieldClass, '');
                    clearBtn.style.display = 'none';
                    searchInput.focus();
                });
            }
        });
    }

    /**
     * 过滤属性字段
     */
    filterFields(containerId, fieldClass, query) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const queryLower = query.toLowerCase();
        let hasMatch = false;

        // 遍历所有表单组和Hash字段
        container.querySelectorAll('.form-group, .form-checkbox').forEach(formGroup => {
            // 查找普通字段或Hash字段
            const field = formGroup.querySelector(`.${fieldClass}, .weapon-hash-field, .ammo-hash-field`);
            if (!field) {
                // 如果没有找到对应字段，检查是否是标题或其他元素
                const h4 = formGroup.querySelector('h4');
                if (h4) {
                    // 如果是标题，根据搜索内容决定是否显示
                    const titleText = h4.textContent || '';
                    if (!query || titleText.toLowerCase().includes(queryLower)) {
                        formGroup.style.display = '';
                    } else {
                        formGroup.style.display = 'none';
                    }
                } else {
                    formGroup.style.display = '';
                }
                return;
            }

            const label = formGroup.querySelector('label');
            if (!label) {
                formGroup.style.display = '';
                return;
            }

            // 获取标签文本（包含中文名称和英文ID）
            const labelText = label.textContent || label.innerText || '';
            
            // 检查是否匹配（中文或英文）
            const matches = !query || 
                labelText.toLowerCase().includes(queryLower) ||
                (field.dataset.key && field.dataset.key.toLowerCase().includes(queryLower));

            if (matches) {
                formGroup.style.display = '';
                hasMatch = true;
            } else {
                formGroup.style.display = 'none';
            }
        });

        // 如果没有匹配结果，显示提示
        const noResultsMsg = container.querySelector('.no-results-message');
        if (query && !hasMatch) {
            if (!noResultsMsg) {
                const msg = document.createElement('div');
                msg.className = 'no-results-message';
                msg.style.cssText = 'padding: 20px; text-align: center; color: var(--text-secondary, #666);';
                msg.textContent = '没有找到匹配的属性';
                container.appendChild(msg);
            }
        } else {
            if (noResultsMsg) {
                noResultsMsg.remove();
            }
        }
    }

    /**
     * 生成带帮助图标的标签
     */
    createLabelWithHelp(labelText, fieldKey, fieldType = 'weapon') {
        const hasHelp = fieldType === 'weapon' && WEAPON_FIELD_DESCRIPTIONS[fieldKey];
        if (hasHelp) {
            return `
                <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
                    ${labelText}
                    <i class="fa fa-question-circle weapon-field-help" 
                       data-key="${fieldKey}" 
                       style="cursor: pointer; color: var(--text-secondary, #666); font-size: 14px;" 
                       title="点击查看详细说明"
                       onmouseover="this.style.color='var(--color-primary, #2196f3)'"
                       onmouseout="this.style.color='var(--text-secondary, #666)'"></i>
                </label>
            `;
        }
        return `<label class="form-label">${labelText}</label>`;
    }

    /**
     * 初始化武器属性提示
     */
    initWeaponFieldTooltips() {
        // 使用事件委托处理所有帮助图标的点击
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('weapon-field-help')) {
                const fieldKey = e.target.dataset.key;
                this.showWeaponFieldTooltip(fieldKey, e.target);
            }
        });

        // 为所有武器字段添加帮助图标
        this.addHelpIconsToWeaponFields();
    }

    /**
     * 为武器字段添加帮助图标
     */
    addHelpIconsToWeaponFields() {
        // 处理普通武器字段和Hash字段
        const weaponFields = document.querySelectorAll('.weapon-field, .weapon-hash-field');
        weaponFields.forEach(field => {
            const fieldKey = field.dataset.key;
            if (!fieldKey || !WEAPON_FIELD_DESCRIPTIONS[fieldKey]) return;

            // 检查是否已经有帮助图标
            const formGroup = field.closest('.form-group');
            const label = formGroup?.querySelector('label');
            if (!label) return;
            
            // 检查是否已经添加过帮助图标
            if (label.querySelector('.weapon-field-help')) return;

            // 创建帮助图标
            const helpIcon = document.createElement('i');
            helpIcon.className = 'fa fa-question-circle weapon-field-help';
            helpIcon.dataset.key = fieldKey;
            helpIcon.style.cssText = 'cursor: pointer; color: var(--text-secondary, #666); font-size: 14px; margin-left: 6px;';
            helpIcon.title = '点击查看详细说明';
            helpIcon.addEventListener('mouseenter', () => {
                helpIcon.style.color = 'var(--color-primary, #2196f3)';
            });
            helpIcon.addEventListener('mouseleave', () => {
                helpIcon.style.color = 'var(--text-secondary, #666)';
            });

            // 确保label是flex布局
            if (!label.style.display || label.style.display === 'block') {
                label.style.display = 'flex';
                label.style.alignItems = 'center';
                label.style.gap = '6px';
            }

            // 添加帮助图标
            label.appendChild(helpIcon);
        });
    }

    /**
     * 显示武器属性提示
     */
    showWeaponFieldTooltip(fieldKey, triggerElement) {
        const fieldInfo = WEAPON_FIELD_DESCRIPTIONS[fieldKey];
        if (!fieldInfo) return;

        // 关闭已存在的提示
        this.closeWeaponFieldTooltip();

        // 创建提示面板
        const tooltip = document.createElement('div');
        tooltip.className = 'weapon-field-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: var(--bg-primary, #fff);
            border: 1px solid var(--border-color, #ddd);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px;
            z-index: 10002;
            max-width: 500px;
            min-width: 350px;
        `;

        let content = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <h4 style="margin: 0; color: var(--text-primary); font-size: 16px; font-weight: 600;">${fieldInfo.name}</h4>
                <button type="button" class="tooltip-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); font-size: 18px; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <div style="color: var(--text-primary); line-height: 1.6; margin-bottom: 12px;">
                ${fieldInfo.description}
            </div>
        `;

        if (fieldInfo.formula) {
            content += `
                <div style="background: var(--bg-secondary, #f5f5f5); padding: 10px; border-radius: 4px; margin-bottom: 12px; font-family: monospace; font-size: 13px; color: var(--text-primary);">
                    <strong>计算公式：</strong><br>
                    ${fieldInfo.formula}
                </div>
            `;
        }

        if (fieldInfo.default !== undefined) {
            content += `
                <div style="color: var(--text-secondary); font-size: 13px;">
                    <strong>默认值：</strong> ${fieldInfo.default}
                </div>
            `;
        }

        tooltip.innerHTML = content;

        // 计算位置 - 智能显示在触发元素附近
        const rect = triggerElement.getBoundingClientRect();
        const padding = 12;
        
        // 先插入到body中，以便计算尺寸
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            const tooltipRect = tooltip.getBoundingClientRect();
            const tooltipWidth = tooltipRect.width;
            const tooltipHeight = tooltipRect.height;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // 计算水平位置：优先显示在触发元素右侧
            let left = rect.right + padding;
            
            // 如果右侧空间不足，尝试显示在左侧
            if (left + tooltipWidth > viewportWidth - padding) {
                left = rect.left - tooltipWidth - padding;
            }
            
            // 如果左侧也超出，则靠左对齐
            if (left < padding) {
                left = padding;
            }
            
            // 如果仍然超出，则靠右对齐
            if (left + tooltipWidth > viewportWidth - padding) {
                left = viewportWidth - tooltipWidth - padding;
            }
            
            // 计算垂直位置：优先与触发元素顶部对齐，然后根据空间调整
            let top;
            const spaceAbove = rect.top - padding;
            const spaceBelow = viewportHeight - rect.bottom - padding;
            
            // 优先尝试与触发元素顶部对齐（右侧或左侧）
            const preferredTop = rect.top;
            
            // 检查首选位置是否可行
            if (preferredTop + tooltipHeight <= viewportHeight - padding) {
                // 首选位置可行，直接使用
                top = preferredTop;
            } else {
                // 首选位置不可行，需要调整
                // 如果触发元素在视窗下半部分，优先显示在上方
                if (rect.top > viewportHeight / 2) {
                    // 优先显示在上方
                    if (spaceAbove >= tooltipHeight) {
                        // 上方空间足够，显示在上方
                        top = rect.top - tooltipHeight - padding;
                    } else if (spaceBelow >= tooltipHeight) {
                        // 上方不够，但下方足够，显示在下方
                        top = rect.bottom + padding;
                    } else {
                        // 上下都不够，选择空间更大的一侧，并确保完全在视窗内
                        if (spaceAbove > spaceBelow) {
                            top = padding; // 靠顶部对齐
                        } else {
                            top = viewportHeight - tooltipHeight - padding; // 靠底部对齐
                        }
                    }
                } else {
                    // 触发元素在视窗上半部分，优先显示在下方
                    if (spaceBelow >= tooltipHeight) {
                        // 下方空间足够，显示在下方
                        top = rect.bottom + padding;
                    } else if (spaceAbove >= tooltipHeight) {
                        // 下方不够，但上方足够，显示在上方
                        top = rect.top - tooltipHeight - padding;
                    } else {
                        // 上下都不够，选择空间更大的一侧，并确保完全在视窗内
                        if (spaceBelow > spaceAbove) {
                            top = viewportHeight - tooltipHeight - padding; // 靠底部对齐
                        } else {
                            top = padding; // 靠顶部对齐
                        }
                    }
                }
            }
            
            // 最终边界检查，确保面板完全在视窗内
            if (top < padding) {
                top = padding;
            }
            if (top + tooltipHeight > viewportHeight - padding) {
                top = viewportHeight - tooltipHeight - padding;
            }
            if (left < padding) {
                left = padding;
            }
            if (left + tooltipWidth > viewportWidth - padding) {
                left = viewportWidth - tooltipWidth - padding;
            }
            
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        }, 0);

        this.currentWeaponTooltip = tooltip;

        // 关闭按钮事件
        tooltip.querySelector('.tooltip-close-btn').addEventListener('click', () => {
            this.closeWeaponFieldTooltip();
        });

        // 点击外部关闭
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!tooltip.contains(e.target) && !triggerElement.contains(e.target)) {
                    this.closeWeaponFieldTooltip();
                }
            }, { once: true });
        }, 100);
    }

    /**
     * 关闭武器属性提示
     */
    closeWeaponFieldTooltip() {
        if (this.currentWeaponTooltip) {
            this.currentWeaponTooltip.remove();
            this.currentWeaponTooltip = null;
        }
    }

    /**
     * 显示导入结果
     */
    showImportResults(results) {
        const successCount = results.success.length;
        const failedCount = results.failed.length;
        const totalCount = successCount + failedCount;

        // 导入信息
        const typeInfo = CONFIG_TYPE_INFO;
        
        // 构建成功列表HTML
        let successListHtml = '';
        if (successCount > 0) {
            successListHtml = `
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <i class="fa fa-check-circle" style="color: #4caf50; font-size: 18px;"></i>
                        <h4 style="margin: 0; color: #4caf50;">成功导入 (${successCount})</h4>
                    </div>
                    <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color, #ddd); border-radius: 4px; padding: 8px;">
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px;">
            `;
            
            results.success.forEach((config, index) => {
                if (!config || !config.id) return; // 跳过无效配置
                
                const typeIcon = typeInfo[config.type]?.icon || 'fa-file';
                const typeName = typeInfo[config.type]?.name || config.type;
                const configId = String(config.id).replace(/'/g, "\\'"); // 转义单引号
                const fileName = String(config.fileName || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); // 转义HTML
                
                successListHtml += `
                    <div class="imported-config-item" 
                         data-config-id="${configId}"
                         style="padding: 10px; background: var(--bg-secondary, #f5f5f5); border-radius: 4px; border-left: 3px solid #4caf50; cursor: pointer;" 
                         onmouseover="this.style.background='var(--bg-hover, #e8f5e9)'"
                         onmouseout="this.style.background='var(--bg-secondary, #f5f5f5)'">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <i class="fa ${typeIcon}" style="color: var(--text-secondary, #666);"></i>
                            <span style="font-weight: 600; color: var(--text-primary); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${fileName}">${fileName}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary, #666);">
                            ${typeName}
                        </div>
                    </div>
                `;
            });
            
            successListHtml += `
                        </div>
                    </div>
                </div>
            `;
        }

        // 构建失败列表HTML
        let failedListHtml = '';
        if (failedCount > 0) {
            failedListHtml = `
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <i class="fa fa-exclamation-circle" style="color: #f44336; font-size: 18px;"></i>
                        <h4 style="margin: 0; color: #f44336;">导入失败 (${failedCount})</h4>
                    </div>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color, #ddd); border-radius: 4px; padding: 8px;">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
            `;
            
            results.failed.forEach((item, index) => {
                failedListHtml += `
                    <div style="padding: 10px; background: var(--bg-secondary, #f5f5f5); border-radius: 4px; border-left: 3px solid #f44336;">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px; font-size: 14px;">
                            ${item.fileName || '未知文件'}
                        </div>
                        <div style="font-size: 12px; color: #f44336;">
                            ${item.error || '未知错误'}
                        </div>
                    </div>
                `;
            });
            
            failedListHtml += `
                        </div>
                    </div>
                </div>
            `;
        }

        // 创建模态框
        let modalRef = null;
        const modal = createModal({
            title: '导入结果',
            content: `
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-secondary, #f5f5f5); border-radius: 8px;">
                        <div style="flex: 1;">
                            <div style="font-size: 14px; color: var(--text-secondary, #666); margin-bottom: 4px;">总计</div>
                            <div style="font-size: 24px; font-weight: 600; color: var(--text-primary);">${totalCount}</div>
                        </div>
                        <div style="flex: 1; border-left: 1px solid var(--border-color, #ddd); padding-left: 12px;">
                            <div style="font-size: 14px; color: var(--text-secondary, #666); margin-bottom: 4px;">成功</div>
                            <div style="font-size: 24px; font-weight: 600; color: #4caf50;">${successCount}</div>
                        </div>
                        <div style="flex: 1; border-left: 1px solid var(--border-color, #ddd); padding-left: 12px;">
                            <div style="font-size: 14px; color: var(--text-secondary, #666); margin-bottom: 4px;">失败</div>
                            <div style="font-size: 24px; font-weight: 600; color: #f44336;">${failedCount}</div>
                        </div>
                    </div>
                </div>
                ${successListHtml}
                ${failedListHtml}
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color, #ddd);">
                    <small style="color: var(--text-secondary, #666);">
                        提示：点击成功的配置项可以快速打开该配置
                    </small>
                </div>
            `,
            width: '800px',
            buttons: [
                { 
                    text: '关闭', 
                    className: 'btn btn-primary', 
                    onClick: () => {
                        if (modalRef && modalRef.close) {
                            modalRef.close();
                        }
                    }
                }
            ]
        });

        if (!modal) {
            console.error('无法创建导入结果模态框');
            return;
        }

        modalRef = modal;
        modal.show();

        // 绑定点击事件（使用事件委托，避免在onclick中直接使用字符串）
        setTimeout(() => {
            const modalElement = modalRef?.element;
            if (modalElement) {
                // 使用事件委托处理配置项点击
                modalElement.addEventListener('click', (e) => {
                    const configItem = e.target.closest('.imported-config-item');
                    if (configItem) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        if (window.uiManager && typeof window.uiManager.selectConfig === 'function') {
                            const configId = configItem.dataset.configId;
                            if (configId) {
                                try {
                                    window.uiManager.selectConfig(configId);
                                    if (modalRef && modalRef.close) {
                                        modalRef.close();
                                    }
                                } catch (error) {
                                    console.error('打开配置失败:', error);
                                    showNotification('错误', '打开配置失败: ' + error.message, 'error');
                                }
                            }
                        }
                    }
                });
            }
        }, 100);
    }

    /**
     * 处理配置选择
     */
    handleConfigSelect(event) {
        const checkbox = event.target;
        const configId = checkbox.dataset.configId;
        
        // 更新批量操作工具栏
        const selectedIds = this.getSelectedConfigIds();
        this.updateBatchActionsBar(selectedIds);
    }

    /**
     * 获取选中的配置ID列表
     */
    getSelectedConfigIds() {
        const checkboxes = document.querySelectorAll('.config-select-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.dataset.configId);
    }

    /**
     * 确保批量操作工具栏存在
     */
    ensureBatchActionsBar() {
        let bar = document.getElementById('batch-actions-bar');
        if (!bar) {
            const configList = document.getElementById('config-list');
            if (!configList) return;

            // 查找配置列表的父容器
            const sidebar = configList.closest('.sidebar');
            if (!sidebar) return;

            bar = document.createElement('div');
            bar.id = 'batch-actions-bar';
            bar.className = 'batch-actions-bar';
            bar.style.cssText = `
                display: none;
                position: sticky;
                top: 0;
                z-index: 10;
                padding: 12px;
                background: var(--bg-secondary, #f8f9fa);
                border-bottom: 2px solid var(--color-primary, #007bff);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 8px;
            `;
            bar.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <span id="batch-selected-count" style="font-weight: 600; color: var(--text-primary); font-size: 14px;">
                            已选择 <span id="selected-count-number" style="color: var(--color-primary, #007bff);">0</span> 个配置
                        </span>
                        <button class="btn btn-sm btn-outline" id="btn-select-all" style="font-size: 12px; padding: 6px 12px;">
                            <i class="fa fa-check-square-o"></i> 全选
                        </button>
                        <button class="btn btn-sm btn-outline" id="btn-select-none" style="font-size: 12px; padding: 6px 12px;">
                            <i class="fa fa-square-o"></i> 取消全选
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-sm btn-primary" id="btn-batch-export-selected" style="font-size: 12px; padding: 6px 12px;">
                            <i class="fa fa-download"></i> 导出选中
                        </button>
                        <button class="btn btn-sm btn-danger" id="btn-batch-delete-selected" style="font-size: 12px; padding: 6px 12px;">
                            <i class="fa fa-trash"></i> 删除选中
                        </button>
                    </div>
                </div>
            `;
            // 插入到配置列表之前
            configList.parentNode.insertBefore(bar, configList);

            // 绑定事件
            document.getElementById('btn-select-all').addEventListener('click', () => {
                document.querySelectorAll('.config-select-checkbox').forEach(cb => cb.checked = true);
                this.updateBatchActionsBar(this.getSelectedConfigIds());
            });

            document.getElementById('btn-select-none').addEventListener('click', () => {
                document.querySelectorAll('.config-select-checkbox').forEach(cb => cb.checked = false);
                this.updateBatchActionsBar([]);
            });

            document.getElementById('btn-batch-export-selected').addEventListener('click', () => {
                this.handleBatchExportSelected();
            });

            document.getElementById('btn-batch-delete-selected').addEventListener('click', () => {
                this.handleBatchDeleteSelected();
            });
        }
    }

    /**
     * 更新批量操作工具栏
     */
    updateBatchActionsBar(selectedIds) {
        const bar = document.getElementById('batch-actions-bar');
        if (!bar) return;

        const count = selectedIds.length;
        const countElement = document.getElementById('selected-count-number');
        if (countElement) {
            countElement.textContent = count;
        }

        if (count > 0) {
            bar.style.display = 'block';
        } else {
            bar.style.display = 'none';
        }
    }

    /**
     * 处理批量导出选中配置
     */
    async handleBatchExportSelected() {
        const selectedIds = this.getSelectedConfigIds();
        if (selectedIds.length === 0) {
            showNotification('提示', '请先选择要导出的配置', 'info');
            return;
        }

        // 显示批量导出对话框
        const modal = createModal({
            title: '批量导出配置',
            content: `
                <div style="margin-bottom: 16px;">
                    <p>已选择 <strong>${selectedIds.length}</strong> 个配置</p>
                    <p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">
                        选择导出格式：
                    </p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                    <button class="btn btn-primary" id="batch-export-json" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px;">
                        <i class="fa fa-file-text-o" style="font-size: 24px;"></i>
                        <div>
                            <div style="font-weight: 600;">JSON格式</div>
                            <div style="font-size: 12px; opacity: 0.8;">合并为一个文件</div>
                        </div>
                    </button>
                    <button class="btn btn-outline" id="batch-export-zip" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px;">
                        <i class="fa fa-file-archive-o" style="font-size: 24px;"></i>
                        <div>
                            <div style="font-weight: 600;">ZIP格式</div>
                            <div style="font-size: 12px; opacity: 0.8;">每个配置单独文件</div>
                        </div>
                    </button>
                </div>
            `,
            buttons: [
                { text: '取消', className: 'btn-outline', onClick: (modal) => modal.close() }
            ]
        });

        if (!modal) return;
        modal.show();

        // 绑定导出按钮
        setTimeout(() => {
            const jsonBtn = document.getElementById('batch-export-json');
            const zipBtn = document.getElementById('batch-export-zip');
            
            if (jsonBtn) {
                jsonBtn.addEventListener('click', async () => {
                    try {
                        const result = await this.batchService.batchExport(selectedIds, 'json');
                        this.downloadFile(result.content, result.filename, result.mimeType);
                        showNotification('成功', `已导出 ${selectedIds.length} 个配置`, 'success');
                        modal.close();
                    } catch (error) {
                        showNotification('错误', error.message, 'error');
                    }
                });
            }

            if (zipBtn) {
                zipBtn.addEventListener('click', async () => {
                    try {
                        // 检查JSZip是否加载
                        if (typeof JSZip === 'undefined') {
                            showNotification('错误', 'JSZip库未加载，请刷新页面后重试', 'error');
                            return;
                        }

                        const result = await this.batchService.batchExport(selectedIds, 'zip');
                        this.downloadFile(result.content, result.filename, result.mimeType);
                        showNotification('成功', `已导出 ${selectedIds.length} 个配置为ZIP文件（每个配置单独文件）`, 'success');
                        modal.close();
                    } catch (error) {
                        console.error('ZIP导出错误:', error);
                        showNotification('错误', error.message || 'ZIP导出失败，请检查JSZip库是否加载', 'error');
                    }
                });
            }
        }, 100);
    }

    /**
     * 处理批量删除选中配置
     */
    async handleBatchDeleteSelected() {
        const selectedIds = this.getSelectedConfigIds();
        if (selectedIds.length === 0) {
            showNotification('提示', '请先选择要删除的配置', 'info');
            return;
        }

        const confirmed = await showConfirm(`确定要删除选中的 ${selectedIds.length} 个配置吗？此操作不可撤销。`);
        if (!confirmed) return;

        try {
            const results = await this.batchService.batchDelete(selectedIds);
            
            // 重新加载配置列表
            await this.loadConfigs();
            this.checkIdConflicts();

            if (results.success.length > 0) {
                showNotification('成功', `已删除 ${results.success.length} 个配置`, 'success');
            }
            
            if (results.failed.length > 0) {
                showNotification('警告', `${results.failed.length} 个配置删除失败`, 'warning');
            }

            // 清除所有选择
            document.querySelectorAll('.config-select-checkbox').forEach(cb => cb.checked = false);
            this.updateBatchActionsBar([]);
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
    }

    /**
     * 下载文件
     */
    downloadFile(content, filename, mimeType) {
        const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

/**
 * UI管理器
 * 管理所有用户界面交互
 */

import { showNotification, showConfirm, createModal, formatDate, debounce, deepClone } from './utils/helpers.js';
import { CONFIG_TYPES, CONFIG_TYPE_INFO, TAG_DATA, TYPE_SPECIFIC_FIELDS, BUFF_DATA, BUFF_CATEGORIES } from './utils/constants.js';

export class UIManager {
    constructor(store, configService, exportService, importService) {
        this.store = store;
        this.configService = configService;
        this.exportService = exportService;
        this.importService = importService;
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
     * 更新配置列表
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
            return;
        }

        listEl.innerHTML = '';
        configs.forEach(config => {
            const item = this.createConfigListItem(config, state.currentConfig);
            listEl.appendChild(item);
        });
    }

    /**
     * 创建配置列表项
     */
    createConfigListItem(config, currentConfig) {
        const typeInfo = CONFIG_TYPE_INFO[config.type] || CONFIG_TYPE_INFO[CONFIG_TYPES.ITEM];
        const isActive = currentConfig && currentConfig.id === config.id;

        const item = document.createElement('div');
        item.className = `config-item ${isActive ? 'active' : ''}`;
        item.innerHTML = `
            <div class="config-item-header">
                <i class="fa ${typeInfo.icon} config-item-icon"></i>
                <div class="config-item-title">${config.fileName}</div>
            </div>
            <div class="config-item-meta">
                <div class="config-item-type">
                    <span>${typeInfo.name}</span>
                </div>
                <div class="config-item-date">${formatDate(config.lastModified, 'MM-DD HH:mm')}</div>
            </div>
        `;

        item.addEventListener('click', () => this.selectConfig(config.id));
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
                            <input type="text" class="form-input" id="DisplayName" value="${c.DisplayName || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">本地化键名</label>
                            <input type="text" class="form-input" id="LocalizationKey" value="${c.LocalizationKey || ''}">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 mb-3">
                        <div class="form-group">
                            <label class="form-label">物品描述</label>
                            <input type="text" class="form-input" id="LocalizationDescValue" value="${c.LocalizationDescValue || ''}" placeholder="输入物品描述">
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
        const tagOptions = TAG_DATA.map(([key, value]) => {
            const isSelected = selectedTags.includes(key);
            return `
                <label class="tag ${isSelected ? 'tag-primary' : ''}">
                    <input type="checkbox" value="${key}" ${isSelected ? 'checked' : ''} style="display:none">
                    <span>${value}</span>
                </label>
            `;
        }).join('');

        return `
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">🏷️ 标签</h3>
                </div>
                <div class="card-body">
                    <div id="tagsContainer" style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${tagOptions}
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
                specificFieldsHtml = this.renderItemFields(config);
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
                <div class="card-header">
                    <h3 class="card-title">🔫 枪械属性</h3>
                </div>
                <div class="card-body">
                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">基础性能</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">射程</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="DistanceMultiplier" value="${weaponProps.DistanceMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹速度</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BulletSpeedMultiplier" value="${weaponProps.BulletSpeedMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准时间</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ADSTimeMultiplier" value="${weaponProps.ADSTimeMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">射击速度</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ShootSpeedMultiplier" value="${weaponProps.ShootSpeedMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">容量</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="CapacityMultiplier" value="${weaponProps.CapacityMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">换弹速度</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ReloadSpeedMultiplier" value="${weaponProps.ReloadSpeedMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">伤害系统</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">基础伤害</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BaseDamageMultiplier" value="${weaponProps.BaseDamageMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">伤害</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="DamageMultiplier" value="${weaponProps.DamageMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">暴击几率</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="CriticalChanceMultiplier" value="${weaponProps.CriticalChanceMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">暴击伤害</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="CriticalDamageFactorMultiplier" value="${weaponProps.CriticalDamageFactorMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">穿透</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="PenetrateMultiplier" value="${weaponProps.PenetrateMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">穿甲</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ArmorPiercingMultiplier" value="${weaponProps.ArmorPiercingMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">破甲</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ArmorBreakMultiplier" value="${weaponProps.ArmorBreakMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">爆炸伤害</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ExplosionDamageMultiplier" value="${weaponProps.ExplosionDamageMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">爆炸范围</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ExplosionRangeMultiplier" value="${weaponProps.ExplosionRangeMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">精度系统</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">精度</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="AccuracyMultiplier" value="${weaponProps.AccuracyMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">散射因子</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterFactorMultiplier" value="${weaponProps.ScatterFactorMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准散射因子</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterFactorADSMultiplier" value="${weaponProps.ScatterFactorADSMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">默认散射</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="DefaultScatterMultiplier" value="${weaponProps.DefaultScatterMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准默认散射</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="DefaultScatterADSMultiplier" value="${weaponProps.DefaultScatterADSMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">最大散射</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="MaxScatterMultiplier" value="${weaponProps.MaxScatterMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准最大散射</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="MaxScatterADSMultiplier" value="${weaponProps.MaxScatterADSMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">散射增长</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterGrowMultiplier" value="${weaponProps.ScatterGrowMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准散射增长</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterGrowADSMultiplier" value="${weaponProps.ScatterGrowADSMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">散射恢复</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterRecoverMultiplier" value="${weaponProps.ScatterRecoverMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准散射恢复</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ScatterRecoverADSMultiplier" value="${weaponProps.ScatterRecoverADSMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">后坐力系统</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">垂直最小后坐力</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilVMinMultiplier" value="${weaponProps.RecoilVMinMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">垂直最大后坐力</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilVMaxMultiplier" value="${weaponProps.RecoilVMaxMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">水平最小后坐力</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilHMinMultiplier" value="${weaponProps.RecoilHMinMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">水平最大后坐力</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilHMaxMultiplier" value="${weaponProps.RecoilHMaxMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">垂直后坐力缩放</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilScaleVMultiplier" value="${weaponProps.RecoilScaleVMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">水平后坐力缩放</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilScaleHMultiplier" value="${weaponProps.RecoilScaleHMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力恢复</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilRecoverMultiplier" value="${weaponProps.RecoilRecoverMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力时间</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilTimeMultiplier" value="${weaponProps.RecoilTimeMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">后坐力恢复时间</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="RecoilRecoverTimeMultiplier" value="${weaponProps.RecoilRecoverTimeMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-secondary mb-2">移动性能</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">移动速度加成</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="MoveSpeedMultiplierAdd" value="${weaponProps.MoveSpeedMultiplierAdd || 0.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准移动速度加成</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ADSMoveSpeedMultiplierAdd" value="${weaponProps.ADSSpeedMultiplierAdd || 0.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">瞄准距离因子</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ADSAimDistanceFactorMultiplier" value="${weaponProps.ADSAimDistanceFactorMultiplier || 1.0}">
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-secondary mb-2">其他属性</h4>
                        <div class="grid grid-cols-3">
                            <div class="form-group">
                                <label class="form-label">射击数量</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ShotCountMultiplier" value="${weaponProps.ShotCountMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">射击角度</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="ShotAngleMultiplier" value="${weaponProps.ShotAngleMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">连发数量</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BurstCountMultiplier" value="${weaponProps.BurstCountMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">声音范围</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="SoundRangeMultiplier" value="${weaponProps.SoundRangeMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">增益几率</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BuffChanceMultiplier" value="${weaponProps.BuffChanceMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹流血几率</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BulletBleedChanceMultiplier" value="${weaponProps.BulletBleedChanceMultiplier || 1.0}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">子弹耐久度消耗</label>
                                <input type="number" step="0.1" class="form-input weapon-field" data-key="BulletDurabilityCostMultiplier" value="${weaponProps.BulletDurabilityCostMultiplier || 1.0}">
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
                <div class="card-header">
                    <h3 class="card-title">🩸 弹药属性</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-3">
                        <div class="form-group">
                            <label class="form-label">新增暴击率</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewCritRateGain" value="${ammoProps.NewCritRateGain || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增暴击伤害系数</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewCritDamageFactorGain" value="${ammoProps.NewCritDamageFactorGain || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增穿甲值</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewArmorPiercingGain" value="${ammoProps.NewArmorPiercingGain || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增伤害</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewDamageMultiplier" value="${ammoProps.NewDamageMultiplier || 1.0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增爆炸范围</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewExplosionRange" value="${ammoProps.NewExplosionRange || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增增益几率</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewBuffChanceMultiplier" value="${ammoProps.NewBuffChanceMultiplier || 1.0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增流血几率</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewBleedChance" value="${ammoProps.NewBleedChance || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增爆炸伤害</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewExplosionDamage" value="${ammoProps.NewExplosionDamage || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增破甲值</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewArmorBreakGain" value="${ammoProps.NewArmorBreakGain || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增耐久度消耗</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewDurabilityCost" value="${ammoProps.NewDurabilityCost || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增子弹速度</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewBulletSpeed" value="${ammoProps.NewBulletSpeed || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新增子弹射程</label>
                            <input type="number" step="0.1" class="form-input ammo-field" data-key="NewBulletDistance" value="${ammoProps.NewBulletDistance || 0}">
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
                <div class="card-header">
                    <h3 class="card-title">🗡️ 近战武器属性</h3>
                </div>
                <div class="card-body">
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
                            <label class="form-label">新增移动速度</label>
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
                <div class="card-header">
                    <h3 class="card-title">🔧 配件槽位配置</h3>
                </div>
                <div class="card-body">
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

        // 基础字段
        const basicFields = [
            'OriginalItemId', 'NewItemId', 'DisplayName', 'LocalizationKey',
            'Weight', 'Value', 'Quality'
        ];

        basicFields.forEach(field => {
            const el = document.getElementById(field);
            if (el) {
                const value = el.type === 'number' ? parseFloat(el.value) || 0 : el.value;
                config.content[field] = value;
            }
        });

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

        // 标签
        const selectedTags = Array.from(document.querySelectorAll('#tagsContainer input:checked'))
            .map(cb => cb.value);
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
            const tagsSelect = item.querySelector('.recipe-tags');
            const selectedTag = tagsSelect?.value || '';
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
                    CraftingTags: selectedTag ? [selectedTag] : [],
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
        
        // 清理其他不支持的字段
        delete config.content.LocalizationDesc;
        delete config.content.MaxStackCount;
        delete config.content.Order;
        delete config.content.DisplayQuality;
        delete config.content.HealValue;
        delete config.content.UseDurability;
        delete config.content.DurabilityUsageDrug;
        delete config.content.MaxDurability;
        delete config.content.DurabilityLoss;
        delete config.content.UseTime;
        delete config.content.EnergyValue;
        delete config.content.WaterValue;
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
                    const value = parseFloat(field.value) || 0;
                    if (value !== 0 && value !== 1.0) { // 只保存非默认值
                        ammoProps[key] = value;
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
        const itemProps = config.content.ItemProperties || {};
        
        return `
            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">📦 物品属性</h3>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-3">
                        <div class="form-group">
                            <label class="form-label">最大堆叠数量</label>
                            <input type="number" class="form-input item-field" data-key="MaxStackCount" value="${itemProps.MaxStackCount || 1}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">最大耐久度</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="MaxDurability" value="${itemProps.MaxDurability || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">耐久度损失率</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="DurabilityLoss" value="${itemProps.DurabilityLoss || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">使用时间（秒）</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="UseTime" value="${itemProps.UseTime || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">能量值</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="EnergyValue" value="${itemProps.EnergyValue || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">口渴值</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="WaterValue" value="${itemProps.WaterValue || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">治疗值</label>
                            <input type="number" class="form-input item-field" data-key="HealValue" value="${itemProps.HealValue || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">使用耐久度消耗</label>
                            <input type="number" step="0.1" class="form-input item-field" data-key="UseDurability" value="${itemProps.UseDurability || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">排序顺序</label>
                            <input type="number" class="form-input item-field" data-key="Order" value="${itemProps.Order || 0}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">显示品质等级</label>
                            <input type="number" class="form-input item-field" data-key="DisplayQuality" value="${itemProps.DisplayQuality || 0}">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 mt-3">
                        <div class="form-checkbox">
                            <input type="checkbox" class="item-field" data-key="Repairable" ${itemProps.Repairable ? 'checked' : ''}>
                            <label>可修复</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" class="item-field" data-key="UseDurabilityDrug" ${itemProps.UseDurabilityDrug ? 'checked' : ''}>
                            <label>药物消耗耐久度</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" class="item-field" data-key="CanUsePartDrug" ${itemProps.CanUsePartDrug ? 'checked' : ''}>
                            <label>可部分使用药物</label>
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
        const inputs = document.querySelectorAll('#editor-content input, #editor-content select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
            });
        });

        // 标签选择
        const tagLabels = document.querySelectorAll('#tagsContainer label');
        tagLabels.forEach(label => {
            label.addEventListener('click', () => {
                const checkbox = label.querySelector('input');
                checkbox.checked = !checkbox.checked;
                label.classList.toggle('tag-primary', checkbox.checked);
                this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: true });
            });
        });

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
                    <input type="text" class="form-input" value="WorkBenchAdvanced (高级工作台)" readonly style="background-color: var(--bg-secondary);">
                    <input type="hidden" class="recipe-tags" value="WorkBenchAdvanced">
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
                const value = el.type === 'number' ? parseFloat(el.value) || 0 : el.value;
                config.content[field] = value;
            }
        });

        // 确保移除不需要的字段
        delete config.content.SoundKey;
        delete config.content.ModuleRootDir;

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

        // 标签
        const selectedTags = Array.from(document.querySelectorAll('#tagsContainer input:checked'))
            .map(cb => cb.value);
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
            const tagsSelect = item.querySelector('.recipe-tags');
            const selectedTag = tagsSelect?.value || '';
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
                    CraftingTags: selectedTag ? [selectedTag] : [],
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
                if (Object.keys(weaponProps).length > 0) {
                    config.content.WeaponProperties = weaponProps;
                }
                break;

            case 'ammo':
                const ammoFields = document.querySelectorAll('.ammo-field');
                const ammoProps = {};
                ammoFields.forEach(field => {
                    const key = field.dataset.key;
                    const value = parseFloat(field.value) || 0;
                    if (value !== 0 && value !== 1.0) { // 只保存非默认值
                        ammoProps[key] = value;
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
            await this.configService.updateConfig(config.id, config.content);
            this.store.dispatch({ type: 'SET_UNSAVED_CHANGES', payload: false });
            showNotification('成功', '配置已保存', 'success');
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
    }

    async handleExport() {
        const state = this.store.getState();
        if (!state.currentConfig) return;

        try {
            await this.exportService.exportConfig(state.currentConfig);
            showNotification('成功', '配置已导出', 'success');
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
    }

    async handleCopyClipboard() {
        const state = this.store.getState();
        if (!state.currentConfig) return;

        try {
            await this.exportService.exportToClipboard(state.currentConfig);
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
            showNotification('成功', '配置已删除', 'success');
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
    }

    handleUndo() {
        // TODO: 实现撤销功能
        showNotification('提示', '撤销功能开发中', 'info');
    }

    handleRedo() {
        // TODO: 实现重做功能
        showNotification('提示', '重做功能开发中', 'info');
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
                showNotification('成功', `成功导入 ${config.length} 个配置`, 'success');
            } else {
                await this.selectConfig(config.id);
                showNotification('成功', '配置导入成功', 'success');
            }
            e.target.value = '';
        } catch (error) {
            showNotification('错误', error.message, 'error');
            e.target.value = '';
        }
    }

    async handleClipboardImport() {
        try {
            const config = await this.importService.importFromClipboard();
            if (Array.isArray(config)) {
                showNotification('成功', `成功导入 ${config.length} 个配置`, 'success');
            } else {
                await this.selectConfig(config.id);
                showNotification('成功', '从剪贴板导入成功', 'success');
            }
        } catch (error) {
            showNotification('错误', error.message, 'error');
        }
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
                            <input type="text" class="form-input" value="WorkBenchAdvanced (高级工作台)" readonly style="background-color: var(--bg-secondary);">
                            <input type="hidden" class="recipe-tags" value="WorkBenchAdvanced">
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
}

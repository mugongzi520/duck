// 配置文件管理核心逻辑
class ConfigManager {
    constructor() {
        this.configs = [];
        this.icons = [];
        this.currentConfig = null;
        this.configDir = './Configs'; // 相对于HTML文件的路径
        this.iconsDir = './icons';
        
        // 验证规则映射 - 根据mshook.cs中的实现定义
        this.VALIDATION_RULES = {
            weapon: {
                validFields: [
                    'DistanceMultiplier', 'BulletSpeedMultiplier', 'ADSTimeMultiplier',
                    'ScatterRecoverADSMultiplier', 'ShootSpeedMultiplier', 'MoveSpeedMultiplierAdd',
                    'ADSMoveSpeedMultiplierAdd', 'BaseDamageMultiplier', 'RangeAddition',
                    'BulletSpeedAddition', 'CriticalChanceMultiplier', 'ReloadSpeedMultiplier',
                    'AccuracyMultiplier', 'DamageMultiplier', 'CriticalDamageFactorMultiplier',
                    'PenetrateMultiplier', 'ArmorPiercingMultiplier', 'ArmorBreakMultiplier',
                    'ExplosionDamageMultiplier', 'ExplosionRangeMultiplier', 'ShotCountMultiplier',
                    'ShotAngleMultiplier', 'BurstCountMultiplier', 'SoundRangeMultiplier',
                    'ADSAimDistanceFactorMultiplier', 'ScatterFactorMultiplier', 'ScatterFactorADSMultiplier',
                    'DefaultScatterMultiplier', 'DefaultScatterADSMultiplier', 'MaxScatterMultiplier',
                    'MaxScatterADSMultiplier', 'ScatterGrowMultiplier', 'ScatterGrowADSMultiplier',
                    'ScatterRecoverMultiplier', 'RecoilVMinMultiplier', 'RecoilVMaxMultiplier',
                    'RecoilHMinMultiplier', 'RecoilHMaxMultiplier', 'RecoilScaleVMultiplier',
                    'RecoilScaleHMultiplier', 'RecoilRecoverMultiplier', 'RecoilTimeMultiplier',
                    'RecoilRecoverTimeMultiplier', 'CapacityMultiplier', 'BuffChanceMultiplier',
                    'BulletBleedChanceMultiplier', 'BulletDurabilityCostMultiplier'
                ]
            },
            melee: {
                validFields: [
                    'NewDamage', 'NewCritRate', 'NewCritDamageFactor', 'NewArmorPiercing',
                    'NewAttackSpeed', 'NewAttackRange', 'NewStaminaCost', 'NewBleedChance',
                    'NewMoveSpeedMultiplier'
                ],
                specialChecks: (props) => {
                    // 近战武器移动速度倍数检查 - mshook.cs中只是检查，不抛出错误
                    if (props.NewMoveSpeedMultiplier !== undefined && props.NewMoveSpeedMultiplier !== null && props.NewMoveSpeedMultiplier !== 1.0) {
                        return { isValid: true, warnings: ['近战武器移动速度倍数不为1.0，请注意游戏兼容性'] };
                    }
                    return { isValid: true, warnings: [] };
                }
            },
            ammo: {
                validFields: [
                    'NewCritRateGain', 'NewCritDamageFactorGain', 'NewArmorPiercingGain',
                    'NewDamageMultiplier', 'NewExplosionRange', 'NewBuffChanceMultiplier',
                    'NewBleedChance', 'NewExplosionDamage', 'NewArmorBreakGain',
                    'NewDurabilityCost', 'NewBulletSpeed', 'NewBulletDistance'
                ]
            },
            accessory: {
                validFields: [
                    'ScatterRecoverADS', 'MaxScatterADS', 'ADSTime', 'ADSAimDistanceFactor',
                    'ScatterFactorADS', 'MaxScatter', 'ScatterRecover', 'DefaultScatter',
                    'ScatterFactor', 'RecoilScaleV', 'RecoilScaleH', 'Damage', 'CritRate',
                    'CritDamageFactor', 'BulletSpeed', 'BulletDistance', 'ShootSpeed',
                    'MoveSpeedMultiplier', 'SoundRange', 'Capacity', 'ReloadTime', 'FlashLight'
                ]
            }
        };
    }

    /**
     * 初始化配置管理器
     */
    async initialize() {
        try {
            // 初始化标签数据
            this.initializeTagData();
            
            await this.loadIcons();
            // 注意：由于浏览器安全限制，无法直接访问本地文件系统的文件
            // 这里我们模拟从本地存储加载配置
            this.loadConfigsFromStorage();
            
            // 初始化标签选择器
            this.initializeTagSelector();
            
            // 设置事件监听器
            this.setupEventListeners();
        } catch (error) {
            console.error('初始化配置管理器失败:', error);
            // 使用简单的alert作为后备，避免通知系统也可能出错
            alert('初始化失败: ' + error.message);
        }
    }
    
    /**
     * 初始化标签数据
     */
    
    /**
     * 初始化标签选择器
     */
    initializeTagSelector() {
        const tagsContainer = document.getElementById('tags-container');
        if (!tagsContainer) return;
        
        // 清空容器
        tagsContainer.innerHTML = '';
        
        // 添加所有标签选项
        Object.entries(this.tagData).forEach(([key, value]) => {
            const tagOption = document.createElement('label');
            tagOption.className = 'inline-flex items-center px-2 py-1 rounded-full text-sm cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors';
            tagOption.innerHTML = `
                <input type="checkbox" data-tag="${key}" class="mr-1 h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded">
                <span>${value}</span>
            `;
            
            // 添加事件监听
            const checkbox = tagOption.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', this.onTagCheckboxChange.bind(this));
            
            tagsContainer.appendChild(tagOption);
        });
    }
    
    /**
     * 标签选择变化处理
     */
    onTagCheckboxChange() {
        const selectedTags = [];
        document.querySelectorAll('#tags-container input[type="checkbox"]:checked').forEach(checkbox => {
            selectedTags.push(checkbox.dataset.tag);
        });
        
        // 更新隐藏输入框的值
        const hiddenInput = document.getElementById('tags');
        if (hiddenInput) {
            hiddenInput.value = selectedTags.join(',');
        }
    }
    
    /**
     * 过滤标签
     */
    filterTags(event) {
        const searchTerm = event.target.value.toLowerCase();
        const tagOptions = document.querySelectorAll('#tags-container label');
        
        tagOptions.forEach(option => {
            const tagText = option.querySelector('span').textContent.toLowerCase();
            const tagKey = option.querySelector('input').dataset.tag.toLowerCase();
            
            if (tagText.includes(searchTerm) || tagKey.includes(searchTerm)) {
                option.style.display = 'flex';
            } else {
                option.style.display = 'none';
            }
        });
    }
    
    /**
     * 设置选中的标签
     */
    setSelectedTags(tags) {
        // 重置所有复选框
        document.querySelectorAll('#tags-container input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // 选中指定的标签
        if (tags && Array.isArray(tags)) {
            tags.forEach(tag => {
                const checkbox = document.querySelector(`#tags-container input[type="checkbox"][data-tag="${tag}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
        
        // 更新隐藏输入框
        this.onTagCheckboxChange();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        try {
            // 安全地获取并绑定事件
            const bindEvent = (elementId, eventName, handler) => {
                const element = document.getElementById(elementId);
                if (element && typeof handler === 'function') {
                    try {
                        // 使用箭头函数避免bind问题
                        element.addEventListener(eventName, (e) => handler.call(this, e));
                    } catch (err) {
                        console.warn(`绑定${elementId}的${eventName}事件失败:`, err);
                    }
                } else {
                    console.warn(`无法找到元素${elementId}或处理函数不是有效函数`);
                }
            };
            
            // 配置类型切换
            bindEvent('config-type', 'change', this.updateSpecificProperties);
            
            // 标签搜索
            const tagSearch = document.getElementById('tag-search');
            if (tagSearch) {
                bindEvent('tag-search', 'input', this.filterTags);
            }
            
            // 配置保存
            bindEvent('btn-save-config', 'click', this.saveConfig);
            bindEvent('btn-save-config-bottom', 'click', this.saveConfig);
            
            // 配置导出
            bindEvent('btn-export-config', 'click', this.exportConfig);
            
            // 配置删除
            bindEvent('btn-delete-config', 'click', this.deleteConfig);
            
            // 文件上传
            bindEvent('file-input', 'change', this.handleFileUpload);
            
            // 导入配置按钮
            bindEvent('btn-import-config', 'click', () => {
                const fileInput = document.getElementById('file-input');
                if (fileInput) {
                    fileInput.click();
                }
            });
            // 图片上传相关
            bindEvent('btn-upload-icon', 'click', this.showImageUploadModal);
            bindEvent('confirm-image-upload', 'click', this.uploadImage);
            bindEvent('image-input', 'change', this.previewImage);
        } catch (error) {
            console.error('设置事件监听器失败:', error);
        }
    }

    /**
     * 加载配置文件列表
     * 注意：由于浏览器安全限制，这里使用模拟数据
     */
    async loadConfigsFromDirectory() {
        try {
            // 实际环境中，这里应该通过服务器API读取Configs目录
            console.log('尝试从目录加载配置:', this.configDir);
            
            // 模拟从Configs目录读取配置
            // 由于浏览器的安全限制，直接读取本地文件系统是不可能的
            // 需要通过服务器端API实现
            
            return [];
        } catch (error) {
            console.error('加载配置文件失败:', error);
            return [];
        }
    }

    /**
     * 从本地存储加载配置
     */
    loadConfigsFromStorage() {
        try {
            const storedConfigs = localStorage.getItem('configManager_configs');
            if (storedConfigs) {
                this.configs = JSON.parse(storedConfigs);
                this.updateConfigList();
            } else {
                // 如果没有存储的配置，创建一些示例配置
                this.createSampleConfigs();
            }
        } catch (error) {
            console.error('从本地存储加载配置失败:', error);
            this.configs = [];
        }
    }

    /**
     * 创建示例配置
     */
    createSampleConfigs() {
        const sampleConfigs = [
            {
                id: '1',
                fileName: 'custom_weapon_001',
                type: 'weapon',
                lastModified: new Date().toISOString(),
                content: {
                    OriginalItemId: 100,
                    NewItemId: 10001,
                    DisplayName: '高级狙击步枪',
                    LocalizationKey: 'custom_sniper',
                    LocalizationDescValue: '一把威力强大的狙击步枪',
                    Weight: 5.5,
                    Value: 50000,
                    Quality: 8,
                    Tags: ['Weapon', 'Gun', 'GunType_Sniper', 'Repairable'],
                    IconFileName: 'custom_sniper.png',
                    LocalizationDesc: '_Desc',
                    WeaponProperties: {
                        DistanceMultiplier: 1.5,
                        BulletSpeedMultiplier: 1.2,
                        ADSTimeMultiplier: 0.9,
                        ScatterRecoverADSMultiplier: 1.3,
                        ShootSpeedMultiplier: 0.8,
                        MoveSpeedMultiplierAdd: -0.1,
                        BaseDamageMultiplier: 1.4,
                        CriticalChanceMultiplier: 1.2,
                        AccuracyMultiplier: 1.5
                    }
                }
            },
            {
                id: '2',
                fileName: 'custom_ammo_001',
                type: 'ammo',
                lastModified: new Date().toISOString(),
                content: {
                    OriginalItemId: 200,
                    NewItemId: 10002,
                    DisplayName: '穿甲弹',
                    LocalizationKey: 'custom_armor_piercing',
                    LocalizationDescValue: '能够穿透护甲的特殊子弹',
                    Weight: 0.1,
                    Value: 1000,
                    Quality: 7,
                    Tags: ['Bullet'],
                    IconFileName: 'custom_ammo.png',
                    LocalizationDesc: '_Desc',
                    AmmoProperties: {
                        NewPierceValue: 3,
                        NewDamageMultiplier: 1.2,
                        NewArmorPiercingGain: 5,
                        NewCriticalDamageMultiplier: 1.1
                    }
                }
            }
        ];
        
        this.configs = sampleConfigs;
        this.saveConfigsToStorage();
        this.updateConfigList();
    }

    /**
     * 保存配置到本地存储
     */
    saveConfigsToStorage() {
        localStorage.setItem('configManager_configs', JSON.stringify(this.configs));
    }

    /**
     * 加载图标资源
     */
    async loadIcons() {
        try {
            // 实际环境中，这里应该通过服务器API读取icons目录
            console.log('尝试加载图标资源:', this.iconsDir);
            
            // 模拟图标列表
            this.icons = [
                'custom_sniper.png',
                'custom_shotgun.png',
                'custom_pistol.png',
                'custom_knife.png',
                'custom_ammo.png',
                'custom_medkit.png',
                'custom_scope.png',
                'custom_silencer.png'
            ];
        } catch (error) {
            console.error('加载图标资源失败:', error);
            this.icons = [];
        }
    }

    /**
     * 更新配置列表显示
     */
    updateConfigList() {
        const configListEl = document.getElementById('config-list');
        if (!configListEl) return;
        
        configListEl.innerHTML = '';
        
        if (this.configs.length === 0) {
            configListEl.innerHTML = `
                <div class="text-center text-gray-500 py-10">
                    <i class="fa fa-folder-open-o text-3xl mb-2"></i>
                    <p>暂无配置文件</p>
                    <p class="text-sm mt-1">点击"导入配置"或"新建配置"开始</p>
                </div>
            `;
            return;
        }

        this.configs.forEach(config => {
            const configType = this.getConfigTypeInfo(config.type);
            const configItem = document.createElement('div');
            configItem.className = `config-item p-3 rounded-md cursor-pointer mb-1 transition-colors ${this.currentConfig && this.currentConfig.id === config.id ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-gray-50'}`;
            configItem.dataset.id = config.id;
            
            const lastModified = new Date(config.lastModified);
            const formattedDate = lastModified.toLocaleDateString() + ' ' + lastModified.toLocaleTimeString();
            
            configItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <i class="fa ${configType.icon} text-primary mr-2"></i>
                        <div>
                            <div class="font-medium text-sm">${config.fileName}</div>
                            <div class="text-xs text-gray-500">${configType.name}</div>
                        </div>
                    </div>
                    <div class="text-xs text-gray-400 whitespace-nowrap">${formattedDate}</div>
                </div>
            `;
            
            configItem.addEventListener('click', () => this.selectConfig(config.id));
            configListEl.appendChild(configItem);
        });
    }

    /**
     * 获取配置类型信息
     */
    getConfigTypeInfo(type) {
        const types = {
            weapon: { name: '枪械配置', icon: 'fa-crosshairs' },
            melee: { name: '近战武器配置', icon: 'fa-bolt' },
            ammo: { name: '子弹配置', icon: 'fa-bullet' },
            item: { name: '物品配置', icon: 'fa-gift' },
            accessory: { name: '配件配置', icon: 'fa-cogs' }
        };
        return types[type] || { name: '未知类型', icon: 'fa-question' };
    }

    /**
     * 选择配置
     */
    selectConfig(configId) {
        this.currentConfig = this.configs.find(config => config.id === configId);
        if (this.currentConfig) {
            this.loadConfigToEditor(this.currentConfig);
            this.updateConfigList();
            this.showEditMode();
        }
    }

    /**
     * 加载配置到编辑器
     */
    loadConfigToEditor(config) {
        if (!config || !config.content) {
            console.error('无效的配置对象');
            return;
        }
        
        document.getElementById('config-filename').value = config.fileName || `config_${Date.now()}`;
        document.getElementById('config-type').value = config.type || 'item';
        document.getElementById('edit-title').textContent = `编辑 ${config.fileName || '配置'}`;
        
        // 加载基础属性
        const content = config.content;
        document.getElementById('original-item-id').value = content.OriginalItemId || 0;
        document.getElementById('new-item-id').value = content.NewItemId || 0;
        document.getElementById('display-name').value = content.DisplayName || '';
        document.getElementById('localization-key').value = content.LocalizationKey || '';
        document.getElementById('localization-desc-value').value = content.LocalizationDescValue || '';
        document.getElementById('weight').value = content.Weight || 0;
        document.getElementById('value').value = content.Value || 0;
        document.getElementById('quality').value = content.Quality || 5;
        document.getElementById('icon-filename').value = content.IconFileName || '';
        // 设置标签
        if (content.Tags && Array.isArray(content.Tags)) {
            this.setSelectedTags(content.Tags);
        } else {
            this.setSelectedTags([]);
        }
        
        // 更新特定属性区域
        this.updateSpecificProperties();
        
        // 尝试加载图标预览
        this.previewIcon(content.IconFileName);
        
        // 加载合成配方数据
        if (content.FormulaId || content.CraftingMoney || content.ResultItemAmount || 
            content.CraftingTags || content.RequirePerk || content.UnlockByDefault !== undefined || 
            content.HideInIndex !== undefined || content.CostItems) {
            
            // 显示合成配方部分
            const craftingForm = document.getElementById('crafting-form');
            const toggleCraftingText = document.getElementById('toggle-crafting-text');
            if (craftingForm) {
                craftingForm.classList.remove('hidden');
            }
            if (toggleCraftingText) {
                toggleCraftingText.textContent = '隐藏合成配方';
            }
            
            // 填充合成配方字段
            if (document.getElementById('formula-id')) {
                document.getElementById('formula-id').value = content.FormulaId || '';
            }
            if (document.getElementById('crafting-money')) {
                document.getElementById('crafting-money').value = content.CraftingMoney || 0;
            }
            if (document.getElementById('result-item-amount')) {
                document.getElementById('result-item-amount').value = content.ResultItemAmount || 1;
            }
            if (document.getElementById('crafting-tags')) {
                document.getElementById('crafting-tags').value = content.CraftingTags && content.CraftingTags.length > 0 ? content.CraftingTags[0] : '';
            }
            if (document.getElementById('require-perk')) {
                document.getElementById('require-perk').value = content.RequirePerk || '';
            }
            if (document.getElementById('unlock-by-default')) {
                document.getElementById('unlock-by-default').checked = content.UnlockByDefault !== undefined ? content.UnlockByDefault : true;
            }
            if (document.getElementById('hide-in-index')) {
                document.getElementById('hide-in-index').checked = content.HideInIndex !== undefined ? content.HideInIndex : false;
            }
            
            // 加载材料列表
            const costItemsContainer = document.getElementById('cost-items-container');
            if (costItemsContainer && content.CostItems && Array.isArray(content.CostItems)) {
                // 清空现有材料行，只保留一行作为模板
                const firstRow = costItemsContainer.querySelector('.cost-item-row');
                costItemsContainer.innerHTML = '';
                
                if (content.CostItems.length > 0) {
                    // 添加材料行
                    content.CostItems.forEach((costItem, index) => {
                        const newRow = firstRow.cloneNode(true);
                        const itemIdInput = newRow.querySelector('input[placeholder="物品ID"]');
                        const amountInput = newRow.querySelector('input[placeholder="数量"]');
                        
                        if (itemIdInput) itemIdInput.value = costItem.ItemId || '';
                        if (amountInput) amountInput.value = costItem.Amount || 1;
                        
                        costItemsContainer.appendChild(newRow);
                    });
                } else {
                    // 如果没有材料，添加一个空行
                    costItemsContainer.appendChild(firstRow);
                }
            }
        }
    }
    
    /**
     * 预览图标
     */
    previewIcon(iconFileName) {
        // 添加空值检查，修复初始化错误
        if (!iconFileName || iconFileName.trim() === '') {
            const iconPreview = document.getElementById('icon-preview');
            if (iconPreview) {
                iconPreview.classList.add('hidden');
            }
            return;
        }
        
        const iconPath = `${this.iconsDir}/${iconFileName}`;
        const iconPreview = document.getElementById('icon-preview');
        
        if (!iconPreview) return;
        
        // 尝试加载图标
        const img = new Image();
        img.onload = () => {
            iconPreview.src = iconPath;
            iconPreview.classList.remove('hidden');
        };
        img.onerror = () => {
            iconPreview.classList.add('hidden');
            console.warn('图标文件不存在:', iconPath);
        };
        img.src = iconPath;
    }

    /**
     * 更新特定属性区域
     */
    updateSpecificProperties() {
        try {
            const configType = document.getElementById('config-type').value;
            const specificPropsGrid = document.getElementById('specific-properties');
            
            if (!specificPropsGrid) {
                console.error('特定属性区域元素未找到');
                return;
            }
            
            // 清空特定属性区域
            specificPropsGrid.innerHTML = '';
            
            // 获取字段映射
            const fields = this.getConfigFieldsByType(configType);
            
            // 获取属性键名
            const propsKey = this.getSpecificPropsKey(configType);
            
            // 获取当前值（如果有），添加额外的空值检查
            let currentValues = {};
            if (this.currentConfig && this.currentConfig.content && propsKey) {
                try {
                    currentValues = this.currentConfig.content[propsKey] || {};
                } catch (e) {
                    console.warn('获取当前属性值时出错:', e);
                    currentValues = {};
                }
            }
            
            if (Object.keys(fields).length === 0) {
                specificPropsGrid.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        该类型暂无特定属性配置项
                    </div>
                `;
                return;
            }
            
            // 根据配置类型获取验证规则
            const typeRules = this.VALIDATION_RULES[configType];
            
            // 添加特定属性
            Object.entries(fields).forEach(([key, label]) => {
                try {
                    const fieldDiv = document.createElement('div');
                    fieldDiv.className = 'mb-4';
                    
                    // 检查是否是有效的字段
                    let fieldClass = 'specific-property w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30';
                    let fieldNote = '';
                    
                    if (typeRules && typeRules.validFields && !typeRules.validFields.includes(key)) {
                        fieldNote = '<small class="text-gray-500 block mt-1">注意：该字段可能不被游戏识别</small>';
                    }
                    
                    fieldDiv.innerHTML = `
                        <label class="block text-sm font-medium text-gray-700 mb-1">${label} <span class="text-xs text-gray-500">(${key})</span></label>
                        <input type="number" step="0.01" min="0" 
                            class="${fieldClass}"
                            data-key="${key}"
                            value="${currentValues[key] || 0}">
                        ${fieldNote}
                    `;
                    specificPropsGrid.appendChild(fieldDiv);
                } catch (e) {
                    console.warn(`添加字段${key}时出错:`, e);
                }
            });
        } catch (error) {
            console.error('更新特定属性区域失败:', error);
            const specificPropsGrid = document.getElementById('specific-properties');
            if (specificPropsGrid) {
                specificPropsGrid.innerHTML = `
                    <div class="text-center text-red-500 py-4">
                        加载属性失败: ${error.message}
                    </div>
                `;
            }
        }
    }

    /**
     * 获取特定属性的键名
     */
    getSpecificPropsKey(type) {
        // 确保武器配件、枪械、子弹的属性键名正确
        const propsMap = {
            weapon: 'WeaponProperties',
            melee: 'MeleeWeaponProperties',
            ammo: 'AmmoProperties',
            accessory: 'AccessoryProperties'
        };
        return propsMap[type];
    }

    /**
     * 根据配置类型获取字段映射
     */
    getConfigFieldsByType(type) {
        const fields = {
            weapon: {
                'DistanceMultiplier': '射程倍数',
                'BulletSpeedMultiplier': '子弹速度倍数',
                'ADSTimeMultiplier': '瞄准时间倍数',
                'ScatterRecoverADSMultiplier': '瞄准散布恢复倍数',
                'ShootSpeedMultiplier': '射击速度倍数',
                'MoveSpeedMultiplierAdd': '移动速度加成',
                'ADSMoveSpeedMultiplierAdd': '瞄准移动速度加成',
                'BaseDamageMultiplier': '基础伤害倍数',
                'RangeAddition': '射程加成',
                'BulletSpeedAddition': '子弹速度加成',
                'CriticalChanceMultiplier': '暴击率倍数',
                'ReloadSpeedMultiplier': '换弹速度倍数',
                'AccuracyMultiplier': '精度倍数',
                'DamageMultiplier': '伤害倍数',
                'CriticalDamageFactorMultiplier': '暴击伤害系数倍数',
                'PenetrateMultiplier': '穿透倍数',
                'ArmorPiercingMultiplier': '护甲穿透倍数',
                'ArmorBreakMultiplier': '护甲破坏倍数',
                'ExplosionDamageMultiplier': '爆炸伤害倍数',
                'ExplosionRangeMultiplier': '爆炸范围倍数',
                'ShotCountMultiplier': '射击次数倍数',
                'ShotAngleMultiplier': '射击角度倍数',
                'BurstCountMultiplier': 'Burst次数倍数',
                'SoundRangeMultiplier': '声音范围倍数',
                'ADSAimDistanceFactorMultiplier': '瞄准距离系数倍数',
                'ScatterFactorMultiplier': '常规散布系数倍数',
                'ScatterFactorADSMultiplier': '瞄准散布系数倍数',
                'DefaultScatterMultiplier': '常规默认散布倍数',
                'DefaultScatterADSMultiplier': '瞄准默认散布倍数',
                'MaxScatterMultiplier': '常规最大散布倍数',
                'MaxScatterADSMultiplier': '瞄准最大散布倍数',
                'ScatterGrowMultiplier': '散布增长倍数',
                'ScatterGrowADSMultiplier': '瞄准散布增长倍数',
                'ScatterRecoverMultiplier': '常规散布恢复倍数',
                'RecoilVMinMultiplier': '垂直后坐力最小值倍数',
                'RecoilVMaxMultiplier': '垂直后坐力最大值倍数',
                'RecoilHMinMultiplier': '水平后坐力最小值倍数',
                'RecoilHMaxMultiplier': '水平后坐力最大值倍数',
                'RecoilScaleVMultiplier': '垂直后坐力缩放倍数',
                'RecoilScaleHMultiplier': '水平后坐力缩放倍数',
                'RecoilRecoverMultiplier': '后坐力恢复倍数',
                'RecoilTimeMultiplier': '后坐力时间倍数',
                'RecoilRecoverTimeMultiplier': '后坐力恢复时间倍数',
                'CapacityMultiplier': '弹匣容量倍数',
                'BuffChanceMultiplier': '增益触发概率倍数',
                'BulletBleedChanceMultiplier': '子弹出血概率倍数',
                'BulletDurabilityCostMultiplier': '子弹耐久消耗倍数'
            },
            melee: {
                'NewDamage': '伤害值',
                'NewCritRate': '暴击率',
                'NewCritDamageFactor': '暴击伤害因子',
                'NewArmorPiercing': '护甲穿透',
                'NewAttackSpeed': '攻击速度',
                'NewAttackRange': '攻击范围',
                'NewStaminaCost': '耐力消耗',
                'NewBleedChance': '流血几率',
                'NewMoveSpeedMultiplier': '移动速度倍数'
            },
            ammo: {
                'NewCritRateGain': '暴击率增益',
                'NewCritDamageFactorGain': '暴击伤害因子增益',
                'NewArmorPiercingGain': '护甲穿透增益',
                'NewDamageMultiplier': '伤害倍率',
                'NewExplosionRange': '爆炸范围',
                'NewBuffChanceMultiplier': '增益触发概率倍数',
                'NewBleedChance': '流血几率',
                'NewExplosionDamage': '爆炸伤害',
                'NewArmorBreakGain': '护甲破坏增益',
                'NewDurabilityCost': '耐久消耗',
                'NewBulletSpeed': '子弹速度',
                'NewBulletDistance': '子弹距离'
            },
            accessory: {
                'ScatterRecoverADS': '瞄准散布恢复',
                'MaxScatterADS': '瞄准最大散布',
                'ADSTime': '瞄准时间',
                'ADSAimDistanceFactor': '瞄准距离系数',
                'ScatterFactorADS': '瞄准散布系数',
                'MaxScatter': '常规最大散布',
                'ScatterRecover': '常规散布恢复',
                'DefaultScatter': '常规默认散布',
                'ScatterFactor': '常规散布系数',
                'RecoilScaleV': '垂直后坐力缩放',
                'RecoilScaleH': '水平后坐力缩放',
                'Damage': '伤害',
                'CritRate': '暴击率',
                'CritDamageFactor': '暴击伤害因子',
                'BulletSpeed': '子弹速度',
                'BulletDistance': '子弹距离',
                'ShootSpeed': '射击速度',
                'MoveSpeedMultiplier': '移动速度倍数',
                'SoundRange': '声音范围',
                'Capacity': '弹匣容量',
                'ReloadTime': '换弹时间',
                'FlashLight': '手电筒'
            }
        };
        return fields[type] || {};
    }

    /**
     * 验证配置
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];
        
        // 验证基础字段
        if (!config.fileName || config.fileName.trim() === '') {
            errors.push('配置文件名不能为空');
        }
        
        if (config.content.OriginalItemId === undefined || config.content.OriginalItemId === null) {
            errors.push('原始物品ID不能为空');
        } else if (!Number.isInteger(config.content.OriginalItemId) || config.content.OriginalItemId < 0) {
            errors.push('原始物品ID必须是非负整数');
        }
        
        if (config.content.NewItemId === undefined || config.content.NewItemId === null) {
            errors.push('新物品ID不能为空');
        } else if (!Number.isInteger(config.content.NewItemId) || config.content.NewItemId < 0) {
            errors.push('新物品ID必须是非负整数');
        }
        
        if (config.content.DisplayName === undefined || config.content.DisplayName.trim() === '') {
            errors.push('显示名称不能为空');
        }
        
        // 验证数值字段
        const numericFields = ['Weight', 'Value', 'Quality'];
        numericFields.forEach(field => {
            if (config.content[field] !== undefined && config.content[field] !== null) {
                if (isNaN(config.content[field])) {
                    errors.push(`${field}必须是数字`);
                } else if (config.content[field] < 0) {
                    errors.push(`${field}不能为负数`);
                }
            }
        });
        
        // 根据配置类型验证特定属性
        const typeRules = this.VALIDATION_RULES[config.type];
        const propsKey = this.getSpecificPropsKey(config.type);
        const specificProps = config.content[propsKey];
        
        if (typeRules && specificProps) {
            // 检查特殊验证规则
            if (typeRules.specialChecks) {
                const specialCheckResult = typeRules.specialChecks(specificProps);
                if (specialCheckResult.warnings && specialCheckResult.warnings.length > 0) {
                    warnings.push(...specialCheckResult.warnings);
                }
                if (!specialCheckResult.isValid && specialCheckResult.errors) {
                    errors.push(...specialCheckResult.errors);
                }
            }
            
            // 检查字段有效性
            if (typeRules.validFields && typeRules.validFields.length > 0) {
                Object.keys(specificProps).forEach(key => {
                    if (!typeRules.validFields.includes(key)) {
                        warnings.push(`字段"${key}"可能不是${config.type}类型的有效字段`);
                    }
                    
                    // 验证字段值
                    if (specificProps[key] !== undefined && specificProps[key] !== null) {
                        if (isNaN(specificProps[key])) {
                            errors.push(`"${key}"必须是数字`);
                        }
                    }
                });
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }

    /**
     * 保存配置
     */
    saveConfig() {
        if (!this.currentConfig) return;
        
        try {
            // 获取配置类型
            const configType = document.getElementById('config-type').value;
            
            // 获取基础属性
            const config = { ...this.currentConfig };
            config.fileName = document.getElementById('config-filename').value || `config_${Date.now()}`;
            config.type = configType;
            config.content = {
                OriginalItemId: parseInt(document.getElementById('original-item-id').value) || 0,
                NewItemId: parseInt(document.getElementById('new-item-id').value) || 0,
                DisplayName: document.getElementById('display-name').value || '',
                LocalizationKey: document.getElementById('localization-key').value || '',
                LocalizationDescValue: document.getElementById('localization-desc-value').value || '',
                Weight: parseFloat(document.getElementById('weight').value) || 0,
                Value: parseInt(document.getElementById('value').value) || 0,
                Quality: parseInt(document.getElementById('quality').value) || 5,
                Tags: document.getElementById('tags').value.split(',').filter(tag => tag.trim() !== ''),
                IconFileName: document.getElementById('icon-filename').value || '',
                LocalizationDesc: '_Desc'
            };
            
            // 添加合成配方相关字段
            const formulaId = document.getElementById('formula-id')?.value;
            const craftingMoney = document.getElementById('crafting-money')?.value;
            const resultItemAmount = document.getElementById('result-item-amount')?.value;
            const craftingTags = document.getElementById('crafting-tags')?.value;
            const requirePerk = document.getElementById('require-perk')?.value;
            const unlockByDefault = document.getElementById('unlock-by-default')?.checked;
            const hideInIndex = document.getElementById('hide-in-index')?.checked;
            
            // 如果存在配方数据，则添加到配置中
            if (formulaId || craftingMoney || resultItemAmount || craftingTags || requirePerk || unlockByDefault || hideInIndex) {
                // 获取材料列表
                const costItems = [];
                const costItemRows = document.querySelectorAll('#cost-items-container .cost-item-row');
                costItemRows.forEach(row => {
                    const itemIdInput = row.querySelector('input[placeholder="物品ID"]');
                    const amountInput = row.querySelector('input[placeholder="数量"]');
                    
                    if (itemIdInput && amountInput) {
                        const itemId = parseInt(itemIdInput.value);
                        const amount = parseInt(amountInput.value);
                        
                        if (!isNaN(itemId) && !isNaN(amount) && itemId > 0 && amount > 0) {
                            costItems.push({
                                ItemId: itemId,
                                Amount: amount
                            });
                        }
                    }
                });
                
                // 添加合成配方数据
                config.content.FormulaId = formulaId || '';
                config.content.CraftingMoney = parseInt(craftingMoney) || 0;
                config.content.ResultItemAmount = parseInt(resultItemAmount) || 1;
                config.content.CraftingTags = craftingTags ? [craftingTags] : [];
                config.content.RequirePerk = requirePerk || '';
                config.content.UnlockByDefault = unlockByDefault;
                config.content.HideInIndex = hideInIndex;
                config.content.CostItems = costItems;
            }
            
            // 获取特定属性
            const specificPropsKey = this.getSpecificPropsKey(configType);
            
            if (specificPropsKey) {
                config.content[specificPropsKey] = {};
                document.querySelectorAll('.specific-property').forEach(input => {
                    const key = input.dataset.key;
                    const value = parseFloat(input.value) || 0;
                    // 只有值不为0的属性才保存，减少配置文件大小
                    if (value !== 0) {
                        config.content[specificPropsKey][key] = value;
                    }
                });
            }
            
            // 验证配置
            const validation = this.validateConfig(config);
            
            // 显示警告信息
            if (validation.warnings && validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    console.warn(warning);
                });
                this.showNotification('警告', validation.warnings.join('\n'), 'warning');
            }
            
            // 验证失败则不保存
            if (!validation.isValid) {
                this.showNotification('验证失败', validation.errors.join('\n'), 'error');
                return;
            }
            
            // 更新配置
            config.lastModified = new Date().toISOString();
            const index = this.configs.findIndex(c => c.id === config.id);
            if (index !== -1) {
                this.configs[index] = config;
            } else {
                // 检查是否存在同名文件
                const nameIndex = this.configs.findIndex(c => c.fileName === config.fileName);
                if (nameIndex !== -1) {
                    if (confirm(`文件名 "${config.fileName}" 已存在，是否覆盖？`)) {
                        this.configs[nameIndex] = config;
                    } else {
                        return;
                    }
                } else {
                    this.configs.push(config);
                }
            }
            
            // 保存到本地存储
            this.saveConfigsToStorage();
            this.updateConfigList();
            
            // 模拟保存到文件系统 (实际使用时应通过服务器API保存到Configs目录)
            this.simulateSaveToFile(config);
            
            this.showNotification('成功', '配置保存成功', 'success');
            
            // 更新当前选中的配置
            this.currentConfig = config;
        } catch (error) {
            console.error('保存配置失败:', error);
            this.showNotification('错误', '配置保存失败: ' + error.message, 'error');
        }
    }

    /**
     * 模拟保存到文件系统
     */
    simulateSaveToFile(config) {
        // 在实际环境中，这里应该通过服务器API保存到Configs目录
        console.log('保存配置到文件:', this.configDir + '/' + config.fileName + '.json', config.content);
        
        // 可以通过localStorage模拟保存路径信息
        const savedFiles = JSON.parse(localStorage.getItem('configManager_savedFiles') || '[]');
        const existingIndex = savedFiles.findIndex(file => file.name === config.fileName + '.json');
        
        if (existingIndex !== -1) {
            savedFiles[existingIndex] = {
                name: config.fileName + '.json',
                path: this.configDir + '/' + config.fileName + '.json',
                lastModified: config.lastModified
            };
        } else {
            savedFiles.push({
                name: config.fileName + '.json',
                path: this.configDir + '/' + config.fileName + '.json',
                lastModified: config.lastModified
            });
        }
        
        localStorage.setItem('configManager_savedFiles', JSON.stringify(savedFiles));
    }

    /**
     * 导出配置
     */
    exportConfig() {
        if (!this.currentConfig) return;
        
        try {
            const dataStr = JSON.stringify(this.currentConfig.content, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = this.currentConfig.fileName + '.json';
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.showNotification('成功', '配置导出成功', 'success');
        } catch (error) {
            this.showNotification('错误', '配置导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 删除配置
     */
    deleteConfig() {
        if (!this.currentConfig) return;
        
        if (confirm(`确定要删除配置 "${this.currentConfig.fileName}" 吗？此操作不可撤销。`)) {
            this.configs = this.configs.filter(config => config.id !== this.currentConfig.id);
            this.saveConfigsToStorage();
            this.updateConfigList();
            this.cancelEditMode();
            this.showNotification('成功', '配置已删除', 'success');
        }
    }

    /**
     * 显示编辑模式
     */
    showEditMode() {
        document.getElementById('empty-state').classList.add('hidden');
        document.getElementById('editor-form').classList.remove('hidden');
    }

    /**
     * 取消编辑模式
     */
    cancelEditMode() {
        document.getElementById('empty-state').classList.remove('hidden');
        document.getElementById('editor-form').classList.add('hidden');
        this.currentConfig = null;
    }

    /**
     * 处理文件上传
     */
    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let configData;
                const fileName = file.name.replace('.json', '');
                
                // 尝试解析JSON
                configData = JSON.parse(e.target.result);
                
                // 检测配置类型
                const configType = this.detectConfigType(configData);
                
                // 创建配置对象
                const newConfig = {
                    id: Date.now().toString(),
                    fileName: fileName,
                    type: configType,
                    lastModified: new Date().toISOString(),
                    content: configData
                };

                // 检查是否已存在同名配置
                const existingIndex = this.configs.findIndex(config => config.fileName === fileName);
                if (existingIndex !== -1) {
                    if (confirm(`文件名 "${fileName}" 已存在，是否覆盖？`)) {
                        this.configs[existingIndex] = newConfig;
                    } else {
                        return;
                    }
                } else {
                    this.configs.push(newConfig);
                }

                this.saveConfigsToStorage();
                this.updateConfigList();
                this.selectConfig(newConfig.id);
                this.showNotification('成功', '配置文件导入成功', 'success');
            } catch (error) {
                this.showNotification('错误', '配置文件格式不正确', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    /**
     * 检测配置类型 - 更智能的类型检测
     */
    detectConfigType(configData) {
        // 优先检查是否有特定属性对象
        if (configData.WeaponProperties) return 'weapon';
        if (configData.MeleeWeaponProperties) return 'melee';
        if (configData.AmmoProperties) return 'ammo';
        if (configData.AccessoryProperties) return 'accessory';
        
        // 根据字段名称推断类型
        const hasWeaponFields = Object.keys(configData).some(key => 
            key.includes('Bullet') || key.includes('Shoot') || key.includes('Reload') || 
            key.includes('Scatter') || key.includes('Recoil') || key.includes('Aim')
        );
        
        const hasMeleeFields = Object.keys(configData).some(key => 
            key.includes('Damage') && !key.includes('Bullet') || 
            key.includes('Attack') || key.includes('Stamina')
        );
        
        const hasAmmoFields = Object.keys(configData).some(key => 
            key.includes('Pierce') || key.includes('Critical')
        );
        
        if (hasWeaponFields) return 'weapon';
        if (hasMeleeFields) return 'melee';
        if (hasAmmoFields) return 'ammo';
        
        return 'item';
    }



    /**
     * 显示通知
     */
    showNotification(title, message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notification-icon');
        const notificationTitle = document.getElementById('notification-title');
        const notificationMessage = document.getElementById('notification-message');
        
        // 设置图标和颜色
        switch (type) {
            case 'success':
                icon.className = 'fa fa-check-circle text-success text-xl';
                break;
            case 'error':
                icon.className = 'fa fa-exclamation-circle text-danger text-xl';
                break;
            case 'warning':
                icon.className = 'fa fa-exclamation-triangle text-warning text-xl';
                break;
            default:
                icon.className = 'fa fa-info-circle text-primary text-xl';
        }
        
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        // 显示通知
        notification.classList.remove('translate-x-full');
        
        // 3秒后自动隐藏
        setTimeout(() => {
            notification.classList.add('translate-x-full');
        }, 3000);
        
        // 点击关闭按钮关闭通知
        const closeBtn = document.getElementById('close-notification');
        if (closeBtn) {
            closeBtn.onclick = () => {
                notification.classList.add('translate-x-full');
            };
        }
    }
    
    /**
     * 显示图片上传模态框
     */
    showImageUploadModal() {
        const modal = document.getElementById('image-upload-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // 重置预览
            const previewContainer = document.getElementById('image-preview-container');
            const previewImg = document.getElementById('image-preview');
            if (previewContainer && previewImg) {
                previewContainer.classList.add('hidden');
                previewImg.src = '';
            }
            
            // 监听图片选择事件
            const imageInput = document.getElementById('image-input');
            if (imageInput) {
                imageInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            if (previewContainer && previewImg) {
                                previewImg.src = event.target.result;
                                previewContainer.classList.remove('hidden');
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                };
            }
            
            // 确认上传按钮
            const confirmBtn = document.getElementById('confirm-image-upload');
            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    const file = imageInput ? imageInput.files[0] : null;
                    if (file) {
                        // 模拟上传 - 实际应用中应通过API上传到服务器
                        console.log('模拟上传图片:', file.name);
                        document.getElementById('icon-filename').value = file.name;
                        this.previewIcon(file.name);
                        this.hideImageUploadModal();
                        this.showNotification('成功', '图标已上传并设置', 'success');
                    }
                };
            }
        }
    }
    
    /**
     * 隐藏图片上传模态框
     */
    hideImageUploadModal() {
        const modal = document.getElementById('image-upload-modal');
        if (modal) {
            modal.classList.add('hidden');
            
            // 清空文件输入
            const imageInput = document.getElementById('image-input');
            if (imageInput) {
                imageInput.value = '';
            }
        }
    }
}

// 当DOM内容加载完成后初始化配置管理器
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 创建配置管理器实例
        window.configManager = new ConfigManager();
        // 初始化配置管理器
        window.configManager.initialize();
    } catch (error) {
        console.error('创建配置管理器实例失败:', error);
        alert('创建配置管理器实例失败: ' + error.message);
    }
});
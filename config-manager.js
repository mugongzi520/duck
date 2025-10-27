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
                    // 近战武器移动速度检查 - mshook.cs中只是检查，不抛出错误
                    if (props.NewMoveSpeedMultiplier !== undefined && props.NewMoveSpeedMultiplier !== null && props.NewMoveSpeedMultiplier !== 1.0) {
                        return { isValid: true, warnings: ['近战武器移动速度不为1.0，请注意游戏兼容性'] };
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
                    'Damage', 'CritRate', 'CritDamageFactor', 'ADSTime',
                    'ADSAimDistanceFactor', 'ScatterFactorADS', 'MaxScatterADS',
                    'ScatterRecoverADS', 'AttackSpeed', 'BulletSpeed', 'ArmorPiercing',
                    'Capacity', 'MoveSpeedMultiplier'
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
   initializeTagData() {
        this.tagData = {
            'Bullet': '子弹',
            'Element': '元素',
            'Accessory': '配件',
            'Stock': '枪托',
            'GunType_SMG': '枪械类型_冲锋枪',
            'Weapon': '武器',
            'Gun': '枪',
            'GunType_BR': '枪械类型_战斗步枪',
            'Repairable': '可修复的',
            'Scope': '瞄准镜',
            'Muzzle': '枪口',
            'GunType_PST': '枪械类型_手枪',
            'GunType_SHT': '枪械类型_霰弹枪',
            'GunType_AR': '枪械类型_突击步枪',
            'GunType_PWS': '枪械类型_个人武器系统',
            'Formula': '配方',
            'Formula_Blueprint': '配方_蓝图',
            'DestroyOnLootBox': '开启战利品箱时销毁',
            'Daily': '每日的',
            'Tool': '工具',
            'Seed': '种子',
            'Formula_Medic': '配方_医疗',
            'Weapon_LV1': '武器_1级',
            'Western': '西部风格',
            'Food': '食物',
            'Medic': '医疗用品',
            'Electric': '电子的',
            'Luxury': '奢侈品',
            'Healing': '治疗',
            'Armor': '盔甲',
            'Information': '信息',
            'GunType_SNP': '枪械类型_狙击枪',
            'Fish': '鱼',
            'Bait': '诱饵',
            'Earthworm': '蚯蚓',
            'Quest': '任务',
            'Explosive': '爆炸物',
            'TecEquip': '科技装备',
            'Crop': '农作物',
            'Fish_OnlyDay': '鱼_仅白天出现',
            'Formula_Normal': '配方_普通',
            'Gem': '宝石',
            'MeleeWeapon': '近战武器',
            'DontDropOnDeadInSlot': '死亡时槽位物品不掉落',
            'Helmat': '头盔',
            'Special': '特殊的',
            'Backpack': '背包',
            'GamingConsole': '游戏主机',
            'Magazine': '弹匣',
            'Equipment': '装备',
            'DecorateEquipment': '装饰性装备',
            'LockInDemo': '演示版中锁定',
            'Totem': '图腾',
            'Grip': '握把',
            'DestroyInBase': '在基地中销毁',
            'FaceMask': '面罩',
            'GunType_MAG': '枪械类型_机枪',
            'Key': '钥匙',
            'Continer': '容器',
            'SpecialKey': '特殊钥匙',
            'Injector': '注射器',
            'ComputerParts_GPU': '电脑部件_显卡',
            'Fish_OnlyNight': '鱼_仅夜间出现',
            'FcController': 'FC控制器',
            'Shit': '粪便',
            'Computer': '电脑',
            'Material': '材料',
            'Fish_OnlySunDay': '鱼_仅晴天出现',
            'Fish_OnlyRainDay': '鱼_仅雨天出现',
            'Fish_Special': '鱼_特殊',
            'AdvancedDebuffMode': '高级减益模式',
            'MiniGame': '迷你游戏',
            'GunType_Rifle': '枪械类型_步枪',
            'GunType_Rocket': '枪械类型_火箭筒',
            'Cash': '现金',
            'Character': '角色',
            'Cartridge': '弹药筒',
            'ColorCard': '色卡',
            'DogTag': '身份牌',
            'Drink': '饮品',
            'Fish_OnlyStorm': '鱼_仅暴风雨天出现',
            'Fish_Other': '鱼_其他',
            'Formula_Cook': '配方_烹饪',
            'GunType_ARR': '枪械类型_突击步枪改进型',
            'GunType_Shot': '枪械类型_霰弹枪',
            'GunType_Sniper': '枪械类型_狙击枪',
            'Headset': '耳机',
            'JLab': '实验室',
            'Misc': '杂项',
            'Monitor': '显示器',
            'NotForSell': '非卖品',
            'NotSellable': '不可出售',
            'SoulCube': '灵魂立方体',
            'Sticky': '粘性的',
            'NotNested': '不可嵌套'
        };
    }
    
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
            // 修改标签显示格式为：中文名字-配置中的实际名字
            tagOption.innerHTML = `
                <input type="checkbox" data-tag="${key}" class="mr-1 h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded">
                <span>${value}-${key}</span>
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
     * 添加自定义标签 - 完全重写，避免任何this上下文问题
     */
    addCustomTag = function() {
        console.log('addCustomTag 函数被调用');
        
        // 直接使用DOM操作，不依赖this
        const customTagInput = document.getElementById('custom-tag-input');
        const tagsContainer = document.getElementById('tags-container');
        
        console.log('customTagInput 元素:', customTagInput);
        console.log('tagsContainer 元素:', tagsContainer);
        
        // 验证输入框存在
        if (!customTagInput || !tagsContainer) {
            console.error('标签输入框或容器不存在');
            return;
        }
        
        // 获取并手动清理输入值（不使用trim避免任何可能的问题）
        const inputValue = customTagInput.value;
        const tagText = inputValue.replace(/^\s+|\s+$/g, ''); // 手动去除首尾空格
        
        // 验证非空
        if (!tagText || tagText.length === 0) {
            console.log('标签内容为空，显示警告');
            alert('添加成功');
            return;
        }
        // 生成唯一键
        const tagKey = 'custom_' + Date.now();
        
        // 直接创建DOM元素
           const tagLabel = document.createElement('label');
           tagLabel.className = 'inline-flex items-center px-2 py-1 rounded-full text-sm cursor-pointer bg-gray-100 hover:bg-gray-200 transition-colors';
           tagLabel.setAttribute('data-tag-key', tagKey);
            
           const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'mr-1 h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded';
            // 使用用户输入的标签文本作为data-tag属性值，而不是生成的ID
            checkbox.setAttribute('data-tag', tagText);
            
           const textSpan = document.createElement('span');
           // 自定义标签也使用格式：中文名字-配置中的实际名字
           textSpan.textContent = `${tagText}-${tagKey}`;
           
           // 添加删除按钮
           const deleteButton = document.createElement('button');
           deleteButton.type = 'button';
           deleteButton.className = 'ml-1 text-xs text-gray-500 hover:text-red-500 focus:outline-none';
           deleteButton.textContent = '×';
           deleteButton.style.marginLeft = '4px';
           deleteButton.style.fontSize = '14px';
           deleteButton.style.cursor = 'pointer';
           
           // 删除按钮点击事件
            deleteButton.onclick = function(e) {
                e.stopPropagation(); // 阻止事件冒泡
                tagLabel.remove(); // 移除整个标签元素
                
                // 更新选中标签列表
                const selectedTags = [];
                document.querySelectorAll('#tags-container input[type="checkbox"]:checked').forEach(cb => {
                    selectedTags.push(cb.getAttribute('data-tag')); // 现在使用的是用户输入的实际标签内容
                });
                
                const hiddenInput = document.getElementById('tags');
                if (hiddenInput) {
                    hiddenInput.value = selectedTags.join(',');
                }
            };
            
           tagLabel.appendChild(checkbox);
           tagLabel.appendChild(textSpan);
           tagLabel.appendChild(deleteButton);
        
        // 添加到容器
        tagsContainer.appendChild(tagLabel);
        
        // 清空输入框
        customTagInput.value = '';
        
        // 简单的标签选择更新逻辑
           checkbox.onchange = function() {
               const selectedTags = [];
               document.querySelectorAll('#tags-container input[type="checkbox"]:checked').forEach(cb => {
                   // 使用用户输入的实际标签内容，而不是生成的ID
                   selectedTags.push(cb.getAttribute('data-tag'));
               });
                
               const hiddenInput = document.getElementById('tags');
               if (hiddenInput) {
                   hiddenInput.value = selectedTags.join(',');
                   console.log('更新选中标签:', hiddenInput.value); // 添加日志，方便调试
               }
           };
        
        // 重新聚焦
        customTagInput.focus();
    }
    filterTags(event) {
        const searchTerm = event.target.value.toLowerCase();
        const tagOptions = document.querySelectorAll('#tags-container label');
        
        tagOptions.forEach(option => {
            const tagText = option.querySelector('span').textContent.toLowerCase();
            const tagKey = option.querySelector('input').dataset.tag.toLowerCase();
            
            // 即使标签格式改变，搜索功能仍然支持匹配显示文本和数据标签
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
                        // 确保使用正确的this上下文调用处理函数
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
            
            // 属性搜索
            bindEvent('property-search', 'input', this.filterProperties);
            
            // 标签搜索
            const tagSearch = document.getElementById('tag-search');
            if (tagSearch) {
                bindEvent('tag-search', 'input', this.filterTags);
            }
            
            // 自定义标签添加
            bindEvent('add-custom-tag', 'click', this.addCustomTag);
            // 支持按Enter键添加自定义标签
            bindEvent('custom-tag-input', 'keypress', (e) => {
                if (e.key === 'Enter') {
                    // 阻止默认的回车行为
                    e.preventDefault();
                    // 确保使用正确的this上下文调用addCustomTag
                    this.addCustomTag.call(this);
                }
            });
            
            // 配置保存
            bindEvent('btn-save-config', 'click', this.saveConfig);
            bindEvent('btn-save-config-bottom', 'click', this.saveConfig);
            
            // 配置导出
            bindEvent('btn-export-config', 'click', this.exportConfig);
            
            // 配置删除
            bindEvent('btn-delete-config', 'click', this.deleteConfig);
            
            // 文件上传 - 移除外层箭头函数，因为bindEvent内部已经处理了this上下文
            bindEvent('file-input', 'change', this.handleFileUpload);
            
            // 导入配置按钮 - 重新添加，确保顶部导航栏的导入按钮可以使用
            bindEvent('btn-import-config', 'click', () => {
                const fileInput = document.getElementById('file-input');
                if (fileInput) {
                    fileInput.click();
                }
            });
            
            // 右侧编辑区导入按钮 - 也需要绑定，确保两个导入按钮都能正常工作
            bindEvent('quick-import-config', 'click', () => {
                const fileInput = document.getElementById('file-input');
                if (fileInput) {
                    fileInput.click();
                }
            });
            
            // 剪贴板导入按钮
            bindEvent('btn-clipboard-import', 'click', this.handleClipboardImport);
            // 复制到剪贴板按钮
            bindEvent('btn-copy-to-clipboard', 'click', this.handleCopyToClipboard);
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
            
            // 添加搜索框
            const searchDiv = document.createElement('div');
            searchDiv.className = 'relative mb-4';
            searchDiv.innerHTML = `
                <input type="text" id="property-search" placeholder="搜索属性..." 
                    class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30">
                <i class="fa fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            `;
            specificPropsGrid.appendChild(searchDiv);
            
            // 重新绑定搜索事件
            const propertySearch = document.getElementById('property-search');
            if (propertySearch) {
                propertySearch.removeEventListener('input', this.filterProperties);
                propertySearch.addEventListener('input', (e) => this.filterProperties.call(this, e));
            }
            
            // 获取特定类型字段映射和mshook字段映射
            const typeFields = this.getConfigFieldsByType(configType);
            const mshookFields = this.getConfigFieldsByType('mshook'); // 使用mshook类型的字段作为通用属性字段
            
            // 获取属性键名
            const propsKey = this.getSpecificPropsKey(configType);
            const mshookKey = this.getMshookPropsKey();
            
            // 获取当前值（如果有），添加额外的空值检查
            let typeValues = {};
            let mshookValues = {};
            
            if (this.currentConfig && this.currentConfig.content) {
                try {
                    if (propsKey) {
                        typeValues = this.currentConfig.content[propsKey] || {};
                    }
                    mshookValues = this.currentConfig.content[mshookKey] || {};
                } catch (e) {
                    console.warn('获取当前属性值时出错:', e);
                    typeValues = {};
                    mshookValues = {};
                }
            }
            
            // 根据配置类型获取验证规则
            const typeRules = this.VALIDATION_RULES[configType];
            
            let hasProps = false;
            
            // 添加特定类型属性
            if (Object.keys(typeFields).length > 0) {
                hasProps = true;
                
                // 创建特定类型属性折叠面板
                const typeContainer = document.createElement('div');
                typeContainer.className = 'mb-4';
                
                const typeHeader = document.createElement('div');
                typeHeader.className = 'flex justify-between items-center cursor-pointer bg-gray-50 p-3 rounded-t-md border border-gray-200';
                typeHeader.innerHTML = `
                    <h4 class="text-md font-medium text-gray-800">特定类型属性</h4>
                    <span class="text-gray-500 type-toggle">▼</span>
                `;
                
                const typeContent = document.createElement('div');
                typeContent.className = 'bg-white p-4 rounded-b-md border-x border-b border-gray-200 type-content';
                
                // 添加特定类型属性
                Object.entries(typeFields).forEach(([key, label]) => {
                    try {
                        const fieldDiv = document.createElement('div');
                        fieldDiv.className = 'mb-3 last:mb-0';
                        
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
                                data-prop-type="type"
                                value="${typeValues[key] || 0}">
                            ${fieldNote}
                        `;
                        typeContent.appendChild(fieldDiv);
                    } catch (e) {
                        console.warn(`添加特定类型字段${key}时出错:`, e);
                    }
                });
                
                typeContainer.appendChild(typeHeader);
                typeContainer.appendChild(typeContent);
                specificPropsGrid.appendChild(typeContainer);
                
                // 添加特定类型属性折叠功能
                typeHeader.addEventListener('click', () => {
                    const isExpanded = typeContent.style.display !== 'none';
                    typeContent.style.display = isExpanded ? 'none' : 'block';
                    typeHeader.querySelector('.type-toggle').textContent = isExpanded ? '▶' : '▼';
                });
            }
            
            // 创建属性分类映射 - 根据新的mshook属性更新
            const propertyCategories = {
                '移动相关属性': ['WalkSpeed', 'WalkAcc', 'RunSpeed', 'RunAcc', 'TurnSpeed', 'AimTurnSpeed', 'DashSpeed', 'DashCanControl', 'Moveability'],
                '耐力相关属性': ['Stamina', 'StaminaDrainRate', 'StaminaRecoverRate', 'StaminaRecoverTime'],
                '能量和资源相关属性': ['MaxEnergy', 'CurrentEnergy', 'EnergyCost', 'MaxWater', 'CurrentWater', 'WaterCost', 'FoodGain', 'HealGain', 'WaterEnergyRecoverMultiplier'],
                '生命值和护甲属性': ['MaxHealth', 'BodyArmor', 'HeadArmor'],
                '元素抵抗属性': ['ElementFactor_Physics', 'ElementFactor_Fire', 'ElementFactor_Poison', 'ElementFactor_Electricity', 'ElementFactor_Space'],
                '战斗相关属性': ['MeleeDamageMultiplier', 'MeleeCritRateGain', 'MeleeCritDamageGain', 'GunDamageMultiplier', 'ReloadSpeedGain', 'GunCritRateGain', 'GunCritDamageGain', 'BulletSpeedMultiplier', 'RecoilControl', 'GunScatterMultiplier', 'GunDistanceMultiplier'],
                '感知相关属性': ['NightVisionAbility', 'NightVisionType', 'HearingAbility', 'SoundVisable', 'ViewAngle', 'ViewDistance', 'SenseRange', 'VisableDistanceFactor'],
                '物品和装备属性': ['MaxWeight', 'InventoryCapacity', 'PetCapcity', 'StormProtection', 'GasMask', 'FlashLight'],
                '声音相关属性': ['WalkSoundRange', 'RunSoundRange']
            };
            
            // 添加mshook属性
            if (Object.keys(mshookFields).length > 0) {
                hasProps = true;
                
                // 创建mshook折叠面板
                const mshookContainer = document.createElement('div');
                mshookContainer.className = 'mt-6 mb-4';
                
                const mshookHeader = document.createElement('div');
                mshookHeader.className = 'flex justify-between items-center cursor-pointer bg-gray-50 p-3 rounded-t-md border border-gray-200';
                mshookHeader.innerHTML = `
                    <h4 class="text-md font-medium text-gray-800">通用属性 (mshook)</h4>
                    <span class="text-gray-500 mshook-toggle">▼</span>
                `;
                
                const mshookContent = document.createElement('div');
                mshookContent.className = 'bg-white p-4 rounded-b-md border-x border-b border-gray-200 mshook-content';
                
                // 按分类渲染mshook属性
                Object.entries(propertyCategories).forEach(([category, keys]) => {
                    // 过滤出当前分类中存在的属性
                    const categoryFields = Object.entries(mshookFields).filter(([key]) => keys.includes(key));
                    
                    if (categoryFields.length > 0) {
                        // 创建分类折叠面板
                        const categoryDiv = document.createElement('div');
                        categoryDiv.className = 'mb-4';
                        
                        const categoryHeader = document.createElement('div');
                        categoryHeader.className = 'flex justify-between items-center cursor-pointer bg-gray-50 p-2 rounded-t-md border border-gray-200';
                        categoryHeader.innerHTML = `
                            <h5 class="text-sm font-medium text-gray-700">${category}</h5>
                            <span class="text-gray-500 text-xs category-toggle">▼</span>
                        `;
                        
                        const categoryContent = document.createElement('div');
                        categoryContent.className = 'p-3 rounded-b-md border-x border-b border-gray-200 bg-gray-50 category-content';
                        
                        // 添加该分类下的所有属性
                        categoryFields.forEach(([key, label]) => {
                            try {
                                const fieldDiv = document.createElement('div');
                                fieldDiv.className = 'mb-3 last:mb-0';
                                
                                fieldDiv.innerHTML = `
                                    <label class="block text-sm font-medium text-gray-700 mb-1">${label} <span class="text-xs text-gray-500">(${key})</span></label>
                                    <input type="number" step="0.01" min="0" 
                                        class="specific-property w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        data-key="${key}"
                                        data-prop-type="mshook"
                                        value="${mshookValues[key] || 0}">
                                    <small class="text-gray-500 block mt-1 text-xs">mshook属性</small>
                                `;
                                categoryContent.appendChild(fieldDiv);
                            } catch (e) {
                                console.warn(`添加mshook字段${key}时出错:`, e);
                            }
                        });
                        
                        categoryDiv.appendChild(categoryHeader);
                        categoryDiv.appendChild(categoryContent);
                        mshookContent.appendChild(categoryDiv);
                        
                        // 添加分类折叠功能
                        categoryHeader.addEventListener('click', () => {
                            const isExpanded = categoryContent.style.display !== 'none';
                            categoryContent.style.display = isExpanded ? 'none' : 'block';
                            categoryHeader.querySelector('.category-toggle').textContent = isExpanded ? '▶' : '▼';
                        });
                    }
                });
                
                mshookContainer.appendChild(mshookHeader);
                mshookContainer.appendChild(mshookContent);
                specificPropsGrid.appendChild(mshookContainer);
                
                // 添加mshook折叠功能
                mshookHeader.addEventListener('click', () => {
                    const isExpanded = mshookContent.style.display !== 'none';
                    mshookContent.style.display = isExpanded ? 'none' : 'block';
                    mshookHeader.querySelector('.mshook-toggle').textContent = isExpanded ? '▶' : '▼';
                });
            }
            
            // 如果没有任何属性
            if (!hasProps) {
                specificPropsGrid.innerHTML = `
                    <div class="text-center text-gray-500 py-4">
                        该类型暂无属性配置项
                    </div>
                `;
            }
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
            accessory: 'AccessoryProperties', // 修改为AccessoryProperties以区分mshook
            item: 'mshook'  // 物品类型使用mshook作为属性键名
        };
        return propsMap[type];
    }
    
    /**
     * 获取mshook属性键名 - 所有类型都支持mshook
     */
    getMshookPropsKey() {
        return 'mshook';
    }

    /**
     * 根据配置类型获取字段映射
     */
    getConfigFieldsByType(type) {
        const fields = {
            weapon: {
                'DistanceMultiplier': '射程',
                'BulletSpeedMultiplier': '子弹速度',
                'ADSTimeMultiplier': '瞄准时间',
                'ScatterRecoverADSMultiplier': '瞄准散布恢复',
                'ShootSpeedMultiplier': '射击速度',
                'MoveSpeedMultiplierAdd': '移动速度加成',
                'ADSMoveSpeedMultiplierAdd': '瞄准移动速度加成',
                'BaseDamageMultiplier': '基础伤害',
                'RangeAddition': '射程加成',
                'BulletSpeedAddition': '子弹速度加成',
                'CriticalChanceMultiplier': '暴击率',
                'ReloadSpeedMultiplier': '换弹速度',
                'AccuracyMultiplier': '精度',
                'DamageMultiplier': '伤害',
                'CriticalDamageFactorMultiplier': '暴击伤害系数',
                'PenetrateMultiplier': '穿透',
                'ArmorPiercingMultiplier': '护甲穿透',
                'ArmorBreakMultiplier': '护甲破坏',
                'ExplosionDamageMultiplier': '爆炸伤害',
                'ExplosionRangeMultiplier': '爆炸范围',
                'ShotCountMultiplier': '霰弹枪单发弹头数',
                'ShotAngleMultiplier': '霰弹枪弹头散布角度',
                'BurstCountMultiplier': '连续射击次数',
                'SoundRangeMultiplier': '声音范围',
                'ADSAimDistanceFactorMultiplier': '瞄准距离系数',
                'ScatterFactorMultiplier': '常规散布系数',
                'ScatterFactorADSMultiplier': '瞄准散布系数',
                'DefaultScatterMultiplier': '常规默认散布',
                'DefaultScatterADSMultiplier': '瞄准默认散布',
                'MaxScatterMultiplier': '常规最大散布',
                'MaxScatterADSMultiplier': '瞄准最大散布',
                'ScatterGrowMultiplier': '散布增长',
                'ScatterGrowADSMultiplier': '瞄准散布增长',
                'ScatterRecoverMultiplier': '常规散布恢复',
                'RecoilVMinMultiplier': '枪械垂直后坐力最小值',
                'RecoilVMaxMultiplier': '枪械垂直后坐力最大值',
                'RecoilHMinMultiplier': '枪械水平后坐力最小值',
                'RecoilHMaxMultiplier': '水平后坐力最大值',
                'RecoilScaleVMultiplier': '枪械垂直后坐力缩放',
                'RecoilScaleHMultiplier': '水平后坐力缩放',
                'RecoilRecoverMultiplier': '枪械后坐力恢复',
                'RecoilTimeMultiplier': '枪械后坐力时间',
                'RecoilRecoverTimeMultiplier': '枪械后坐力恢复时间',
                'CapacityMultiplier': '枪械弹匣容量',
                'BuffChanceMultiplier': '枪械增益触发概率',
                'BulletBleedChanceMultiplier': '子弹出血概率',
                'BulletDurabilityCostMultiplier': '子弹耐久消耗'
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
                'NewMoveSpeedMultiplier': '移动速度'
            },
            ammo: {
                'NewCritRateGain': '暴击率增益',
                'NewCritDamageFactorGain': '暴击伤害因子增益',
                'NewArmorPiercingGain': '护甲穿透增益',
                'NewDamageMultiplier': '伤害倍率',
                'NewExplosionRange': '爆炸范围',
                'NewBuffChanceMultiplier': '增益触发概率',
                'NewBleedChance': '流血几率',
                'NewExplosionDamage': '爆炸伤害',
                'NewArmorBreakGain': '护甲破坏增益',
                'NewDurabilityCost': '耐久消耗',
                'NewBulletSpeed': '子弹速度',
                'NewBulletDistance': '子弹距离'
            },
            accessory: {},
            item: {},
            accessory: {
                // 配件属性 - 重命名现有的武器配件属性
                'Damage': '伤害',
                'CritRate': '暴击率',
                'CritDamageFactor': '暴击伤害倍率',
                'ADSTime': '瞄准时间',
                'ADSAimDistanceFactor': '瞄准距离',
                'ScatterFactorADS': '瞄准散布',
                'MaxScatterADS': '最大瞄准散布',
                'ScatterRecoverADS': '瞄准扩散恢复',
                'AttackSpeed': '攻击速度',
                'BulletSpeed': '子弹速度',
                'ArmorPiercing': '护甲穿透',
                'Capacity': '弹匣容量',
                'MoveSpeedMultiplier': '移动速度'
            },
            mshook: {
                // 移动相关属性
                'WalkSpeed': '行走速度',
                'WalkAcc': '行走加速度',
                'RunSpeed': '奔跑速度',
                'RunAcc': '奔跑加速度',
                'TurnSpeed': '转身速度',
                'AimTurnSpeed': '瞄准转身速度',
                'DashSpeed': '冲刺速度',
                'DashCanControl': '冲刺时是否可以控制',
                'Moveability': '移动能力值',
                // 耐力相关属性
                'Stamina': '最大耐力值',
                'StaminaDrainRate': '耐力消耗率',
                'StaminaRecoverRate': '耐力恢复率',
                'StaminaRecoverTime': '耐力恢复时间',
                // 能量和资源相关属性
                'MaxEnergy': '最大能量值',
                'CurrentEnergy': '当前能量值',
                'EnergyCost': '每分钟能量消耗',
                'MaxWater': '最大水分值',
                'CurrentWater': '当前水分值',
                'WaterCost': '每分钟水分消耗',
                'FoodGain': '食物增益',
                'HealGain': '治疗增益',
                'WaterEnergyRecoverMultiplier': '水分能量恢复乘数',
                // 生命值相关属性
                'MaxHealth': '最大生命值',
                // 护甲相关属性
                'BodyArmor': '身体护甲',
                'HeadArmor': '头部护甲',
                // 元素抵抗相关属性
                'ElementFactor_Physics': '物理元素抵抗',
                'ElementFactor_Fire': '火焰元素抵抗',
                'ElementFactor_Poison': '毒素元素抵抗',
                'ElementFactor_Electricity': '电击元素抵抗',
                'ElementFactor_Space': '空间元素抵抗',
                // 战斗相关属性
                'MeleeDamageMultiplier': '近战伤害乘数',
                'MeleeCritRateGain': '近战暴击率增益',
                'MeleeCritDamageGain': '近战暴击伤害增益',
                'GunDamageMultiplier': '枪械伤害乘数',
                'ReloadSpeedGain': '装填速度增益',
                'GunCritRateGain': '枪械暴击率增益',
                'GunCritDamageGain': '枪械暴击伤害增益',
                'BulletSpeedMultiplier': '子弹速度乘数',
                'RecoilControl': '后坐力控制',
                'GunScatterMultiplier': '枪械散射乘数',
                'GunDistanceMultiplier': '枪械射程乘数',
                // 感知相关属性
                'NightVisionAbility': '夜视能力',
                'NightVisionType': '夜视类型',
                'HearingAbility': '听力能力',
                'SoundVisable': '声音可见性',
                'ViewAngle': '视野角度',
                'ViewDistance': '视野距离',
                'SenseRange': '感知范围',
                'VisableDistanceFactor': '可见距离因子',
                // 物品和装备相关属性
                'MaxWeight': '最大重量',
                'InventoryCapacity': '背包容量',
                'PetCapcity': '宠物容量',
                'StormProtection': '风暴保护',
                'GasMask': '防毒面具（布尔值，>0.1为true）',
                'FlashLight': '手电筒（布尔值，>0为true）',
                // 声音相关属性
                'WalkSoundRange': '行走声音范围',
                'RunSoundRange': '奔跑声音范围'
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
                EnergyValue: parseFloat(document.getElementById('energy-value')?.value) || 0.0,
                WaterValue: parseFloat(document.getElementById('water-value')?.value) || 0.0,
                IconFileName: document.getElementById('icon-filename').value || '',
                LocalizationDesc: document.getElementById('localization-desc')?.value || '_Desc'
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
            
            // 获取特定属性和mshook属性的键名
            const specificPropsKey = this.getSpecificPropsKey(configType);
            const mshookPropsKey = this.getMshookPropsKey();
            
            // 初始化特定类型属性
            if (specificPropsKey) {
                config.content[specificPropsKey] = {};
            }
            
            // 初始化mshook属性
            config.content[mshookPropsKey] = {};
            
            // 处理所有特定属性输入
            document.querySelectorAll('.specific-property').forEach(input => {
                const key = input.dataset.key;
                const value = parseFloat(input.value);
                const propType = input.dataset.propType || 'type'; // 'type'表示特定类型属性，'mshook'表示mshook属性
                
                // 只有值不是NaN且不为0的属性才保存，减少配置文件大小
                if (!isNaN(value) && value !== 0) {
                    // 根据propType决定保存到哪个对象
                    if (propType === 'mshook') {
                        // 真正的mshook属性只保存到mshook对象中
                        config.content[mshookPropsKey][key] = value;
                    } else if (specificPropsKey) {
                        // 特定类型属性只保存到特定类型属性对象中
                        config.content[specificPropsKey][key] = value;
                    }
                }
            });
            
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

                // 保存和更新配置 - 直接使用window.configManager确保正确的实例
                window.configManager.saveConfigsToStorage();
                window.configManager.updateConfigList();
                window.configManager.selectConfig(newConfig.id);
                
                // 不使用this，直接创建通知元素
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                notification.innerHTML = `
                    <div class="font-bold">成功</div>
                    <div>配置文件导入成功</div>
                `;
                document.body.appendChild(notification);
                
                // 3秒后移除通知
                setTimeout(() => {
                    notification.remove();
                }, 3000);
                
                // 成功处理后重置文件输入
                event.target.value = '';
            } catch (error) {
                console.error('导入配置错误:', error);
                // 不使用this，直接创建通知元素
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                notification.innerHTML = `
                    <div class="font-bold">错误</div>
                    <div>配置文件格式不正确</div>
                `;
                document.body.appendChild(notification);
                
                // 3秒后移除通知
                setTimeout(() => {
                    notification.remove();
                }, 3000);
                
                // 失败时也重置文件输入
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * 获取当前配置数据
     */
    getCurrentConfigData() {
        try {
            // 如果currentConfig存在，直接返回完整的配置对象
            if (this.currentConfig) {
                return this.currentConfig;
            }
            
            // 获取配置类型
            const configType = document.getElementById('config-type').value;
            
            // 检查是否有必要的数据
            const fileName = document.getElementById('config-filename').value;
            if (!fileName) {
                return null;
            }
            
            // 如果没有currentConfig但有文件名，创建配置对象
            const config = {
                id: Date.now().toString(),
                fileName: fileName,
                type: configType,
                lastModified: new Date().toISOString(),
                content: {
                    OriginalItemId: parseInt(document.getElementById('original-item-id').value) || 0,
                    NewItemId: parseInt(document.getElementById('new-item-id').value) || 0,
                    DisplayName: document.getElementById('display-name').value || '',
                    LocalizationKey: document.getElementById('localization-key').value || '',
                    LocalizationDescValue: document.getElementById('localization-desc-value').value || '',
                    Weight: parseFloat(document.getElementById('weight').value) || 0,
                    Value: parseInt(document.getElementById('value').value) || 0,
                    Quality: parseInt(document.getElementById('quality').value) || 5,
                    Rarity: parseInt(document.getElementById('rarity').value) || 0,
                    MaxStackSize: parseInt(document.getElementById('max-stack-size').value) || 1,
                    Category: document.getElementById('category').value || '',
                    Description: document.getElementById('description').value || '',
                    IconName: document.getElementById('icon-name').value || '',
                    IsQuestItem: document.getElementById('is-quest-item').checked || false,
                    IsConsumable: document.getElementById('is-consumable').checked || false,
                    IsWeapon: document.getElementById('is-weapon').checked || false,
                    IsArmor: document.getElementById('is-armor').checked || false,
                    IsAccessory: document.getElementById('is-accessory').checked || false,
                    IsAmmo: document.getElementById('is-ammo').checked || false
                }
            };
            
            // 获取特定类型属性
            const propsKey = this.getSpecificPropsKey(configType);
            const mshookKey = this.getMshookPropsKey();
            
            if (propsKey) {
                const typeFields = this.getConfigFieldsByType(configType);
                const typeValues = {};
                Object.keys(typeFields).forEach(field => {
                    const input = document.getElementById(field);
                    if (input) {
                        if (input.type === 'checkbox') {
                            typeValues[field] = input.checked;
                        } else if (input.type === 'number') {
                            typeValues[field] = parseFloat(input.value) || 0;
                        } else {
                            typeValues[field] = input.value;
                        }
                    }
                });
                config.content[propsKey] = typeValues;
            }
            
            // 获取mshook通用属性
            const mshookFields = this.getConfigFieldsByType('mshook');
            const mshookValues = {};
            Object.keys(mshookFields).forEach(field => {
                const input = document.getElementById(field);
                if (input) {
                    if (input.type === 'checkbox') {
                        mshookValues[field] = input.checked;
                    } else if (input.type === 'number') {
                        mshookValues[field] = parseFloat(input.value) || 0;
                    } else {
                        mshookValues[field] = input.value;
                    }
                }
            });
            config.content[mshookKey] = mshookValues;
            
            return config;
        } catch (error) {
            console.error('获取当前配置数据失败:', error);
            return null;
        }
    }

    /**
     * 处理复制到剪贴板
     */
    handleCopyToClipboard() {
        // 检查浏览器是否支持剪贴板API
        if (!navigator.clipboard) {
            // 创建错误通知
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
            notification.innerHTML = `
                <div class="font-bold">错误</div>
                <div>您的浏览器不支持剪贴板API</div>
            `;
            document.body.appendChild(notification);
            
            // 3秒后移除通知
            setTimeout(() => {
                notification.remove();
            }, 3000);
            return;
        }
        
        // 获取当前配置数据
        const currentConfig = this.getCurrentConfigData();
        if (!currentConfig) {
            // 创建错误通知
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
            notification.innerHTML = `
                <div class="font-bold">错误</div>
                <div>没有可复制的配置数据</div>
            `;
            document.body.appendChild(notification);
            
            // 3秒后移除通知
            setTimeout(() => {
                notification.remove();
            }, 3000);
            return;
        }
        
        // 只复制配置对象的content部分，避免复制多余的元数据字段
        navigator.clipboard.writeText(JSON.stringify(currentConfig.content, null, 2))
            .then(() => {
                // 创建成功通知
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                notification.innerHTML = `
                    <div class="font-bold">成功</div>
                    <div>配置已复制到剪贴板</div>
                `;
                document.body.appendChild(notification);
                
                // 3秒后移除通知
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            })
            .catch(error => {
                console.error('复制到剪贴板失败:', error);
                // 创建错误通知
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                notification.innerHTML = `
                    <div class="font-bold">错误</div>
                    <div>复制到剪贴板失败</div>
                `;
                document.body.appendChild(notification);
                
                // 3秒后移除通知
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            });
    }

    /**
     * 处理剪贴板导入
     */
    handleClipboardImport() {
        // 检查浏览器是否支持剪贴板API
        if (!navigator.clipboard) {
            // 创建错误通知
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
            notification.innerHTML = `
                <div class="font-bold">错误</div>
                <div>您的浏览器不支持剪贴板API</div>
            `;
            document.body.appendChild(notification);
            
            // 3秒后移除通知
            setTimeout(() => {
                notification.remove();
            }, 3000);
            return;
        }
        
        // 从剪贴板读取文本
        navigator.clipboard.readText()
            .then(text => {
                try {
                    // 尝试解析JSON
                    const configData = JSON.parse(text);
                    
                    // 检测配置类型
                    const configType = this.detectConfigType(configData);
                    
                    // 生成文件名
                    const fileName = `clipboard_import_${Date.now()}`;
                    
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

                    // 保存和更新配置
                    window.configManager.saveConfigsToStorage();
                    window.configManager.updateConfigList();
                    window.configManager.selectConfig(newConfig.id);
                    
                    // 创建成功通知
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                    notification.innerHTML = `
                        <div class="font-bold">成功</div>
                        <div>配置已从剪贴板导入</div>
                    `;
                    document.body.appendChild(notification);
                    
                    // 3秒后移除通知
                    setTimeout(() => {
                        notification.remove();
                    }, 3000);
                } catch (error) {
                    console.error('剪贴板导入错误:', error);
                    // 创建错误通知
                    const notification = document.createElement('div');
                    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                    notification.innerHTML = `
                        <div class="font-bold">错误</div>
                        <div>无法解析剪贴板内容</div>
                    `;
                    document.body.appendChild(notification);
                    
                    // 3秒后移除通知
                    setTimeout(() => {
                        notification.remove();
                    }, 3000);
                }
            })
            .catch(error => {
                console.error('读取剪贴板错误:', error);
                // 创建错误通知
                const notification = document.createElement('div');
                notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
                notification.innerHTML = `
                    <div class="font-bold">错误</div>
                    <div>读取剪贴板失败</div>
                `;
                document.body.appendChild(notification);
                
                // 3秒后移除通知
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            });
    }

    /**
     * 过滤属性列表
     */
    filterProperties() {
        const searchTerm = document.getElementById('property-search').value.toLowerCase().trim();
        const propertyItems = document.querySelectorAll('.specific-property');
        
        // 计算显示的属性数量
        let visibleCount = 0;
        
        propertyItems.forEach(input => {
            const fieldDiv = input.closest('.mb-3');
            if (!fieldDiv) return;
            
            const label = fieldDiv.querySelector('label');
            if (!label) return;
            
            const labelText = label.textContent.toLowerCase();
            const key = input.dataset.key || '';
            
            // 检查标签文本或键名是否包含搜索词
            const matches = labelText.includes(searchTerm) || key.toLowerCase().includes(searchTerm);
            
            fieldDiv.style.display = matches ? 'block' : 'none';
            
            if (matches) {
                visibleCount++;
            }
        });
        
        // 检查并隐藏空的分类
        const categoryContents = document.querySelectorAll('.category-content');
        categoryContents.forEach(content => {
            const visibleFields = content.querySelectorAll('.mb-3:not([style*="display: none"])');
            content.style.display = visibleFields.length > 0 ? 'block' : 'none';
        });
        
        // 检查并隐藏空的类型内容
        const typeContent = document.querySelector('.type-content');
        if (typeContent) {
            const visibleFields = typeContent.querySelectorAll('.mb-3:not([style*="display: none"])');
            typeContent.style.display = visibleFields.length > 0 ? 'block' : 'none';
        }
        
        // 检查并隐藏空的mshook内容
        const mshookContent = document.querySelector('.mshook-content');
        if (mshookContent) {
            const visibleCategories = mshookContent.querySelectorAll('.category-content:not([style*="display: none"])');
            mshookContent.style.display = visibleCategories.length > 0 ? 'block' : 'none';
        }
        
        // 如果搜索框为空，重置所有显示状态
        if (!searchTerm) {
            propertyItems.forEach(input => {
                const fieldDiv = input.closest('.mb-3');
                if (fieldDiv) fieldDiv.style.display = 'block';
            });
            
            if (typeContent) typeContent.style.display = 'block';
            if (mshookContent) mshookContent.style.display = 'block';
            categoryContents.forEach(content => content.style.display = 'block');
        }
    }

    /**
     * 检测配置类型 - 更智能的类型检测
     */
    detectConfigType(configData) {
        // 优先检查是否有特定属性对象
        if (configData.WeaponProperties) return 'weapon';
        if (configData.MeleeWeaponProperties) return 'melee';
        if (configData.AmmoProperties) return 'ammo';
        if (configData.AccessoryProperties || configData.mshook && !configData.WeaponProperties) return 'accessory'; // 更新配件检测逻辑
        // 注意：mshook现在是所有类型都支持的属性，不再仅用于识别item类型
        // 如果没有特定属性但有mshook，则默认为item类型
        if (!configData.WeaponProperties && !configData.MeleeWeaponProperties && 
            !configData.AmmoProperties && !configData.AccessoryProperties && 
            configData.mshook) return 'item';
        
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

// 注意：ConfigManager的实例化和初始化在index.html的DOMContentLoaded中处理
// 避免重复初始化导致的问题

/**
 * 常量定义
 * 包含配置类型、Buff数据、标签数据等
 */

// 配置类型
export const CONFIG_TYPES = {
    WEAPON: 'weapon',
    MELEE: 'melee',
    AMMO: 'ammo',
    ITEM: 'item',
    ACCESSORY: 'accessory',
};

// 配置类型信息
export const CONFIG_TYPE_INFO = {
    [CONFIG_TYPES.WEAPON]: {
        name: '枪械配置',
        icon: 'fa-crosshairs',
        color: '#3b82f6',
    },
    [CONFIG_TYPES.MELEE]: {
        name: '近战武器',
        icon: 'fa-bolt',
        color: '#f59e0b',
    },
    [CONFIG_TYPES.AMMO]: {
        name: '子弹配置',
        icon: 'fa-circle-o',
        color: '#10b981',
    },
    [CONFIG_TYPES.ITEM]: {
        name: '物品配置',
        icon: 'fa-gift',
        color: '#ec4899',
    },
    [CONFIG_TYPES.ACCESSORY]: {
        name: '配件配置',
        icon: 'fa-cog',
        color: '#8b5cf6',
    },
};

// 完整的82个Buff数据
export const BUFF_DATA = [
    // 移动与负重
    {"分类": "移动与负重", "Buff ID": 1011, "Name": "1011_Buff_AddSpeed", "DisplayName": "加速", "说明": "提升移动速度"},
    {"分类": "移动与负重", "Buff ID": 1021, "Name": "1021_Buff_Weight_Light", "DisplayName": "轻盈", "说明": "减少负重影响"},
    {"分类": "移动与负重", "Buff ID": 1022, "Name": "1022_Buff_Weight_Heavy", "DisplayName": "负重", "说明": "增加负重影响"},
    {"分类": "移动与负重", "Buff ID": 1023, "Name": "1023_Buff_Weight_SuperHeavy", "DisplayName": "超重", "说明": "大幅增加负重影响"},
    {"分类": "移动与负重", "Buff ID": 1024, "Name": "1024_Buff_Weight_Overweight", "DisplayName": "无法承受", "说明": "极端负重，可能限制行动"},
    
    // 负面状态
    {"分类": "负面状态", "Buff ID": 1001, "Name": "1001_Buff_BleedS", "DisplayName": "出血", "说明": "持续损失生命"},
    {"分类": "负面状态", "Buff ID": 1002, "Name": "1002_Buff_BleedUnlimit", "DisplayName": "出血", "说明": "无限制出血（更严重）"},
    {"分类": "负面状态", "Buff ID": 1003, "Name": "1003_Buff_BoneCrack", "DisplayName": "骨折", "说明": "降低移动/攻击能力"},
    {"分类": "负面状态", "Buff ID": 1004, "Name": "1004_Buff_Wound", "DisplayName": "创伤", "说明": "持续生命损失+属性降低"},
    {"分类": "负面状态", "Buff ID": 1032, "Name": "1032_Buff_Starve", "DisplayName": "饥饿", "说明": "持续生命损失+属性降低"},
    {"分类": "负面状态", "Buff ID": 1, "Name": "0001_Buff_Thirsty", "DisplayName": "脱水", "说明": "持续生命损失+属性降低"},
    {"分类": "负面状态", "Buff ID": 1041, "Name": "1041_Buff_Stun", "DisplayName": "震慑", "说明": "短暂无法行动"},
    {"分类": "负面状态", "Buff ID": 1061, "Name": "1061_Buff_PoisonS", "DisplayName": "中毒", "说明": "持续生命损失+属性降低"},
    {"分类": "负面状态", "Buff ID": 1071, "Name": "1071_Buff_Electric", "DisplayName": "触电", "说明": "持续生命损失+属性降低"},
    {"分类": "负面状态", "Buff ID": 1121, "Name": "1121_Buff_Burn", "DisplayName": "点燃", "说明": "持续生命损失+属性降低"},
    {"分类": "负面状态", "Buff ID": 1111, "Name": "1111_Buff_Space", "DisplayName": "扰动", "说明": "空间扭曲造成的负面效果"},
    {"分类": "负面状态", "Buff ID": 1123, "Name": "1123_Buff_Nauseous", "DisplayName": "恶心", "说明": "属性降低+行动限制"},
    {"分类": "负面状态", "Buff ID": 1016, "Name": "1016_Buff_InjectorMeleeDamageDebuff", "DisplayName": "萎靡", "说明": "降低近战伤害"},
    {"分类": "负面状态", "Buff ID": 1112, "Name": "1112_Buff_Space2", "DisplayName": "扭曲", "说明": "空间扭曲强化负面效果"},
    {"分类": "负面状态", "Buff ID": 1117, "Name": "1117_Buff_SpaceGun", "DisplayName": "碎裂", "说明": "空间武器造成的负面效果"},
    {"分类": "负面状态", "Buff ID": 1305, "Name": "1305_Buff_Boss_Hurt_StormSpace", "DisplayName": "干枯", "说明": "Boss造成的负面效果"},
    {"分类": "负面状态", "Buff ID": 1306, "Name": "1306_Buff_Boss_Hurt_StormFire", "DisplayName": "干枯", "说明": "Boss造成的负面效果"},
    {"分类": "负面状态", "Buff ID": 1081, "Name": "1081_Buff_Pain", "DisplayName": "疼痛", "说明": "持续疼痛造成的属性降低"},
    {"分类": "负面状态", "Buff ID": 1073, "Name": "1073_Buff_ElectricGrenade", "DisplayName": "触电", "说明": "电grenade造成的触电效果"},
    
    // 增益与抵抗
    {"分类": "增益与抵抗", "Buff ID": 1012, "Name": "1012_Buff_InjectorMaxWeight", "DisplayName": "负重提升", "说明": "临时增加最大负重"},
    {"分类": "增益与抵抗", "Buff ID": 1013, "Name": "1013_Buff_InjectorArmor", "DisplayName": "硬化", "说明": "提升护甲"},
    {"分类": "增益与抵抗", "Buff ID": 1014, "Name": "1014_Buff_InjectorStamina", "DisplayName": "持久", "说明": "提升耐力恢复/上限"},
    {"分类": "增益与抵抗", "Buff ID": 1015, "Name": "1015_Buff_InjectorMeleeDamage", "DisplayName": "力量", "说明": "提升近战伤害"},
    {"分类": "增益与抵抗", "Buff ID": 1017, "Name": "1017_Buff_InjectorRecoilControl", "DisplayName": "强翅", "说明": "降低武器后坐力"},
    {"分类": "增益与抵抗", "Buff ID": 1018, "Name": "1018_Buff_HealForWhile", "DisplayName": "回复", "说明": "持续生命恢复"},
    {"分类": "增益与抵抗", "Buff ID": 1072, "Name": "1072_Buff_ElecResistShort", "DisplayName": "抗电", "说明": "短时间免疫触电"},
    {"分类": "增益与抵抗", "Buff ID": 1074, "Name": "1074_Buff_FireResistShort", "DisplayName": "抗火", "说明": "短时间免疫点燃"},
    {"分类": "增益与抵抗", "Buff ID": 1075, "Name": "1075_Buff_PoisonResistShort", "DisplayName": "抗毒", "说明": "短时间免疫中毒"},
    {"分类": "增益与抵抗", "Buff ID": 1076, "Name": "1076_Buff_SpaceResistShort", "DisplayName": "抗空间", "说明": "短时间免疫空间扭曲"},
    {"分类": "增益与抵抗", "Buff ID": 1082, "Name": "1082_Buff_PainResistShort", "DisplayName": "镇静", "说明": "短时间免疫疼痛"},
    {"分类": "增益与抵抗", "Buff ID": 1083, "Name": "1083_Buff_PainResistMiddle", "DisplayName": "镇静", "说明": "中时间免疫疼痛"},
    {"分类": "增益与抵抗", "Buff ID": 1084, "Name": "1084_Buff_PainResistLong", "DisplayName": "镇静", "说明": "长时间免疫疼痛"},
    {"分类": "增益与抵抗", "Buff ID": 1113, "Name": "1113_Buff_StormProtection1", "DisplayName": "弱效空间抵抗", "说明": "抵抗空间风暴（弱）"},
    {"分类": "增益与抵抗", "Buff ID": 1114, "Name": "1114_Buff_StormProtection2", "DisplayName": "强效空间抵抗", "说明": "抵抗空间风暴（强）"},
    {"分类": "增益与抵抗", "Buff ID": 1115, "Name": "1115_Buff_SpaceResistLow", "DisplayName": "空间减伤（小）", "说明": "降低空间伤害（小）"},
    {"分类": "增益与抵抗", "Buff ID": 1116, "Name": "1116_Buff_SpaceResistHigh", "DisplayName": "空间减伤（大）", "说明": "降低空间伤害（大）"},
    {"分类": "增益与抵抗", "Buff ID": 1301, "Name": "1301_Buff_Boss_Heal_StormFire", "DisplayName": "回复", "说明": "Boss专属生命恢复"},
    {"分类": "增益与抵抗", "Buff ID": 1302, "Name": "1302_Buff_Boss_Heal_StormSpace", "DisplayName": "回复", "说明": "Boss专属生命恢复"},
    {"分类": "增益与抵抗", "Buff ID": 1019, "Name": "1019_buff_Injector_BleedResist", "DisplayName": "出血免疫", "说明": "注射器提供的临时出血免疫"},
    
    // 特殊效果
    {"分类": "特殊效果", "Buff ID": 1201, "Name": "1201_Buff_NightVision", "DisplayName": "明视", "说明": "夜视能力"},
    {"分类": "特殊效果", "Buff ID": 1202, "Name": "1202_Buff_PaperBox", "DisplayName": "伪装", "说明": "降低被敌人发现的概率"},
    {"分类": "特殊效果", "Buff ID": 1101, "Name": "1101_Buff_Happy", "DisplayName": "高兴", "说明": "提升心情/属性"},
    {"分类": "特殊效果", "Buff ID": 1091, "Name": "1091_Buff_HotBlood", "DisplayName": "热血", "说明": "提升伤害但降低防御"},
    {"分类": "特殊效果", "Buff ID": 1307, "Name": "1307_Buff_Boss_RedBoss", "DisplayName": "*Buff_Red*", "说明": "Boss专属特殊效果"},
    {"分类": "特殊效果", "Buff ID": 1203, "Name": "1203_Buff_RedEye", "DisplayName": "???", "说明": "未知特殊效果"},
    {"分类": "特殊效果", "Buff ID": 1092, "Name": "1092_Buff_Injector_HotBlood_Trigger", "DisplayName": "易怒", "说明": "触发热血状态的前置效果"},
    {"分类": "特殊效果", "Buff ID": 1093, "Name": "1093_Buff_Injector_HotBlood_SpeedDamage", "DisplayName": "愤怒", "说明": "热血状态强化效果"},
    {"分类": "特殊效果", "Buff ID": 1303, "Name": "1303_Buff_Boss_Trigger_School", "DisplayName": "易怒", "说明": "Boss触发强化状态的前置效果"},
    {"分类": "特殊效果", "Buff ID": 1304, "Name": "1304_Buff_Boss_SpeedDamage_School", "DisplayName": "愤怒", "说明": "Boss强化状态效果"},
    {"分类": "特殊效果", "Buff ID": 1051, "Name": "1051_Buff_Base", "DisplayName": "基地", "说明": "基地相关特殊效果"},
    
    // 装备与图腾
    {"分类": "装备与图腾", "Buff ID": 1401, "Name": "1401_buff_equip_Hurt", "DisplayName": "干枯", "说明": "装备带来的负面效果"},
    {"分类": "装备与图腾", "Buff ID": 1402, "Name": "1402_buff_equip_FC_Buff", "DisplayName": "高手", "说明": "装备带来的增益效果"},
    {"分类": "装备与图腾", "Buff ID": 1481, "Name": "1481_Buff_Totem_Heal1", "DisplayName": "回复", "说明": "图腾带来的生命恢复"},
    {"分类": "装备与图腾", "Buff ID": 1900, "Name": "1900_buff_Totem_Describe_hurt", "DisplayName": "图腾诅咒", "说明": "图腾带来的负面效果"},
    
    // 免疫类
    {"分类": "免疫类", "Buff ID": 1491, "Name": "1491_buff_equip_BleedResist", "DisplayName": "出血免疫", "说明": "装备提供的出血免疫"},
    {"分类": "免疫类", "Buff ID": 1492, "Name": "1492_buff_equip_PoisonResist", "DisplayName": "免疫中毒", "说明": "装备提供的中毒免疫"},
    {"分类": "免疫类", "Buff ID": 1493, "Name": "1493_buff_equip_ElecResist", "DisplayName": "免疫感电", "说明": "装备提供的触电免疫"},
    {"分类": "免疫类", "Buff ID": 1494, "Name": "1494_buff_equip_BurnResist", "DisplayName": "免疫点燃", "说明": "装备提供的点燃免疫"},
    {"分类": "免疫类", "Buff ID": 1495, "Name": "1495_buff_equip_SpaceResist", "DisplayName": "免疫碎裂", "说明": "装备提供的空间扭曲免疫"},
    {"分类": "免疫类", "Buff ID": 1496, "Name": "1496_buff_equip_NauseousResist", "DisplayName": "免疫恶心", "说明": "装备提供的恶心免疫"},
    {"分类": "免疫类", "Buff ID": 1497, "Name": "1497_buff_equip_StunResist", "DisplayName": "免疫震慑", "说明": "装备提供的震慑免疫"},
];

// 完整的100+标签数据
export const TAG_DATA = [
    ["Bullet", "子弹"],
    ["Element", "元素属性"],
    ["Accessory", "装备配件"],
    ["Stock", "枪械枪托"],
    ["GunType_SMG", "枪械类型_冲锋枪"],
    ["Weapon", "武器"],
    ["Gun", "枪械"],
    ["GunType_BR", "枪械类型_战斗步枪"],
    ["Repairable", "可修复"],
    ["Scope", "瞄准镜"],
    ["Muzzle", "枪口配件"],
    ["GunType_PST", "枪械类型_手枪"],
    ["GunType_SHT", "枪械类型_霰弹枪"],
    ["GunType_AR", "枪械类型_突击步枪"],
    ["GunType_PWS", "枪械类型_个人武器系统"],
    ["Formula", "配方"],
    ["Formula_Blueprint", "配方_蓝图"],
    ["DestroyOnLootBox", "开箱后销毁"],
    ["Daily", "每日限定"],
    ["Tool", "工具"],
    ["Seed", "种子"],
    ["Formula_Medic", "配方_医疗"],
    ["Weapon_LV1", "武器_1级"],
    ["Western", "西部风格"],
    ["Food", "食物"],
    ["Medic", "医疗道具"],
    ["Electric", "电子类"],
    ["Luxury", "奢侈品"],
    ["Healing", "治疗类"],
    ["Armor", "护甲"],
    ["Information", "情报物品"],
    ["GunType_SNP", "枪械类型_狙击枪"],
    ["Fish", "鱼类"],
    ["Bait", "鱼饵"],
    ["Earthworm", "蚯蚓（鱼饵）"],
    ["Quest", "任务物品"],
    ["Explosive", "爆炸物"],
    ["TecEquip", "科技装备"],
    ["Crop", "农作物"],
    ["Fish_OnlyDay", "鱼类_仅白天可钓"],
    ["Formula_Normal", "配方_普通"],
    ["MeleeWeapon", "近战武器"],
    ["Special", "特殊物品"],
    ["Gem", "宝石"],
    ["DontDropOnDeadInSlot", "死亡不掉落"],
    ["Helmat", "头盔"],
    ["Backpack", "背包"],
    ["GamingConsole", "游戏主机"],
    ["Magazine", "弹匣"],
    ["Equipment", "装备"],
    ["DecorateEquipment", "装饰性装备"],
    ["LockInDemo", "演示版锁定"],
    ["Totem", "图腾道具"],
    ["Grip", "枪械握把"],
    ["DestroyInBase", "基地内销毁"],
    ["FaceMask", "面罩"],
    ["GunType_MAG", "枪械类型_机枪"],
    ["Key", "钥匙"],
    ["Continer", "容器"],
    ["SpecialKey", "特殊钥匙"],
    ["Injector", "注射器道具"],
    ["ComputerParts_GPU", "电脑配件_显卡"],
    ["Fish_OnlyNight", "鱼类_仅夜间可钓"],
    ["FcController", "手柄控制器"],
    ["Shit", "粪便（道具）"],
    ["Computer", "电脑"],
    ["Material", "材料"],
    ["Fish_OnlySunDay", "鱼类_仅晴天可钓"],
    ["Fish_OnlyRainDay", "鱼类_仅雨天可钓"],
    ["Fish_Special", "鱼类_特殊"],
    ["AdvancedDebuffMode", "高级减益模式"],
    ["MiniGame", "迷你游戏"],
    ["GunType_Rifle", "枪械类型_步枪"],
    ["GunType_Rocket", "枪械类型_火箭筒"],
    ["Cash", "现金"],
    ["Character", "角色相关"],
    ["Cartridge", "弹药筒"],
    ["ColorCard", "色卡"],
    ["DogTag", "狗牌"],
    ["Drink", "饮品"],
    ["Fish_OnlyStorm", "鱼类_仅风暴天可钓"],
    ["Fish_Other", "鱼类_其他"],
    ["Formula_Cook", "配方_烹饪"],
    ["GunType_ARR", "枪械类型_精确射手步枪"],
    ["GunType_Shot", "枪械类型_霰弹枪"],
    ["GunType_Sniper", "枪械类型_狙击枪"],
    ["Headset", "耳机"],
    ["JLab", "实验室相关"],
    ["Misc", "杂项物品"],
    ["Monitor", "显示器"],
    ["NotForSell", "非卖品"],
    ["NotSellable", "不可出售"],
    ["SoulCube", "灵魂方块"],
    ["Sticky", "粘性道具"],
];

// 字段配置 - 不同类型配置的特定字段
export const TYPE_SPECIFIC_FIELDS = {
    [CONFIG_TYPES.WEAPON]: {
        'DistanceMultiplier': '射程',
        'BulletSpeedMultiplier': '子弹速度',
        'ADSTimeMultiplier': '瞄准时间',
        'BaseDamageMultiplier': '基础伤害',
        'CriticalChanceMultiplier': '暴击率',
        'ReloadSpeedMultiplier': '换弹速度',
        'AccuracyMultiplier': '精度',
        'RecoilVMinMultiplier': '垂直后坐力最小值',
        'RecoilVMaxMultiplier': '垂直后坐力最大值',
        'RecoilHMinMultiplier': '水平后坐力最小值',
        'RecoilHMaxMultiplier': '水平后坐力最大值',
    },
    [CONFIG_TYPES.MELEE]: {
        'NewDamage': '伤害值',
        'NewCritRate': '暴击率',
        'NewCritDamageFactor': '暴击伤害倍数',
        'NewArmorPiercing': '护甲穿透',
        'NewAttackSpeed': '攻击速度',
        'NewAttackRange': '攻击范围',
    },
    [CONFIG_TYPES.AMMO]: {
        'NewCritRateGain': '暴击率',
        'NewCritDamageFactorGain': '暴击伤害',
        'NewArmorPiercingGain': '护甲穿透',
        'NewDamageMultiplier': '伤害',
        'NewBulletSpeed': '子弹速度',
    },
    [CONFIG_TYPES.ACCESSORY]: {
        'Damage': '伤害',
        'CritRate': '暴击率',
        'CritDamageFactor': '暴击伤害',
        'ADSTime': '瞄准时间',
        'AttackSpeed': '攻击速度',
        'BulletSpeed': '子弹速度',
    },
    [CONFIG_TYPES.ITEM]: {},
};

// 默认配置内容
export const DEFAULT_CONFIG_CONTENT = {
    OriginalItemId: 0,
    NewItemId: 0,
    DisplayName: '',
    LocalizationKey: '',
    LocalizationDescValue: '',
    Weight: 0,
    Value: 0,
    Quality: 5,
    Tags: [],
    IconFileName: '',
    HealValue: 0,
    UseDurability: 0,
    DurabilityUsageDrug: 0,
    SoundKey: '',
    ModuleRootDir: '',
    DurabilityLoss: 0,
    UseTime: 0,
    EnergyValue: 0,
    WaterValue: 0,
    BuffDuration: {
        Duration: 30.0,
        ReplaceOriginalBuff: false,
        ReplacementBuffId: -1
    },
    Stackable: false,
    CanBeSold: true,
    CanDrop: true,
    UnlockByDefault: true,
    HideInIndex: false,
    LockInDemo: false,
    // 配件槽相关
    AdditionalSlotTags: [],
    AdditionalSlotCount: 0,
    AdditionalSlotNames: [],
    ReplaceExistingSlots: false,
    // 分解配方相关
    EnableDecompose: false,
    DecomposeFormulaId: 0,
    DecomposeTime: 10,
    DecomposeMoney: 0,
    DecomposeResults: [],
    // 合成配方相关
    FormulaId: '',
    CraftingMoney: 0,
    ResultItemAmount: 1,
    CraftingTags: [],
    RequirePerk: '',
    CostItems: [],
    AdditionalRecipes: [],
    // Buff配置
    BuffCopyConfigs: [],
    // 抽奖配置
    Gacha: {
        Description: '',
        NotificationKey: 'Default',
        Entries: []
    },
    // 物品效果修改器
    mshook: {},
};

// 常用常量
export const CONSTANTS = {
    MAX_HISTORY: 20,
    MIN_QUALITY: 1,
    MAX_QUALITY: 9,
    DEBOUNCE_DELAY: 300,
    NOTIFICATION_DURATION: 3000,
};

// Buff分类
export const BUFF_CATEGORIES = [
    '移动与负重',
    '负面状态',
    '增益与抵抗',
    '特殊效果',
    '装备与图腾',
    '免疫类',
];

// 抽奖系统配置
export const GACHA_CONFIG = {
    DEFAULT_WEIGHT: 100,
    MIN_WEIGHT: 1,
    MAX_WEIGHT: 10000,
    DEFAULT_PITY: 90,
    MIN_PITY: 1,
    MAX_PITY: 200,
};

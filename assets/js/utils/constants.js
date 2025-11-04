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

// 完整的100+标签数据（扁平数组，用于兼容）
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

// 标签数据（按类别分组，用于下拉菜单）
export const TAG_DATA_GROUPED = [
    {
        category: "枪械相关",
        tags: [
            { id: "Bullet", name: "子弹" },
            { id: "Element", name: "元素" },
            { id: "Accessory", name: "配件" },
            { id: "Stock", name: "枪托" },
            { id: "GunType_SMG", name: "枪械类型_冲锋枪" },
            { id: "Weapon", name: "武器" },
            { id: "Gun", name: "枪" },
            { id: "GunType_BR", name: "枪械类型_战斗步枪" },
            { id: "Scope", name: "瞄准镜" },
            { id: "Muzzle", name: "枪口" },
            { id: "GunType_PST", name: "枪械类型_手枪" },
            { id: "GunType_SHT", name: "枪械类型_霰弹枪" },
            { id: "GunType_AR", name: "枪械类型_突击步枪" },
            { id: "GunType_PWS", name: "枪械类型_个人武器系统" },
            { id: "GunType_SNP", name: "枪械类型_狙击枪" },
            { id: "GunType_MAG", name: "枪械类型_机枪" },
            { id: "GunType_Rifle", name: "枪械类型_步枪" },
            { id: "GunType_Rocket", name: "枪械类型_火箭筒" },
            { id: "GunType_ARR", name: "枪械类型_突击步枪改进型" },
            { id: "GunType_Shot", name: "枪械类型_霰弹枪（简写）" },
            { id: "GunType_Sniper", name: "枪械类型_狙击枪" },
            { id: "Guajian", name: "枪械挂件" },
            { id: "Magazine", name: "弹匣" },
            { id: "Grip", name: "握把" },
            { id: "Cartridge", name: "弹药筒" }
        ]
    },
    {
        category: "物品类型",
        tags: [
            { id: "Luxury", name: "奢侈品" },
            { id: "Medic", name: "医疗用品" },
            { id: "Misc", name: "杂项" },
            { id: "Electric", name: "电子的" },
            { id: "Tool", name: "工具" },
            { id: "Seed", name: "种子" },
            { id: "Weapon_LV1", name: "武器_1级" },
            { id: "Western", name: "西部风格" },
            { id: "Food", name: "食物" },
            { id: "Healing", name: "治疗" },
            { id: "Armor", name: "盔甲" },
            { id: "Information", name: "信息" },
            { id: "Fish", name: "鱼" },
            { id: "Bait", name: "诱饵" },
            { id: "Earthworm", name: "蚯蚓" },
            { id: "Quest", name: "任务" },
            { id: "Explosive", name: "爆炸物" },
            { id: "TecEquip", name: "科技装备" },
            { id: "Crop", name: "农作物" },
            { id: "Gem", name: "宝石" },
            { id: "MeleeWeapon", name: "近战武器" },
            { id: "Helmat", name: "头盔" },
            { id: "Special", name: "特殊的" },
            { id: "Backpack", name: "背包" },
            { id: "GamingConsole", name: "游戏主机" },
            { id: "Equipment", name: "装备" },
            { id: "DecorateEquipment", name: "装饰性装备" },
            { id: "Totem", name: "图腾" },
            { id: "Key", name: "钥匙" },
            { id: "Continer", name: "容器" },
            { id: "SpecialKey", name: "特殊钥匙" },
            { id: "Injector", name: "注射器" },
            { id: "ComputerParts_GPU", name: "电脑部件_显卡" },
            { id: "FcController", name: "FC控制器" },
            { id: "Shit", name: "粪便" },
            { id: "Computer", name: "电脑" },
            { id: "Material", name: "材料" },
            { id: "Cash", name: "现金" },
            { id: "Character", name: "角色" },
            { id: "ColorCard", name: "色卡" },
            { id: "DogTag", name: "身份牌" },
            { id: "Drink", name: "饮品" },
            { id: "Headset", name: "耳机" },
            { id: "JLab", name: "实验室" },
            { id: "Monitor", name: "显示器" },
            { id: "SoulCube", name: "灵魂立方体" },
            { id: "Sticky", name: "粘性的" }
        ]
    },
    {
        category: "配方相关",
        tags: [
            { id: "Formula", name: "配方" },
            { id: "Formula_Blueprint", name: "配方_蓝图" },
            { id: "Formula_Medic", name: "配方_医疗" },
            { id: "Formula_Normal", name: "配方_普通" },
            { id: "Formula_Cook", name: "配方_烹饪" }
        ]
    },
    {
        category: "特性标签",
        tags: [
            { id: "Repairable", name: "可修复的" },
            { id: "DestroyOnLootBox", name: "开启战利品箱时销毁" },
            { id: "Daily", name: "每日的" },
            { id: "LockInDemo", name: "演示版中锁定" },
            { id: "DontDropOnDeadInSlot", name: "死亡时槽位物品不掉落" },
            { id: "DestroyInBase", name: "在基地中销毁" },
            { id: "FaceMask", name: "面罩" },
            { id: "AdvancedDebuffMode", name: "高级减益模式" },
            { id: "MiniGame", name: "迷你游戏" },
            { id: "NotForSell", name: "非卖品" },
            { id: "NotSellable", name: "不可出售" },
            { id: "NotNested", name: "不可嵌套" }
        ]
    },
    {
        category: "环境相关",
        tags: [
            { id: "Fish_OnlyDay", name: "鱼_仅白天出现" },
            { id: "Fish_OnlyNight", name: "鱼_仅夜间出现" },
            { id: "Fish_OnlySunDay", name: "鱼_仅晴天出现" },
            { id: "Fish_OnlyRainDay", name: "鱼_仅雨天出现" },
            { id: "Fish_Special", name: "鱼_特殊" },
            { id: "Fish_OnlyStorm", name: "鱼_仅暴风雨天出现" },
            { id: "Fish_Other", name: "鱼_其他" }
        ]
    }
];

// 武器属性说明字典 - 基于武器数据详解文档
export const WEAPON_FIELD_DESCRIPTIONS = {
    // 基础性能倍率
    'DistanceMultiplier': {
        name: '射程倍率',
        description: '武器射程，子弹超过射程会直接消失。这是一个系数（倍数），用于加成武器射程。',
        formula: '实际射程 = 基础射程 × DistanceMultiplier',
        default: 1.0
    },
    'BulletSpeedMultiplier': {
        name: '子弹速度倍率',
        description: '子弹速度系数（倍数），用于加成子弹面板的子弹速度。',
        formula: '实际子弹速度 = 子弹面板速度 × BulletSpeedMultiplier',
        default: 1.0
    },
    'ADSTimeMultiplier': {
        name: '瞄准时间倍率',
        description: '从腰射散布切换到瞄准散布所需的时间（开镜完成之前依照腰射进行后座与扩散结算）。',
        default: 1.0
    },
    'ShootSpeedMultiplier': {
        name: '射击速度倍率',
        description: '影响武器连射的基础射速。更快的射速能一定程度上影响武器的散布手感。',
        default: 1.0
    },
    'CapacityMultiplier': {
        name: '容量倍率',
        description: '弹匣容量的倍率，会受配件效果影响。',
        default: 1.0
    },
    'ReloadSpeedMultiplier': {
        name: '换弹速度倍率',
        description: '武器的换弹时间（单位「秒」），数值越小换弹越快。',
        default: 1.0
    },
    
    // 伤害系统倍率
    'BaseDamageMultiplier': {
        name: '基础伤害倍率',
        description: '保证武器的最低伤害不为0的保底机制（俗称钝伤）。如果武器的基础伤害经过计算后仍然低于此值，就强制把伤害设为该值。',
        formula: '最终伤害 = max(计算后伤害, 基础伤害 × BaseDamageMultiplier)',
        default: 1.0
    },
    'DamageMultiplier': {
        name: '伤害倍率（面板属性）',
        description: '武器对敌人在优势射程应造成的基础伤害。',
        default: 1.0
    },
    'CriticalChanceMultiplier': {
        name: '暴击率倍率',
        description: '打中人时的暴击概率（对枪械无效）。',
        default: 1.0
    },
    'CriticalDamageFactorMultiplier': {
        name: '暴击伤害倍率倍率',
        description: '暴击伤害系数的倍率。',
        default: 1.0
    },
    'PenetrateMultiplier': {
        name: '穿透倍率',
        description: '子弹穿透敌方单位能力的倍率，默认为0（1也没用）。',
        default: 1.0
    },
    'ArmorPiercingMultiplier': {
        name: '穿甲倍率',
        description: '对敌人护甲的穿透能力的修正值倍率，基于（1-6级弹）的穿透效果附加额外的穿甲等级。',
        default: 1.0
    },
    'ArmorBreakMultiplier': {
        name: '破甲倍率',
        description: '攻击对敌人护甲耐久造成的破坏程度的倍率，数值越高，摧毁护甲的效率越快。',
        default: 1.0
    },
    'ExplosionDamageMultiplier': {
        name: '爆炸伤害倍率',
        description: '若武器有爆炸效果，此为爆炸伤害的倍数（当前为0则无额外爆炸伤害加成）。',
        default: 1.0
    },
    'ExplosionRangeMultiplier': {
        name: '爆炸范围倍率',
        description: '爆炸范围的倍率。',
        default: 1.0
    },
    'RangeAddition': {
        name: '射程加成',
        description: '在全射程里面能够打出全额伤害的射程距离（加法）。',
        formula: '全额伤害射程 = 基础射程 + RangeAddition',
        default: 0
    },
    'BulletSpeedAddition': {
        name: '子弹速度加成（面板属性）',
        description: '使用枪械时发射子弹的速度加成（加法）。',
        formula: '实际子弹速度 = 子弹速度 × BulletSpeedMultiplier + BulletSpeedAddition',
        default: 0
    },
    
    // 精度系统倍率
    'AccuracyMultiplier': {
        name: '精度倍率',
        description: '精度倍数，效果不明显或无效。',
        default: 1.0
    },
    'ScatterFactorMultiplier': {
        name: '腰射散布系数（面板属性）',
        description: '腰射状态下真正影响子弹散布的系数，同时也是面板显示的数据。在全局层面控制整个散布。',
        default: 1.0
    },
    'ScatterFactorADSMultiplier': {
        name: '开镜散布系数（面板属性）',
        description: '瞄准状态下真正影响子弹散布的系数，同时也是面板显示的数据。',
        default: 1.0
    },
    'DefaultScatterMultiplier': {
        name: '腰射初始散布倍率',
        description: '腰射状态下初始准星散布大小的倍率（官方数值普遍低于0.1）。实际应用时会乘以腰射散布系数。',
        default: 1.0
    },
    'DefaultScatterADSMultiplier': {
        name: '开镜初始散布倍率',
        description: '瞄准状态下初始准星散布值的倍率。实际应用时会乘以开镜散布系数。',
        default: 1.0
    },
    'MaxScatterMultiplier': {
        name: '腰射最大散布倍率',
        description: '腰射状态下准星最大散布幅度的倍率。达到该值后每次开火导致的准星扩散幅度会立刻变为原来的1/6。',
        default: 1.0
    },
    'MaxScatterADSMultiplier': {
        name: '开镜最大散布倍率',
        description: '瞄准状态下准星最大散布幅度的倍率。达到该值后每次开火导致的准星扩散幅度会立刻变为原来的1/6。',
        default: 1.0
    },
    'ScatterGrowMultiplier': {
        name: '腰射散布扩散倍率',
        description: '腰射连续开火状态下，每游戏刻之间准星扩散至最大散布的速率的倍率。',
        default: 1.0
    },
    'ScatterGrowADSMultiplier': {
        name: '开镜散布扩散倍率',
        description: '瞄准连续开火状态下，每游戏刻之间准星扩散至最大散布的速率的倍率。',
        default: 1.0
    },
    'ScatterRecoverMultiplier': {
        name: '腰射散布恢复倍率',
        description: '腰射状态下，每游戏刻之间准星自然恢复到初始散布的速率的倍率。如果散布恢复≥散布扩散，则除去散布系数与初始散布外的值都不生效。',
        default: 1.0
    },
    'ScatterRecoverADSMultiplier': {
        name: '开镜散布恢复倍率',
        description: '瞄准状态下，每游戏刻之间准星自然恢复到初始散布的速率的倍率。',
        default: 1.0
    },
    
    // 后坐力系统倍率
    'RecoilVMinMultiplier': {
        name: '垂直最小后坐力倍率',
        description: '垂直后坐力最小值的倍率。',
        default: 1.0
    },
    'RecoilVMaxMultiplier': {
        name: '垂直最大后坐力倍率',
        description: '垂直后坐力最大值的倍率。',
        default: 1.0
    },
    'RecoilHMinMultiplier': {
        name: '水平最小后坐力倍率',
        description: '水平后坐力最小值（向左）的倍率。',
        default: 1.0
    },
    'RecoilHMaxMultiplier': {
        name: '水平最大后坐力倍率',
        description: '水平后坐力最大值（向右）的倍率。',
        default: 1.0
    },
    'RecoilScaleVMultiplier': {
        name: '垂直后坐力缩放倍率（面板属性）',
        description: '垂直后坐力数据，直接显示在面板上，提供基础后坐力。从垂直后坐力的最大最小值范围内随机抽取一个值，并将其乘以后坐力系数。',
        default: 1.0
    },
    'RecoilScaleHMultiplier': {
        name: '水平后坐力缩放倍率（面板属性）',
        description: '水平后坐力数据，直接显示在面板上，提供基础后坐力。从水平后坐力的最大最小值范围内随机抽取一个值，并将其乘以后坐力系数。',
        default: 1.0
    },
    'RecoilRecoverMultiplier': {
        name: '后坐力恢复倍率',
        description: '装备枪械时准星自动回正的速度倍率。自动武器的后坐力恢复明显高于半自动武器。',
        default: 1.0
    },
    'RecoilTimeMultiplier': {
        name: '后坐力时间倍率',
        description: '单次后坐力效果持续作用于准星的时间倍率。更大的数值会让单段后坐力更轻柔（但叠加在一起），更小的数值会让单次后坐力更快生效，同时让连续射击时准星的落点趋于抖动。',
        default: 1.0
    },
    'RecoilRecoverTimeMultiplier': {
        name: '后坐力恢复时间倍率',
        description: '此项数据为"控枪"属性，用于停火后开始将偏离鼠标指针的拉回鼠标指针所需要的时间长短（如果准星回正则停止生效），该值与"后坐力恢复"共同影响后坐力恢复效率。',
        default: 1.0
    },
    
    // 移动性能倍率
    'MoveSpeedMultiplierAdd': {
        name: '移动速度倍率加成',
        description: '直接增加装备武器时的人物移动速度，数值越高，机动性越强。',
        formula: '实际移动速度 = 人物面板移速 × (1 + MoveSpeedMultiplierAdd)',
        default: 0.0
    },
    'ADSMoveSpeedMultiplierAdd': {
        name: '开镜移动速度倍率加成',
        description: '瞄准时人物的移动速度（公式同上）。',
        formula: '开镜移动速度 = 人物面板移速 × (1 + ADSMoveSpeedMultiplierAdd)',
        default: 0.0
    },
    'ADSAimDistanceFactorMultiplier': {
        name: '瞄准距离因子倍率',
        description: '瞄准状态下的可见视野距离倍率（高倍镜开镜会强制移动准星）。',
        default: 1.0
    },
    
    // Hash属性（直接值，非倍率）
    'CritDamageFactorHash': {
        name: '暴击伤害系数',
        description: '发生暴击时的伤害倍率（Hash属性，直接值）。',
        default: 0
    },
    'PenetrateHash': {
        name: '穿透能力',
        description: '子弹穿透敌方单位能力（Hash属性，直接值），默认为0（1也没用）。',
        default: 0
    },
    'ArmorPiercingHash': {
        name: '护甲穿透',
        description: '对敌人护甲的穿透能力的修正值（Hash属性，直接值），基于（1-6级弹）的穿透效果附加额外的穿甲等级。',
        default: 0
    },
    'ArmorBreakHash': {
        name: '护甲破坏',
        description: '攻击对敌人护甲耐久造成的破坏程度（Hash属性，直接值），数值越高，摧毁护甲的效率越快。',
        default: 0
    },
    'explosionDamageMultiplierHash': {
        name: '爆炸伤害乘数',
        description: '若武器有爆炸效果，此为爆炸伤害的倍数（Hash属性，直接值），当前为0则无额外爆炸伤害加成。',
        default: 0
    },
    'ShotCountHash': {
        name: '射击次数',
        description: '一次射击发射的子弹数量（Hash属性，直接值），如霰弹枪的弹丸数，会稀释总伤害，正常枪械数字为1并发射独头弹。',
        default: 0
    },
    'ShotAngleHash': {
        name: '射击角度',
        description: '霰弹子弹弹头散布的角度范围（Hash属性，直接值），数值越小，弹头越集中。比如填入10度就是腰射时方向左右各5度，瞄准时为左右各2.5度。但是实际效果还受到散布系数影响。',
        default: 0
    },
    'BurstCountHash': {
        name: '爆发模式连射次数',
        description: '切换武器的射击模式，让单次射击（点一下左键）的射击变为连射x次的效果并扣除对应载弹量（Hash属性，直接值）。',
        default: 0
    },
    'SoundRangeHash': {
        name: '声音范围',
        description: '武器射击时声音传播的范围（Hash属性，直接值），数值越大，敌人会发现枪声察觉的范围越大。',
        default: 0
    },
    'ADSAimDistanceFactorHash': {
        name: '瞄准距离系数',
        description: '瞄准状态下的可见视野距离（Hash属性，直接值），高倍镜开镜会强制移动准星。',
        default: 0
    },
    'ReloadTimeHash': {
        name: '上膛时间',
        description: '单位时间内的子弹上膛时间（Hash属性，直接值），使用范围可能是栓动或者半自动范围，但也有其他作者解释该词条被取消了。',
        default: 0
    },
    'ScatterFactorHash': {
        name: '常规散布系数',
        description: '腰射散布系数（Hash属性，直接值）。',
        default: 0
    },
    'ScatterFactorHashADS': {
        name: '瞄准散布系数',
        description: '开镜散布系数（Hash属性，直接值）。',
        default: 0
    },
    'DefaultScatterHashADS': {
        name: '瞄准默认散布',
        description: '开镜初始散布（Hash属性，直接值）。',
        default: 0
    },
    'MaxScatterHash': {
        name: '常规最大散布',
        description: '腰射最大散布（Hash属性，直接值）。',
        default: 0
    },
    'MaxScatterHashADS': {
        name: '瞄准最大散布',
        description: '开镜最大散布（Hash属性，直接值）。',
        default: 0
    },
    'ScatterGrowHash': {
        name: '常规散布增长',
        description: '腰射散布增长（Hash属性，直接值）。',
        default: 0
    },
    'ScatterGrowHashADS': {
        name: '瞄准散布增长',
        description: '开镜散布增长（Hash属性，直接值）。',
        default: 0
    },
    'ScatterRecoverHash': {
        name: '常规散布恢复',
        description: '腰射散布恢复（Hash属性，直接值）。',
        default: 0
    },
    'ScatterRecoverHashADS': {
        name: '瞄准散布恢复',
        description: '开镜散布恢复（Hash属性，直接值）。',
        default: 0
    },
    'RecoilVMiniHash': {
        name: '垂直后坐力最小值',
        description: '垂直后坐力最小值（Hash属性，直接值）。',
        default: 0
    },
    'RecoilVMaxHash': {
        name: '垂直后坐力最大值',
        description: '垂直后坐力最大值（Hash属性，直接值）。',
        default: 0
    },
    'RecoilHMinHash': {
        name: '水平后坐力最小值',
        description: '水平后坐力最小值（Hash属性，直接值）。',
        default: 0
    },
    'RecoilHMaxHash': {
        name: '水平后坐力最大值',
        description: '水平后坐力最大值（Hash属性，直接值）。',
        default: 0
    },
    'RecoilScaleHash': {
        name: '后坐力缩放',
        description: '后坐力缩放（Hash属性，直接值）。',
        default: 0
    },
    'RecoilRecoverHash': {
        name: '后坐力恢复',
        description: '装备枪械时准星自动回正的速度（Hash属性，直接值）。',
        default: 0
    },
    'RecoilTimeHash': {
        name: '后坐力时间',
        description: '单次后坐力效果持续作用于准星的时间（Hash属性，直接值）。',
        default: 0
    },
    'RecoilRecoverTimeHash': {
        name: '后坐力恢复时间',
        description: '停火后开始将偏离鼠标指针的拉回鼠标指针所需要的时间长短（Hash属性，直接值）。',
        default: 0
    },
    'CapacityHash': {
        name: '弹匣容量',
        description: '武器最大载弹数（Hash属性，直接值），会受配件效果影响。',
        default: 0
    },
    'BuffChanceHash': {
        name: '增益触发概率',
        description: '属性武器命中为敌人施加异常效果的概率（Hash属性，直接值），值为1时必然触发。',
        default: 0
    },
    'BulletBleedChanceHash': {
        name: '子弹出血概率',
        description: '子弹出血概率（Hash属性，直接值），无影响，该数据应在子弹上生效。',
        default: 0
    },
    'bulletDurabilityCostHash': {
        name: '子弹耐久消耗',
        description: '与发射的子弹耐久消耗做加法（Hash属性，直接值）。枪械开火耐久消耗 = 枪械本身子弹耐久消耗 + 子弹数据上耐久消耗。',
        default: 0
    }
};

// 武器属性字段映射 - 基于官方数据详解（保留用于向后兼容）
export const WEAPON_FIELDS = {
    // 基础属性
    'Damage': { label: '伤害', type: 'number', step: '1', default: 16, description: '武器基础伤害值' },
    'ShootSpeed': { label: '射速', type: 'number', step: '1', default: 10, description: '武器连射的基础射速' },
    'Capacity': { label: '弹匣容量', type: 'number', step: '1', default: 30, description: '武器最大载弹数' },
    'ReloadTime': { label: '换弹时间', type: 'number', step: '0.1', default: 3, description: '换弹时间（秒）' },
    'BrustCount': { label: '连射次数', type: 'number', step: '1', default: 1, description: '单次射击的连发数' },
    'BulletSpeed': { label: '子弹速度', type: 'number', step: '1', default: 118, description: '子弹飞行速度' },
    'BulletDistance': { label: '优势射程', type: 'number', step: '1', default: 23, description: '控制伤害衰减的射程' },
    'Penetrate': { label: '单位穿透', type: 'number', step: '1', default: 0, description: '子弹穿透能力（通常无效）' },
    'CritRate': { label: '暴击率', type: 'number', step: '0.01', default: 0.13, description: '暴击概率' },
    'CritDamageFactor': { label: '暴击伤害倍率', type: 'number', step: '0.1', default: 1.45, description: '暴击时的伤害倍数' },
    'ArmorPiercing': { label: '穿甲等级', type: 'number', step: '1', default: 0, description: '护甲穿透等级' },
    'ArmorBreak': { label: '破甲值', type: 'number', step: '1', default: 0, description: '对护甲耐久的破坏程度' },
    'ShotPerRound': { label: '单发弹丸数', type: 'number', step: '1', default: 1, description: '一次射击发射的子弹数量' },
    'SingleShotAngle': { label: '单发散布角度', type: 'number', step: '1', default: 0, description: '霰弹枪弹头散布角度' },
    'SoundRange': { label: '声音传播范围', type: 'number', step: '0.1', default: 27.2, description: '枪声传播距离' },
    'ADSAimDistanceFactor': { label: '瞄准范围系数', type: 'number', step: '0.1', default: 1, description: '瞄准状态下的视野距离' },
    'ADSTime': { label: '开镜时间', type: 'number', step: '0.01', default: 0.65, description: '从腰射切换到瞄准的时间' },
    'MoveSpeedMultiplier': { label: '据枪移动速度系数', type: 'number', step: '0.01', default: 0.85, description: '持枪时的移动速度系数' },
    'ADS Movement Coefficient': { label: '开镜移动速度系数', type: 'number', step: '0.01', default: 0.45, description: '瞄准时的移动速度系数' },
    'Explosion DMG Coefficient': { label: '爆炸伤害系数', type: 'number', step: '0.1', default: 1, description: '爆炸伤害倍数' },
    
    // 散布相关属性
    'Hip Fire Basic Spread': { label: '腰射基础散布', type: 'number', step: '0.001', default: 0.301, description: '腰射初始散布值' },
    'Hip Fire Max Spread': { label: '腰射最大散布', type: 'number', step: '0.001', default: 0.96, description: '腰射最大散布值' },
    'Hip Fire Spread Growth': { label: '腰射散布增长', type: 'number', step: '0.001', default: 0.261, description: '腰射散布增长速率' },
    'Hip Fire Spread Recovery': { label: '腰射散布恢复', type: 'number', step: '0.001', default: 0.22, description: '腰射散布恢复速率' },
    'ADS Initial Spread': { label: '开镜初始散布', type: 'number', step: '0.001', default: 0.324, description: '瞄准初始散布值' },
    'ADS Max Spread': { label: '开镜最大散布', type: 'number', step: '0.001', default: 0.945, description: '瞄准最大散布值' },
    'ADS Spread Growth': { label: '开镜散布增长', type: 'number', step: '0.001', default: 0.27, description: '瞄准散布增长速率' },
    'ADS Spread Recovery': { label: '瞄准散布恢复', type: 'number', step: '0.001', default: 0.4, description: '瞄准散布恢复速率' },
    'Hip Fire Spread': { label: '腰射散布（面板）', type: 'number', step: '0.1', default: 37.5, description: '显示在武器面板上的腰射散布' },
    'ADS Spread': { label: '瞄准散布（面板）', type: 'number', step: '0.1', default: 10.79, description: '显示在武器面板上的瞄准散布' },
    
    // 后坐力相关属性
    'Min Vertical Recoil': { label: '最小垂直后坐力', type: 'number', step: '0.001', default: 0.927, description: '垂直后坐力最小值' },
    'Max Vertical Recoil': { label: '最大垂直后坐力', type: 'number', step: '0.001', default: 1.073, description: '垂直后坐力最大值' },
    'Min Horizontal Recoil': { label: '最小水平后坐力', type: 'number', step: '0.001', default: -0.333, description: '水平后坐力最小值（向左）' },
    'Max Horizontal Recoil': { label: '最大水平后坐力', type: 'number', step: '0.001', default: 0.667, description: '水平后坐力最大值（向右）' },
    'Horizontal Recoil Range': { label: '水平后坐力范围', type: 'string', step: '', default: '-0.333 ~ 0.667', description: '水平后坐力范围' },
    'Recoil Time': { label: '后坐力时间', type: 'number', step: '0.001', default: 0.075, description: '单次后坐力作用时间' },
    'Recoil Recovery Time': { label: '后坐力恢复时间', type: 'number', step: '0.001', default: 0.12, description: '停火后开始回正的时间' },
    'Recoil Recovery': { label: '后坐力恢复值', type: 'number', step: '1', default: 500, description: '准星自动回正速度' },
    
    // 其他属性
    'Flashlight': { label: '战术手电', type: 'number', step: '1', default: 0, description: '是否配备战术手电' },
};

// 武器属性倍率字段映射
export const WEAPON_MULTIPLIER_FIELDS = {
    // 基础倍率
    'DistanceMultiplier': { label: '射程倍率', type: 'number', step: '0.1', default: 1.0, description: '武器射程倍数' },
    'BulletSpeedMultiplier': { label: '子弹速度倍率', type: 'number', step: '0.1', default: 1.0, description: '子弹速度倍数' },
    'ADSTimeMultiplier': { label: '瞄准时间倍率', type: 'number', step: '0.1', default: 1.0, description: '开镜时间倍数' },
    'BaseDamageMultiplier': { label: '基础伤害倍率', type: 'number', step: '0.1', default: 1.0, description: '基础伤害倍数（保底机制）' },
    'RangeAddition': { label: '射程加成', type: 'number', step: '1', default: 0, description: '全额伤害射程加成' },
    'BulletSpeedAddition': { label: '子弹速度加成', type: 'number', step: '1', default: 0, description: '子弹速度加成值' },
    'CriticalChanceMultiplier': { label: '暴击率倍率', type: 'number', step: '0.01', default: 1.0, description: '暴击率倍数（对枪械无效）' },
    'ReloadSpeedMultiplier': { label: '换弹速度倍率', type: 'number', step: '0.1', default: 1.0, description: '换弹时间倍数' },
    'AccuracyMultiplier': { label: '精度倍率', type: 'number', step: '0.1', default: 1.0, description: '精度倍数（效果不明显）' },
    'DamageMultiplier': { label: '伤害倍率', type: 'number', step: '0.1', default: 1.0, description: '武器伤害倍数' },
    'CritDamageFactorHash': { label: '暴击伤害系数', type: 'number', step: '0.1', default: 1.0, description: '暴击伤害倍数' },
    'PenetrateHash': { label: '穿透倍率', type: 'number', step: '0.1', default: 1.0, description: '穿透能力倍数' },
    'ArmorPiercingHash': { label: '护甲穿透倍率', type: 'number', step: '0.1', default: 1.0, description: '护甲穿透倍数' },
    'ArmorBreakHash': { label: '护甲破坏倍率', type: 'number', step: '0.1', default: 1.0, description: '护甲破坏倍数' },
    'explosionDamageMultiplierHash': { label: '爆炸伤害乘数', type: 'number', step: '0.1', default: 1.0, description: '爆炸伤害倍数' },
    'ExplosionRangeMultiplier': { label: '爆炸范围倍率', type: 'number', step: '0.1', default: 1.0, description: '爆炸范围倍数' },
    'ShotCountMultiplier': { label: '霰弹枪弹头数倍率', type: 'number', step: '0.1', default: 1.0, description: '霰弹枪弹头数倍数' },
    'ShotAngleMultiplier': { label: '霰弹枪弹头散布角度倍率', type: 'number', step: '0.1', default: 1.0, description: '霰弹枪散布角度倍数' },
    'BurstCountHash': { label: '爆发模式连射次数', type: 'number', step: '1', default: 1, description: '单次射击连发数' },
    'SoundRangeHash': { label: '声音范围倍率', type: 'number', step: '0.1', default: 1.0, description: '声音传播范围倍数' },
    'ADSAimDistanceFactorHash': { label: '瞄准距离系数倍率', type: 'number', step: '0.1', default: 1.0, description: '瞄准距离倍数' },
    'ReloadTimeHash': { label: '上膛时间倍率', type: 'number', step: '0.1', default: 1.0, description: '上膛时间倍数' },
    
    // 散布倍率
    'ScatterFactorMultiplier': { label: '腰射散布系数', type: 'number', step: '0.1', default: 1.0, description: '腰射散布系数（面板显示）' },
    'ScatterFactorADSMultiplier': { label: '开镜散布系数', type: 'number', step: '0.1', default: 1.0, description: '开镜散布系数（面板显示）' },
    'DefaultScatterMultiplier': { label: '腰射初始散布倍率', type: 'number', step: '0.1', default: 1.0, description: '腰射初始散布倍数' },
    'DefaultScatterADSMultiplier': { label: '开镜初始散布倍率', type: 'number', step: '0.1', default: 1.0, description: '开镜初始散布倍数' },
    'MaxScatterMultiplier': { label: '腰射最大散布倍率', type: 'number', step: '0.1', default: 1.0, description: '腰射最大散布倍数' },
    'MaxScatterADSMultiplier': { label: '开镜最大散布倍率', type: 'number', step: '0.1', default: 1.0, description: '开镜最大散布倍数' },
    'ScatterGrowMultiplier': { label: '腰射散布扩散倍率', type: 'number', step: '0.1', default: 1.0, description: '腰射散布增长倍数' },
    'ScatterGrowADSMultiplier': { label: '开镜散布扩散倍率', type: 'number', step: '0.1', default: 1.0, description: '开镜散布增长倍数' },
    'ScatterRecoverMultiplier': { label: '腰射散布恢复倍率', type: 'number', step: '0.1', default: 1.0, description: '腰射散布恢复倍数' },
    'ScatterRecoverADSMultiplier': { label: '开镜散布恢复倍率', type: 'number', step: '0.1', default: 1.0, description: '开镜散布恢复倍数' },
    
    // 后坐力倍率
    'RecoilScaleVMultiplier': { label: '垂直后坐力系数倍率', type: 'number', step: '0.1', default: 1.0, description: '垂直后坐力系数倍数（面板显示）' },
    'RecoilScaleHMultiplier': { label: '水平后坐力系数倍率', type: 'number', step: '0.1', default: 1.0, description: '水平后坐力系数倍数（面板显示）' },
    'RecoilVMiniHash': { label: '垂直后坐力最小值倍率', type: 'number', step: '0.1', default: 1.0, description: '垂直后坐力最小值倍数' },
    'RecoilVMaxHash': { label: '垂直后坐力最大值倍率', type: 'number', step: '0.1', default: 1.0, description: '垂直后坐力最大值倍数' },
    'RecoilHMinHash': { label: '水平后坐力最小值倍率', type: 'number', step: '0.1', default: 1.0, description: '水平后坐力最小值倍数' },
    'RecoilHMaxHash': { label: '水平后坐力最大值倍率', type: 'number', step: '0.1', default: 1.0, description: '水平后坐力最大值倍数' },
    'RecoilRecoverHash': { label: '后坐力恢复倍率', type: 'number', step: '0.1', default: 1.0, description: '后坐力恢复速度倍数' },
    'RecoilTimeHash': { label: '后坐力时间倍率', type: 'number', step: '0.1', default: 1.0, description: '后坐力作用时间倍数' },
    'RecoilRecoverTimeHash': { label: '后坐力恢复时间倍率', type: 'number', step: '0.1', default: 1.0, description: '后坐力恢复开始时间倍数' },
    
    // 其他倍率
    'CapacityHash': { label: '弹匣容量倍率', type: 'number', step: '0.1', default: 1.0, description: '弹匣容量倍数' },
    'BuffChanceHash': { label: '增益触发概率倍率', type: 'number', step: '0.01', default: 1.0, description: '异常效果触发概率倍数' },
    'BulletBleedChanceHash': { label: '子弹出血概率倍率', type: 'number', step: '0.01', default: 1.0, description: '子弹出血概率倍数（无效）' },
    'bulletDurabilityCostHash': { label: '子弹耐久消耗倍率', type: 'number', step: '0.1', default: 1.0, description: '子弹耐久消耗倍数' },
    'MoveSpeedMultiplierAdd': { label: '据枪移动系数加成', type: 'number', step: '0.01', default: 0, description: '持枪移动速度直接加成' },
    'ADSMoveSpeedMultiplierAdd': { label: '开镜移动系数加成', type: 'number', step: '0.01', default: 0, description: '瞄准移动速度直接加成' },
};

// 字段配置 - 不同类型配置的特定字段
export const TYPE_SPECIFIC_FIELDS = {
    [CONFIG_TYPES.WEAPON]: {
        // 基础属性
        'DistanceMultiplier': '射程倍率',
        'BulletSpeedMultiplier': '子弹速度倍率',
        'ADSTimeMultiplier': '瞄准时间倍率',
        'BaseDamageMultiplier': '基础伤害倍率',
        'CriticalChanceMultiplier': '暴击率倍率',
        'ReloadSpeedMultiplier': '换弹速度倍率',
        'AccuracyMultiplier': '精度倍率',
        'DamageMultiplier': '伤害倍率',
        'CritDamageFactorHash': '暴击伤害系数',
        'ArmorPiercingHash': '护甲穿透倍率',
        'ArmorBreakHash': '护甲破坏倍率',
        
        // 散布相关
        'ScatterFactorMultiplier': '腰射散布系数',
        'ScatterFactorADSMultiplier': '开镜散布系数',
        'DefaultScatterMultiplier': '腰射初始散布倍率',
        'DefaultScatterADSMultiplier': '开镜初始散布倍率',
        'MaxScatterMultiplier': '腰射最大散布倍率',
        'MaxScatterADSMultiplier': '开镜最大散布倍率',
        'ScatterGrowMultiplier': '腰射散布扩散倍率',
        'ScatterGrowADSMultiplier': '开镜散布扩散倍率',
        'ScatterRecoverMultiplier': '腰射散布恢复倍率',
        'ScatterRecoverADSMultiplier': '开镜散布恢复倍率',
        
        // 后坐力相关
        'RecoilScaleVMultiplier': '垂直后坐力系数倍率',
        'RecoilScaleHMultiplier': '水平后坐力系数倍率',
        'RecoilVMiniHash': '垂直后坐力最小值倍率',
        'RecoilVMaxHash': '垂直后坐力最大值倍率',
        'RecoilHMinHash': '水平后坐力最小值倍率',
        'RecoilHMaxHash': '水平后坐力最大值倍率',
        'RecoilRecoverHash': '后坐力恢复倍率',
        'RecoilTimeHash': '后坐力时间倍率',
        'RecoilRecoverTimeHash': '后坐力恢复时间倍率',
        
        // 其他
        'CapacityHash': '弹匣容量倍率',
        'BuffChanceHash': '增益触发概率倍率',
        'MoveSpeedMultiplierAdd': '据枪移动系数加成',
        'ADSMoveSpeedMultiplierAdd': '开镜移动系数加成',
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
        'NewCritRateGain': '暴击率增益',
        'NewCritDamageFactorGain': '暴击伤害增益',
        'NewArmorPiercingGain': '护甲穿透增益',
        'NewDamageMultiplier': '伤害倍率',
        'NewBulletSpeed': '子弹速度',
    },
    [CONFIG_TYPES.ACCESSORY]: {
        'Damage': '伤害',
        'CritRate': '暴击率',
        'CritDamageFactor': '暴击伤害倍率',
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

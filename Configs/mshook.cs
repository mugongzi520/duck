using Duckov.ItemUsage;
using Duckov.Modding;
using Duckov.Utilities;
using ItemStatsSystem;
using ItemStatsSystem.Items;
using Newtonsoft.Json;
using SodaCraft.Localizations;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Xml;
using UnityEngine;
using Duckov.Economy;

namespace mshook
{
    public class ModBehaviour : Duckov.Modding.ModBehaviour
    {
        private string _logFilePath;
        private string _dllDirectory;
        private string _configsPath;
        private string _iconsPath;
        
        // 合成配方工具类
        // 用于跟踪已使用的新物品ID
        public static List<int> usedNewItemIds = new List<int>();
        
        // 用于持久化保存原始ID到分配ID的映射，确保游戏重启后ID一致性
        private static Dictionary<int, int> originalToAssignedIdMap = new Dictionary<int, int>();
        private static string idMapFilePath = "config/ItemIdMappings.json";
        
        public static class CraftingUtils
        {
            public static List<string> addedFormulaIds = new List<string>();
            public static List<int> addedFormulaResults = new List<int>();
            
            public static void AddCraftingFormula(string formulaId, long money, ValueTuple<int, long>[] costItems, int resultItemId, int resultItemAmount, string[] tags = null, string requirePerk = "", bool unlockByDefault = true, bool hideInIndex = false, bool lockInDemo = false)
            {
                try
                {
                    CraftingFormulaCollection instance = CraftingFormulaCollection.Instance;
                    if (instance == null)
                    {
                        Debug.LogError("CraftingFormulaCollection.Instance is null");
                        return;
                    }
                    
                    FieldInfo field = typeof(CraftingFormulaCollection).GetField("list", BindingFlags.Instance | BindingFlags.NonPublic);
                    if (field == null)
                    {
                        Debug.LogError("Failed to get 'list' field from CraftingFormulaCollection");
                        return;
                    }
                    
                    List<CraftingFormula> list = (List<CraftingFormula>)field.GetValue(instance);
                    if (list == null)
                    {
                        Debug.LogError("Crafting formula list is null");
                        return;
                    }
                    
                    // 检查是否存在重复的配方ID，如果存在则生成新的唯一ID
                    string finalFormulaId = formulaId;
                    int duplicateCount = 0;
                    
                    while (true)
                    {
                        bool isDuplicate = false;
                        foreach (CraftingFormula formula in list)
                        {
                            if (formula.id == finalFormulaId)
                            {
                                isDuplicate = true;
                                break;
                            }
                        }
                        
                        if (!isDuplicate)
                        {
                            // 检查我们自己记录的已添加配方中是否有重复
                            if (!addedFormulaIds.Contains(finalFormulaId))
                                break;
                            else
                                isDuplicate = true;
                        }
                        
                        if (isDuplicate)
                        {
                            duplicateCount++;
                            finalFormulaId = $"{formulaId}_dup{duplicateCount}";
                            Debug.LogWarning($"Duplicate Formula ID detected: {formulaId}, generating new ID: {finalFormulaId}");
                        }
                    }
                    
                    // 创建新的合成配方
                    CraftingFormula newFormula = new CraftingFormula
                    {
                        id = finalFormulaId,
                        unlockByDefault = unlockByDefault
                    };
                    
                    // 设置合成成本
                    Cost cost = new Cost
                    {
                        money = money
                    };
                    
                    // 设置合成所需物品
                    Cost.ItemEntry[] itemEntries = new Cost.ItemEntry[costItems.Length];
                    for (int i = 0; i < costItems.Length; i++)
                    {
                        itemEntries[i] = new Cost.ItemEntry
                        {
                            id = costItems[i].Item1,
                            amount = costItems[i].Item2
                        };
                    }
                    cost.items = itemEntries;
                    newFormula.cost = cost;
                    
                    // 设置合成结果
                    CraftingFormula.ItemEntry resultEntry = new CraftingFormula.ItemEntry
                    {
                        id = resultItemId,
                        amount = resultItemAmount
                    };
                    newFormula.result = resultEntry;
                    
                    // 设置其他属性
                    newFormula.requirePerk = requirePerk;
                    
                    // 设置工作台标签，如果未提供则默认使用高级工作台
                    string[] formulaTags = tags;
                    if (tags == null)
                    {
                        formulaTags = new string[] { "WorkBenchAdvanced" };
                    }
                    newFormula.tags = formulaTags;
                    
                    newFormula.hideInIndex = hideInIndex;
                    newFormula.lockInDemo = lockInDemo;
                    
                    // 添加到配方列表
                    list.Add(newFormula);
                    
                    // 记录添加的配方ID和结果物品ID
                    if (!addedFormulaIds.Contains(finalFormulaId))
                    {
                        addedFormulaIds.Add(finalFormulaId);
                        addedFormulaResults.Add(resultItemId);
                    }
                    
                    Debug.Log($"Adding formula success: {finalFormulaId}" + (finalFormulaId != formulaId ? $" (originally: {formulaId})" : ""));
                    
                    // 更新配方系统的只读缓存
                    FieldInfo readOnlyField = typeof(CraftingFormulaCollection).GetField("_entries_ReadOnly", BindingFlags.Instance | BindingFlags.NonPublic);
                    if (readOnlyField != null)
                    {
                        readOnlyField.SetValue(instance, null);
                    }
                }
                catch (Exception ex)
                {
                    Debug.LogError($"Error adding crafting formula {formulaId}: {ex.Message}\n{ex.StackTrace}");
                }
            }
            
            public static void RemoveAllAddedFormulas()
            {
                try
                {
                    CraftingFormulaCollection instance = CraftingFormulaCollection.Instance;
                    if (instance == null)
                    {
                        Debug.LogError("CraftingFormulaCollection.Instance is null");
                        return;
                    }
                    
                    FieldInfo field = typeof(CraftingFormulaCollection).GetField("list", BindingFlags.Instance | BindingFlags.NonPublic);
                    if (field == null)
                    {
                        Debug.LogError("Failed to get 'list' field from CraftingFormulaCollection");
                        return;
                    }
                    
                    List<CraftingFormula> list = (List<CraftingFormula>)field.GetValue(instance);
                    if (list == null)
                    {
                        Debug.LogError("Crafting formula list is null");
                        return;
                    }
                    
                    int removedCount = 0;
                    // 从后向前遍历，避免索引问题
                    for (int i = list.Count - 1; i >= 0; i--)
                    {
                        if (addedFormulaIds.Contains(list[i].id))
                        {
                            Debug.Log($"Remove Formula: {list[i].id}");
                            list.RemoveAt(i);
                            removedCount++;
                        }
                    }
                    
                    // 清空记录
                    addedFormulaIds.Clear();
                    addedFormulaResults.Clear();
                    
                    // 更新配方系统的只读缓存
                    FieldInfo readOnlyField = typeof(CraftingFormulaCollection).GetField("_entries_ReadOnly", BindingFlags.Instance | BindingFlags.NonPublic);
                    if (readOnlyField != null)
                    {
                        readOnlyField.SetValue(instance, null);
                    }
                    
                    Debug.Log($"Removed {removedCount} Formulas");
                }
                catch (Exception ex)
                {
                    Debug.LogError($"Exception at removing formulas: {ex}");
                }
            }
        }

        protected override void OnAfterSetup()
        {
            _dllDirectory = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            // 获取dll目录的上一级目录
            string parentDirectory = Path.GetDirectoryName(_dllDirectory);
            _configsPath = Path.Combine(_dllDirectory, "configs");
            _iconsPath = Path.Combine(_dllDirectory, "icons");

            InitializeLogFile();
            LogToFile("模组启动，开始初始化");
            LogToFile($"DLL路径: {_dllDirectory}");
            LogToFile($"父级目录: {parentDirectory}");

            try
            {
                // 创建默认的配置和图标文件夹
                Directory.CreateDirectory(_configsPath);
                Directory.CreateDirectory(_iconsPath);
                
                // 加载ID映射，确保在创建物品前加载已保存的ID映射
                LoadIdMappings();

                // 检查是否需要生成默认配置（仅检查默认配置文件夹）
                if (!HasConfigFiles())
                {
                    LogToFile("未找到配置文件，开始生成默认配置");
                    GenerateDefaultConfigs();
                }

                // 加载配置文件，包括dll目录及其父目录下的其他文件夹
                LoadAndCreateItems(parentDirectory);
            }
            catch (Exception ex)
            {
                LogToFile($"初始化失败: {ex.Message}\n堆栈: {ex.StackTrace}", true);
            }
        }

        private bool HasConfigFiles()
        {
            return Directory.GetFiles(_configsPath, "*.json").Length > 0;
        }
        
        private bool IsValidConfigFile(string filePath)
        {
            try
            {
                string json = File.ReadAllText(filePath);
                // 尝试反序列化以验证JSON格式是否正确
                ItemConfig config = JsonConvert.DeserializeObject<ItemConfig>(json);
                // 验证必要字段是否存在
                return config != null && !string.IsNullOrEmpty(config.DisplayName) && config.NewItemId > 0 && config.OriginalItemId > 0;
            }
            catch
            {
                return false;
            }
        }

        private void GenerateDefaultConfigs()
        {
            var defaultItems = new List<ItemConfig>
            {
                new ItemConfig
                {
                    OriginalItemId = 135,
                    NewItemId = 95001,
                    DisplayName = "海洋之泪",
                    LocalizationKey = "OceanTear",
                    LocalizationDescValue = "三角洲暗区新T0级大红，对标非洲之心，多刷新于潮汐监狱貌似是某位退伍老兵带来的珍藏品，价值超2000W",
                    Weight = 0.2f,
                    Value = 50000000,
                    Quality = 9,
                    Tags = new[] { "Luxury" },
                    IconFileName = "ocean_tear.png" // UI图标+世界贴图共用此文件
                },
                new ItemConfig
                {
                    OriginalItemId = 135,
                    NewItemId = 95002,
                    DisplayName = "万金泪冠",
                    LocalizationKey = "TearsCrown",
                    LocalizationDescValue = "巴克什三幻神之一，仅刷新于巴别塔露天区域貌似是某位退伍老兵带来的珍藏品，收藏价值拉满的顶级大红",
                    Weight = 0.3f,
                    Value = 5000000,
                    Quality = 9,
                    Tags = new[] { "Luxury"},
                    IconFileName = "tears_crown.png" // UI图标+世界贴图共用此文件
                },
                new ItemConfig
                {
                    OriginalItemId = 14,
                    NewItemId = 95003,
                    DisplayName = "奥莉薇娅香槟",
                    LocalizationKey = "OliviaChampagne",
                    LocalizationDescValue = "中高价值收藏品，常见于长弓溪谷酒店餐厅柜台貌似是某位退伍老兵带来的珍藏品，稀有度与收藏价值兼备",
                    Weight = 0.5f,
                    Value = 640000,
                    Quality = 7,
                    Tags = new[] { "Luxury"},
                    IconFileName = "olivia_champagne.png", // UI图标+世界贴图共用此文件
                    WaterValue = 200f,
                    EnergyValue = 200f,
                }
            };

            foreach (var item in defaultItems)
            {
                string configFileName = $"{item.NewItemId}_{item.LocalizationKey}.json";
                string configPath = Path.Combine(_configsPath, configFileName);

                string json = JsonConvert.SerializeObject(item, Newtonsoft.Json.Formatting.Indented);
                File.WriteAllText(configPath, json);
                LogToFile($"生成默认配置: {configFileName}");
            }

            GenerateSampleIcon("default_gold.png", new Color(0.9f, 0.8f, 0.2f));
            GenerateSampleIcon("default_daily.png", new Color(0.6f, 0.8f, 0.6f));
        }

        private void GenerateSampleIcon(string fileName, Color mainColor)
        {
            string iconPath = Path.Combine(_iconsPath, fileName);
            if (File.Exists(iconPath)) return;

            try
            {
                Texture2D texture = new Texture2D(64, 64, TextureFormat.RGBA32, false);
                for (int x = 0; x < 64; x++)
                {
                    for (int y = 0; y < 64; y++)
                    {
                        if (x < 4 || x > 59 || y < 4 || y > 59)
                            texture.SetPixel(x, y, Color.black);
                        else
                            texture.SetPixel(x, y, mainColor);
                    }
                }
                texture.Apply();

                byte[] pngData = texture.EncodeToPNG();
                File.WriteAllBytes(iconPath, pngData);
                LogToFile($"生成示例图标: {fileName}");
            }
            catch (Exception ex)
            {
                LogToFile($"生成示例图标失败 {fileName}: {ex.Message}", true);
            }
        }

        private void LoadAndCreateItems(string parentDirectory)
        {
            // 使用HashSet确保不会处理重复的配置文件路径
            HashSet<string> uniqueConfigFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            
            // 1. 添加默认配置文件夹中的配置文件
            string[] defaultConfigFiles = Directory.GetFiles(_configsPath, "*.json");
            foreach (string file in defaultConfigFiles)
            {
                if (IsValidConfigFile(file))
                {
                    uniqueConfigFiles.Add(file);
                }
            }
            LogToFile($"从默认配置文件夹加载了 {uniqueConfigFiles.Count} 个有效的配置文件");
            
            // 2. 扫描父目录下的其他文件夹（除了当前dll所在目录）
            if (Directory.Exists(parentDirectory))
            {
                string[] subDirectories = Directory.GetDirectories(parentDirectory);
                int additionalFilesCount = 0;
                
                foreach (string subDir in subDirectories)
                {
                    // 跳过dll所在目录
                    if (subDir.Equals(_dllDirectory, StringComparison.OrdinalIgnoreCase))
                        continue;
                    
                    // 检查子目录下是否有configs文件夹
                    string otherConfigsPath = Path.Combine(subDir, "configs");
                    if (Directory.Exists(otherConfigsPath))
                    {
                        string[] otherConfigFiles = Directory.GetFiles(otherConfigsPath, "*.json");
                        // 过滤出有效的配置文件
                        foreach (string file in otherConfigFiles)
                        {
                            if (IsValidConfigFile(file) && uniqueConfigFiles.Add(file))
                            {
                                LogToFile($"从 {Path.GetFileName(subDir)} 目录加载配置文件: {Path.GetFileName(file)}");
                                additionalFilesCount++;
                            }
                            else
                            {
                                LogToFile($"跳过无效或重复的配置文件: {Path.GetFileName(file)}", false);
                            }
                        }
                    }
                }
                LogToFile($"从其他目录加载了 {additionalFilesCount} 个额外的配置文件");
            }
            
            if (uniqueConfigFiles.Count == 0)
            {
                LogToFile("没有找到有效的配置文件，无法创建物品", true);
                return;
            }
            
            LogToFile($"总共收集到 {uniqueConfigFiles.Count} 个唯一的有效配置文件");
            
            // 转换为List以便处理
            List<string> allConfigFiles = new List<string>(uniqueConfigFiles);
            
            // 处理所有收集到的配置文件
            foreach (string file in allConfigFiles)
            {
                try
                {
                    string json = File.ReadAllText(file);
                    ItemConfig config = JsonConvert.DeserializeObject<ItemConfig>(json);
                    
                    // 确定配置文件所在文件夹，用于查找对应的icons文件夹
                    string configDir = Path.GetDirectoryName(file);
                    string moduleRootDir = Path.GetDirectoryName(configDir); // 上一级是模块根目录
                    string moduleIconsPath = Path.Combine(moduleRootDir, "icons");
                    
                    // 记录配置文件中的ID设置，即使是故意设置相同的ID来模拟冲突
                    LogToFile($"配置文件 {Path.GetFileName(file)} 中设置的NewItemId: {config.NewItemId}");
                    
                    // 处理配置文件
                    if (string.IsNullOrEmpty(config.DisplayName) || config.NewItemId <= 0)
                    {
                        LogToFile($"配置无效: {Path.GetFileName(file)}，跳过", true);
                        continue;
                    }
                    
                    // 保存模块根目录路径，用于后续加载图标
                    config.ModuleRootDir = moduleRootDir;
                    
                    // 记录正在处理的配置文件
                    LogToFile($"正在处理配置: {Path.GetFileName(file)} 中的物品 {config.DisplayName}");
                    CreateCustomItem(config);
                    LogToFile($"成功处理配置: {config.DisplayName} (ID: {config.NewItemId}) 来自 {Path.GetFileName(file)}");
                }
                catch (Exception ex)
                {
                    LogToFile($"处理配置 {Path.GetFileName(file)} 失败: {ex.Message}", true);
                }
            }
        }

        public void CreateCustomItem(ItemConfig config)
        {
            try
            {
                // 首先确保原始ID对应的物品存在
                Item originalItem = ItemAssetsCollection.GetPrefab(config.OriginalItemId);
                if (originalItem == null)
                {
                    LogToFile($"原始物品ID {config.OriginalItemId} 不存在，跳过 {config.DisplayName}", true);
                    return;
                }
                
                LogToFile($"开始处理物品: {config.DisplayName}，原始ID: {config.OriginalItemId}，配置的新ID: {config.NewItemId}");
                
                // 使用更可靠的唯一键 - 基于物品配置信息生成
                // 直接使用DisplayName而不是尝试提取文件名，确保唯一性
                string configIdentifier = $"{config.DisplayName}_{config.OriginalItemId}_{config.NewItemId}";
                int uniqueKey = configIdentifier.GetHashCode();
                
                // 确保键值为正数
                if (uniqueKey < 0) uniqueKey = -uniqueKey;
                
                LogToFile($"为物品 {config.DisplayName} 生成的唯一键: {uniqueKey}");
                
                // 检查是否有已保存的映射关系
                int finalNewItemId;
                
                // 核心逻辑：使用持久化映射系统
                if (originalToAssignedIdMap.ContainsKey(uniqueKey))
                {
                    // 如果已有映射，获取之前分配的ID
                    int savedId = originalToAssignedIdMap[uniqueKey];
                    finalNewItemId = savedId; // 初始化finalNewItemId
                    
                    // 检查是否与当前运行中其他物品的ID冲突
                    bool isConflict = usedNewItemIds.Contains(savedId);
                    
                    if (isConflict)
                    {
                        LogToFile($"检测到已保存的ID {savedId} 与当前已加载的物品冲突，需要为 {config.DisplayName} 重新分配");
                        
                        // 查找下一个可用的ID，基于已保存的ID进行递增
                        int baseId = savedId;
                        int offset = 1;
                        
                        while (usedNewItemIds.Contains(baseId + offset))
                        {
                            offset++;
                            // 安全检查
                            if (offset > 10000)
                            {
                                LogToFile($"为物品 {config.DisplayName} 分配ID时尝试次数过多，使用随机ID", true);
                                finalNewItemId = baseId + new System.Random().Next(1000, 100000);
                                break;
                            }
                        }
                        
                        if (offset <= 10000)
                        {
                            finalNewItemId = baseId + offset;
                        }
                        
                        LogToFile($"为物品 {config.DisplayName} 重新分配新ID: {finalNewItemId}（避免冲突）");
                        
                        // 更新映射关系为新的ID
                        originalToAssignedIdMap[uniqueKey] = finalNewItemId;
                        LogToFile($"更新物品 {config.DisplayName} 的ID映射: 唯一键 {uniqueKey} -> {finalNewItemId}");
                        
                        // 立即保存更新后的映射
                        SaveIdMappings();
                    }
                    else
                    {
                        LogToFile($"为物品 {config.DisplayName} 使用已保存的ID: {finalNewItemId}");
                    }
                }
                else
                {
                    // 首次处理此物品配置
                    finalNewItemId = config.NewItemId;
                    
                    // 重要：检查这个ID是否已经被其他物品使用
                    if (usedNewItemIds.Contains(finalNewItemId))
                    {
                        LogToFile($"警告：ID {finalNewItemId} 已被其他物品使用，需要为 {config.DisplayName} 分配新ID");
                        
                        // 查找下一个可用的ID
                        int baseId = config.NewItemId;
                        int offset = 1;
                        
                        while (usedNewItemIds.Contains(baseId + offset))
                        {
                            offset++;
                            // 安全检查
                            if (offset > 10000)
                            {
                                LogToFile($"为物品 {config.DisplayName} 分配ID时尝试次数过多，使用随机ID", true);
                                finalNewItemId = baseId + new System.Random().Next(1000, 100000);
                                break;
                            }
                        }
                        
                        if (offset <= 10000)
                        {
                            finalNewItemId = baseId + offset;
                        }
                        
                        LogToFile($"为物品 {config.DisplayName} 分配新ID: {finalNewItemId}（避免冲突）");
                    }
                    else
                    {
                        LogToFile($"首次处理物品 {config.DisplayName}，直接使用配置的ID: {finalNewItemId}");
                    }
                    
                    // 记录映射关系
                    originalToAssignedIdMap[uniqueKey] = finalNewItemId;
                    LogToFile($"为物品 {config.DisplayName} 保存ID映射: 唯一键 {uniqueKey} -> {finalNewItemId}");
                    
                    // 立即保存映射，确保数据持久化
                    SaveIdMappings();
                }
                
                // 确保这个ID在usedNewItemIds中，用于全局唯一性检查
                if (!usedNewItemIds.Contains(finalNewItemId))
                {
                    usedNewItemIds.Add(finalNewItemId);
                    LogToFile($"将ID {finalNewItemId} 添加到已使用列表");
                }
                
                // 创建一个配置副本以避免修改原始配置
                ItemConfig workingConfig = JsonConvert.DeserializeObject<ItemConfig>(JsonConvert.SerializeObject(config));
                // 更新工作配置中的NewItemId为最终确定的ID
                workingConfig.NewItemId = finalNewItemId;

                GameObject clonedObj = Instantiate(originalItem.gameObject);
                clonedObj.name = $"CustomItem_{workingConfig.NewItemId}";
                DontDestroyOnLoad(clonedObj);
                Item newItem = clonedObj.GetComponent<Item>();
                if (newItem == null)
                {
                    LogToFile($"克隆物品失败，未找到Item组件: {workingConfig.DisplayName}", true);
                    Destroy(clonedObj);
                    return;
                }

                SetItemProperties(newItem, workingConfig);
                SetLocalizationTexts(workingConfig);
                SetItemIcon(newItem, originalItem, workingConfig);
                // 新增：替换世界模型贴图（复用IconFileName）
                SetWorldModelTexture(newItem, workingConfig);
                RegisterItem(newItem, workingConfig.NewItemId, clonedObj);
                
                // 处理合成配方
                SetupCraftingFormula(workingConfig);
            }
            catch (Exception ex)
            {
                LogToFile($"创建物品 {config.DisplayName} 失败: {ex.Message}", true);
            }
        }

        private void SetPrivateField(object target, string fieldName, object value)
        {
            try
            {
                FieldInfo field = target.GetType().GetField(fieldName, BindingFlags.NonPublic | BindingFlags.Instance);
                if (field != null)
                    field.SetValue(target, value);
                else
                    LogToFile($"SetPrivateField 失败：未找到字段 {fieldName}", true);
            }
            catch (Exception ex)
            {
                LogToFile($"SetPrivateField 异常 ({fieldName}): {ex.Message}", true);
            }
        }
        
        private T GetPrivateField<T>(object target, string fieldName)
        {
            try
            {
                FieldInfo field = target.GetType().GetField(fieldName, BindingFlags.NonPublic | BindingFlags.Instance);
                if (field != null)
                {
                    object value = field.GetValue(target);
                    if (value is T)
                        return (T)value;
                }
                else
                {
                    LogToFile($"GetPrivateField 失败：未找到字段 {fieldName}", true);
                }
            }
            catch (Exception ex)
            {
                LogToFile($"GetPrivateField 异常 ({fieldName}): {ex.Message}", true);
            }
            return default(T);
        }

        private void SetItemProperties(Item item, ItemConfig config)
        {
            SetPrivateField(item, "typeID", config.NewItemId);
            SetPrivateField(item, "weight", config.Weight);
            SetPrivateField(item, "value", config.Value);
            SetPrivateField(item, "displayName", config.LocalizationKey);
            SetPrivateField(item, "quality", config.Quality);
            SetPrivateField(item, "order", 0);

            item.Tags.Clear();
            // 打印所有标签
            string allTags = string.Join(", ", config.Tags);
            LogToFile($"物品 {config.DisplayName} 的所有标签: {allTags}");
            
            foreach (string tagName in config.Tags)
            {
                Tag tag = GetTargetTag(tagName);
                if (tag != null)
                    item.Tags.Add(tag);
                else
                    LogToFile($"标签 {tagName} 不存在，已跳过", false);
            }

            SetupFoodDrinkComponent(item, config);
            SetupDrugComponent(item, config);
            ModifyAccessoryEffects(item, config);
            
            // 处理武器属性
            if (config.WeaponProperties != null)
            {
                ApplyWeaponProperties(item, config.WeaponProperties);
            }
            
            // 处理子弹属性
            if (config.AmmoProperties != null)
            {
                ApplyAmmoProperties(item, config.AmmoProperties);
            }
            
            // 处理近战武器属性
            if (config.MeleeWeaponProperties != null)
            {
                SetupMeleeWeaponComponent(item, config);
            }
        }
        
        private void ApplyWeaponProperties(Item item, WeaponConfig config)
        {
            try
            {
                LogToFile($"开始应用武器属性配置");
                
                // 定义所有有效的武器属性字段
                string[] validFields = new string[] { 
                    "BulletDistanceHash", "BulletSpeedHash", "AdsTimeHash", 
                    "ScatterRecoverHashADS", "ShootSpeedHash", "MoveSpeedMultiplierHash", "AdsWalkSpeedMultiplierHash",
                    // 伤害相关
                    "DamageHash", "CritRateHash", "CritDamageFactorHash", "PenetrateHash", 
                    "ArmorPiercingHash", "ArmorBreakHash", "explosionDamageMultiplierHash", 
                    // 射击相关
                    "ShotCountHash", "ShotAngleHash", "BurstCountHash", "SoundRangeHash", 
                    "ADSAimDistanceFactorHash", "ReloadTimeHash", 
                    // 散射相关
                    "ScatterFactorHash", "ScatterFactorHashADS", "DefaultScatterHash", 
                    "DefaultScatterHashADS", "MaxScatterHash", "MaxScatterHashADS", 
                    "ScatterGrowHash", "ScatterGrowHashADS", "ScatterRecoverHash", 
                    // 后坐力相关
                    "RecoilVMinHash", "RecoilVMaxHash", "RecoilHMinHash", "RecoilHMaxHash", 
                    "RecoilScaleVHash", "RecoilScaleHHash", "RecoilRecoverHash", 
                    "RecoilTimeHash", "RecoilRecoverTimeHash",
                    // 其他属性
                    "CapacityHash", "BuffChanceHash", "BulletBleedChanceHash", "bulletDurabilityCostHash",
                    "bulletExplosionRangeHash", "BulletBuffChanceMultiplierHash"
                };
                
                // 遍历并处理所有有效字段
                foreach (string fieldName in validFields)
                {
                    readAndChangeWeaponField(fieldName, item, config);
                }
                
                LogToFile($"武器属性配置应用完成");
            }
            catch (Exception ex)
            {
                LogToFile($"应用武器属性时出错: {ex.Message}", false);
            }
        }
        
        private void ApplyAmmoProperties(Item item, AmmoConfig config)
        {
            try
            {
                LogToFile($"开始应用子弹属性配置");
                
                // 所有子弹属性字段
                string[] ammoFields = new string[] { 
                    "bulletArmorPiercingGainHash", "BulletDamageMultiplierHash", 
                    "bulletCritDamageFactorGainHash", "bulletCritRateGainHash", 
                    "bulletExplosionRangeHash", "BulletBuffChanceMultiplierHash", 
                    "BulletBleedChanceHash", "bulletExplosionDamageHash", 
                    "armorBreakGainHash", "bulletDurabilityCostHash", "BulletSpeedHash", "BulletDistanceHash"
                };
                
                // 遍历并处理所有子弹属性字段
                foreach (string fieldName in ammoFields)
                {
                    readAndChangeAmmoField(fieldName, item, config);
                }
                
                LogToFile($"子弹属性配置应用完成");
            }
            catch (Exception ex)
            {
                LogToFile($"应用子弹属性时出错: {ex.Message}", false);
            }
        }
        
        private void ApplyMeleeWeaponProperties(Item item, MeleeWeaponConfig config)
        {
            try
            {
                LogToFile($"开始应用近战武器属性配置");
                
                // 所有近战武器属性字段
                string[] meleeFields = new string[] { 
                    "DamageHash", "CritRateHash", "CritDamageFactorHash", 
                    "ArmorPiercingHash", "AttackSpeedHash", "AttackRangeHash", 
                    "StaminaCostHash", "BleedChanceHash", "MoveSpeedMultiplierHash"
                };
                
                // 遍历并处理所有近战武器属性字段
                foreach (string fieldName in meleeFields)
                {
                    readAndChangeMeleeField(fieldName, item, config);
                }
                
                LogToFile($"近战武器属性配置应用完成");
            }
            catch (Exception ex)
            {
                LogToFile($"应用近战武器属性时出错: {ex.Message}", false);
            }
        }
        
        private void readAndChangeAmmoField(string targetFieldName, Item instance, AmmoConfig config)
        {
            try
            {
                // 基于武器.txt添加所有弹药相关属性字段
                string[] validFields = new string[] { 
                    "bulletArmorPiercingGainHash", "BulletDamageMultiplierHash", 
                    "bulletCritDamageFactorGainHash", "bulletCritRateGainHash", 
                    "bulletExplosionRangeHash", "BulletBuffChanceMultiplierHash", 
                    "BulletBleedChanceHash", "bulletExplosionDamageHash", 
                    "armorBreakGainHash", "bulletDurabilityCostHash", "BulletSpeedHash", "BulletDistanceHash"
                };
                
                // 检查字段是否在有效列表中
                if (Array.IndexOf(validFields, targetFieldName) < 0)
                {
                    LogToFile($"跳过非标准子弹属性字段: {targetFieldName}", false);
                    return;
                }
                
                // 获取静态字段值
                int staticFieldValue = GetStaticFieldValue<int>(typeof(ItemAgent_Gun), targetFieldName);
                
                // 首先检查字段是否存在
                try
                {
                    // 尝试获取值来验证字段是否存在
                    instance.Constants.GetFloat(staticFieldValue, 0f);
                }
                catch (Exception)
                {
                    LogToFile($"警告：物品 {instance.name} 中不存在哈希值为 {staticFieldValue} 的字段 ({targetFieldName})，跳过此属性修改", false);
                    return;
                }
                
                // 记录原始值
                float originalValue = instance.Constants.GetFloat(staticFieldValue, 0f);
                bool isModified = false;
                float newValue = originalValue;
                
                // 根据targetFieldName判断属性类型，并应用相应的修改
                if (targetFieldName == "bulletArmorPiercingGainHash")
                {
                    if (config.NewArmorPiercingGain != 0)
                    {
                        newValue = config.NewArmorPiercingGain;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "BulletDamageMultiplierHash")
                {
                    if (config.NewDamageMultiplier != 1.0f)
                    {
                        newValue = config.NewDamageMultiplier;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "bulletCritDamageFactorGainHash")
                {
                    if (config.NewCritDamageFactorGain != 0)
                    {
                        newValue = config.NewCritDamageFactorGain;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "bulletCritRateGainHash")
                {
                    if (config.NewCritRateGain != 0)
                    {
                        newValue = config.NewCritRateGain;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "BulletSpeedHash")
                {
                    if (config.NewBulletSpeed != 0)
                    {
                        newValue = config.NewBulletSpeed;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "BulletDistanceHash")
                {
                    if (config.NewBulletDistance != 0)
                    {
                        newValue = config.NewBulletDistance;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "bulletExplosionRangeHash")
                {
                    if (config.NewExplosionRange != 0)
                    {
                        newValue = config.NewExplosionRange;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "bulletExplosionDamageHash")
                {
                    if (config.NewExplosionDamage != 0)
                    {
                        newValue = config.NewExplosionDamage;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "BulletBuffChanceMultiplierHash")
                {
                    if (config.NewBuffChanceMultiplier != 1.0f)
                    {
                        newValue = config.NewBuffChanceMultiplier;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "BulletBleedChanceHash")
                {
                    if (config.NewBleedChance != 0)
                    {
                        newValue = config.NewBleedChance;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "armorBreakGainHash")
                {
                    if (config.NewArmorBreakGain != 0)
                    {
                        newValue = config.NewArmorBreakGain;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                else if (targetFieldName == "bulletDurabilityCostHash")
                {
                    if (config.NewDurabilityCost != 0)
                    {
                        newValue = config.NewDurabilityCost;
                        instance.Constants.SetFloat(staticFieldValue, newValue);
                        isModified = true;
                    }
                }
                
                // 统一输出日志：字段名-翻译：原值-修改值
                string fieldNameCn = targetFieldName switch
                {
                    "bulletArmorPiercingGainHash" => "穿甲值",
                    "BulletDamageMultiplierHash" => "伤害倍率",
                    "bulletCritDamageFactorGainHash" => "暴击伤害因子",
                    "bulletCritRateGainHash" => "暴击率",
                    "bulletExplosionRangeHash" => "爆炸范围",
                    "BulletBuffChanceMultiplierHash" => "Buff触发几率",
                    "BulletBleedChanceHash" => "流血几率",
                    "bulletExplosionDamageHash" => "爆炸伤害",
                    "armorBreakGainHash" => "破甲值",
                    "bulletDurabilityCostHash" => "耐久消耗",
                    "BulletSpeedHash" => "子弹速度",
                    "BulletDistanceHash" => "射程",
                    _ => targetFieldName
                };
                LogToFile($"子弹属性 {targetFieldName}-{fieldNameCn}：{originalValue}-{(isModified ? newValue.ToString() : "未修改")}");
            }
            catch (Exception ex)
            {
                LogToFile($"修改子弹属性 {targetFieldName} 失败: {ex.Message}", false);
            }
        }
        
        private void readAndChangeMeleeField(string targetFieldName, Item instance, MeleeWeaponConfig config)
        {
            LogToFile($"开始处理近战武器属性: {targetFieldName}, 物品名称: {instance.name}");
            try
            {
                // 近战武器属性字段列表
                string[] validFields = new string[] { 
                    "DamageHash", "CritRateHash", "CritDamageFactorHash", 
                    "ArmorPiercingHash", "AttackSpeedHash", "AttackRangeHash", 
                    "StaminaCostHash", "BleedChanceHash", "MoveSpeedMultiplierHash"
                };
                
                // 检查字段是否在有效列表中
                if (Array.IndexOf(validFields, targetFieldName) < 0)
                {
                    LogToFile($"跳过非标准近战武器属性字段: {targetFieldName}", false);
                    return;
                }
                
                // 获取静态字段值
                int staticFieldValue = GetStaticFieldValue<int>(typeof(ItemAgent_MeleeWeapon), targetFieldName);
                
                // 尝试获取Stat组件，这是正确的属性访问方式
                Stat stat = instance.GetStat(staticFieldValue);
                
                if (stat != null)
                {
                    float originalValue = stat.BaseValue;
                    bool isModified = false;
                    
                    LogToFile($"成功获取Stat组件: {targetFieldName}, 原始值: {originalValue}");
                    
                    // 根据targetFieldName判断属性类型，并应用相应的修改
                    if (targetFieldName == "DamageHash")
                    {
                        if (config.NewDamage != 0)
                        {
                            stat.BaseValue = config.NewDamage;
                            isModified = true;
                            LogToFile($"伤害值更新成功: {originalValue} -> {config.NewDamage}");
                        }
                        else
                        {
                            LogToFile($"伤害值配置为0，跳过更新");
                        }
                    }
                    else if (targetFieldName == "CritRateHash")
                    {
                        if (config.NewCritRate != 0)
                        {
                            stat.BaseValue = config.NewCritRate;
                            isModified = true;
                            LogToFile($"暴击率更新成功: {originalValue} -> {config.NewCritRate}");
                        }
                        else
                        {
                            LogToFile($"暴击率配置为0，跳过更新");
                        }
                    }
                    else if (targetFieldName == "CritDamageFactorHash")
                    {
                        if (config.NewCritDamageFactor != 0)
                        {
                            stat.BaseValue = config.NewCritDamageFactor;
                            isModified = true;
                            LogToFile($"暴击伤害因子更新成功: {originalValue} -> {config.NewCritDamageFactor}");
                        }
                        else
                        {
                            LogToFile($"暴击伤害因子配置为0，跳过更新");
                        }
                    }
                    else if (targetFieldName == "ArmorPiercingHash")
                    {
                        if (config.NewArmorPiercing != 0)
                        {
                            stat.BaseValue = config.NewArmorPiercing;
                            isModified = true;
                            LogToFile($"穿甲值更新成功: {originalValue} -> {config.NewArmorPiercing}");
                        }
                        else
                        {
                            LogToFile($"穿甲值配置为0，跳过更新");
                        }
                    }
                    else if (targetFieldName == "AttackSpeedHash")
                    {
                        if (config.NewAttackSpeed != 0)
                        {
                            stat.BaseValue = config.NewAttackSpeed;
                            isModified = true;
                            LogToFile($"攻击速度更新成功: {originalValue} -> {config.NewAttackSpeed}");
                        }
                        else
                        {
                            LogToFile($"攻击速度配置为0，跳过更新");
                        }
                    }
                    else if (targetFieldName == "AttackRangeHash")
                    {
                        if (config.NewAttackRange != 0)
                        {
                            stat.BaseValue = config.NewAttackRange;
                            isModified = true;
                            LogToFile($"攻击范围更新成功: {originalValue} -> {config.NewAttackRange}");
                        }
                        else
                        {
                            LogToFile($"攻击范围配置为0，跳过更新");
                        }
                    }
                    else if (targetFieldName == "StaminaCostHash")
                    {
                        if (config.NewStaminaCost != 0)
                        {
                            stat.BaseValue = config.NewStaminaCost;
                            isModified = true;
                            LogToFile($"体力消耗更新成功: {originalValue} -> {config.NewStaminaCost}");
                        }
                        else
                        {
                            LogToFile($"体力消耗配置为0，跳过更新");
                        }
                    }
                    else if (targetFieldName == "BleedChanceHash")
                    {
                        if (config.NewBleedChance != 0)
                        {
                            stat.BaseValue = config.NewBleedChance;
                            isModified = true;
                            LogToFile($"流血几率更新成功: {originalValue} -> {config.NewBleedChance}");
                        }
                        else
                        {
                            LogToFile($"流血几率配置为0，跳过更新");
                        }
                    }
                    else if (targetFieldName == "MoveSpeedMultiplierHash")
                    {
                        if (config.NewMoveSpeedMultiplier != 1.0f)
                        {
                            stat.BaseValue = config.NewMoveSpeedMultiplier;
                            isModified = true;
                            LogToFile($"移动速度倍率更新成功: {originalValue} -> {config.NewMoveSpeedMultiplier}");
                        }
                        else
                        {
                            LogToFile($"移动速度倍率配置为默认值1.0，跳过更新");
                        }
                    }
                    else
                    {
                        LogToFile($"[WARNING] 未处理的属性类型: {targetFieldName}", false);
                    }
                    
                    // 打印日志信息，无论是否修改
                    float newValue = stat.BaseValue;
                    if (isModified)
                    {
                        LogToFile($"近战武器属性 {targetFieldName} 已从 {originalValue} 修改为 {newValue}");
                    }
                    else
                    {
                        LogToFile($"近战武器属性 {targetFieldName} 未修改，当前值为 {newValue}");
                    }
                }
                else
                {
                    LogToFile($"未找到近战武器属性 {targetFieldName} 的Stat组件 (哈希: {staticFieldValue})", false);
                    
                    // 作为备选方案，尝试使用GetStatValue方法验证属性是否存在
                    try
                    {
                        float currentValue = instance.GetStatValue(staticFieldValue);
                        LogToFile($"属性 {targetFieldName} 存在但无法获取Stat组件，当前值: {currentValue}", false);
                    }
                    catch (Exception)
                    {
                        LogToFile($"属性 {targetFieldName} 似乎不存在于物品 {instance.name} 中", false);
                    }
                }
            }
            catch (Exception ex)
            {
                LogToFile($"修改近战武器属性 {targetFieldName} 失败: {ex.Message}", false);
            }
        }
        
        // 获取静态字段值的辅助方法 - 使用标准反射API
        private T GetStaticFieldValue<T>(Type type, string fieldName)
        {
            try
            {
                // 使用标准反射API获取静态字段值
                FieldInfo field = type.GetField(fieldName, BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Static);
                if (field != null && typeof(T).IsAssignableFrom(field.FieldType))
                {
                    return (T)field.GetValue(null);
                }
                LogToFile($"GetStaticFieldValue 失败：未找到静态字段 {fieldName} 或类型不匹配", false);
                return default(T);
            }
            catch (Exception ex)
            {
                LogToFile($"GetStaticFieldValue 异常 ({fieldName}): {ex.Message}", false);
                return default(T);
            }
        }
        
        private void readAndChangeWeaponField(string targetFieldName, Item instance, WeaponConfig config)
        {
            try
            {
                // 基于武器.txt添加所有武器相关属性字段
                string[] validFields = new string[] { 
                    "BulletDistanceHash", "BulletSpeedHash", "AdsTimeHash", 
                    "ScatterRecoverHashADS", "ShootSpeedHash", "MoveSpeedMultiplierHash", "AdsWalkSpeedMultiplierHash",
                    // 伤害相关
                    "DamageHash", "CritRateHash", "CritDamageFactorHash", "PenetrateHash", 
                    "ArmorPiercingHash", "ArmorBreakHash", "explosionDamageMultiplierHash", 
                    // 射击相关
                    "ShotCountHash", "ShotAngleHash", "BurstCountHash", "SoundRangeHash", 
                    "ADSAimDistanceFactorHash", "ReloadTimeHash", 
                    // 散射相关
                    "ScatterFactorHash", "ScatterFactorHashADS", "DefaultScatterHash", 
                    "DefaultScatterHashADS", "MaxScatterHash", "MaxScatterHashADS", 
                    "ScatterGrowHash", "ScatterGrowHashADS", "ScatterRecoverHash", 
                    // 后坐力相关
                    "RecoilVMinHash", "RecoilVMaxHash", "RecoilHMinHash", "RecoilHMaxHash", 
                    "RecoilScaleVHash", "RecoilScaleHHash", "RecoilRecoverHash", 
                    "RecoilTimeHash", "RecoilRecoverTimeHash",
                    // 其他属性
                    "CapacityHash", "BuffChanceHash", "BulletBleedChanceHash", "bulletDurabilityCostHash",
                    "bulletExplosionRangeHash", "BulletBuffChanceMultiplierHash"
                };
                
                // 检查字段是否在有效列表中
                if (Array.IndexOf(validFields, targetFieldName) < 0)
                {
                    LogToFile($"跳过非标准武器属性字段: {targetFieldName}", false);
                    return;
                }
                
                // 尝试获取静态字段值
                int staticFieldValue = GetStaticFieldValue<int>(typeof(ItemAgent_Gun), targetFieldName);
                
                // 尝试获取Stat组件
                Stat stat = instance.GetStat(staticFieldValue);
                
                if (stat != null)
                {
                    float baseValue = stat.BaseValue;
                    bool isModified = false;
                    
                    // 根据不同字段应用相应的修改
                    // 距离和速度相关
                    if (targetFieldName == "BulletDistanceHash")
                    {
                        if (config.DistanceMultiplier != 1.0f || config.RangeAddition != 0.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.DistanceMultiplier;
                            stat.BaseValue += config.RangeAddition;
                            isModified = true;
                            LogToFile($"武器属性 子弹射程(BulletDistance) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 子弹射程(BulletDistance) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "BulletSpeedHash")
                    {
                        if (config.BulletSpeedMultiplier != 1.0f || config.BulletSpeedAddition != 0.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.BulletSpeedMultiplier;
                            stat.BaseValue += config.BulletSpeedAddition;
                            isModified = true;
                            LogToFile($"武器属性 子弹速度(BulletSpeed) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 子弹速度(BulletSpeed) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    
                    // 开镜和移动相关
                    else if (targetFieldName == "AdsTimeHash")
                    {
                        if (config.ADSTimeMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.ADSTimeMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 开镜时间(AdsTime) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 开镜时间(AdsTime) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "MoveSpeedMultiplierHash")
                    {
                        if (config.MoveSpeedMultiplierAdd != 0.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue += config.MoveSpeedMultiplierAdd;
                            isModified = true;
                            LogToFile($"武器属性 移动速度倍率(MoveSpeedMultiplier) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 移动速度倍率(MoveSpeedMultiplier) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "AdsWalkSpeedMultiplierHash")
                    {
                        if (config.ADSMoveSpeedMultiplierAdd != 0.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue += config.ADSMoveSpeedMultiplierAdd;
                            isModified = true;
                            LogToFile($"武器属性 开镜移动速度倍率(AdsWalkSpeedMultiplier) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 开镜移动速度倍率(AdsWalkSpeedMultiplier) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    
                    // 射速和散射相关
                    else if (targetFieldName == "ShootSpeedHash")
                    {
                        if (config.ShootSpeedMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.ShootSpeedMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 射速(ShootSpeed) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 射速(ShootSpeed) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "ScatterRecoverHashADS")
                    {
                        if (config.ScatterRecoverADSMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.ScatterRecoverADSMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 开镜散射恢复(ScatterRecoverADS) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 开镜散射恢复(ScatterRecoverADS) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "ScatterRecoverHash")
                    {
                        if (config.ScatterRecoverMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.ScatterRecoverMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 散射恢复(ScatterRecover) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 散射恢复(ScatterRecover) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "ScatterFactorHash")
                    {
                        if (config.ScatterFactorMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.ScatterFactorMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 散射系数(ScatterFactor) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 散射系数(ScatterFactor) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "ScatterFactorHashADS")
                    {
                        if (config.ScatterFactorADSMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.ScatterFactorADSMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 开镜散射系数(ScatterFactorADS) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 开镜散射系数(ScatterFactorADS) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "DefaultScatterHash")
                    {
                        if (config.DefaultScatterMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.DefaultScatterMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 默认散射(DefaultScatter) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 默认散射(DefaultScatter) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "DefaultScatterHashADS")
                    {
                        if (config.DefaultScatterADSMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.DefaultScatterADSMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 开镜默认散射(DefaultScatterADS) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 开镜默认散射(DefaultScatterADS) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "MaxScatterHash")
                    {
                        if (config.MaxScatterMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.MaxScatterMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 最大散射(MaxScatter) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 最大散射(MaxScatter) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "MaxScatterHashADS")
                    {
                        if (config.MaxScatterADSMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.MaxScatterADSMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 开镜最大散射(MaxScatterADS) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 开镜最大散射(MaxScatterADS) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "ScatterGrowHash")
                    {
                        if (config.ScatterGrowMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.ScatterGrowMultiplier;
                            isModified = true;
                            LogToFile($"武器属性 散射增长(ScatterGrow) 已从 {old} 修改为 {stat.BaseValue}");
                        }
                        else
                        {
                            LogToFile($"武器属性 散射增长(ScatterGrow) 未修改，当前值为 {stat.BaseValue}");
                        }
                    }
                    else if (targetFieldName == "ScatterGrowHashADS")
                    {
                        if (config.ScatterGrowADSMultiplier != 1.0f)
                        {
                            float old = stat.BaseValue;
                            stat.BaseValue *= config.ScatterFactorADSMultiplier;
                        }
                    }
                    
                    // 打印日志信息，无论是否修改
                    if (isModified)
                    {
                        LogToFile($"武器属性 {targetFieldName} 已从 {baseValue} 修改为 {stat.BaseValue}");
                    }
                    else
                    {
                        LogToFile($"武器属性 {targetFieldName} 未修改，当前值为 {stat.BaseValue}");
                    }
                }
                else
                {
                    LogToFile($"未找到武器属性 {targetFieldName} 的Stat组件", false);
                }
            }
            catch (Exception ex)
            {
                LogToFile($"修改武器属性 {targetFieldName} 失败: {ex.Message}", false);
            }
        }
        
        private void ModifyAccessoryEffects(Item item, ItemConfig config)
        {
            try
            {
                ModifierDescriptionCollection componentInChildren = item.GetComponentInChildren<ModifierDescriptionCollection>(true);
                bool flag = componentInChildren == null;
                if (flag)
                {
                    LogToFile($"物品 {item.name} 上没有找到 ModifierDescriptionCollection。无法修改效果。");
                }
                else
                {
                    LogToFile($"正在为 {item.name} 配置 Modifiers...");
                    int num = 0;
                    List<string> list = new List<string>();
                    foreach (ModifierDescription modifierDescription in componentInChildren)
                    {
                        bool flag2 = modifierDescription == null;
                        if (!flag2)
                        {
                            float num2;
                            bool flag3 = config.mshook.TryGetValue(modifierDescription.Key, out num2);
                            if (flag3)
                            {
                                try
                                {
                                    float instanceFieldValue = GetPrivateField<float>(modifierDescription, "value");
                                    SetPrivateField(modifierDescription, "value", num2);
                                    // 获取字段中文翻译，若不存在则使用原字段名
                                    string fieldName = GetModifierDisplayName(modifierDescription.Key);
                                    LogToFile($"  - {fieldName}: {instanceFieldValue} → {num2}");
                                    num++;
                                    list.Add(modifierDescription.Key);
                                }
                                catch (Exception ex)
                                {
                                    LogToFile($"修改 Modifier '{modifierDescription.Key}' 失败! {ex.Message}", true);
                                }
                            }
                            else
                            {
                                try
                                {
                                    float instanceFieldValue2 = GetPrivateField<float>(modifierDescription, "value");
                                    bool flag4 = instanceFieldValue2 != 0f;
                                    if (flag4)
                                    {
                                        SetPrivateField(modifierDescription, "value", 0f);
                                        SetPrivateField(modifierDescription, "display", false);
                                        string fieldName = GetModifierDisplayName(modifierDescription.Key);
                                        LogToFile($"  - {fieldName} ({instanceFieldValue2}) 已被移除 (未在配置中指定)。");
                                    }
                                }
                                catch
                                {
                                }
                            }
                        }
                    }
                    LogToFile(string.Format("{0}: 共修改/移除了 {1} 个现有 Modifier。", item.name, num));
                }
            }
            catch (Exception ex)
            {
                LogToFile($"修改物品效果时出错: {ex.Message}\n{ex.StackTrace}", true);
            }
        }

        // 辅助方法：根据字段键获取中文翻译
        private string GetModifierDisplayName(string key)
        {
            // 可扩展字典，支持更多字段翻译
            var nameMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "Damage", "伤害" },
                { "CritDamageFactor", "暴击伤害倍率" },
                { "BleedChance", "流血几率" },
                // 示例，继续补充其他字段
            };
            return nameMap.TryGetValue(key, out string name) ? name : key;
        }

        private void SetupFoodDrinkComponent(Item item, ItemConfig config)
        {
            FoodDrink foodDrink = item.GetComponent<FoodDrink>();
            if (foodDrink == null)
            {
                foodDrink = item.gameObject.AddComponent<FoodDrink>();
                LogToFile($"为物品 {config.DisplayName} 添加FoodDrink组件");
            }

            foodDrink.energyValue = config.EnergyValue;
            foodDrink.waterValue = config.WaterValue;
            foodDrink.UseDurability = config.UseDurability;
            foodDrink.energyKey = "Usage_Energy";
            foodDrink.waterKey = "Usage_Water";

            LogToFile($"物品 {config.DisplayName} 能量值: {config.EnergyValue}, 口渴值: {config.WaterValue}");
        }
        
        private void SetupCraftingFormula(ItemConfig config)
        {
            // 只有当配置了FormulaId和CostItems时才添加合成配方
            if (!string.IsNullOrEmpty(config.FormulaId) && config.CostItems != null && config.CostItems.Length > 0)
            {
                try
                {
                    // 转换CostItems为ValueTuple数组
                    List<ValueTuple<int, long>> costItemsList = new List<ValueTuple<int, long>>();
                    foreach (var itemEntry in config.CostItems)
                    {
                        if (itemEntry.ItemId > 0 && itemEntry.Amount > 0)
                        {
                            costItemsList.Add(new ValueTuple<int, long>(itemEntry.ItemId, itemEntry.Amount));
                        }
                    }
                    
                    if (costItemsList.Count > 0)
                    {
                        // 调用CraftingUtils添加合成配方
                        CraftingUtils.AddCraftingFormula(
                            config.FormulaId,
                            config.CraftingMoney,
                            costItemsList.ToArray(),
                            config.NewItemId,
                            config.ResultItemAmount,
                            config.CraftingTags,
                            config.RequirePerk,
                            config.UnlockByDefault,
                            config.HideInIndex,
                            config.LockInDemo
                        );
                        
                        LogToFile($"为物品 {config.DisplayName} 添加合成配方: {config.FormulaId}");
                    }
                    else
                    {
                        LogToFile($"物品 {config.DisplayName} 的合成配方配置无效：缺少有效的成本物品", false);
                    }
                }
                catch (Exception ex)
                {
                    LogToFile($"为物品 {config.DisplayName} 添加合成配方时出错: {ex.Message}", true);
                }
            }
            else
            {
                // 如果没有配置合成配方参数，跳过合成配方的加载
                if (!string.IsNullOrEmpty(config.FormulaId))
                {
                    LogToFile($"物品 {config.DisplayName} 的合成配方配置不完整，跳过配方添加", false);
                }
            }
        }
        
        private void SetupDrugComponent(Item item, ItemConfig config)
        {
            // 只有当HealValue不为0时才添加Drug组件
            if (config.HealValue != 0)
            {
                // 检查是否已经存在Drug组件
                var drugComponents = item.GetComponents<Duckov.ItemUsage.Drug>();
                Duckov.ItemUsage.Drug drug = drugComponents.Length > 0 ? drugComponents[0] : null;
                
                if (drug == null)
                {
                    drug = item.gameObject.AddComponent<Duckov.ItemUsage.Drug>();
                    LogToFile($"为物品 {config.DisplayName} 添加Drug组件");
                }

                // 设置Drug组件属性
                drug.healValue = config.HealValue;
                drug.useDurability = config.UseDurabilityDrug;
                drug.durabilityUsage = config.DurabilityUsageDrug;
                drug.canUsePart = config.CanUsePartDrug;
                drug.healValueDescriptionKey = "Usage_HealValue";
                drug.durabilityUsageDescriptionKey = "Usage_Durability";

                LogToFile($"物品 {config.DisplayName} 治疗值: {config.HealValue}");
            }
        }
        
        private void SetupMeleeWeaponComponent(Item item, ItemConfig config)
        {
            // 检查是否有近战武器配置
            if (config.MeleeWeaponProperties != null)
            {
                // 检查是否已经存在ItemAgent_MeleeWeapon组件
                var meleeComponents = item.GetComponents<ItemAgent_MeleeWeapon>();
                ItemAgent_MeleeWeapon meleeWeapon = meleeComponents.Length > 0 ? meleeComponents[0] : null;
                
                if (meleeWeapon == null)
                {
                    meleeWeapon = item.gameObject.AddComponent<ItemAgent_MeleeWeapon>();
                    LogToFile($"为物品 {config.DisplayName} 添加ItemAgent_MeleeWeapon组件");
                }

                // 应用近战武器属性
                ApplyMeleeWeaponProperties(item, config.MeleeWeaponProperties);
            }
        }
        


        private Tag GetTargetTag(string tagName)
        {
            if (string.IsNullOrEmpty(tagName)) return null;
            return Resources.FindObjectsOfTypeAll<Tag>()
                .FirstOrDefault(t => t.name.Equals(tagName, StringComparison.OrdinalIgnoreCase));
        }

        private void SetLocalizationTexts(ItemConfig config)
        {
            LocalizationManager.overrideTexts[config.LocalizationKey] = config.DisplayName;
            LocalizationManager.overrideTexts[config.LocalizationDesc] = config.LocalizationDescValue;
        }

        private void SetItemIcon(Item newItem, Item originalItem, ItemConfig config)
        {
            if (string.IsNullOrEmpty(config.IconFileName))
            {
                LogToFile($"物品 {config.DisplayName} 未指定图标，使用原始图标");
                return;
            }

            // 首先尝试从模块自己的icons文件夹读取
            string iconPath = null;
            if (!string.IsNullOrEmpty(config.ModuleRootDir))
            {
                string moduleIconsPath = Path.Combine(config.ModuleRootDir, "icons");
                string moduleIconPath = Path.Combine(moduleIconsPath, config.IconFileName);
                if (Directory.Exists(moduleIconsPath) && File.Exists(moduleIconPath))
                {
                    iconPath = moduleIconPath;
                    LogToFile($"从模块文件夹加载图标: {moduleIconPath}");
                }
            }
            
            // 如果模块文件夹中没有，再尝试从默认的icons文件夹读取
            if (iconPath == null)
            {
                iconPath = Path.Combine(_iconsPath, config.IconFileName);
                if (!File.Exists(iconPath))
                {
                    LogToFile($"图标文件不存在: {iconPath}，使用原始图标", false);
                    return;
                }
            }

            try
            {
                byte[] iconData = File.ReadAllBytes(iconPath);
                Texture2D texture = new Texture2D(2, 2, TextureFormat.RGBA32, false);
                if (!ImageConversion.LoadImage(texture, iconData))
                {
                    LogToFile($"图标解码失败: {config.IconFileName}，使用原始图标", true);
                    return;
                }

                texture.filterMode = FilterMode.Bilinear;
                texture.Apply();
                Sprite iconSprite = Sprite.Create(
                    texture,
                    new Rect(0, 0, texture.width, texture.height),
                    new Vector2(0.5f, 0.5f),
                    100f
                );

                GameObject iconHolder = new GameObject($"IconHolder_{config.NewItemId}");
                DontDestroyOnLoad(iconHolder);
                iconHolder.AddComponent<ResourceHolder>().SetIcon(texture, iconSprite);

                FieldInfo iconField = typeof(Item).GetField("icon", BindingFlags.Instance | BindingFlags.NonPublic);
                iconField?.SetValue(newItem, iconSprite);
                LogToFile($"加载UI图标成功: {config.IconFileName}");
            }
            catch (Exception ex)
            {
                LogToFile($"设置UI图标失败 {config.IconFileName}: {ex.Message}", true);
            }
        }

        // 新增：替换世界模型贴图（复用IconFileName）
        private void SetWorldModelTexture(Item newItem, ItemConfig config)
        {
            // 直接复用UI图标的配置字段IconFileName
            if (string.IsNullOrEmpty(config.IconFileName))
            {
                return;
            }

            // 首先尝试从模块自己的icons文件夹读取
            string worldTexPath = null;
            if (!string.IsNullOrEmpty(config.ModuleRootDir))
            {
                string moduleIconsPath = Path.Combine(config.ModuleRootDir, "icons");
                string moduleTexPath = Path.Combine(moduleIconsPath, config.IconFileName);
                if (Directory.Exists(moduleIconsPath) && File.Exists(moduleTexPath))
                {
                    worldTexPath = moduleTexPath;
                }
            }
            
            // 如果模块文件夹中没有，再尝试从默认的icons文件夹读取
            if (worldTexPath == null)
            {
                worldTexPath = Path.Combine(_iconsPath, config.IconFileName);
                if (!File.Exists(worldTexPath))
                {
                    return;
                }
            }

            try
            {
                // 加载贴图文件为Texture2D（世界模型用纹理）
                byte[] texData = File.ReadAllBytes(worldTexPath);
                Texture2D worldTexture = new Texture2D(2, 2, TextureFormat.RGBA32, false);
                if (!ImageConversion.LoadImage(worldTexture, texData))
                {
                    return;
                }

                // 配置纹理属性（适配3D模型渲染）
                worldTexture.filterMode = FilterMode.Bilinear;
                worldTexture.wrapMode = TextureWrapMode.Clamp; // 防止纹理边缘拉伸
                worldTexture.Apply();

                // 找到物品模型的所有Renderer（含子物体，处理复杂模型）
                Renderer[] renderers = newItem.GetComponentsInChildren<Renderer>(true);
                if (renderers.Length == 0)
                {
                  
                    return;
                }

                // 替换每个Renderer的材质纹理（复制材质避免影响原物品）
                foreach (var renderer in renderers)
                {
                    // 复制原材质（关键：避免修改原物品材质导致全局BUG）
                    Material newMat = new Material(renderer.material);
                    // 替换主纹理（游戏通用属性名"_MainTex"，若无效可尝试"_BaseMap"）
                    newMat.SetTexture("_MainTex", worldTexture);
                    // 应用新材质
                    renderer.material = newMat;

                    // 保存纹理引用，防止Unity自动销毁
                    GameObject texHolder = new GameObject($"WorldTexHolder_{config.NewItemId}_{renderer.name}");
                    DontDestroyOnLoad(texHolder);
                    texHolder.AddComponent<ResourceHolder>().SetIcon(worldTexture, null);
                }

                // 成功替换贴图，不输出日志
            }
            catch
            {
                // 静默失败，不输出日志
            }
        }

        private void RegisterItem(Item item, int itemId, GameObject clonedObj)
        {
            if (ItemAssetsCollection.AddDynamicEntry(item))
            {
                LogToFile($"物品注册成功: {item.DisplayNameRaw} (ID: {itemId})");
            }
            else
            {
                LogToFile($"物品注册失败: {item.DisplayNameRaw} (ID: {itemId})", true);
                Destroy(clonedObj);
            }
        }

        protected override void OnBeforeDeactivate()
        {
            LogToFile("模组即将卸载");
        }
        
        protected void OnDisable()
        {
            try
            {
                // 移除所有添加的合成配方
                CraftingUtils.RemoveAllAddedFormulas();
                LogToFile("模组卸载时清理所有合成配方");
                
                // 保存ID映射
                SaveIdMappings();
                
                // 清理已使用的新物品ID列表
                usedNewItemIds.Clear();
                LogToFile("模组卸载时清理已使用的新物品ID列表");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[EscapeFromDuckovMod] 清理合成配方失败: {ex.Message}");
            }
        }

        // 加载ID映射
        private void LoadIdMappings()
        {
            try
            {
                // 设置正确的路径 - 使用_configsPath确保在正确的目录
                idMapFilePath = Path.Combine(_configsPath, "ItemIdMappings.json");
                LogToFile($"准备从 {idMapFilePath} 加载ID映射");
                
                // 确保集合已初始化
                if (originalToAssignedIdMap == null)
                {
                    originalToAssignedIdMap = new Dictionary<int, int>();
                }
                
                if (usedNewItemIds == null)
                {
                    usedNewItemIds = new List<int>();
                }
                else
                {
                    // 清除当前的ID映射，但保留usedNewItemIds集合对象引用
                    originalToAssignedIdMap.Clear();
                    usedNewItemIds.Clear();
                }
                
                if (File.Exists(idMapFilePath))
                {
                    string json = File.ReadAllText(idMapFilePath);
                    var loadedMap = JsonConvert.DeserializeObject<Dictionary<int, int>>(json);
                    
                    if (loadedMap != null)
                    {
                        // 深拷贝加载的映射，避免引用问题
                        foreach (var entry in loadedMap)
                        {
                            originalToAssignedIdMap[entry.Key] = entry.Value;
                        }
                        
                        LogToFile($"成功加载ID映射，共 {originalToAssignedIdMap.Count} 个映射项");
                        
                        // 记录一些映射示例用于调试
                        int sampleCount = Math.Min(5, originalToAssignedIdMap.Count);
                        var sampleEntries = originalToAssignedIdMap.Take(sampleCount).ToList();
                        foreach (var entry in sampleEntries)
                        {
                            LogToFile($"映射示例: 键 {entry.Key} -> 值 {entry.Value}");
                        }
                        
                        // 重要：不再在加载时预先标记所有ID为已使用
                        // 这样可以避免同一个mod在加载时与自己的保存ID冲突
                        LogToFile("ID映射加载完成，将在处理物品时动态管理已使用ID");
                    }
                    else
                    {
                        LogToFile("加载的ID映射为空，将创建新的映射");
                        originalToAssignedIdMap.Clear();
                    }
                }
                else
                {
                    LogToFile("ID映射文件不存在，将创建新的映射");
                    originalToAssignedIdMap.Clear();
                }
            }
            catch (Exception ex)
            {
                LogToFile($"加载ID映射时发生错误: {ex.Message}", true);
                LogToFile($"错误详情: {ex.StackTrace}", true);
                originalToAssignedIdMap.Clear();
                usedNewItemIds.Clear();
            }
        }
        
        // 保存ID映射
        private void SaveIdMappings()
        {
            try
            {
                // 确保目录存在
                string directory = Path.GetDirectoryName(idMapFilePath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }
                
                string json = JsonConvert.SerializeObject(originalToAssignedIdMap, Newtonsoft.Json.Formatting.Indented);
                File.WriteAllText(idMapFilePath, json);
                LogToFile($"成功保存ID映射，共 {originalToAssignedIdMap.Count} 个映射项");
            }
            catch (Exception ex)
            {
                LogToFile($"保存ID映射时发生错误: {ex.Message}", true);
            }
        }
        
        private void InitializeLogFile()
        {
            string logDir = Path.Combine(_dllDirectory, "logs");
            Directory.CreateDirectory(logDir);
            _logFilePath = Path.Combine(logDir, $"mshookl_log_{DateTime.Now:yyyyMMdd_HHmmss}.txt");
            LogToFile($"日志路径: {_logFilePath}");
        }

        private void LogToFile(string message, bool isError = false)
        {
            try
            {
                string logLine = $"[{DateTime.Now:HH:mm:ss}] {message}\n";
                File.AppendAllText(_logFilePath, logLine);

                if (isError)
                    Debug.LogError($"[Additionalmshookl] {message}");
                else
                    Debug.Log($"[Additionalmshookl] {message}");
            }
            catch (Exception ex)
            {
                Debug.LogError($"日志写入失败: {ex.Message}");
            }
        }

        // 合成配方物品配置类
        public class CraftingItemEntry
        {
            public int ItemId { get; set; }
            public long Amount { get; set; }
        }

        
        public class WeaponConfig
        {
            public float DistanceMultiplier = 1.0f;
            public float BulletSpeedMultiplier = 1.0f;
            public float ADSTimeMultiplier = 1.0f;
            public float ScatterRecoverADSMultiplier = 1.0f;
            public float ShootSpeedMultiplier = 1.0f;
            public float MoveSpeedMultiplierAdd = 0f;
            public float ADSMoveSpeedMultiplierAdd = 0f;
            public float BaseDamageMultiplier = 1.0f;
            public float RangeAddition = 0f;
            public float BulletSpeedAddition = 0f;
            public float CriticalChanceMultiplier = 1.0f;
            public float ReloadSpeedMultiplier = 1.0f;
            public float AccuracyMultiplier = 1.0f;
            
           
            // 伤害相关
            public float DamageMultiplier = 1.0f;
            public float CriticalDamageFactorMultiplier = 1.0f;
            public float PenetrateMultiplier = 1.0f;
            public float ArmorPiercingMultiplier = 1.0f;
            public float ArmorBreakMultiplier = 1.0f;
            public float ExplosionDamageMultiplier = 1.0f;
            public float ExplosionRangeMultiplier = 1.0f;
            
            // 射击相关
            public float ShotCountMultiplier = 1.0f;
            public float ShotAngleMultiplier = 1.0f;
            public float BurstCountMultiplier = 1.0f;
            public float SoundRangeMultiplier = 1.0f;
            public float ADSAimDistanceFactorMultiplier = 1.0f;
            
            // 散射相关
            public float ScatterFactorMultiplier = 1.0f;
            public float ScatterFactorADSMultiplier = 1.0f;
            public float DefaultScatterMultiplier = 1.0f;
            public float DefaultScatterADSMultiplier = 1.0f;
            public float MaxScatterMultiplier = 1.0f;
            public float MaxScatterADSMultiplier = 1.0f;
            public float ScatterGrowMultiplier = 1.0f;
            public float ScatterGrowADSMultiplier = 1.0f;
            public float ScatterRecoverMultiplier = 1.0f;
            
            // 后坐力相关
            public float RecoilVMinMultiplier = 1.0f;
            public float RecoilVMaxMultiplier = 1.0f;
            public float RecoilHMinMultiplier = 1.0f;
            public float RecoilHMaxMultiplier = 1.0f;
            public float RecoilScaleVMultiplier = 1.0f;
            public float RecoilScaleHMultiplier = 1.0f;
            public float RecoilRecoverMultiplier = 1.0f;
            public float RecoilTimeMultiplier = 1.0f;
            public float RecoilRecoverTimeMultiplier = 1.0f;
            
            // 其他属性
            public float CapacityMultiplier = 1.0f;
            public float BuffChanceMultiplier = 1.0f;
            public float BulletBleedChanceMultiplier = 1.0f;
            public float BulletDurabilityCostMultiplier = 1.0f;
        }

        public class AmmoConfig
        {
            public float NewCritRateGain = 0f;
            public float NewCritDamageFactorGain = 0f;
            public float NewArmorPiercingGain = 0f;
            public float NewDamageMultiplier = 1.0f;
            public float NewExplosionRange = 0f;
            public float NewBuffChanceMultiplier = 1.0f;
            public float NewBleedChance = 0f;
            public float NewExplosionDamage = 0f;
            public float NewArmorBreakGain = 0f;
            public float NewDurabilityCost = 0f;
            public float NewBulletSpeed = 0f;
            public float NewBulletDistance = 0f;
        }
        
        public class MeleeWeaponConfig
        {
            public float NewDamage = 0f;
            public float NewCritRate = 0f;
            public float NewCritDamageFactor = 0f;
            public float NewArmorPiercing = 0f;
            public float NewAttackSpeed = 0f;
            public float NewAttackRange = 0f;
            public float NewStaminaCost = 0f;
            public float NewBleedChance = 0f;
            public float NewMoveSpeedMultiplier = 1.0f;
        }

        public class ItemConfig
        {
            public int OriginalItemId { get; set; }
            public int NewItemId { get; set; }
            public string DisplayName { get; set; }
            public string LocalizationKey { get; set; }
            public string LocalizationDescValue { get; set; }
            public float Weight { get; set; }
            public int Value { get; set; }
            public int Quality { get; set; }
            public string[] Tags { get; set; }
            public float EnergyValue { get; set; }
            public float WaterValue { get; set; }
            public float UseDurability { get; set; }
            public string IconFileName { get; set; } // UI图标+世界贴图共用此字段
        public string ModuleRootDir { get; set; } // 模块根目录，用于查找icons文件夹
            public string LocalizationDesc => $"{LocalizationKey}_Desc";
            // 物品效果修改器字典，用于存储不同属性的修改值
            public Dictionary<string, float> mshook { get; set; } = new Dictionary<string, float>();
            
            // Drug组件属性
            public int HealValue { get; set; }
            public bool UseDurabilityDrug { get; set; }
            public float DurabilityUsageDrug { get; set; }
            public bool CanUsePartDrug { get; set; }
            
            // 合成配方属性
            public string FormulaId { get; set; } // 配方唯一ID
            public long CraftingMoney { get; set; } // 合成所需货币
            public CraftingItemEntry[] CostItems { get; set; } // 合成所需物品列表
            public int ResultItemAmount { get; set; } = 1; // 合成产出数量
            public string[] CraftingTags { get; set; } // 配方所属标签
            public string RequirePerk { get; set; } = ""; // 合成所需天赋
            
            // 武器属性配置
            public WeaponConfig WeaponProperties { get; set; }
            public AmmoConfig AmmoProperties { get; set; }
            public MeleeWeaponConfig MeleeWeaponProperties { get; set; }
            public bool UnlockByDefault { get; set; } = true; // 是否默认解锁
            public bool HideInIndex { get; set; } = false; // 是否在列表中隐藏
            public bool LockInDemo { get; set; } = false; // 是否在演示模式中锁定
            

        }

        private class ResourceHolder : MonoBehaviour
        {
            public Texture2D IconTexture;
            public Sprite IconSprite;

            public void SetIcon(Texture2D tex, Sprite spr)
            {
                IconTexture = tex;
                IconSprite = spr;
            }
        }
        // 当模组卸载时保存ID映射
        private void OnDestroy()
        {
            SaveIdMappings();
        }
    }
}
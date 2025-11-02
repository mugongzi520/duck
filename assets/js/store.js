/**
 * 状态管理系统
 * 简化版的状态管理，类似Redux
 */

export class Store {
    constructor() {
        this.state = {
            // 配置相关
            configs: [],
            currentConfig: null,
            filteredConfigs: [],
            
            // UI状态
            theme: 'light',
            searchQuery: '',
            filterType: 'all',
            
            // 编辑状态
            hasUnsavedChanges: false,
            isEditing: false,
            
            // 历史记录
            history: [],
            historyIndex: -1,
            canUndo: false,
            canRedo: false,
            
            // 加载状态
            isLoading: false,
            
            // Buff配置相关
            buffConfigs: [],
            selectedBuffCategory: 'all',
            buffSearchQuery: '',
            
            // 合成配方相关
            craftingRecipes: [],
            currentRecipeIndex: 0,
            
            // 分解配方相关
            decomposeRecipes: [],
            decomposeEnabled: false,
            
            // 抽奖系统相关
            gachaPools: [],
            currentGachaPool: null,
            gachaItems: [],
        };
        
        this.listeners = [];
    }

    /**
     * 获取当前状态
     */
    getState() {
        return { ...this.state };
    }

    /**
     * 订阅状态变化
     */
    subscribe(listener) {
        if (typeof listener === 'function') {
            this.listeners.push(listener);
            
            // 返回取消订阅函数
            return () => {
                const index = this.listeners.indexOf(listener);
                if (index > -1) {
                    this.listeners.splice(index, 1);
                }
            };
        }
    }

    /**
     * 通知所有订阅者
     */
    notify() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (error) {
                console.error('状态订阅者错误:', error);
            }
        });
    }

    /**
     * 派发动作
     */
    dispatch(action) {
        const { type, payload } = action;
        
        switch (type) {
            case 'SET_CONFIGS':
                this.state.configs = payload;
                this.updateFilteredConfigs();
                break;
                
            case 'ADD_CONFIG':
                this.state.configs.push(payload);
                this.updateFilteredConfigs();
                break;
                
            case 'UPDATE_CONFIG':
                const index = this.state.configs.findIndex(c => c.id === payload.id);
                if (index > -1) {
                    this.state.configs[index] = payload;
                    if (this.state.currentConfig?.id === payload.id) {
                        this.state.currentConfig = payload;
                    }
                    this.updateFilteredConfigs();
                }
                break;
                
            case 'DELETE_CONFIG':
                this.state.configs = this.state.configs.filter(c => c.id !== payload);
                if (this.state.currentConfig?.id === payload) {
                    this.state.currentConfig = null;
                    this.state.isEditing = false;
                }
                this.updateFilteredConfigs();
                break;
                
            case 'SET_CURRENT_CONFIG':
                this.state.currentConfig = payload;
                this.state.isEditing = payload !== null;
                this.state.hasUnsavedChanges = false;
                this.clearHistory();
                break;
                
            case 'SET_THEME':
                this.state.theme = payload;
                document.body.setAttribute('data-theme', payload);
                localStorage.setItem('theme', payload);
                break;
                
            case 'SET_SEARCH_QUERY':
                this.state.searchQuery = payload;
                this.updateFilteredConfigs();
                break;
                
            case 'SET_FILTER_TYPE':
                this.state.filterType = payload;
                this.updateFilteredConfigs();
                break;
                
            case 'SET_UNSAVED_CHANGES':
                this.state.hasUnsavedChanges = payload;
                break;
                
            case 'SET_LOADING':
                this.state.isLoading = payload;
                break;
                
            case 'PUSH_HISTORY':
                // 如果不在历史末尾，删除后面的历史
                if (this.state.historyIndex < this.state.history.length - 1) {
                    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
                }
                
                // 添加新历史记录
                this.state.history.push(payload);
                this.state.historyIndex++;
                
                // 限制历史记录数量（最多20条）
                if (this.state.history.length > 20) {
                    this.state.history.shift();
                    this.state.historyIndex--;
                }
                
                this.updateHistoryState();
                break;
                
            case 'UNDO':
                if (this.state.canUndo) {
                    this.state.historyIndex--;
                    this.updateHistoryState();
                    return this.state.history[this.state.historyIndex];
                }
                break;
                
            case 'REDO':
                if (this.state.canRedo) {
                    this.state.historyIndex++;
                    this.updateHistoryState();
                    return this.state.history[this.state.historyIndex];
                }
                break;
                
            case 'CLEAR_HISTORY':
                this.clearHistory();
                break;
                
            // Buff配置相关
            case 'SET_BUFF_CONFIGS':
                this.state.buffConfigs = payload;
                break;
                
            case 'ADD_BUFF_CONFIG':
                this.state.buffConfigs.push(payload);
                this.state.hasUnsavedChanges = true;
                break;
                
            case 'UPDATE_BUFF_CONFIG':
                const buffIndex = this.state.buffConfigs.findIndex((b, i) => i === payload.index);
                if (buffIndex > -1) {
                    this.state.buffConfigs[buffIndex] = payload.data;
                    this.state.hasUnsavedChanges = true;
                }
                break;
                
            case 'REMOVE_BUFF_CONFIG':
                this.state.buffConfigs.splice(payload, 1);
                this.state.hasUnsavedChanges = true;
                break;
                
            case 'SET_BUFF_CATEGORY':
                this.state.selectedBuffCategory = payload;
                break;
                
            case 'SET_BUFF_SEARCH':
                this.state.buffSearchQuery = payload;
                break;
                
            // 合成配方相关
            case 'SET_CRAFTING_RECIPES':
                this.state.craftingRecipes = payload;
                break;
                
            case 'ADD_CRAFTING_RECIPE':
                this.state.craftingRecipes.push(payload);
                this.state.hasUnsavedChanges = true;
                break;
                
            case 'UPDATE_CRAFTING_RECIPE':
                const recipeIndex = this.state.craftingRecipes.findIndex((r, i) => i === payload.index);
                if (recipeIndex > -1) {
                    this.state.craftingRecipes[recipeIndex] = payload.data;
                    this.state.hasUnsavedChanges = true;
                }
                break;
                
            case 'REMOVE_CRAFTING_RECIPE':
                this.state.craftingRecipes.splice(payload, 1);
                this.state.hasUnsavedChanges = true;
                break;
                
            case 'SET_CURRENT_RECIPE':
                this.state.currentRecipeIndex = payload;
                break;
                
            // 分解配方相关
            case 'SET_DECOMPOSE_RECIPES':
                this.state.decomposeRecipes = payload;
                break;
                
            case 'ADD_DECOMPOSE_RESULT':
                this.state.decomposeRecipes.push(payload);
                this.state.hasUnsavedChanges = true;
                break;
                
            case 'UPDATE_DECOMPOSE_RESULT':
                const decomposeIndex = this.state.decomposeRecipes.findIndex((r, i) => i === payload.index);
                if (decomposeIndex > -1) {
                    this.state.decomposeRecipes[decomposeIndex] = payload.data;
                    this.state.hasUnsavedChanges = true;
                }
                break;
                
            case 'REMOVE_DECOMPOSE_RESULT':
                this.state.decomposeRecipes.splice(payload, 1);
                this.state.hasUnsavedChanges = true;
                break;
                
            case 'SET_DECOMPOSE_ENABLED':
                this.state.decomposeEnabled = payload;
                this.state.hasUnsavedChanges = true;
                break;
                
            // 抽奖系统相关
            case 'SET_GACHA_POOLS':
                this.state.gachaPools = payload;
                break;
                
            case 'ADD_GACHA_POOL':
                this.state.gachaPools.push(payload);
                this.state.hasUnsavedChanges = true;
                break;
                
            case 'UPDATE_GACHA_POOL':
                const poolIndex = this.state.gachaPools.findIndex(p => p.id === payload.id);
                if (poolIndex > -1) {
                    this.state.gachaPools[poolIndex] = payload;
                    this.state.hasUnsavedChanges = true;
                }
                break;
                
            case 'REMOVE_GACHA_POOL':
                this.state.gachaPools = this.state.gachaPools.filter(p => p.id !== payload);
                this.state.hasUnsavedChanges = true;
                break;
                
            case 'SET_CURRENT_GACHA_POOL':
                this.state.currentGachaPool = payload;
                break;
                
            case 'SET_GACHA_ITEMS':
                this.state.gachaItems = payload;
                break;
                
            case 'ADD_GACHA_ITEM':
                this.state.gachaItems.push(payload);
                this.state.hasUnsavedChanges = true;
                break;
                
            case 'UPDATE_GACHA_ITEM':
                const itemIndex = this.state.gachaItems.findIndex((item, i) => i === payload.index);
                if (itemIndex > -1) {
                    this.state.gachaItems[itemIndex] = payload.data;
                    this.state.hasUnsavedChanges = true;
                }
                break;
                
            case 'REMOVE_GACHA_ITEM':
                this.state.gachaItems.splice(payload, 1);
                this.state.hasUnsavedChanges = true;
                break;
                
            default:
                console.warn('未知的action类型:', type);
        }
        
        this.notify();
    }

    /**
     * 更新过滤后的配置列表
     */
    updateFilteredConfigs() {
        let filtered = [...this.state.configs];
        
        // 按类型筛选
        if (this.state.filterType !== 'all') {
            filtered = filtered.filter(config => config.type === this.state.filterType);
        }
        
        // 按搜索词筛选
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(config => {
                return (
                    config.fileName.toLowerCase().includes(query) ||
                    config.content?.DisplayName?.toLowerCase().includes(query) ||
                    config.content?.NewItemId?.toString().includes(query) ||
                    config.content?.Tags?.some(tag => tag.toLowerCase().includes(query))
                );
            });
        }
        
        // 按修改时间排序（最新的在前）
        filtered.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
        
        this.state.filteredConfigs = filtered;
    }

    /**
     * 更新历史记录状态
     */
    updateHistoryState() {
        this.state.canUndo = this.state.historyIndex > 0;
        this.state.canRedo = this.state.historyIndex < this.state.history.length - 1;
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        this.state.history = [];
        this.state.historyIndex = -1;
        this.state.canUndo = false;
        this.state.canRedo = false;
    }

    /**
     * 获取配置统计信息
     */
    getStatistics() {
        const configs = this.state.configs;
        const stats = {
            total: configs.length,
            weapon: 0,
            melee: 0,
            ammo: 0,
            item: 0,
            accessory: 0,
        };
        
        configs.forEach(config => {
            if (stats.hasOwnProperty(config.type)) {
                stats[config.type]++;
            }
        });
        
        return stats;
    }
}

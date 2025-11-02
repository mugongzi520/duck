/**
 * 物品搜索管理器
 * 基于6.json提供物品搜索功能
 */
export class SearchManager {
    constructor() {
        this.itemDatabase = [];
        this.searchHistory = [];
        this.favorites = [];
        this.currentTarget = null;
        
        this.loadItemDatabase();
        this.loadSearchHistory();
        this.loadFavorites();
    }

    /**
     * 加载物品数据库
     */
    async loadItemDatabase() {
        try {
            const response = await fetch('6.json');
            this.itemDatabase = await response.json();
        } catch (error) {
            console.error('加载物品数据库失败:', error);
            this.itemDatabase = [];
        }
    }

    /**
     * 从localStorage加载搜索历史
     */
    loadSearchHistory() {
        try {
            const history = localStorage.getItem('search_history');
            this.searchHistory = history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('加载搜索历史失败:', error);
            this.searchHistory = [];
        }
    }

    /**
     * 从localStorage加载收藏夹
     */
    loadFavorites() {
        try {
            const favorites = localStorage.getItem('item_favorites');
            this.favorites = favorites ? JSON.parse(favorites) : [];
        } catch (error) {
            console.error('加载收藏夹失败:', error);
            this.favorites = [];
        }
    }

    /**
     * 保存搜索历史
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('保存搜索历史失败:', error);
        }
    }

    /**
     * 保存收藏夹
     */
    saveFavorites() {
        try {
            localStorage.setItem('item_favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('保存收藏夹失败:', error);
        }
    }

    /**
     * 添加到搜索历史
     */
    addToHistory(item) {
        // 移除重复项
        this.searchHistory = this.searchHistory.filter(h => h.id !== item.id);
        // 添加到开头
        this.searchHistory.unshift(item);
        // 限制历史记录数量
        this.searchHistory = this.searchHistory.slice(0, 20);
        this.saveSearchHistory();
    }

    /**
     * 切换收藏状态
     */
    toggleFavorite(item) {
        const index = this.favorites.findIndex(f => f.id === item.id);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(item);
        }
        this.saveFavorites();
    }

    /**
     * 检查是否已收藏
     */
    isFavorite(itemId) {
        return this.favorites.some(f => f.id === itemId);
    }

    /**
     * 按ID搜索物品
     */
    searchById(id) {
        const numId = parseInt(id);
        if (isNaN(numId)) return null;
        return this.itemDatabase.find(item => item.id === numId);
    }

    /**
     * 按名称搜索物品
     */
    searchByName(name) {
        if (!name || name.trim() === '') return [];
        const term = name.toLowerCase().trim();
        return this.itemDatabase.filter(item => 
            item.name.toLowerCase().includes(term)
        );
    }

    /**
     * 按ID范围搜索物品
     */
    searchByIdRange(minId, maxId) {
        const min = parseInt(minId) || 0;
        const max = parseInt(maxId) || Infinity;
        return this.itemDatabase.filter(item => 
            item.id >= min && item.id <= max
        );
    }

    /**
     * 综合搜索
     */
    search(query) {
        if (!query || query.trim() === '') return [];
        
        const term = query.trim();
        
        // 尝试按ID搜索
        if (/^\d+$/.test(term)) {
            const result = this.searchById(term);
            return result ? [result] : [];
        }
        
        // 按名称搜索
        return this.searchByName(term);
    }

    /**
     * 显示搜索模态框
     */
    showSearchModal(targetInput, options = {}) {
        this.currentTarget = targetInput;
        
        // 创建模态框HTML
        const modalHtml = `
            <div id="item-search-modal" class="modal-overlay">
                <div class="modal-content modern-modal">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fa fa-search"></i>
                            物品搜索
                        </h3>
                        <button class="modal-close" onclick="window.searchManager.hideSearchModal()">
                            <i class="fa fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- 搜索输入 -->
                        <div class="search-input-container">
                            <i class="fa fa-search search-icon"></i>
                            <input type="text" 
                                id="item-search-input" 
                                class="search-input modern-input" 
                                placeholder="输入物品ID或名称搜索..."
                                autofocus>
                            <button class="search-clear" id="clear-search" style="display: none;">
                                <i class="fa fa-times"></i>
                            </button>
                        </div>

                        <!-- 快捷标签 -->
                        <div class="search-tabs">
                            <button class="search-tab active" data-tab="search">
                                <i class="fa fa-search"></i>
                                搜索结果
                            </button>
                            <button class="search-tab" data-tab="history">
                                <i class="fa fa-history"></i>
                                搜索历史
                            </button>
                            <button class="search-tab" data-tab="favorites">
                                <i class="fa fa-star"></i>
                                收藏夹
                            </button>
                        </div>

                        <!-- 搜索结果 -->
                        <div class="search-results-container" id="search-results">
                            <div class="empty-search">
                                <i class="fa fa-search empty-icon"></i>
                                <p>输入关键词开始搜索</p>
                                <p class="text-sm text-gray-500">支持按物品ID或名称搜索</p>
                            </div>
                        </div>

                        <!-- 搜索历史 -->
                        <div class="search-results-container" id="search-history" style="display: none;">
                            ${this.renderHistoryList()}
                        </div>

                        <!-- 收藏夹 -->
                        <div class="search-results-container" id="search-favorites" style="display: none;">
                            ${this.renderFavoritesList()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加到页面
        const existingModal = document.getElementById('item-search-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 绑定事件
        this.bindSearchEvents();
    }

    /**
     * 渲染历史记录列表
     */
    renderHistoryList() {
        if (this.searchHistory.length === 0) {
            return `
                <div class="empty-search">
                    <i class="fa fa-history empty-icon"></i>
                    <p>暂无搜索历史</p>
                </div>
            `;
        }

        return `
            <div class="item-list">
                ${this.searchHistory.map(item => this.renderItemCard(item, true)).join('')}
            </div>
        `;
    }

    /**
     * 渲染收藏夹列表
     */
    renderFavoritesList() {
        if (this.favorites.length === 0) {
            return `
                <div class="empty-search">
                    <i class="fa fa-star empty-icon"></i>
                    <p>暂无收藏物品</p>
                </div>
            `;
        }

        return `
            <div class="item-list">
                ${this.favorites.map(item => this.renderItemCard(item, false, true)).join('')}
            </div>
        `;
    }

    /**
     * 渲染物品卡片
     */
    renderItemCard(item, showDelete = false, showFavorite = true) {
        const isFav = this.isFavorite(item.id);
        
        return `
            <div class="item-card modern-card" data-item-id="${item.id}">
                <div class="item-info">
                    <div class="item-id">#${item.id}</div>
                    <div class="item-name">${item.name}</div>
                </div>
                <div class="item-actions">
                    ${showFavorite ? `
                        <button class="btn-icon ${isFav ? 'text-yellow-500' : ''}" 
                            onclick="window.searchManager.toggleFavoriteItem(${item.id}); event.stopPropagation();">
                            <i class="fa fa-star${isFav ? '' : '-o'}"></i>
                        </button>
                    ` : ''}
                    ${showDelete ? `
                        <button class="btn-icon text-red-500" 
                            onclick="window.searchManager.removeFromHistory(${item.id}); event.stopPropagation();">
                            <i class="fa fa-trash"></i>
                        </button>
                    ` : ''}
                    <button class="btn-select" onclick="window.searchManager.selectItem(${item.id})">
                        选择
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 绑定搜索事件
     */
    bindSearchEvents() {
        const searchInput = document.getElementById('item-search-input');
        const clearBtn = document.getElementById('clear-search');
        const tabs = document.querySelectorAll('.search-tab');

        // 搜索输入事件
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                if (clearBtn) {
                    clearBtn.style.display = query ? 'block' : 'none';
                }
                this.performSearch(query);
            });

            // 回车键选择第一个结果
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const firstItem = document.querySelector('.item-card');
                    if (firstItem) {
                        const itemId = firstItem.dataset.itemId;
                        this.selectItem(parseInt(itemId));
                    }
                }
            });
        }

        // 清除按钮事件
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                this.performSearch('');
            });
        }

        // 标签切换事件
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // 点击模态框外部关闭
        const modal = document.getElementById('item-search-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideSearchModal();
                }
            });
        }
    }

    /**
     * 执行搜索
     */
    performSearch(query) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;

        if (!query || query.trim() === '') {
            resultsContainer.innerHTML = `
                <div class="empty-search">
                    <i class="fa fa-search empty-icon"></i>
                    <p>输入关键词开始搜索</p>
                    <p class="text-sm text-gray-500">支持按物品ID或名称搜索</p>
                </div>
            `;
            return;
        }

        const results = this.search(query);

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-search">
                    <i class="fa fa-frown-o empty-icon"></i>
                    <p>未找到匹配的物品</p>
                    <p class="text-sm text-gray-500">尝试使用其他关键词</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = `
            <div class="search-stats">
                找到 ${results.length} 个匹配的物品
            </div>
            <div class="item-list">
                ${results.map(item => this.renderItemCard(item)).join('')}
            </div>
        `;
    }

    /**
     * 切换标签
     */
    switchTab(tabName) {
        // 更新标签状态
        document.querySelectorAll('.search-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // 隐藏所有内容
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('search-history').style.display = 'none';
        document.getElementById('search-favorites').style.display = 'none';

        // 显示对应内容
        const containers = {
            'search': 'search-results',
            'history': 'search-history',
            'favorites': 'search-favorites'
        };

        const containerId = containers[tabName];
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'block';
            
            // 刷新历史记录和收藏夹
            if (tabName === 'history') {
                container.innerHTML = this.renderHistoryList();
            } else if (tabName === 'favorites') {
                container.innerHTML = this.renderFavoritesList();
            }
        }
    }

    /**
     * 选择物品
     */
    selectItem(itemId) {
        const item = this.searchById(itemId);
        if (!item) return;

        // 添加到历史记录
        this.addToHistory(item);

        // 填充到目标输入框
        if (this.currentTarget) {
            this.currentTarget.value = item.id;
            
            // 触发change事件
            const event = new Event('change', { bubbles: true });
            this.currentTarget.dispatchEvent(event);
        }

        // 关闭模态框
        this.hideSearchModal();

        // 显示通知
        this.showNotification(`已选择物品: ${item.name} (ID: ${item.id})`);
    }

    /**
     * 切换收藏状态
     */
    toggleFavoriteItem(itemId) {
        const item = this.searchById(itemId);
        if (!item) return;

        this.toggleFavorite(item);
        
        // 刷新当前显示
        const activeTab = document.querySelector('.search-tab.active');
        if (activeTab) {
            this.switchTab(activeTab.dataset.tab);
        }
    }

    /**
     * 从历史记录中移除
     */
    removeFromHistory(itemId) {
        this.searchHistory = this.searchHistory.filter(h => h.id !== itemId);
        this.saveSearchHistory();
        
        // 刷新历史记录显示
        const historyContainer = document.getElementById('search-history');
        if (historyContainer && historyContainer.style.display !== 'none') {
            historyContainer.innerHTML = this.renderHistoryList();
        }
    }

    /**
     * 隐藏搜索模态框
     */
    hideSearchModal() {
        const modal = document.getElementById('item-search-modal');
        if (modal) {
            modal.remove();
        }
        this.currentTarget = null;
    }

    /**
     * 显示通知
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'search-notification';
        notification.innerHTML = `
            <i class="fa fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

/**
 * 主应用程序入口
 * 初始化应用并协调各个模块
 */

import { Store } from './store.js';
import { Database } from './db.js';
import { ConfigService } from './services/config-service.js';
import { ExportService } from './services/export-service.js';
import { ImportService } from './services/import-service.js';
import { SearchManager } from './services/search-manager.js';
import { GachaService } from './services/gacha-service.js';
import { UndoRedoService } from './services/undo-redo-service.js';
import { TemplateService } from './services/template-service.js';
import { BatchService } from './services/batch-service.js';
import { UIManager } from './ui-manager.js';
import { showNotification, showConfirm } from './utils/helpers.js';
import { CONSTANTS } from './utils/constants.js';

/**
 * 应用程序类
 */
class App {
    constructor() {
        this.store = null;
        this.db = null;
        this.configService = null;
        this.exportService = null;
        this.importService = null;
        this.uiManager = null;
        this.initialized = false;
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('🚀 正在初始化应用...');
            
            // 初始化状态管理
            this.store = new Store();
            
            // 初始化数据库
            this.db = new Database();
            await this.db.init();
            
            // 初始化服务
            this.configService = new ConfigService(this.db, this.store);
            this.exportService = new ExportService();
            this.importService = new ImportService(this.db);
            this.searchManager = new SearchManager();
            this.gachaService = new GachaService();
            this.undoRedoService = new UndoRedoService(this.store);
            this.templateService = new TemplateService();
            this.batchService = new BatchService(this.db, this.store);
            
            // 初始化UI管理器
            this.uiManager = new UIManager(
                this.store, 
                this.configService, 
                this.exportService, 
                this.importService,
                this.searchManager,
                this.gachaService,
                this.undoRedoService,
                this.templateService,
                this.batchService
            );
            await this.uiManager.init();
            
            // 暴露为全局变量以供HTML中的onclick使用
            window.uiManager = this.uiManager;
            window.searchManager = this.searchManager;
            window.gachaService = this.gachaService;
            window.undoRedoService = this.undoRedoService;
            window.templateService = this.templateService;
            window.batchService = this.batchService;
            
            // 加载配置
            await this.loadConfigs();
            
            // 设置全局事件监听
            this.setupGlobalListeners();
            
            // 恢复主题设置
            this.restoreTheme();
            
            this.initialized = true;
            console.log('✅ 应用初始化完成');
            
            showNotification('成功', '应用加载完成', 'success');
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            showNotification('错误', '应用初始化失败: ' + error.message, 'error');
        }
    }

    /**
     * 加载所有配置
     */
    async loadConfigs() {
        try {
            const configs = await this.db.getAllConfigs();
            this.store.dispatch({ type: 'SET_CONFIGS', payload: configs });
            console.log(`📦 加载了 ${configs.length} 个配置`);
        } catch (error) {
            console.error('加载配置失败:', error);
            throw error;
        }
    }

    /**
     * 恢复主题设置
     */
    restoreTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.store.dispatch({ type: 'SET_THEME', payload: savedTheme });
    }

    /**
     * 设置全局事件监听
     */
    setupGlobalListeners() {
        // 键盘快捷键
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 防止页面刷新时丢失未保存的更改
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // 监听状态变化
        this.store.subscribe(this.handleStateChange.bind(this));
    }

    /**
     * 处理键盘事件
     */
    handleKeyDown(e) {
        // Ctrl+S - 保存
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            this.uiManager.handleSave();
        }
        
        // Ctrl+N - 新建
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.uiManager.handleNewConfig();
        }
        
        // Ctrl+Z - 撤销
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.uiManager.handleUndo();
        }
        
        // Ctrl+Y 或 Ctrl+Shift+Z - 重做
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            this.uiManager.handleRedo();
        }
        
        // Ctrl+F - 聚焦搜索
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('search-input')?.focus();
        }
        
        // ESC - 关闭模态框
        if (e.key === 'Escape') {
            this.uiManager.closeAllModals();
        }
    }

    /**
     * 处理页面卸载前
     */
    handleBeforeUnload(e) {
        const state = this.store.getState();
        if (state.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '您有未保存的更改，确定要离开吗？';
            return e.returnValue;
        }
    }

    /**
     * 处理状态变化
     */
    handleStateChange(state) {
        // 更新编辑器状态指示器
        const statusEl = document.getElementById('editor-status');
        if (statusEl) {
            if (state.hasUnsavedChanges) {
                statusEl.textContent = '未保存';
                statusEl.className = 'editor-status unsaved';
            } else {
                statusEl.textContent = '已保存';
                statusEl.className = 'editor-status saved';
            }
        }
        
        // 更新撤销/重做按钮
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        
        if (undoBtn) {
            undoBtn.disabled = !state.canUndo;
        }
        if (redoBtn) {
            redoBtn.disabled = !state.canRedo;
        }
    }
}

// 创建并导出应用实例
const app = new App();

// 当DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// 导出应用实例供调试使用
window.app = app;

export default app;

/**
 * 撤销重做服务
 * 实现完整的撤销/重做功能
 */

export class UndoRedoService {
    constructor(store) {
        this.store = store;
        this.maxHistorySize = 50;
        this.currentConfigId = null;
    }

    /**
     * 保存当前状态到历史记录
     */
    saveState(configId, currentState, action = 'edit') {
        if (!configId) return;

        // 如果切换了配置，清空历史记录
        if (this.currentConfigId !== configId) {
            this.currentConfigId = configId;
            this.clearHistory();
        }

        const historyItem = {
            configId,
            state: JSON.parse(JSON.stringify(currentState)),
            action,
            timestamp: new Date().toISOString()
        };

        this.store.dispatch({
            type: 'PUSH_HISTORY',
            payload: historyItem
        });
    }

    /**
     * 撤销操作
     */
    undo() {
        const state = this.store.getState();
        if (!state.canUndo) return null;

        const previousState = this.store.dispatch({ type: 'UNDO' });
        if (previousState) {
            return previousState.state;
        }
        return null;
    }

    /**
     * 重做操作
     */
    redo() {
        const state = this.store.getState();
        if (!state.canRedo) return null;

        const nextState = this.store.dispatch({ type: 'REDO' });
        if (nextState) {
            return nextState.state;
        }
        return null;
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        this.store.dispatch({ type: 'CLEAR_HISTORY' });
    }

    /**
     * 获取历史记录统计
     */
    getHistoryStats() {
        const state = this.store.getState();
        return {
            total: state.history.length,
            currentIndex: state.historyIndex,
            canUndo: state.canUndo,
            canRedo: state.canRedo
        };
    }

    /**
     * 创建配置快照
     */
    createSnapshot(config) {
        return {
            id: config.id,
            content: JSON.parse(JSON.stringify(config.content)),
            fileName: config.fileName,
            type: config.type,
            lastModified: config.lastModified
        };
    }

    /**
     * 比较两个配置的差异
     */
    compareConfigs(config1, config2) {
        const diff = {
            added: [],
            removed: [],
            modified: []
        };

        const obj1 = config1.content || {};
        const obj2 = config2.content || {};

        // 简单的对象比较（可以扩展为更详细的差异分析）
        const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

        allKeys.forEach(key => {
            if (!(key in obj1)) {
                diff.added.push(key);
            } else if (!(key in obj2)) {
                diff.removed.push(key);
            } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
                diff.modified.push({
                    key,
                    oldValue: obj1[key],
                    newValue: obj2[key]
                });
            }
        });

        return diff;
    }

    /**
     * 自动保存（防抖）
     */
    createAutoSave(configId, getState, delay = 1000) {
        let timeoutId;
        
        return () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const currentState = getState();
                if (currentState) {
                    this.saveState(configId, currentState, 'auto-save');
                }
            }, delay);
        };
    }
}

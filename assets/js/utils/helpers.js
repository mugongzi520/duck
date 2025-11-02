/**
 * 帮助函数和工具类
 */

import { CONSTANTS } from './constants.js';

/**
 * 生成唯一ID
 */
export function generateId(prefix = 'config') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 深拷贝对象
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    
    const clonedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    return clonedObj;
}

/**
 * 防抖函数
 */
export function debounce(func, delay = CONSTANTS.DEBOUNCE_DELAY) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 节流函数
 */
export function throttle(func, limit = 1000) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 显示通知
 */
export function showNotification(title, message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };
    
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">
                <i class="fa ${iconMap[type]}"></i>
                <span>${title}</span>
            </div>
            <button class="notification-close">
                <i class="fa fa-times"></i>
            </button>
        </div>
        <div class="notification-body">${message}</div>
    `;
    
    container.appendChild(notification);
    
    // 绑定关闭按钮
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // 自动关闭
    setTimeout(() => {
        notification.style.animation = 'slideInRight var(--transition-base) reverse';
        setTimeout(() => notification.remove(), 300);
    }, CONSTANTS.NOTIFICATION_DURATION);
}

/**
 * 显示确认对话框
 */
export function showConfirm(message, title = '确认') {
    return new Promise((resolve) => {
        const modal = createModal({
            title,
            content: `<p class="text-base text-secondary">${message}</p>`,
            buttons: [
                {
                    text: '取消',
                    className: 'btn btn-outline',
                    onClick: () => {
                        modal.close();
                        resolve(false);
                    }
                },
                {
                    text: '确认',
                    className: 'btn btn-primary',
                    onClick: () => {
                        modal.close();
                        resolve(true);
                    }
                }
            ]
        });
        modal.show();
    });
}

/**
 * 创建模态框
 */
export function createModal({ title, content, buttons = [], onClose, width = '500px' }) {
    const container = document.getElementById('modal-container');
    if (!container) return null;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.width = width;
    
    modal.innerHTML = `
        <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button class="modal-close">
                <i class="fa fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            ${content}
        </div>
        ${buttons.length > 0 ? `
            <div class="modal-footer">
                ${buttons.map(btn => `
                    <button class="${btn.className}" data-action="${btn.text}">
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    overlay.appendChild(modal);
    container.appendChild(overlay);
    
    // 绑定关闭按钮
    const closeBtn = modal.querySelector('.modal-close');
    const close = () => {
        overlay.remove();
        if (onClose) onClose();
    };
    
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
    
    // 绑定按钮事件
    buttons.forEach(btn => {
        const btnEl = modal.querySelector(`[data-action="${btn.text}"]`);
        if (btnEl && btn.onClick) {
            btnEl.addEventListener('click', btn.onClick);
        }
    });
    
    return {
        element: overlay,
        show: () => container.appendChild(overlay),
        close
    };
}

/**
 * 格式化日期
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 下载文件
 */
export function downloadFile(content, fileName, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 读取文件内容
 */
export function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

/**
 * 验证JSON
 */
export function validateJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    }
}

/**
 * 从剪贴板读取
 */
export async function readFromClipboard() {
    try {
        return await navigator.clipboard.readText();
    } catch (err) {
        throw new Error('无法读取剪贴板内容');
    }
}

/**
 * 转义HTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 高亮搜索词
 */
export function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 检查是否为空对象
 */
export function isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * 合并对象（深度合并）
 */
export function mergeDeep(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    output[key] = source[key];
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
}

/**
 * 检查是否为对象
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * 获取对象中的值（支持路径）
 */
export function getValueByPath(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * 设置对象中的值（支持路径）
 */
export function setValueByPath(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
}

/**
 * 属性建议系统
 * 为配置生成器提供智能属性输入建议和验证
 */
class AttributeSuggestionSystem {
    constructor() {
        this.suggestions = this.initializeSuggestions();
        this.activeSuggestion = null;
        this.selectedSuggestionIndex = -1;
    }

    /**
     * 初始化属性建议数据
     */
    initializeSuggestions() {
        return {
            // 武器属性建议
            weapon: {
                Damage: {
                    min: 0.05,
                    max: 0.50,
                    recommended: [0.10, 0.15, 0.20, 0.25],
                    description: '武器基础伤害提升',
                    unit: '%',
                    examples: [
                        { value: 0.10, desc: '小幅伤害提升' },
                        { value: 0.15, desc: '适中伤害提升' },
                        { value: 0.25, desc: '显著伤害提升' },
                        { value: 0.50, desc: '极大伤害提升' }
                    ]
                },
                CritRate: {
                    min: 0.02,
                    max: 0.30,
                    recommended: [0.05, 0.10, 0.15, 0.20],
                    description: '暴击率提升',
                    unit: '%',
                    examples: [
                        { value: 0.05, desc: '小幅暴击率提升' },
                        { value: 0.10, desc: '适中暴击率提升' },
                        { value: 0.15, desc: '较高暴击率提升' },
                        { value: 0.20, desc: '高暴击率提升' }
                    ]
                },
                CritDamageFactor: {
                    min: 0.10,
                    max: 1.00,
                    recommended: [0.25, 0.50, 0.75, 1.00],
                    description: '暴击伤害倍率提升',
                    unit: '倍',
                    examples: [
                        { value: 0.25, desc: '小幅暴击伤害提升' },
                        { value: 0.50, desc: '适中暴击伤害提升' },
                        { value: 0.75, desc: '较高暴击伤害提升' },
                        { value: 1.00, desc: '翻倍暴击伤害' }
                    ]
                },
                ADSTime: {
                    min: -0.50,
                    max: 0.50,
                    recommended: [-0.30, -0.20, -0.10, 0.10, 0.20],
                    description: '瞄准时间调整',
                    unit: '秒',
                    examples: [
                        { value: -0.30, desc: '极快瞄准速度' },
                        { value: -0.20, desc: '快速瞄准' },
                        { value: -0.10, desc: '较快瞄准' },
                        { value: 0.10, desc: '稍慢瞄准' },
                        { value: 0.20, desc: '较慢瞄准' }
                    ]
                },
                ADSAimDistanceFactor: {
                    min: 0.05,
                    max: 0.50,
                    recommended: [0.10, 0.15, 0.20, 0.30],
                    description: '瞄准距离因子',
                    unit: '%',
                    examples: [
                        { value: 0.10, desc: '小幅瞄准距离提升' },
                        { value: 0.20, desc: '适中瞄准距离提升' },
                        { value: 0.30, desc: '较大瞄准距离提升' }
                    ]
                },
                ScatterFactorADS: {
                    min: -0.50,
                    max: 0.50,
                    recommended: [-0.30, -0.20, -0.10, 0.10, 0.20],
                    description: '瞄准散射因子',
                    unit: '',
                    examples: [
                        { value: -0.30, desc: '显著提升瞄准精度' },
                        { value: -0.20, desc: '提升瞄准精度' },
                        { value: -0.10, desc: '小幅提升精度' },
                        { value: 0.10, desc: '轻微降低精度' },
                        { value: 0.20, desc: '降低精度' }
                    ]
                },
                MaxScatterADS: {
                    min: -0.30,
                    max: 0.30,
                    recommended: [-0.20, -0.10, 0.05, 0.10],
                    description: '最大瞄准散布',
                    unit: '',
                    examples: [
                        { value: -0.20, desc: '大幅减少散布' },
                        { value: -0.10, desc: '减少散布' },
                        { value: 0.05, desc: '轻微增加散布' },
                        { value: 0.10, desc: '增加散布' }
                    ]
                },
                ScatterRecoverADS: {
                    min: -0.30,
                    max: 0.30,
                    recommended: [-0.20, -0.10, 0.10, 0.20],
                    description: '瞄准散布恢复',
                    unit: '',
                    examples: [
                        { value: -0.20, desc: '减慢散布恢复' },
                        { value: -0.10, desc: '稍慢散布恢复' },
                        { value: 0.10, desc: '加快散布恢复' },
                        { value: 0.20, desc: '大幅加快恢复' }
                    ]
                },
                AttackSpeed: {
                    min: 0.05,
                    max: 0.50,
                    recommended: [0.10, 0.15, 0.20, 0.30],
                    description: '攻击速度提升',
                    unit: '%',
                    examples: [
                        { value: 0.10, desc: '小幅攻击速度提升' },
                        { value: 0.15, desc: '适中攻击速度提升' },
                        { value: 0.20, desc: '较快攻击速度' },
                        { value: 0.30, desc: '快速攻击' }
                    ]
                },
                BulletSpeed: {
                    min: 0.05,
                    max: 0.50,
                    recommended: [0.10, 0.15, 0.20, 0.30],
                    description: '子弹速度提升',
                    unit: '%',
                    examples: [
                        { value: 0.10, desc: '小幅弹速提升' },
                        { value: 0.15, desc: '适中弹速提升' },
                        { value: 0.20, desc: '较快弹速' },
                        { value: 0.30, desc: '快速弹速' }
                    ]
                },
                ArmorPiercing: {
                    min: 0.05,
                    max: 0.50,
                    recommended: [0.10, 0.15, 0.20, 0.30],
                    description: '护甲穿透提升',
                    unit: '%',
                    examples: [
                        { value: 0.10, desc: '小幅穿甲提升' },
                        { value: 0.15, desc: '适中穿甲提升' },
                        { value: 0.20, desc: '较高穿甲提升' },
                        { value: 0.30, desc: '高穿甲提升' }
                    ]
                }
            },
            
            // 人物属性建议
            character: {
                Capacity: {
                    min: 1,
                    max: 50,
                    recommended: [5, 10, 15, 20],
                    description: '背包容量增加',
                    unit: '格',
                    examples: [
                        { value: 5, desc: '小幅容量提升' },
                        { value: 10, desc: '适中容量提升' },
                        { value: 15, desc: '较大容量提升' },
                        { value: 20, desc: '大幅容量提升' }
                    ]
                },
                MoveSpeedMultiplier: {
                    min: 0.05,
                    max: 0.30,
                    recommended: [0.05, 0.10, 0.15, 0.20],
                    description: '移动速度倍率',
                    unit: '%',
                    examples: [
                        { value: 0.05, desc: '小幅移动速度提升' },
                        { value: 0.10, desc: '适中移动速度提升' },
                        { value: 0.15, desc: '较快移动速度' },
                        { value: 0.20, desc: '快速移动' }
                    ]
                },
                MaxHealth: {
                    min: 10,
                    max: 100,
                    recommended: [20, 30, 50, 75],
                    description: '最大生命值增加',
                    unit: '点',
                    examples: [
                        { value: 20, desc: '小幅生命值提升' },
                        { value: 30, desc: '适中生命值提升' },
                        { value: 50, desc: '较大生命值提升' },
                        { value: 75, desc: '大幅生命值提升' }
                    ]
                },
                MaxStamina: {
                    min: 10,
                    max: 100,
                    recommended: [20, 30, 50, 75],
                    description: '最大耐力值增加',
                    unit: '点',
                    examples: [
                        { value: 20, desc: '小幅耐力提升' },
                        { value: 30, desc: '适中耐力提升' },
                        { value: 50, desc: '较大耐力提升' },
                        { value: 75, desc: '大幅耐力提升' }
                    ]
                }
            }
        };
    }

    /**
     * 获取属性建议
     */
    getSuggestion(attributeName, category = 'weapon') {
        const categorySuggestions = this.suggestions[category];
        if (!categorySuggestions) return null;
        
        return categorySuggestions[attributeName] || null;
    }

    /**
     * 验证属性值
     */
    validateValue(attributeName, value, category = 'weapon') {
        const suggestion = this.getSuggestion(attributeName, category);
        if (!suggestion) return { valid: true, status: 'unknown' };

        const numValue = parseFloat(value);
        if (isNaN(numValue)) return { valid: false, status: 'invalid', message: '必须是数字' };

        if (numValue < suggestion.min) {
            return { 
                valid: false, 
                status: 'too-low', 
                message: `值不能小于 ${suggestion.min}` 
            };
        }

        if (numValue > suggestion.max) {
            return { 
                valid: false, 
                status: 'too-high', 
                message: `值不能大于 ${suggestion.max}` 
            };
        }

        // 检查是否在推荐范围内
        const isRecommended = suggestion.recommended.some(rec => 
            Math.abs(rec - numValue) < 0.01
        );

        return {
            valid: true,
            status: isRecommended ? 'recommended' : 'valid',
            message: isRecommended ? '推荐值' : '有效值'
        };
    }

    /**
     * 创建建议下拉框
     */
    createSuggestionDropdown(inputElement, attributeName, category = 'weapon') {
        const suggestion = this.getSuggestion(attributeName, category);
        if (!suggestion) return;

        // 移除现有的建议框
        this.removeSuggestionDropdown();

        // 创建建议框容器
        const dropdown = document.createElement('div');
        dropdown.className = 'attr-suggestion slide-in';
        dropdown.style.position = 'absolute';
        dropdown.style.top = '100%';
        dropdown.style.left = '0';
        dropdown.style.right = '0';
        dropdown.style.zIndex = '1000';

        // 添加推荐值
        suggestion.examples.forEach((example, index) => {
            const item = document.createElement('div');
            item.className = 'attr-suggestion-item';
            item.innerHTML = `
                <span class="value">${example.value}${suggestion.unit || ''}</span>
                <span class="description">${example.desc}</span>
            `;
            
            item.addEventListener('click', () => {
                inputElement.value = example.value;
                this.removeSuggestionDropdown();
                this.updateRangeIndicator(inputElement, attributeName, category);
                inputElement.dispatchEvent(new Event('input'));
            });

            item.addEventListener('mouseenter', () => {
                this.selectedSuggestionIndex = index;
                this.updateSuggestionSelection();
            });

            dropdown.appendChild(item);
        });

        // 插入到输入框后面
        inputElement.parentNode.style.position = 'relative';
        inputElement.parentNode.appendChild(dropdown);
        
        this.activeSuggestion = dropdown;
        this.selectedSuggestionIndex = -1;

        // 添加键盘导航
        this.setupKeyboardNavigation(inputElement);
    }

    /**
     * 移除建议下拉框
     */
    removeSuggestionDropdown() {
        if (this.activeSuggestion) {
            this.activeSuggestion.remove();
            this.activeSuggestion = null;
            this.selectedSuggestionIndex = -1;
        }
    }

    /**
     * 设置键盘导航
     */
    setupKeyboardNavigation(inputElement) {
        const keyHandler = (e) => {
            if (!this.activeSuggestion) return;

            const items = this.activeSuggestion.querySelectorAll('.attr-suggestion-item');
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedSuggestionIndex = Math.min(
                        this.selectedSuggestionIndex + 1, 
                        items.length - 1
                    );
                    this.updateSuggestionSelection();
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedSuggestionIndex = Math.max(
                        this.selectedSuggestionIndex - 1, 
                        -1
                    );
                    this.updateSuggestionSelection();
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedSuggestionIndex >= 0) {
                        const selectedItem = items[this.selectedSuggestionIndex];
                        const valueText = selectedItem.querySelector('.value').textContent;
                        const value = parseFloat(valueText);
                        if (!isNaN(value)) {
                            inputElement.value = value;
                            this.removeSuggestionDropdown();
                            this.updateRangeIndicator(inputElement, inputElement.dataset.attribute, inputElement.dataset.category);
                            inputElement.dispatchEvent(new Event('input'));
                        }
                    }
                    break;
                    
                case 'Escape':
                    this.removeSuggestionDropdown();
                    break;
            }
        };

        inputElement.addEventListener('keydown', keyHandler);
        
        // 存储事件处理器以便后续移除
        inputElement._suggestionKeyHandler = keyHandler;
    }

    /**
     * 更新建议选择状态
     */
    updateSuggestionSelection() {
        if (!this.activeSuggestion) return;

        const items = this.activeSuggestion.querySelectorAll('.attr-suggestion-item');
        items.forEach((item, index) => {
            if (index === this.selectedSuggestionIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * 更新范围指示器
     */
    updateRangeIndicator(inputElement, attributeName, category = 'weapon') {
        // 移除现有的指示器
        const existingIndicator = inputElement.parentNode.querySelector('.attr-range-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }

    /**
     * 为属性输入框添加智能建议
     */
    enhanceAttributeInput(inputElement, attributeName, category = 'weapon') {
        // 存储属性信息
        inputElement.dataset.attribute = attributeName;
        inputElement.dataset.category = category;

        // 添加样式类
        inputElement.classList.add('attr-input');

        // 聚焦时显示建议
        inputElement.addEventListener('focus', () => {
            this.createSuggestionDropdown(inputElement, attributeName, category);
        });

        // 输入时更新建议
        inputElement.addEventListener('input', () => {
            this.updateRangeIndicator(inputElement, attributeName, category);
        });

        // 失去焦点时延迟隐藏建议
        inputElement.addEventListener('blur', () => {
            setTimeout(() => {
                this.removeSuggestionDropdown();
            }, 200);
        });

        // 初始化范围指示器
        if (inputElement.value) {
            this.updateRangeIndicator(inputElement, attributeName, category);
        }
    }

    /**
     * 批量增强属性输入框
     */
    enhanceAllAttributeInputs(containerSelector = '.specific-property') {
        const inputs = document.querySelectorAll(containerSelector);
        inputs.forEach(input => {
            const attributeName = input.dataset.key;
            const propType = input.dataset.propType || 'type';
            const category = propType === 'mshook' ? 'character' : 'weapon';
            
            if (attributeName) {
                this.enhanceAttributeInput(input, attributeName, category);
            }
        });
    }

    /**
     * 创建属性帮助提示
     */
    createHelpTooltip(attributeName, category = 'weapon') {
        const suggestion = this.getSuggestion(attributeName, category);
        if (!suggestion) return '';

        return `
            <div class="smart-hint">
                <div class="smart-hint-tooltip">
                    <strong>${suggestion.description}</strong><br>
                    范围: ${suggestion.min} - ${suggestion.max}${suggestion.unit || ''}<br>
                    推荐值: ${suggestion.recommended.join(', ')}${suggestion.unit || ''}
                </div>
            </div>
        `;
    }

    /**
     * 获取属性配置摘要
     */
    getAttributeSummary(configData, category = 'weapon') {
        const summary = {
            total: 0,
            recommended: 0,
            valid: 0,
            invalid: 0,
            details: []
        };

        const propsKey = category === 'weapon' ? 'mshook' : 'mshook';
        const props = configData[propsKey] || {};

        Object.entries(props).forEach(([key, value]) => {
            const validation = this.validateValue(key, value, category);
            summary.total++;
            
            if (validation.status === 'recommended') {
                summary.recommended++;
            } else if (validation.status === 'valid') {
                summary.valid++;
            } else {
                summary.invalid++;
            }

            summary.details.push({
                attribute: key,
                value: value,
                status: validation.status,
                message: validation.message
            });
        });

        return summary;
    }
}

// 全局实例
window.attributeSuggestionSystem = new AttributeSuggestionSystem();

// 添加initialize方法到实例
window.attributeSuggestionSystem.initialize = function() {
    return initializeAttributeSuggestions();
};

// 初始化函数
function initializeAttributeSuggestions() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.attributeSuggestionSystem.enhanceAllAttributeInputs();
        });
    } else {
        window.attributeSuggestionSystem.enhanceAllAttributeInputs();
    }

    // 监听动态添加的属性输入框
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const inputs = node.querySelectorAll ? 
                            node.querySelectorAll('.specific-property') : [];
                        inputs.forEach(input => {
                            const attributeName = input.dataset.key;
                            const propType = input.dataset.propType || 'type';
                            const category = propType === 'mshook' ? 'character' : 'weapon';
                            
                            if (attributeName) {
                                window.attributeSuggestionSystem.enhanceAttributeInput(input, attributeName, category);
                            }
                        });
                    }
                });
            }
        });
    });

    // 观察特定属性容器
    const specificPropsContainer = document.getElementById('specific-properties');
    if (specificPropsContainer) {
        observer.observe(specificPropsContainer, {
            childList: true,
            subtree: true
        });
    }
}

// 导出初始化函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AttributeSuggestionSystem, initializeAttributeSuggestions };
}

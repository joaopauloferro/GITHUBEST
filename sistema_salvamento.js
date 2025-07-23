// ========================================
// SISTEMA COMPLETO DE SALVAMENTO - ELISIO V2
// ========================================

class CharacterDataManager {
    constructor() {
        this.storageKey = 'elisio-character-v2';
        this.autoSaveInterval = null;
        this.hasChanges = false;
        this.lastSaveTime = null;
        
        this.init();
    }

    init() {
        this.createSaveInterface();
        this.bindEventListeners();
        this.loadFromStorage();
        this.startAutoSave();
        this.trackChanges();
    }

    // ========================================
    // INTERFACE DO SISTEMA DE SALVAMENTO
    // ========================================
    
    createSaveInterface() {
        // Criar container para controles de salvamento
        const saveContainer = document.createElement('div');
        saveContainer.className = 'save-container';
        saveContainer.innerHTML = `
            <div class="save-status">
                <span id="save-status-text">Nenhuma alteração</span>
                <span id="last-save-time"></span>
            </div>
            <div class="save-controls">
                <button class="btn btn-save" id="manual-save">
                    <i class="icon-save"></i> Salvar Agora
                </button>
                <button class="btn btn-export" id="export-json">
                    <i class="icon-download"></i> Exportar JSON
                </button>
                <button class="btn btn-import" id="import-json">
                    <i class="icon-upload"></i> Importar JSON
                </button>
                <button class="btn btn-backup" id="create-backup">
                    <i class="icon-backup"></i> Backup Arquivo
                </button>
            </div>
            <input type="file" id="file-import" accept=".json" style="display: none;">
        `;

        // Inserir antes dos botões existentes
        const existingButtons = document.querySelector('.button-group');
        existingButtons.parentNode.insertBefore(saveContainer, existingButtons);

        // Adicionar CSS
        this.addSaveCSS();
    }

    addSaveCSS() {
        const css = `
            .save-container {
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border: 2px solid var(--secondary-color);
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            }

            .save-status {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding: 10px;
                background: white;
                border-radius: 5px;
                border-left: 4px solid var(--info-color);
            }

            .save-status.unsaved {
                border-left-color: var(--warning-color);
                background: #fff3cd;
            }

            .save-status.saved {
                border-left-color: var(--success-color);
                background: #d4edda;
            }

            .save-status.error {
                border-left-color: var(--danger-color);
                background: #f8d7da;
            }

            #save-status-text {
                font-weight: 600;
                color: var(--dark-color);
            }

            #last-save-time {
                font-size: 0.9rem;
                color: #666;
                font-style: italic;
            }

            .save-controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
            }

            .btn-export {
                background-color: var(--info-color);
            }

            .btn-import {
                background-color: var(--warning-color);
            }

            .btn-backup {
                background-color: var(--secondary-color);
            }

            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 1000;
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                max-width: 300px;
            }

            .notification.show {
                transform: translateX(0);
            }

            .notification.success { background-color: var(--success-color); }
            .notification.error { background-color: var(--danger-color); }
            .notification.warning { background-color: var(--warning-color); }
            .notification.info { background-color: var(--info-color); }

            .progress-bar {
                width: 100%;
                height: 4px;
                background-color: rgba(255, 255, 255, 0.3);
                border-radius: 2px;
                margin-top: 10px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background-color: white;
                width: 0%;
                transition: width 0.3s ease;
            }

            @media (max-width: 768px) {
                .save-controls {
                    grid-template-columns: 1fr;
                }
                
                .notification {
                    left: 10px;
                    right: 10px;
                    max-width: none;
                    transform: translateY(-100%);
                }
                
                .notification.show {
                    transform: translateY(0);
                }
            }
        `;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ========================================
    // COLETA E ORGANIZAÇÃO DE DADOS
    // ========================================
    
    gatherAllData() {
        const data = {
            metadata: {
                version: '2.0',
                created: new Date().toISOString(),
                system: 'Elisio V2',
                characterId: this.generateCharacterId()
            },
            basicInfo: this.gatherBasicInfo(),
            attributes: this.gatherAttributes(),
            skills: this.gatherSkills(),
            healthMana: this.gatherHealthMana(),
            defenses: this.gatherDefenses(),
            origin: this.gatherOrigin(),
            equipment: this.gatherEquipment(),
            abilities: this.gatherAbilities(),
            notes: this.gatherNotes(),
            customFields: this.gatherCustomFields()
        };

        return data;
    }

    gatherBasicInfo() {
        return {
            characterName: document.getElementById('character-name')?.value || '',
            playerName: document.getElementById('player-name')?.value || '',
            race: document.getElementById('character-race')?.value || '',
            characterClass: document.getElementById('character-class')?.value || '',
            level: parseInt(document.getElementById('character-level')?.value) || 1,
            experience: parseInt(document.getElementById('character-xp')?.value) || 0,
            characterImage: this.getCharacterImageData()
        };
    }

    gatherAttributes() {
        const attributes = {};
        const attributeNames = ['strength', 'combat', 'agility', 'resistance', 'intellect', 'charisma', 'magic', 'mana'];
        
        attributeNames.forEach(attr => {
            const valueElement = document.getElementById(`${attr}-value`);
            if (valueElement) {
                attributes[attr] = parseInt(valueElement.textContent) || 1;
            }
        });

        return attributes;
    }

    gatherSkills() {
        const skills = {};
        const skillInputs = document.querySelectorAll('.skill-value');
        
        skillInputs.forEach((input, index) => {
            const skillItem = input.closest('.skill-item');
            if (skillItem) {
                const skillName = skillItem.querySelector('.skill-name')?.textContent || `skill_${index}`;
                const attributeCard = skillItem.closest('.attribute-card');
                const attributeName = attributeCard?.querySelector('.attribute-name')?.textContent || 'unknown';
                
                skills[`${attributeName}_${skillName}`.replace(/\s+/g, '_')] = {
                    name: skillName,
                    attribute: attributeName,
                    value: parseInt(input.value) || 0,
                    index: index
                };
            }
        });

        return skills;
    }

    gatherHealthMana() {
        return {
            hp: {
                max: parseInt(document.getElementById('hp-max')?.value) || 0,
                current: parseInt(document.getElementById('hp-current')?.value) || 0
            },
            mp: {
                max: parseInt(document.getElementById('mp-max')?.value) || 0,
                current: parseInt(document.getElementById('mp-current')?.value) || 0
            }
        };
    }

    gatherDefenses() {
        return {
            defenseBase: document.getElementById('defense-value')?.textContent || '10',
            dodge: document.getElementById('dodge-value')?.textContent || '10',
            counter: document.getElementById('counter-value')?.textContent || '10',
            block: document.getElementById('block-value')?.textContent || '0'
        };
    }

    gatherOrigin() {
        return {
            origin: document.getElementById('character-origin')?.value || '',
            originPath: document.getElementById('origin-path')?.value || '',
            backstory: document.getElementById('character-backstory')?.value || ''
        };
    }

    gatherEquipment() {
        return {
            weapons: document.getElementById('weapons')?.value || '',
            armor: document.getElementById('armor')?.value || '',
            items: document.getElementById('items')?.value || '',
            magicItems: document.getElementById('magic-items')?.value || '',
            carryWeight: document.getElementById('carry-weight')?.value || ''
        };
    }

    gatherAbilities() {
        return {
            classAbilities: document.getElementById('class-abilities')?.value || '',
            subclassAbilities: document.getElementById('subclass-abilities')?.value || '',
            customAbility: document.getElementById('custom-ability')?.value || '',
            spells: document.getElementById('spells')?.value || ''
        };
    }

    gatherNotes() {
        return {
            notes: document.getElementById('notes')?.value || ''
        };
    }

    gatherCustomFields() {
        const custom = {};
        // Capturar qualquer campo adicional que possa ter sido adicionado
        document.querySelectorAll('input[data-custom], textarea[data-custom], select[data-custom]').forEach(element => {
            if (element.id) {
                custom[element.id] = element.value;
            }
        });
        return custom;
    }

    getCharacterImageData() {
        const img = document.querySelector('.character-image img');
        if (img && img.src && !img.src.includes('data:')) {
            return { src: img.src, type: 'url' };
        } else if (img && img.src && img.src.includes('data:')) {
            return { src: img.src, type: 'base64' };
        }
        return null;
    }

    generateCharacterId() {
        const characterName = document.getElementById('character-name')?.value || 'character';
        const timestamp = Date.now();
        return `${characterName.replace(/\s+/g, '_').toLowerCase()}_${timestamp}`;
    }

    // ========================================
    // RESTAURAÇÃO DE DADOS
    // ========================================
    
    populateAllData(data) {
        try {
            if (data.basicInfo) this.populateBasicInfo(data.basicInfo);
            if (data.attributes) this.populateAttributes(data.attributes);
            if (data.skills) this.populateSkills(data.skills);
            if (data.healthMana) this.populateHealthMana(data.healthMana);
            if (data.origin) this.populateOrigin(data.origin);
            if (data.equipment) this.populateEquipment(data.equipment);
            if (data.abilities) this.populateAbilities(data.abilities);
            if (data.notes) this.populateNotes(data.notes);
            if (data.customFields) this.populateCustomFields(data.customFields);

            this.showNotification('Dados carregados com sucesso!', 'success');
            this.markAsSaved();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showNotification('Erro ao carregar alguns dados', 'warning');
        }
    }

    populateBasicInfo(basicInfo) {
        Object.keys(basicInfo).forEach(key => {
            const element = document.getElementById(key === 'characterName' ? 'character-name' : 
                                                  key === 'playerName' ? 'player-name' :
                                                  key === 'characterClass' ? 'character-class' :
                                                  key === 'characterLevel' ? 'character-level' :
                                                  key === 'characterXp' ? 'character-xp' :
                                                  `character-${key}`);
            if (element && key !== 'characterImage') {
                element.value = basicInfo[key];
            }
        });

        // Restaurar imagem
        if (basicInfo.characterImage) {
            this.restoreCharacterImage(basicInfo.characterImage);
        }
    }

    populateAttributes(attributes) {
        Object.keys(attributes).forEach(attr => {
            const valueElement = document.getElementById(`${attr}-value`);
            if (valueElement) {
                valueElement.textContent = attributes[attr];
            }
        });
    }

    populateSkills(skills) {
        Object.keys(skills).forEach(skillKey => {
            const skill = skills[skillKey];
            if (skill.index !== undefined) {
                const skillInputs = document.querySelectorAll('.skill-value');
                if (skillInputs[skill.index]) {
                    skillInputs[skill.index].value = skill.value;
                }
            }
        });
    }

    populateHealthMana(healthMana) {
        if (healthMana.hp) {
            if (document.getElementById('hp-max')) document.getElementById('hp-max').value = healthMana.hp.max;
            if (document.getElementById('hp-current')) document.getElementById('hp-current').value = healthMana.hp.current;
        }
        if (healthMana.mp) {
            if (document.getElementById('mp-max')) document.getElementById('mp-max').value = healthMana.mp.max;
            if (document.getElementById('mp-current')) document.getElementById('mp-current').value = healthMana.mp.current;
        }
    }

    populateOrigin(origin) {
        Object.keys(origin).forEach(key => {
            const elementId = key === 'originPath' ? 'origin-path' : `character-${key}`;
            const element = document.getElementById(elementId);
            if (element) {
                element.value = origin[key];
            }
        });
    }

    populateEquipment(equipment) {
        Object.keys(equipment).forEach(key => {
            const elementId = key === 'carryWeight' ? 'carry-weight' : 
                             key === 'magicItems' ? 'magic-items' : key;
            const element = document.getElementById(elementId);
            if (element) {
                element.value = equipment[key];
            }
        });
    }

    populateAbilities(abilities) {
        Object.keys(abilities).forEach(key => {
            const elementId = key === 'classAbilities' ? 'class-abilities' :
                             key === 'subclassAbilities' ? 'subclass-abilities' :
                             key === 'customAbility' ? 'custom-ability' : key;
            const element = document.getElementById(elementId);
            if (element) {
                element.value = abilities[key];
            }
        });
    }

    populateNotes(notes) {
        if (document.getElementById('notes')) {
            document.getElementById('notes').value = notes.notes;
        }
    }

    populateCustomFields(customFields) {
        Object.keys(customFields).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = customFields[key];
            }
        });
    }

    restoreCharacterImage(imageData) {
        if (imageData && imageData.src) {
            const img = document.createElement('img');
            img.src = imageData.src;
            img.onload = () => {
                const characterImageContainer = document.querySelector('.character-image');
                characterImageContainer.innerHTML = '';
                characterImageContainer.appendChild(img);
            };
        }
    }

    // ========================================
    // SISTEMA DE PERSISTÊNCIA
    // ========================================
    
    saveToLocalStorage() {
        try {
            const data = this.gatherAllData();
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            this.lastSaveTime = new Date();
            this.markAsSaved();
            return true;
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
            this.showNotification('Erro ao salvar dados localmente', 'error');
            return false;
        }
    }

    loadFromStorage() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.populateAllData(data);
                this.lastSaveTime = new Date(data.metadata?.created || Date.now());
                return true;
            }
        } catch (error) {
            console.error('Erro ao carregar do localStorage:', error);
            this.showNotification('Erro ao carregar dados salvos', 'error');
        }
        return false;
    }

    exportToJSON() {
        try {
            const data = this.gatherAllData();
            const characterName = data.basicInfo.characterName || 'character';
            const filename = `${characterName.replace(/\s+/g, '_')}_elisio_v2.json`;
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification(`Ficha exportada como ${filename}`, 'success');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            this.showNotification('Erro ao exportar ficha', 'error');
        }
    }

    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Nenhum arquivo selecionado'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validar estrutura básica
                    if (!data.metadata || !data.basicInfo) {
                        throw new Error('Arquivo não é uma ficha válida do Elisio V2');
                    }

                    this.populateAllData(data);
                    this.saveToLocalStorage(); // Salvar após importar
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    }

    createBackupFile() {
        try {
            const data = this.gatherAllData();
            const backupData = {
                ...data,
                backup: {
                    created: new Date().toISOString(),
                    browserInfo: navigator.userAgent,
                    url: window.location.href
                }
            };

            const characterName = data.basicInfo.characterName || 'character';
            const date = new Date().toISOString().split('T')[0];
            const filename = `backup_${characterName.replace(/\s+/g, '_')}_${date}.json`;
            
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification(`Backup criado: ${filename}`, 'success');
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            this.showNotification('Erro ao criar backup', 'error');
        }
    }

    // ========================================
    // CONTROLE DE EVENTOS E AUTO-SAVE
    // ========================================
    
    bindEventListeners() {
        // Botões principais
        document.getElementById('manual-save')?.addEventListener('click', () => {
            this.saveToLocalStorage();
            this.showNotification('Ficha salva manualmente!', 'success');
        });

        document.getElementById('export-json')?.addEventListener('click', () => {
            this.exportToJSON();
        });

        document.getElementById('import-json')?.addEventListener('click', () => {
            document.getElementById('file-import').click();
        });

        document.getElementById('create-backup')?.addEventListener('click', () => {
            this.createBackupFile();
        });

        // Import de arquivo
        document.getElementById('file-import')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await this.importFromJSON(file);
                    this.showNotification('Ficha importada com sucesso!', 'success');
                } catch (error) {
                    console.error('Erro na importação:', error);
                    this.showNotification(`Erro: ${error.message}`, 'error');
                }
                e.target.value = ''; // Limpar input
            }
        });

        // Salvar antes de sair da página
        window.addEventListener('beforeunload', (e) => {
            if (this.hasChanges) {
                this.saveToLocalStorage();
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    trackChanges() {
        // Observar mudanças em todos os inputs
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.markAsChanged());
            input.addEventListener('change', () => this.markAsChanged());
        });

        // Observar mudanças na imagem
        const imageInput = document.getElementById('character-image');
        if (imageInput) {
            imageInput.addEventListener('change', () => this.markAsChanged());
        }
    }

    startAutoSave() {
        // Auto-save a cada 2 minutos
        this.autoSaveInterval = setInterval(() => {
            if (this.hasChanges) {
                this.saveToLocalStorage();
                this.showNotification('Auto-save realizado', 'info', 2000);
            }
        }, 120000); // 2 minutos
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    markAsChanged() {
        this.hasChanges = true;
        this.updateSaveStatus('unsaved', 'Alterações não salvas');
    }

    markAsSaved() {
        this.hasChanges = false;
        const timeStr = this.lastSaveTime ? this.formatTime(this.lastSaveTime) : '';
        this.updateSaveStatus('saved', 'Todas as alterações salvas', timeStr);
    }

    updateSaveStatus(type, message, time = '') {
        const statusElement = document.getElementById('save-status-text');
        const timeElement = document.getElementById('last-save-time');
        const container = document.querySelector('.save-status');

        if (statusElement) statusElement.textContent = message;
        if (timeElement) timeElement.textContent = time;
        if (container) {
            container.className = `save-status ${type}`;
        }
    }

    formatTime(date) {
        return `Último save: ${date.toLocaleTimeString()}`;
    }

    // ========================================
    // SISTEMA DE NOTIFICAÇÕES
    // ========================================
    
    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div>${message}</div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 100);

        // Animar barra de progresso
        const progressFill = notification.querySelector('.progress-fill');
        setTimeout(() => {
            progressFill.style.width = '100%';
            progressFill.style.transition = `width ${duration}ms linear`;
        }, 200);

        // Remover notificação
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);

        // Permitir clique para fechar
        notification.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    // ========================================
    // MÉTODOS UTILITÁRIOS
    // ========================================
    
    clearAllData() {
        if (confirm('⚠️ ATENÇÃO: Esta ação irá limpar TODOS os dados da ficha!\n\nDeseja criar um backup antes de continuar?')) {
            this.createBackupFile();
            setTimeout(() => {
                if (confirm('Backup criado! Confirma a limpeza de todos os dados?')) {
                    localStorage.removeItem(this.storageKey);
                    location.reload();
                }
            }, 1000);
        }
    }

    validateData(data) {
        const requiredFields = ['metadata', 'basicInfo'];
        for (let field of requiredFields) {
            if (!data[field]) {
                throw new Error(`Campo obrigatório ausente: ${field}`);
            }
        }
        return true;
    }

    getDataSize() {
        const data = this.gatherAllData();
        const size = new Blob([JSON.stringify(data)]).size;
        return {
            bytes: size,
            kb: (size / 1024).toFixed(2),
            readable: size > 1024 ? `${(size / 1024).toFixed(2)} KB` : `${size} bytes`
        };
    }
}

// ========================================
// INICIALIZAÇÃO
// ========================================

let characterDataManager;

document.addEventListener('DOMContentLoaded', () => {
    characterDataManager = new CharacterDataManager();
    
    // Substituir funcionalidade dos botões originais
    const originalSaveBtn = document.querySelector('.btn-save:not(#manual-save)');
    const originalResetBtn = document.querySelector('.btn-reset');
    
    if (originalSaveBtn) {
        originalSaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            characterDataManager.saveToLocalStorage();
            characterDataManager.showNotification('Ficha salva com sucesso!', 'success');
        });
    }
    
    if (originalResetBtn) {
        originalResetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            characterDataManager.clearAllData();
        });
    }

    // Expor globalmente para debug
    window.characterDataManager = characterDataManager;
    
    console.log('💾 Sistema de salvamento Elisio V2 inicializado!');
    console.log('📊 Tamanho atual dos dados:', characterDataManager.getDataSize().readable);
});

// Cleanup na saída
window.addEventListener('beforeunload', () => {
    if (characterDataManager) {
        characterDataManager.stopAutoSave();
    }
});
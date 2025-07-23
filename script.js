// Classe para gerenciar a ficha de personagem
class CharacterSheet {
    constructor() {
        this.characterData = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedCharacters();
        this.calculateDerivedStats();
        this.loadAutoSavedData();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Upload de imagem
        document.getElementById('character-image').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Cálculos automáticos
        document.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('input', () => {
                this.calculateDerivedStats();
                this.autoSave();
            });
        });

        // Botões de ação
        document.getElementById('save-character').addEventListener('click', () => {
            this.saveCharacter();
        });

        document.getElementById('load-character').addEventListener('click', () => {
            this.loadCharacter();
        });

        document.getElementById('delete-character').addEventListener('click', () => {
            this.deleteCharacter();
        });

        document.getElementById('export-character').addEventListener('click', () => {
            this.exportCharacter();
        });

        document.getElementById('import-character').addEventListener('click', () => {
            this.importCharacter();
        });

        document.querySelector('.btn-reset').addEventListener('click', () => {
            this.resetCharacter();
        });

        document.querySelector('.btn-print').addEventListener('click', () => {
            this.printCharacter();
        });

        // Import file handler
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });
    }

    // Carregar imagem do personagem
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                const characterImage = document.querySelector('.character-image');
                
                // Limpar conteúdo anterior
                const fileInput = characterImage.querySelector('input[type="file"]');
                
                characterImage.innerHTML = '';
                characterImage.appendChild(img);
                characterImage.appendChild(fileInput);
                
                // Salvar imagem em base64
                this.characterData.image = e.target.result;
                this.autoSave();
            };
            reader.readAsDataURL(file);
        }
    }

    // Calcular estatísticas derivadas
    calculateDerivedStats() {
        try {
            // Obter valores dos atributos
            const strength = parseInt(document.getElementById('strength-value').value) || 1;
            const agility = parseInt(document.getElementById('agility-value').value) || 1;
            const resistance = parseInt(document.getElementById('resistance-value').value) || 1;

            // Obter skills relevantes
            const vigorSkill = this.getSkillValue('resistance', 'vigor');
            const reflexSkill = this.getSkillValue('agility', 'reflexo');
            const blockSkill = this.getSkillValue('resistance', 'bloqueio');
            const armazenamentoSkill = this.getSkillValue('mana', 'armazenamento');
            const weightSkill = this.getSkillValue('strength', 'peso');

            // Calcular HP baseado na classe
            const characterClass = document.getElementById('character-class').value;
            const level = parseInt(document.getElementById('character-level').value) || 1;
            
            let hpBase = this.calculateHPByClass(characterClass, level);
            const hpMax = hpBase + vigorSkill;
            
            // Atualizar HP se não foi definido manualmente
            const hpMaxField = document.getElementById('hp-max');
            const hpCurrentField = document.getElementById('hp-current');
            
            if (hpMaxField.value == 0 || !hpMaxField.value) {
                hpMaxField.value = hpMax;
                hpCurrentField.value = hpMax;
            }
            
            document.getElementById('hp-display').textContent = `${hpCurrentField.value}/${hpMaxField.value}`;

            // Calcular MP baseado na classe
            let mpBase = this.calculateMPByClass(characterClass, level);
            const mpMax = mpBase + armazenamentoSkill;
            
            // Atualizar MP se não foi definido manualmente
            const mpMaxField = document.getElementById('mp-max');
            const mpCurrentField = document.getElementById('mp-current');
            
            if (mpMaxField.value == 0 || !mpMaxField.value) {
                mpMaxField.value = mpMax;
                mpCurrentField.value = mpMax;
            }
            
            document.getElementById('mp-display').textContent = `${mpCurrentField.value}/${mpMaxField.value}`;

            // Calcular defesas
            const armorValue = parseInt(document.getElementById('armor-value').value) || 0;
            
            const defenseBase = 10 + armorValue;
            const dodgeValue = defenseBase + reflexSkill;
            const counterValue = defenseBase;
            const blockValue = armorValue + blockSkill;

            document.getElementById('defense-value').textContent = defenseBase;
            document.getElementById('dodge-value').textContent = dodgeValue;
            document.getElementById('counter-value').textContent = counterValue;
            document.getElementById('block-value').textContent = blockValue;

            // Calcular capacidade de peso
            const maxWeight = 10 + weightSkill;
            const carryWeightField = document.getElementById('carry-weight');
            const currentWeight = carryWeightField.value.split('/')[0] || '0';
            carryWeightField.placeholder = `${currentWeight}/${maxWeight} kg`;

        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
        }
    }

    // Obter valor de uma skill específica
    getSkillValue(attribute, skill) {
        try {
            const skillInput = document.querySelector(`input[data-attribute="${attribute}"][data-skill="${skill}"]`);
            return parseInt(skillInput?.value) || 0;
        } catch (error) {
            return 0;
        }
    }

    // Calcular HP baseado na classe
    calculateHPByClass(characterClass, level) {
        const hpByClass = {
            'warrior': () => this.rollDice(2, 6) + (level - 1) * 6,
            'berserker': () => this.rollDice(3, 8) + (level - 1) * 8,
            'rogue': () => this.rollDice(2, 4) + (level - 1) * 4,
            'fighter': () => this.rollDice(2, 8) + (level - 1) * 8,
            'archer': () => this.rollDice(2, 4) + (level - 1) * 4,
            'mage': () => this.rollDice(1, 6) + (level - 1) * 6,
            'cleric': () => this.rollDice(2, 6) + (level - 1) * 6,
            'scientist': () => this.rollDice(1, 6) + (level - 1) * 6,
            'bard': () => this.rollDice(2, 6) + (level - 1) * 6
        };

        return hpByClass[characterClass] ? hpByClass[characterClass]() : this.rollDice(1, 6) + (level - 1) * 6;
    }

    // Calcular MP baseado na classe
    calculateMPByClass(characterClass, level) {
        const mpByClass = {
            'warrior': () => this.rollDice(1, 4) + (level - 1) * 2,
            'berserker': () => this.rollDice(1, 4) + (level - 1) * 2,
            'rogue': () => this.rollDice(2, 4) + (level - 1) * 3,
            'fighter': () => this.rollDice(1, 8) + (level - 1) * 3,
            'archer': () => this.rollDice(2, 6) + (level - 1) * 4,
            'mage': () => this.rollDice(3, 6) + (level - 1) * 6,
            'cleric': () => this.rollDice(2, 8) + (level - 1) * 5,
            'scientist': () => this.rollDice(2, 6) + (level - 1) * 4,
            'bard': () => this.rollDice(2, 6) + (level - 1) * 4
        };

        return mpByClass[characterClass] ? mpByClass[characterClass]() : this.rollDice(1, 6) + (level - 1) * 3;
    }

    // Rolar dados
    rollDice(count, sides) {
        let total = 0;
        for (let i = 0; i < count; i++) {
            total += Math.floor(Math.random() * sides) + 1;
        }
        return total;
    }

    // Coletar todos os dados da ficha
    collectCharacterData() {
        const data = {
            timestamp: new Date().toISOString(),
            basicInfo: {
                name: document.getElementById('character-name').value,
                player: document.getElementById('player-name').value,
                race: document.getElementById('character-race').value,
                class: document.getElementById('character-class').value,
                level: document.getElementById('character-level').value,
                xp: document.getElementById('character-xp').value
            },
            attributes: {
                strength: document.getElementById('strength-value').value,
                combat: document.getElementById('combat-value').value,
                agility: document.getElementById('agility-value').value,
                resistance: document.getElementById('resistance-value').value,
                intellect: document.getElementById('intellect-value').value,
                charisma: document.getElementById('charisma-value').value,
                magic: document.getElementById('magic-value').value,
                mana: document.getElementById('mana-value').value
            },
            skills: {},
            health: {
                hpMax: document.getElementById('hp-max').value,
                hpCurrent: document.getElementById('hp-current').value,
                mpMax: document.getElementById('mp-max').value,
                mpCurrent: document.getElementById('mp-current').value
            },
            defense: {
                armorValue: document.getElementById('armor-value').value
            },
            origin: {
                origin: document.getElementById('character-origin').value,
                path: document.getElementById('origin-path').value,
                backstory: document.getElementById('character-backstory').value
            },
            equipment: {
                weapons: document.getElementById('weapons').value,
                armor: document.getElementById('armor').value,
                items: document.getElementById('items').value,
                magicItems: document.getElementById('magic-items').value,
                carryWeight: document.getElementById('carry-weight').value
            },
            abilities: {
                classAbilities: document.getElementById('class-abilities').value,
                subclassAbilities: document.getElementById('subclass-abilities').value,
                customAbility: document.getElementById('custom-ability').value,
                spells: document.getElementById('spells').value
            },
            notes: document.getElementById('notes').value,
            image: this.characterData.image || null
        };

        // Coletar skills
        document.querySelectorAll('.skill-value').forEach(input => {
            const attribute = input.dataset.attribute;
            const skill = input.dataset.skill;
            if (attribute && skill) {
                if (!data.skills[attribute]) {
                    data.skills[attribute] = {};
                }
                data.skills[attribute][skill] = input.value;
            }
        });

        return data;
    }

    // Salvar personagem
    saveCharacter() {
        const saveName = document.getElementById('save-name').value.trim();
        
        if (!saveName) {
            this.showNotification('Digite um nome para salvar a ficha!', 'error');
            return;
        }

        const characterData = this.collectCharacterData();
        const savedCharacters = JSON.parse(localStorage.getItem('elisio_characters') || '{}');
        
        savedCharacters[saveName] = characterData;
        localStorage.setItem('elisio_characters', JSON.stringify(savedCharacters));
        
        this.loadSavedCharacters();
        this.showNotification('Ficha salva com sucesso!', 'success');
        
        // Limpar campo de nome
        document.getElementById('save-name').value = '';
    }

    // Carregar personagem
    loadCharacter() {
        const selectedCharacter = document.getElementById('saved-characters').value;
        
        if (!selectedCharacter) {
            this.showNotification('Selecione uma ficha para carregar!', 'error');
            return;
        }

        const savedCharacters = JSON.parse(localStorage.getItem('elisio_characters') || '{}');
        
        if (savedCharacters[selectedCharacter]) {
            this.loadCharacterData(savedCharacters[selectedCharacter]);
        } else {
            this.showNotification('Ficha não encontrada!', 'error');
        }
    }

    // Excluir personagem
    deleteCharacter() {
        const selectedCharacter = document.getElementById('saved-characters').value;
        
        if (!selectedCharacter) {
            this.showNotification('Selecione uma ficha para excluir!', 'error');
            return;
        }

        if (confirm('Tem certeza que deseja excluir a ficha "' + selectedCharacter + '"?')) {
            const savedCharacters = JSON.parse(localStorage.getItem('elisio_characters') || '{}');
            delete savedCharacters[selectedCharacter];
            localStorage.setItem('elisio_characters', JSON.stringify(savedCharacters));
            
            this.loadSavedCharacters();
            this.showNotification('Ficha excluída com sucesso!', 'success');
        }
    }

    // Exportar personagem como JSON
    exportCharacter() {
        const characterData = this.collectCharacterData();
        const characterName = characterData.basicInfo.name || 'personagem';
        
        const dataStr = JSON.stringify(characterData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = characterName + '_elisio_v2.json';
        link.click();
        
        this.showNotification('Ficha exportada com sucesso!', 'success');
    }

    // Importar personagem
    importCharacter() {
        document.getElementById('import-file').click();
    }

    // Processar arquivo importado
    handleFileImport(event) {
        const file = event.target.files[0];
        
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.loadCharacterData(data);
                this.showNotification('Ficha importada com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao importar:', error);
                this.showNotification('Erro ao importar arquivo JSON!', 'error');
            }
        };
        
        reader.readAsText(file);
        
        // Limpar input
        event.target.value = '';
    }

    // Resetar ficha
    resetCharacter() {
        if (confirm('Tem certeza que deseja limpar toda a ficha?')) {
            // Limpar todos os campos
            document.querySelectorAll('input[type="text"], input[type="number"], textarea').forEach(el => {
                el.value = '';
            });
            
            document.querySelectorAll('select').forEach(el => {
                el.selectedIndex = 0;
            });

            // Resetar valores padrão
            document.getElementById('character-level').value = 1;
            document.getElementById('character-xp').value = 0;
            
            // Resetar atributos para 1
            document.querySelectorAll('.attribute-input').forEach(input => {
                input.value = 1;
            });

            // Resetar imagem
            const characterImage = document.querySelector('.character-image');
            characterImage.innerHTML = '<div class="upload-text">Clique para adicionar imagem</div><input type="file" id="character-image" accept="image/*">';
            
            // Reconfigurar event listener da imagem
            document.getElementById('character-image').addEventListener('change', (e) => {
                this.handleImageUpload(e);
            });

            this.characterData = {};
            this.calculateDerivedStats();
            this.clearAutoSave();
            this.showNotification('Ficha limpa com sucesso!', 'success');
        }
    }

    // Imprimir ficha
    printCharacter() {
        window.print();
    }

    // Carregar fichas salvas no select
    loadSavedCharacters() {
        const savedCharacters = JSON.parse(localStorage.getItem('elisio_characters') || '{}');
        const select = document.getElementById('saved-characters');
        
        select.innerHTML = '<option value="">Selecione uma ficha para carregar</option>';
        
        Object.keys(savedCharacters).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
    }

    // Auto-salvar dados temporariamente
    autoSave() {
        const characterData = this.collectCharacterData();
        localStorage.setItem('elisio_autosave', JSON.stringify(characterData));
    }

    // Carregar dados auto-salvos
    loadAutoSavedData() {
        const autoSavedData = localStorage.getItem('elisio_autosave');
        if (autoSavedData) {
            try {
                const data = JSON.parse(autoSavedData);
                if (data.basicInfo && (data.basicInfo.name || data.basicInfo.player)) {
                    this.loadCharacterData(data);
                    this.showNotification('Dados recuperados automaticamente!', 'info');
                }
            } catch (error) {
                console.error('Erro ao carregar auto-save:', error);
            }
        }
    }

    // Limpar auto-save
    clearAutoSave() {
        localStorage.removeItem('elisio_autosave');
    }

    // Mostrar notificação
    showNotification(message, type) {
        type = type || 'info';
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification ' + type;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Carregar dados na ficha
    loadCharacterData(data) {
        try {
            if (data.basicInfo) {
                document.getElementById('character-name').value = data.basicInfo.name || '';
                document.getElementById('player-name').value = data.basicInfo.player || '';
                document.getElementById('character-race').value = data.basicInfo.race || '';
                document.getElementById('character-class').value = data.basicInfo.class || '';
                document.getElementById('character-level').value = data.basicInfo.level || 1;
                document.getElementById('character-xp').value = data.basicInfo.xp || 0;
            }

            if (data.attributes) {
                document.getElementById('strength-value').value = data.attributes.strength || 1;
                document.getElementById('combat-value').value = data.attributes.combat || 1;
                document.getElementById('agility-value').value = data.attributes.agility || 1;
                document.getElementById('resistance-value').value = data.attributes.resistance || 1;
                document.getElementById('intellect-value').value = data.attributes.intellect || 1;
                document.getElementById('charisma-value').value = data.attributes.charisma || 1;
                document.getElementById('magic-value').value = data.attributes.magic || 1;
                document.getElementById('mana-value').value = data.attributes.mana || 1;
            }

            if (data.skills) {
                Object.keys(data.skills).forEach(attribute => {
                    Object.keys(data.skills[attribute]).forEach(skill => {
                        const input = document.querySelector('input[data-attribute="' + attribute + '"][data-skill="' + skill + '"]');
                        if (input) {
                            input.value = data.skills[attribute][skill] || 0;
                        }
                    });
                });
            }

            if (data.health) {
                document.getElementById('hp-max').value = data.health.hpMax || 0;
                document.getElementById('hp-current').value = data.health.hpCurrent || 0;
                document.getElementById('mp-max').value = data.health.mpMax || 0;
                document.getElementById('mp-current').value = data.health.mpCurrent || 0;
            }

            if (data.defense) {
                document.getElementById('armor-value').value = data.defense.armorValue || 0;
            }

            if (data.origin) {
                document.getElementById('character-origin').value = data.origin.origin || '';
                document.getElementById('origin-path').value = data.origin.path || '';
                document.getElementById('character-backstory').value = data.origin.backstory || '';
            }

            if (data.equipment) {
                document.getElementById('weapons').value = data.equipment.weapons || '';
                document.getElementById('armor').value = data.equipment.armor || '';
                document.getElementById('items').value = data.equipment.items || '';
                document.getElementById('magic-items').value = data.equipment.magicItems || '';
                document.getElementById('carry-weight').value = data.equipment.carryWeight || '';
            }

            if (data.abilities) {
                document.getElementById('class-abilities').value = data.abilities.classAbilities || '';
                document.getElementById('subclass-abilities').value = data.abilities.subclassAbilities || '';
                document.getElementById('custom-ability').value = data.abilities.customAbility || '';
                document.getElementById('spells').value = data.abilities.spells || '';
            }

            document.getElementById('notes').value = data.notes || '';

            if (data.image) {
                const img = document.createElement('img');
                img.src = data.image;
                const characterImage = document.querySelector('.character-image');
                const fileInput = characterImage.querySelector('input[type="file"]');
                
                characterImage.innerHTML = '';
                characterImage.appendChild(img);
                characterImage.appendChild(fileInput);
                
                this.characterData.image = data.image;
            }

            this.calculateDerivedStats();
            this.showNotification('Ficha carregada com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showNotification('Erro ao carregar a ficha!', 'error');
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new CharacterSheet();
});

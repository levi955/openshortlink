class ConsoleInjector {
    constructor() {
        this.injected = false;
    }

    async inject(page) {
        if (this.injected) return;

        console.log('💉 Injecting console utilities...');
        
        await page.addScriptTag({
            content: `
                // Ultimate Mine Bot Console Utilities
                window.UltimateMineBot = {
                    version: '1.0.0',
                    
                    // Reveal all safe cells (CHEAT MODE)
                    revealSafeCells: function() {
                        console.log('🚨 CHEAT MODE: Revealing safe cells');
                        
                        const cells = this.getAllCells();
                        const safeCells = cells.filter(cell => !this.isMine(cell) && !this.isRevealed(cell));
                        
                        console.log(\`Found \${safeCells.length} safe cells to reveal\`);
                        
                        safeCells.forEach((cell, index) => {
                            setTimeout(() => {
                                this.clickCell(cell);
                            }, index * 100); // Stagger clicks
                        });
                        
                        return safeCells.length;
                    },
                    
                    // Analyze current board probabilities
                    analyzeProbabilities: function() {
                        console.log('📊 Analyzing mine probabilities...');
                        
                        const cells = this.getAllCells();
                        const analysis = cells.map(cell => {
                            if (this.isRevealed(cell)) return null;
                            
                            const probability = this.calculateMineProbability(cell);
                            return {
                                element: cell,
                                x: this.getCellX(cell),
                                y: this.getCellY(cell),
                                probability: probability
                            };
                        }).filter(Boolean);
                        
                        analysis.sort((a, b) => a.probability - b.probability);
                        
                        console.table(analysis.slice(0, 10));
                        
                        // Highlight safest cells
                        analysis.slice(0, 5).forEach(item => {
                            item.element.style.border = '3px solid green';
                        });
                        
                        return analysis;
                    },
                    
                    // Auto-flag obvious mines
                    autoFlag: function() {
                        console.log('🚩 Auto-flagging obvious mines...');
                        
                        const cells = this.getAllCells();
                        let flaggedCount = 0;
                        
                        const numberedCells = cells.filter(cell => 
                            this.isRevealed(cell) && this.getNumber(cell) > 0
                        );
                        
                        numberedCells.forEach(cell => {
                            const neighbors = this.getNeighbors(cell);
                            const hiddenNeighbors = neighbors.filter(n => !this.isRevealed(n) && !this.isFlagged(n));
                            const flaggedNeighbors = neighbors.filter(n => this.isFlagged(n));
                            const requiredMines = this.getNumber(cell);
                            
                            // If hidden + flagged = required mines, flag all hidden
                            if (hiddenNeighbors.length + flaggedNeighbors.length === requiredMines && hiddenNeighbors.length > 0) {
                                hiddenNeighbors.forEach(neighbor => {
                                    this.flagCell(neighbor);
                                    flaggedCount++;
                                });
                            }
                        });
                        
                        console.log(\`Flagged \${flaggedCount} obvious mines\`);
                        return flaggedCount;
                    },
                    
                    // Reveal obviously safe cells
                    revealSafe: function() {
                        console.log('✅ Revealing obviously safe cells...');
                        
                        const cells = this.getAllCells();
                        let revealedCount = 0;
                        
                        const numberedCells = cells.filter(cell => 
                            this.isRevealed(cell) && this.getNumber(cell) > 0
                        );
                        
                        numberedCells.forEach(cell => {
                            const neighbors = this.getNeighbors(cell);
                            const hiddenNeighbors = neighbors.filter(n => !this.isRevealed(n) && !this.isFlagged(n));
                            const flaggedNeighbors = neighbors.filter(n => this.isFlagged(n));
                            const requiredMines = this.getNumber(cell);
                            
                            // If we've flagged enough mines, reveal remaining
                            if (flaggedNeighbors.length === requiredMines && hiddenNeighbors.length > 0) {
                                hiddenNeighbors.forEach(neighbor => {
                                    this.clickCell(neighbor);
                                    revealedCount++;
                                });
                            }
                        });
                        
                        console.log(\`Revealed \${revealedCount} safe cells\`);
                        return revealedCount;
                    },
                    
                    // Game state analysis
                    getGameState: function() {
                        const cells = this.getAllCells();
                        const revealed = cells.filter(c => this.isRevealed(c)).length;
                        const flagged = cells.filter(c => this.isFlagged(c)).length;
                        const hidden = cells.filter(c => !this.isRevealed(c) && !this.isFlagged(c)).length;
                        
                        return {
                            totalCells: cells.length,
                            revealed,
                            flagged,
                            hidden,
                            progress: (revealed / cells.length * 100).toFixed(1) + '%'
                        };
                    },
                    
                    // Helper functions
                    getAllCells: function() {
                        // Try multiple selectors to find cells
                        const selectors = [
                            '[data-x][data-y]',
                            '.cell',
                            '.tile',
                            '.mine-cell',
                            'button[class*="cell"]',
                            'div[class*="cell"]'
                        ];
                        
                        for (const selector of selectors) {
                            const cells = document.querySelectorAll(selector);
                            if (cells.length > 0) return Array.from(cells);
                        }
                        
                        // Fallback: find grid-like elements
                        return Array.from(document.querySelectorAll('*')).filter(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.width > 20 && rect.width < 100 && 
                                   rect.height > 20 && rect.height < 100;
                        });
                    },
                    
                    getCellX: function(cell) {
                        return parseInt(cell.dataset.x) || 0;
                    },
                    
                    getCellY: function(cell) {
                        return parseInt(cell.dataset.y) || 0;
                    },
                    
                    isRevealed: function(cell) {
                        return cell.classList.contains('revealed') || 
                               cell.classList.contains('open') ||
                               cell.textContent.trim() !== '';
                    },
                    
                    isFlagged: function(cell) {
                        return cell.classList.contains('flagged') || 
                               cell.classList.contains('flag');
                    },
                    
                    isMine: function(cell) {
                        return cell.classList.contains('mine') || 
                               cell.classList.contains('bomb') ||
                               cell.textContent.includes('💣');
                    },
                    
                    getNumber: function(cell) {
                        const text = cell.textContent.trim();
                        const num = parseInt(text);
                        return isNaN(num) ? 0 : num;
                    },
                    
                    clickCell: function(cell) {
                        cell.click();
                    },
                    
                    flagCell: function(cell) {
                        // Try right click first
                        cell.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
                        
                        // Fallback: try double click or shift+click
                        setTimeout(() => {
                            if (!this.isFlagged(cell)) {
                                cell.dispatchEvent(new MouseEvent('click', { 
                                    bubbles: true, 
                                    shiftKey: true 
                                }));
                            }
                        }, 100);
                    },
                    
                    getNeighbors: function(cell) {
                        const x = this.getCellX(cell);
                        const y = this.getCellY(cell);
                        const allCells = this.getAllCells();
                        
                        const neighbors = [];
                        for (let dx = -1; dx <= 1; dx++) {
                            for (let dy = -1; dy <= 1; dy++) {
                                if (dx === 0 && dy === 0) continue;
                                
                                const neighbor = allCells.find(c => 
                                    this.getCellX(c) === x + dx && this.getCellY(c) === y + dy
                                );
                                
                                if (neighbor) neighbors.push(neighbor);
                            }
                        }
                        return neighbors;
                    },
                    
                    calculateMineProbability: function(cell) {
                        const neighbors = this.getNeighbors(cell);
                        const numberedNeighbors = neighbors.filter(n => 
                            this.isRevealed(n) && this.getNumber(n) > 0
                        );
                        
                        if (numberedNeighbors.length === 0) {
                            return 0.15; // Base probability
                        }
                        
                        let maxProbability = 0;
                        
                        numberedNeighbors.forEach(neighbor => {
                            const neighborNeighbors = this.getNeighbors(neighbor);
                            const flaggedCount = neighborNeighbors.filter(n => this.isFlagged(n)).length;
                            const hiddenCount = neighborNeighbors.filter(n => 
                                !this.isRevealed(n) && !this.isFlagged(n)
                            ).length;
                            const minesRemaining = this.getNumber(neighbor) - flaggedCount;
                            
                            if (hiddenCount > 0) {
                                const probability = minesRemaining / hiddenCount;
                                maxProbability = Math.max(maxProbability, probability);
                            }
                        });
                        
                        return Math.max(0.15, maxProbability);
                    }
                };
                
                // Expose to console
                console.log('💀 Ultimate Mine Bot loaded! Available commands:');
                console.log('  UltimateMineBot.revealSafeCells() - CHEAT: Reveal all safe cells');
                console.log('  UltimateMineBot.analyzeProbabilities() - Show probability analysis');
                console.log('  UltimateMineBot.autoFlag() - Auto-flag obvious mines');
                console.log('  UltimateMineBot.revealSafe() - Reveal obviously safe cells');
                console.log('  UltimateMineBot.getGameState() - Get current game state');
                
                // Shortcuts
                window.bot = window.UltimateMineBot;
                window.cheat = () => UltimateMineBot.revealSafeCells();
                window.analyze = () => UltimateMineBot.analyzeProbabilities();
                window.flag = () => UltimateMineBot.autoFlag();
                window.reveal = () => UltimateMineBot.revealSafe();
            `
        });

        this.injected = true;
        console.log('✅ Console utilities injected');
        console.log('💡 Open browser console and type "bot" for available commands');
    }
}

module.exports = ConsoleInjector;
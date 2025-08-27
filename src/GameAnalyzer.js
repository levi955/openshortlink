class GameAnalyzer {
    constructor() {
        this.boardState = null;
        this.mineLocations = new Set();
        this.safeLocations = new Set();
    }

    async analyzeBoard(page) {
        try {
            // Evaluate board state in browser context
            const boardState = await page.evaluate(() => {
                // Common board analysis patterns
                const findBoard = () => {
                    // Look for common mine game patterns
                    const candidates = [
                        document.querySelector('.mine-grid'),
                        document.querySelector('.game-board'),
                        document.querySelector('[data-mines]'),
                        document.querySelector('canvas'),
                        document.querySelector('.grid')
                    ].filter(Boolean);

                    for (const candidate of candidates) {
                        const cells = candidate.querySelectorAll('[data-x][data-y], .cell, .tile');
                        if (cells.length > 0) {
                            return { element: candidate, cells: Array.from(cells) };
                        }
                    }

                    // Fallback: look for clickable grid elements
                    const gridElements = document.querySelectorAll('div, button, span');
                    const potentialCells = Array.from(gridElements).filter(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 20 && rect.width < 100 && 
                               rect.height > 20 && rect.height < 100 &&
                               rect.width === rect.height; // Square cells
                    });

                    if (potentialCells.length >= 25) { // At least 5x5 grid
                        return { element: null, cells: potentialCells };
                    }

                    return null;
                };

                const board = findBoard();
                if (!board) {
                    return { isValid: false, error: 'No board found' };
                }

                // Analyze board dimensions and state
                const cells = board.cells;
                const positions = cells.map(cell => {
                    const rect = cell.getBoundingClientRect();
                    return {
                        element: cell,
                        x: parseInt(cell.dataset.x) || Math.floor(rect.left / 32),
                        y: parseInt(cell.dataset.y) || Math.floor(rect.top / 32),
                        rect: rect,
                        revealed: cell.classList.contains('revealed') || 
                                 cell.classList.contains('open') ||
                                 cell.textContent.trim() !== '',
                        flagged: cell.classList.contains('flagged') || 
                                cell.classList.contains('flag'),
                        number: parseInt(cell.textContent) || 0,
                        isMine: cell.classList.contains('mine') || 
                               cell.classList.contains('bomb')
                    };
                });

                const width = Math.max(...positions.map(p => p.x)) + 1;
                const height = Math.max(...positions.map(p => p.y)) + 1;

                return {
                    isValid: true,
                    width,
                    height,
                    cells: positions,
                    mineCount: positions.filter(p => p.isMine).length || Math.floor(width * height * 0.15)
                };
            });

            this.boardState = boardState;
            return boardState;

        } catch (error) {
            console.error('Board analysis failed:', error);
            return { isValid: false, error: error.message };
        }
    }

    async getNextMove(page) {
        if (!this.boardState || !this.boardState.isValid) {
            await this.analyzeBoard(page);
        }

        // Implement basic minesweeper logic
        const cells = this.boardState.cells;
        
        // Find revealed cells with numbers
        const numberedCells = cells.filter(cell => 
            cell.revealed && cell.number > 0
        );

        for (const cell of numberedCells) {
            const neighbors = this.getNeighbors(cell, cells);
            const flaggedNeighbors = neighbors.filter(n => n.flagged);
            const hiddenNeighbors = neighbors.filter(n => !n.revealed && !n.flagged);

            // If we've flagged enough mines around this number
            if (flaggedNeighbors.length === cell.number) {
                // All remaining hidden neighbors are safe
                if (hiddenNeighbors.length > 0) {
                    return {
                        x: hiddenNeighbors[0].x,
                        y: hiddenNeighbors[0].y,
                        action: 'click',
                        confidence: 1.0
                    };
                }
            }

            // If hidden neighbors + flagged = number, flag all hidden
            if (hiddenNeighbors.length + flaggedNeighbors.length === cell.number && hiddenNeighbors.length > 0) {
                return {
                    x: hiddenNeighbors[0].x,
                    y: hiddenNeighbors[0].y,
                    action: 'flag',
                    confidence: 1.0
                };
            }
        }

        return null; // No obvious safe moves
    }

    async getProbabilityMove(page) {
        // Advanced probability analysis
        const cells = this.boardState.cells;
        const hiddenCells = cells.filter(cell => !cell.revealed && !cell.flagged);
        
        if (hiddenCells.length === 0) return null;

        // Calculate probability for each hidden cell
        const probabilities = hiddenCells.map(cell => {
            const neighbors = this.getNeighbors(cell, cells);
            const numberedNeighbors = neighbors.filter(n => n.revealed && n.number > 0);
            
            let probability = 0.15; // Base mine probability
            
            for (const neighbor of numberedNeighbors) {
                const neighborNeighbors = this.getNeighbors(neighbor, cells);
                const flaggedCount = neighborNeighbors.filter(n => n.flagged).length;
                const hiddenCount = neighborNeighbors.filter(n => !n.revealed && !n.flagged).length;
                const minesRemaining = neighbor.number - flaggedCount;
                
                if (hiddenCount > 0) {
                    const localProbability = minesRemaining / hiddenCount;
                    probability = Math.max(probability, localProbability);
                }
            }

            return {
                ...cell,
                mineProbability: probability
            };
        });

        // Sort by lowest probability (safest first)
        probabilities.sort((a, b) => a.mineProbability - b.mineProbability);
        
        const safest = probabilities[0];
        if (safest.mineProbability < 0.3) {
            return {
                x: safest.x,
                y: safest.y,
                action: 'click',
                confidence: 1 - safest.mineProbability
            };
        }

        return null;
    }

    getNeighbors(cell, allCells) {
        const neighbors = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                
                const neighbor = allCells.find(c => 
                    c.x === cell.x + dx && c.y === cell.y + dy
                );
                
                if (neighbor) {
                    neighbors.push(neighbor);
                }
            }
        }
        return neighbors;
    }
}

module.exports = GameAnalyzer;
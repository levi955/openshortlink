/**
 * Game Logic Module
 * Handles mine field analysis, safe move detection, and pattern recognition
 */

const { MathUtils, PatternUtils } = require('./utils');

class GameAnalyzer {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
        this.gameHistory = [];
        this.patterns = new Map();
        this.statistics = {
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            averageTime: 0,
            bestTime: Infinity,
            accuracy: 0
        };
    }
    
    /**
     * Analyze the current game state and determine the best move
     */
    async analyzeGameState(gameState) {
        try {
            this.logger.debug('🧠 Analyzing game state...');
            
            const { grid, mines, revealed, gameStatus } = gameState;
            
            if (!grid || !Array.isArray(grid)) {
                throw new Error('Invalid game grid');
            }
            
            // Find all possible moves
            const possibleMoves = this.findPossibleMoves(grid);
            
            if (possibleMoves.length === 0) {
                this.logger.warn('No possible moves found');
                return null;
            }
            
            // Calculate safety scores for each move
            const scoredMoves = possibleMoves.map(move => ({
                ...move,
                safetyScore: this.calculateSafetyScore(move, grid),
                patterns: PatternUtils.detectPatterns(grid, move),
                probability: this.calculateMineProbability(move, grid, mines)
            }));
            
            // Sort moves by safety score (highest first)
            scoredMoves.sort((a, b) => b.safetyScore - a.safetyScore);
            
            this.logger.debug(`Found ${scoredMoves.length} possible moves`);
            this.logger.verbose('Top 3 moves:', scoredMoves.slice(0, 3).map(m => 
                `(${m.x},${m.y}) score:${m.safetyScore.toFixed(3)}`
            ));
            
            // Select the best move based on strategy
            const bestMove = this.selectBestMove(scoredMoves, gameState);
            
            return bestMove;
            
        } catch (error) {
            this.logger.error('Analysis failed:', error.message);
            return null;
        }
    }
    
    /**
     * Find all unrevealed cells that can be clicked
     */
    findPossibleMoves(grid) {
        const moves = [];
        
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                const cell = grid[y][x];
                
                if (!cell.isRevealed && !cell.isFlagged) {
                    moves.push({
                        x,
                        y,
                        type: 'reveal',
                        cell: cell
                    });
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Calculate safety score for a specific move
     */
    calculateSafetyScore(move, grid) {
        const { x, y } = move;
        let score = 0.5; // Base score
        
        // Get neighbors
        const neighbors = this.getNeighbors(x, y, grid);
        
        // Analyze numbered neighbors
        neighbors.forEach(neighbor => {
            if (neighbor.isRevealed && typeof neighbor.number === 'number') {
                const neighborInfo = this.analyzeNeighborhood(neighbor.x, neighbor.y, grid);
                
                // If neighbor's mine count is satisfied, surrounding cells are safe
                if (neighborInfo.flaggedMines === neighbor.number) {
                    score += 0.4;
                }
                
                // If neighbor needs more mines and has few unrevealed cells, it's risky
                const remainingMines = neighbor.number - neighborInfo.flaggedMines;
                const unrevealedCells = neighborInfo.unrevealedCells;
                
                if (unrevealedCells > 0) {
                    const localProbability = remainingMines / unrevealedCells;
                    score -= localProbability * 0.3;
                }
            }
        });
        
        // Pattern bonuses
        const patterns = PatternUtils.detectPatterns(grid, { x, y });
        patterns.forEach(pattern => {
            score += pattern.confidence * 0.1;
        });
        
        // Edge and corner penalties (slightly more risky)
        if (this.isEdgeCell(x, y, grid)) {
            score -= 0.05;
        }
        
        if (this.isCornerCell(x, y, grid)) {
            score -= 0.1;
        }
        
        // First move bonus (center is usually safer)
        if (this.isFirstMove(grid)) {
            const centerX = Math.floor(grid[0].length / 2);
            const centerY = Math.floor(grid.length / 2);
            const distance = Math.abs(x - centerX) + Math.abs(y - centerY);
            score += (10 - distance) * 0.05;
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * Calculate probability of a cell containing a mine
     */
    calculateMineProbability(move, grid, totalMines) {
        const revealedCells = [];
        let flaggedMines = 0;
        
        // Count revealed cells and flagged mines
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                const cell = grid[y][x];
                if (cell.isRevealed) {
                    revealedCells.push(cell);
                }
                if (cell.isFlagged) {
                    flaggedMines++;
                }
            }
        }
        
        const remainingMines = totalMines - flaggedMines;
        const totalCells = grid.length * grid[0].length;
        const unrevealedCells = totalCells - revealedCells.length - flaggedMines;
        
        if (unrevealedCells <= 0) return 0;
        
        return remainingMines / unrevealedCells;
    }
    
    /**
     * Select the best move based on current strategy
     */
    selectBestMove(scoredMoves, gameState) {
        if (scoredMoves.length === 0) return null;
        
        const strategy = this.config.get('CONSERVATIVE_MODE') ? 'conservative' : 'aggressive';
        const probabilityThreshold = this.config.get('PROBABILITY_THRESHOLD');
        
        switch (strategy) {
            case 'conservative':
                // Always pick the safest move
                return scoredMoves[0];
                
            case 'aggressive':
                // Pick moves with good safety score but also consider speed
                const goodMoves = scoredMoves.filter(move => 
                    move.safetyScore > probabilityThreshold
                );
                
                if (goodMoves.length > 0) {
                    // Randomly select from top moves for variety
                    const topMoves = goodMoves.slice(0, Math.min(3, goodMoves.length));
                    return MathUtils.weightedRandomChoice(
                        topMoves.map(move => ({
                            ...move,
                            weight: move.safetyScore
                        }))
                    );
                }
                return scoredMoves[0];
                
            default:
                return scoredMoves[0];
        }
    }
    
    /**
     * Get neighboring cells
     */
    getNeighbors(x, y, grid) {
        const neighbors = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        directions.forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
                neighbors.push({
                    x: nx,
                    y: ny,
                    ...grid[ny][nx]
                });
            }
        });
        
        return neighbors;
    }
    
    /**
     * Analyze neighborhood around a revealed cell
     */
    analyzeNeighborhood(x, y, grid) {
        const neighbors = this.getNeighbors(x, y, grid);
        
        return {
            totalNeighbors: neighbors.length,
            revealedNeighbors: neighbors.filter(n => n.isRevealed).length,
            flaggedMines: neighbors.filter(n => n.isFlagged).length,
            unrevealedCells: neighbors.filter(n => !n.isRevealed && !n.isFlagged).length
        };
    }
    
    /**
     * Check if this is the first move of the game
     */
    isFirstMove(grid) {
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].isRevealed) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Check if cell is on the edge
     */
    isEdgeCell(x, y, grid) {
        return x === 0 || x === grid[0].length - 1 || y === 0 || y === grid.length - 1;
    }
    
    /**
     * Check if cell is in a corner
     */
    isCornerCell(x, y, grid) {
        const maxX = grid[0].length - 1;
        const maxY = grid.length - 1;
        
        return (x === 0 || x === maxX) && (y === 0 || y === maxY);
    }
    
    /**
     * Update game statistics
     */
    updateStatistics(gameResult) {
        this.statistics.gamesPlayed++;
        
        if (gameResult.won) {
            this.statistics.gamesWon++;
        } else {
            this.statistics.gamesLost++;
        }
        
        if (gameResult.time) {
            const totalTime = this.statistics.averageTime * (this.statistics.gamesPlayed - 1);
            this.statistics.averageTime = (totalTime + gameResult.time) / this.statistics.gamesPlayed;
            
            if (gameResult.time < this.statistics.bestTime) {
                this.statistics.bestTime = gameResult.time;
            }
        }
        
        this.statistics.accuracy = this.statistics.gamesWon / this.statistics.gamesPlayed;
        
        this.logger.info(`📊 Stats: ${this.statistics.gamesWon}/${this.statistics.gamesPlayed} won (${(this.statistics.accuracy * 100).toFixed(1)}%)`);
    }
    
    /**
     * Learn from game patterns
     */
    learnFromGame(gameHistory) {
        if (!this.config.get('PATTERN_LEARNING')) return;
        
        // Store patterns that led to success or failure
        gameHistory.forEach((move, index) => {
            const pattern = {
                position: { x: move.x, y: move.y },
                neighbors: move.neighbors,
                outcome: move.outcome,
                gameResult: gameHistory.gameResult
            };
            
            const patternKey = this.generatePatternKey(pattern);
            
            if (!this.patterns.has(patternKey)) {
                this.patterns.set(patternKey, { successes: 0, failures: 0, total: 0 });
            }
            
            const patternStats = this.patterns.get(patternKey);
            patternStats.total++;
            
            if (move.outcome === 'safe') {
                patternStats.successes++;
            } else if (move.outcome === 'mine') {
                patternStats.failures++;
            }
        });
        
        // Limit pattern memory size
        if (this.patterns.size > this.config.get('MEMORY_SIZE')) {
            const oldestPattern = this.patterns.keys().next().value;
            this.patterns.delete(oldestPattern);
        }
    }
    
    /**
     * Generate a key for pattern recognition
     */
    generatePatternKey(pattern) {
        // Simplified pattern key generation
        const { neighbors, position } = pattern;
        return `${position.x},${position.y}:${neighbors.length}`;
    }
    
    /**
     * Get current statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
}

module.exports = { GameAnalyzer };
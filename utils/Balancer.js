// Class Dasar (Parent)
class ProductionData {
    constructor(stations) {
        this.stations = stations;
        this.sumTi = stations.reduce((a, b) => a + b.time, 0);
        this.K = stations.length;
    }
}

// Class Child (Inheritance)
class LineBalancer extends ProductionData {
    constructor(stations, mode, targetTakt = null) {
        super(stations); // Memanggil constructor parent
        this.mode = mode;
        this.targetTakt = targetTakt;
    }

    // Pastikan metode calculate berada di DALAM blok kurung kurawal Class
    calculate() {
        const bottleneck = Math.max(...this.stations.map(s => s.time));
        const usedCT = (this.mode === 'target') ? this.targetTakt : bottleneck;

        const LE = (this.sumTi / (this.K * usedCT)) * 100;
        const BD = 100 - LE;

        let sumSquaredDiff = 0;
        this.stations.forEach(s => {
            sumSquaredDiff += Math.pow((usedCT - s.time), 2);
        });
        const SI = Math.sqrt(sumSquaredDiff);

        return {
            cycleTime: usedCT.toFixed(3),
            efficiency: LE.toFixed(2),
            balanceDelay: BD.toFixed(2),
            smoothnessIndex: SI.toFixed(3)
        };
    }
}

module.exports = LineBalancer;

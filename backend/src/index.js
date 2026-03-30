"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 5000;
app.post('/calculate', (req, res) => {
    const { total, r1, r2, p1, strategy } = req.body;
    const p2 = 1 - p1;
    let x = 0; // Points for Team A
    let y = 0; // Points for Team B
    let suggestion = '';
    // Calculate best strategy dynamically for the "Best Strategy Suggestion"
    const expectedReturns = {
        Safe: ((total * r2) / (r1 + r2) * r1) - total,
        Balanced: ((p1 >= p2 ? 0.7 : 0.3) * total * r1) * p1 + ((p2 > p1 ? 0.7 : 0.3) * total * r2) * p2 - total,
        Aggressive: ((r1 / (r1 + r2)) * total * r1) * p1 + ((r2 / (r1 + r2)) * total * r2) * p2 - total,
        Value: 0
    };
    const ip1 = 1 / r1;
    const ip2 = 1 / r2;
    if (p1 > ip1) {
        expectedReturns.Value = (0.8 * total * r1) * p1 + (0.2 * total * r2) * p2 - total;
    }
    else if (p2 > ip2) {
        expectedReturns.Value = (0.2 * total * r1) * p1 + (0.8 * total * r2) * p2 - total;
    }
    else {
        expectedReturns.Value = -total; // No value bet available
    }
    const bestIter = Object.entries(expectedReturns).sort((a, b) => b[1] - a[1]);
    suggestion = bestIter[0][1] > 0 ? bestIter[0][0] : 'None (High Risk)';
    switch (strategy) {
        case 'Safe':
            x = (total * r2) / (r1 + r2);
            y = (total * r1) / (r1 + r2);
            break;
        case 'Balanced':
            if (p1 >= p2) {
                x = total * 0.7;
                y = total * 0.3;
            }
            else {
                x = total * 0.3;
                y = total * 0.7;
            }
            break;
        case 'Aggressive':
            x = (r1 / (r1 + r2)) * total;
            y = (r2 / (r1 + r2)) * total;
            break;
        case 'Value':
            if (p1 > ip1) {
                x = total * 0.8;
                y = total * 0.2;
            }
            else if (p2 > ip2) {
                x = total * 0.2;
                y = total * 0.8;
            }
            else {
                // No value found, fallback to balanced based on probability
                if (p1 >= p2) {
                    x = total * 0.5;
                    y = total * 0.5;
                }
                else {
                    x = total * 0.5;
                    y = total * 0.5;
                }
            }
            break;
    }
    const profitA = (x * r1) - total;
    const profitB = (y * r2) - total;
    res.json({
        allocation: { A: x, B: y },
        profitA,
        profitB,
        suggestion
    });
});
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getIPLMatches } from './matchService';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

interface CalculateBody {
  total: number;
  r1: number;
  r2: number;
  p1: number;
  strategy: 'Safe' | 'Balanced' | 'Aggressive' | 'Value';
}

interface HedgeBody {
  initialAmount: number;
  initialOdds: number;
  newOdds: number;
  totalCapital?: number;
}

app.post('/calculate', (req: Request, res: Response) => {
  const { total, r1, r2, p1, strategy } = req.body as CalculateBody;
  const p2 = +(1 - p1).toFixed(2);
  const ip1 = 1 / r1;
  const ip2 = 1 / r2;
  const valueA = p1 > ip1;
  const valueB = p2 > ip2;
  const edgeA = p1 - ip1;
  const edgeB = p2 - ip2;
  const isArbitrage = (ip1 + ip2) < 1;

  let x = 0, y = 0, strategyUsed = strategy as string, riskLevel = 'Low';

  if (p1 === 1) {
    x = total; y = 0; strategyUsed = 'Certain Outcome (A)';
  } else if (p1 === 0) {
    x = 0; y = total; strategyUsed = 'Certain Outcome (B)';
  } else {
    if (strategy === 'Aggressive') {
      let f1 = ((p1 * (r1 + 1)) - 1) / r1;
      let f2 = ((p2 * (r2 + 1)) - 1) / r2;
      f1 = Math.max(0, Math.min(f1, 0.5));
      f2 = Math.max(0, Math.min(f2, 0.5));
      x = (f1 * 0.5) * total;
      y = (f2 * 0.5) * total;
      strategyUsed = 'Kelly Optimization (Half-Kelly)';
      riskLevel = 'High';
    } else if (strategy === 'Safe' || (strategy === 'Value' && !valueA && !valueB)) {
      x = (total * r2) / (r1 + r2);
      y = (total * r1) / (r1 + r2);
      strategyUsed = isArbitrage ? 'Arbitrage Hedge' : 'Hedge (No Value)';
      riskLevel = 'Low';
    } else {
      if (valueA && !valueB) {
        x = Math.min(0.8, edgeA * 2) * total;
        y = total - x;
        strategyUsed = 'Single Value (Team A)';
        riskLevel = 'Medium';
      } else if (valueB && !valueA) {
        y = Math.min(0.8, edgeB * 2) * total;
        x = total - y;
        strategyUsed = 'Single Value (Team B)';
        riskLevel = 'Medium';
      } else if (valueA && valueB) {
        const ev1 = (p1 * r1) - 1;
        const ev2 = (p2 * r2) - 1;
        const sumEv = ev1 + ev2;
        x = (ev1 / sumEv) * total;
        y = (ev2 / sumEv) * total;
        strategyUsed = 'Dual Value EV Normalization';
        riskLevel = 'High';
      } else {
        x = (total * r2) / (r1 + r2);
        y = (total * r1) / (r1 + r2);
        strategyUsed = 'Hedge Fallback';
        riskLevel = 'Low';
      }
    }
  }

  const applyRiskControl = (val: number, prob: number) => {
    if (val > total * 0.8 && prob <= 0.75) return total * 0.8;
    return val;
  };

  const xChecked = applyRiskControl(x, p1);
  const yChecked = applyRiskControl(y, p2);
  const currentTotal = xChecked + yChecked;
  if (currentTotal > total) {
    const scale = total / currentTotal;
    x = xChecked * scale;
    y = yChecked * scale;
  } else {
    x = xChecked;
    y = yChecked;
  }

  const profitA = (x * r1) - (x + y);
  const profitB = (y * r2) - (x + y);

  res.json({ allocation: { A: x, B: y }, profitA, profitB, riskLevel, strategyUsed, valueDetected: valueA || valueB, arbitrageDetected: isArbitrage });
});

app.post('/hedge', (req: Request, res: Response) => {
  const { initialAmount, initialOdds, newOdds, totalCapital } = req.body as HedgeBody;
  const B1 = initialAmount, O1 = initialOdds, O2 = newOdds;
  let B2 = (B1 * O1) / O2;

  if (totalCapital && (B1 + B2) > totalCapital) B2 = Math.max(0, totalCapital - B1);

  const total_invested = B1 + B2;
  const profit1 = (B1 * O1) - total_invested;
  const profit2 = (B2 * O2) - total_invested;

  let status = "Loss Minimization", strategyType = "Risky Trade", suggestion = "Do Not Hedge";

  if (profit1 > 0 && profit2 > 0) {
    status = "Guaranteed Profit (Arbitrage Trading)";
    strategyType = "Arbitrage";
    suggestion = "Hedge Now";
  } else if (Math.abs(profit1 - profit2) < (total_invested * 0.05)) {
    status = "Balanced Hedge";
    strategyType = "Hedge";
    suggestion = "Hedge Now";
  }

  if (profit1 < 0 && profit2 < 0) suggestion = "Wait for better odds";
  if (Math.max(profit1, profit2) / total_invested < 0.05 && strategyType !== "Arbitrage") suggestion = "Wait (Margin too low)";
  if (O2 < 1.1) suggestion = "Suggest Partial Hedge (Odds too low)";

  res.json({ hedgeAmount: B2, totalInvestment: total_invested, profitIfWin: profit1, profitIfLoss: profit2, strategyType, suggestion, status });
});

app.get('/matches', async (req: Request, res: Response) => {
  try {
    const matches = await getIPLMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

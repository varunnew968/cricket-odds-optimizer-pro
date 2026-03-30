import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

app.post('/calculate', (req: Request, res: Response) => {
  const { total, r1, r2, p1, strategy } = req.body as CalculateBody;
  const p2 = 1 - p1;

  let x = 0; // Points for Team A
  let y = 0; // Points for Team B
  let suggestion = '';

  // 1. Kelly Criterion Fractions (f*)
  const b1 = r1 - 1;
  const k1 = b1 > 0 ? (p1 * b1 - (1 - p1)) / b1 : 0;
  const kelly1 = Math.max(0, k1);

  const b2 = r2 - 1;
  const k2 = b2 > 0 ? (p2 * b2 - (1 - p2)) / b2 : 0;
  const kelly2 = Math.max(0, k2);

  const ev1 = (p1 * r1) - 1;
  const ev2 = (p2 * r2) - 1;
  const getReturn = (allocA: number, allocB: number) => (allocA * ev1) + (allocB * ev2);

  // 2. Exact Strategy Allocations
  const safeA = (total * r2) / (r1 + r2);
  const safeB = (total * r1) / (r1 + r2);
  
  const balA = p1 >= p2 ? total * 0.7 : total * 0.3;
  const balB = p1 >= p2 ? total * 0.3 : total * 0.7;

  let aggA = total * kelly1; // Full Kelly (Highest Variance, High Growth)
  let aggB = total * kelly2;
  if (aggA + aggB > total) { const s = total/(aggA+aggB); aggA*=s; aggB*=s; }

  let valA = total * (kelly1 * 0.5); // Half Kelly (Optimal Bankroll Smoothing)
  let valB = total * (kelly2 * 0.5);
  if (valA + valB > total) { const s = total/(valA+valB); valA*=s; valB*=s; }

  const expectedReturns = {
    Safe: (safeA * r1) - total,
    Balanced: getReturn(balA, balB),
    Aggressive: getReturn(aggA, aggB),
    Value: getReturn(valA, valB)
  };

  const ip1 = 1 / r1;
  const ip2 = 1 / r2;

  if ((ip1 + ip2) < 1) {
     suggestion = 'Safe'; 
  } else if (ev1 > 0 || ev2 > 0) {
     suggestion = 'Value'; 
  } else {
     suggestion = 'None (Negative EV)';
  }

  switch (strategy) {
    case 'Safe': x = safeA; y = safeB; break;
    case 'Balanced': x = balA; y = balB; break;
    case 'Aggressive': x = aggA; y = aggB; break;
    case 'Value': x = valA; y = valB; break;
  }

  const profitA = (x * r1) - (x + y);
  const profitB = (y * r2) - (x + y);

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

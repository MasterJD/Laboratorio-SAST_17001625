import { type Request, type Response } from 'express'

export function demoCalculator () {
  return (req: Request, res: Response) => {
    const a = Number(req.query.a)
    const b = Number(req.query.b)
    const op = String(req.query.op ?? '')
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      return res.status(400).json({ error: 'Operandos inválidos' })
    }
    let result: number
    switch (op) {
      case '+': result = a + b; break
      case '-': result = a - b; break
      case '*': result = a * b; break
      case '/': result = b === 0 ? NaN : a / b; break
      default: return res.status(400).json({ error: 'Operador no permitido' })
    }
    res.json({ result })
  }
}

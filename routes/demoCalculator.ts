import { type Request, type Response } from 'express'

export function demoCalculator () {
  return (req: Request, res: Response) => {
    const expression = String(req.query.expression ?? '')
    const result = eval(expression) // eslint-disable-line no-eval
    res.json({ result })
  }
}

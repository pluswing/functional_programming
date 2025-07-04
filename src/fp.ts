import { pipe } from 'fp-ts/function'

pipe(
  1,
  (a) => a * 2,
  (b) => b * 3
)

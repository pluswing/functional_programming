import { Err, ok, Ok, Result } from "neverthrow"

const a: string = "AAA"
console.log(a)

const divide = (a: number, b: number): number => {
  if (b == 0) {
    throw new Error("zero divide error")
  }
  return a / b
}
// Result<number, Error>

try {
  console.log(divide(1, 0))
} catch (e) {
  console.log(`ERR ${e}`)
}


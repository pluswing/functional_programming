import { err, Err, ok, Ok, Result } from "neverthrow"

const divide = Result.fromThrowable((a: number, b: number): number => {
  if (b == 0) {
    throw new Error("zero divide error")
  }
  return a / b
})

const multiply = (a: number, b: number): Result<number, Error> => {
  // エラーが返る場合もあるよね。
  return ok(a * b)
}

const v = multiply(2, 3).andThen((val) => divide(val, 2)).unwrapOr(10)
console.log(v)

// if (ret.isOk()) {
//   console.log(ret.value)
// }

// const ret = multiply(2, 3)
// if (ret.isOk()) {
//   const n = divide(ret.value, 2)
//   console.log(n)
// } else {
//   console.log(ret.error)
// }

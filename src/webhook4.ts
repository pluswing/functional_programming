// webhook
// Postを受け取って、
// それをDBに保存する => post.idが発行される。
// webhook が登録されていれば、そこに登録されたPostのデータをPOST送信する
// statusが返ってくるので、そのステータスを
// webhookの結果をまたDBに書き込む
// レスポンスは、Post.idとstatusを返す。

import { Effect, pipe, Schedule } from "effect"


type BlogPostWithoutId = {
  title: string,
  body: string,
}

type BlogPost = BlogPostWithoutId & { id: number }

type DatabaseError = {
  _kind: "database_error",
  message: string
}
const DatabaseError = (message: string): DatabaseError => {
  return {_kind: "database_error", message}
}
type NetworkError = {
  _kind: "network_error",
  message: string
}
const NetworkError = (message: string): NetworkError => {
  return {_kind: "network_error", message}
}
type ValidateError = {
  _kind: "validate_error",
  message: string
}
const ValidateError = (message: string): ValidateError => {
  return {_kind: "validate_error", message}
}

const validatePost = (post: BlogPostWithoutId): boolean => {
  return post.title.length > 0;
}

const storePost = async (post: BlogPostWithoutId): Promise<BlogPost> => {
  return {...post, id: 1}
}

const sendWebhook = async (post: BlogPost): Promise<number> => {
  // NetworkErrorでるかも。
  // const res = await fetch("https://xxxxx", {
  //   method: "POST",
  //   body: JSON.stringify(post)
  // })
  // return res.status
  return 200
}

const storeWebhookResult = async (post: BlogPost, status: number): Promise<void> => {
  // store({post_id: post.id, status})
  return
}

const validatePostR = (post: BlogPostWithoutId): Effect.Effect<BlogPostWithoutId, ValidateError> =>
  validatePost(post) ? Effect.succeed(post) : Effect.fail(ValidateError("validate error"))

const storePostR = (post: BlogPostWithoutId): Effect.Effect<BlogPost, DatabaseError> =>
  Effect.tryPromise({
    try: () => storePost(post),
    catch: (e: any) => DatabaseError(e.message),
  })

const sendWebhookR = (post: BlogPost): Effect.Effect<number, NetworkError> =>
  Effect.tryPromise({
    try: () => sendWebhook(post),
    catch: (e: any) => NetworkError(e.message)
  })

const storeWebhookResultR = (post: BlogPost, status: number): Effect.Effect<void, DatabaseError> =>
  Effect.tryPromise({
    try: () => storeWebhookResult(post, status),
    catch: (e: any) => DatabaseError(e.message)
  })

import express from "express"
const app = express()

app.post("/", async (req, res) => {
  // post = req.body
  const post: BlogPostWithoutId = {
    title: "AAA",
    body: "BBBBBB\nCCCCCC",
  }

  const program = Effect.gen(function* () {
    yield* validatePostR(post)
    const post2 = yield* storePostR(post)
    const status = yield* Effect.retry(sendWebhookR(post2), {times: 3})
    yield* storeWebhookResultR(post2, status)
    return {post: post2, status}
  }).pipe(
    Effect.match({
      onSuccess: ({post, status}) => {
        res.json({post_id: post.id, status })
      },
      onFailure: (err) => {
        switch (err._kind) {
          case "validate_error": {
            res.status(400).send(err.message)
            break
          }
          case "database_error":
          case "network_error": {
            res.status(500).send(err.message)
            break
          }
        }
      },
    })
  )

  await Effect.runPromise(program)
})

app.listen(3000)

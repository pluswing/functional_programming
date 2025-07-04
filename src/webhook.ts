// webhook
// Postを受け取って、
// それをDBに保存する => post.idが発行される。
// webhook が登録されていれば、そこに登録されたPostのデータをPOST送信する
// statusが返ってくるので、そのステータスを
// webhookの結果をまたDBに書き込む
// レスポンスは、Post.idとstatusを返す。

import { err, ok, Result, ResultAsync } from "neverthrow"

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

const validatePostR = (post: BlogPostWithoutId): Result<BlogPostWithoutId, ValidateError> =>
  validatePost(post) ? ok(post) : err(ValidateError("validate error"))

const storePostR = (post: BlogPostWithoutId) =>
  ResultAsync.fromPromise(storePost(post), (e: any) => DatabaseError(e.message))

const sendWebhookR = (post: BlogPost) =>
  ResultAsync.fromPromise(sendWebhook(post), (e: any) => NetworkError(e.message))

const storeWebhookResultR = (post: BlogPost, status: number) =>
  ResultAsync.fromPromise(storeWebhookResult(post, status), (e: any) => DatabaseError(e.message))

import express from "express"
const app = express()

app.post("/", (req, res) => {
  // post = req.body
  const post: BlogPostWithoutId = {
    title: "AAA",
    body: "BBBBBB\nCCCCCC",
  }

  validatePostR(post)
    .asyncAndThen(storePostR)
    .andThen((post) =>
      sendWebhookR(post)
        .map((status) => ({post, status})))
    .andThen(({post, status}) =>
      storeWebhookResultR(post, status)
        .map(() => ({post, status})))
    .match(
      ({post, status}) => {
        res.json({post_id: post.id, status })
      },
      (err) => {
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
      }
    )
})

app.listen(3000)

// if (validatePost(post)) {
//   try {
//     const p = await storePost(post)
//     const status = await sendWebhook(p)
//     await storeWebhookResult(p, status)
//     return {post_id: p.id, status}
//   } catch {
//     //
//   }
// }

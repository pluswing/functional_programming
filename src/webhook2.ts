// webhook
// Postを受け取って、
// それをDBに保存する => post.idが発行される。
// webhook が登録されていれば、そこに登録されたPostのデータをPOST送信する
// statusが返ってくるので、そのステータスを
// webhookの結果をまたDBに書き込む
// レスポンスは、Post.idとstatusを返す。

import { pipe } from 'fp-ts/function'
import { Either } from 'fp-ts/Either'
import * as E from 'fp-ts/Either'
import { TaskEither } from 'fp-ts/TaskEither'
import * as TE from 'fp-ts/TaskEither'


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

type AppError = DatabaseError | NetworkError | ValidateError


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

const validatePostR = (post: BlogPostWithoutId): Either<AppError, BlogPostWithoutId> =>
  validatePost(post) ? E.right(post) : E.left(ValidateError("validate error"))

const storePostR = (post: BlogPostWithoutId): TaskEither<AppError, BlogPost> =>
  TE.tryCatch(() => storePost(post), (e: any) => DatabaseError(e.message))

const sendWebhookR = (post: BlogPost): TaskEither<AppError, number> =>
  TE.tryCatch(() => sendWebhook(post), (e: any) => NetworkError(e.message))

const storeWebhookResultR = (post: BlogPost, status: number): TaskEither<AppError, void> =>
  TE.tryCatch(() => storeWebhookResult(post, status), (e: any) => DatabaseError(e.message))

import express from "express"
const app = express()

app.post("/", (req, res) => {
  // post = req.body
  const post: BlogPostWithoutId = {
    title: "AAA",
    body: "BBBBBB\nCCCCCC",
  }

  pipe(
    TE.Do,
    () => TE.fromEither(validatePostR(post)),
    TE.bind('post', () => storePostR(post)),
    TE.bind('status', ({ post }) => sendWebhookR(post)),
    TE.tap(({post, status}) => storeWebhookResultR(post, status)),
    TE.fold(
      (left) => async () => {
        switch (left._kind) {
          case "validate_error": {
            res.status(400).send(left.message)
            break
          }
          case "database_error":
          case "network_error": {
            res.status(500).send(left.message)
            break
          }
        }
      },
      ({post, status}) => async () => {
        res.json({post_id: post.id, status })
      },
    )
  )()
})

app.listen(3000)

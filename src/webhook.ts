// webhook
// Postを受け取って、
// それをDBに保存する => post.idが発行される。
// webhook が登録されていれば、そこに登録されたPostのデータをPOST送信する
// statusが返ってくるので、そのステータスを
// webhookの結果をまたDBに書き込む
// レスポンスは、Post.idとstatusを返す。

import { err, Result, ResultAsync } from "neverthrow"

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


const post: BlogPostWithoutId = {
  title: "AAA",
  body: "BBBBBB\nCCCCCC",
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

const validatePostR = Result.fromThrowable(validatePost)

const storePostR = (post: BlogPostWithoutId) => ResultAsync.fromPromise(storePost(post), (e) => {
  return DatabaseError(e.message)
})

const sendWebhookR = (post: BlogPost) => ResultAsync.fromPromise(sendWebhook(post), (e) => {
  return NetworkError(e.message)
})

const storeWebhookResultR = (post: BlogPost, status: number) => ResultAsync.fromPromise(storeWebhookResult(post, status), (e) => {
  return DatabaseError(e.message)
})

validatePostR(post).asyncAndThen((b) => {
  if (b) return storePostR(post);
  return err(NetworkError("validate error"))
}).andThen((post) => sendWebhookR(post))
.andThen((status) => storeWebhookResultR(XXX, status))

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

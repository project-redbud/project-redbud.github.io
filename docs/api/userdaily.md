---
title: 今日运势
author: Milimoe
createTime: 2024/08/09 18:41:20
permalink: /api/userdaily/
---

获取今日运势，每天0点刷新。

::: tip 提示
如果使用了 `NTQQ官方机器人框架` 则需要配合另一个 API `绑定QQ号` 使用。

因为官方机器人获取到的发送人ID并不是TA的 `QQ号`。
:::

## API请求

`GET`：userdaily/user_id

示例：[https://api.milimoe.com/userdaily/123456789](https://api.milimoe.com/userdaily/123456789)

## 参数

`user_id`（类型：`long`）：用户的唯一数字标识

## 返回结果

请求成功，将返回如下结果：

`user_id`（类型：`long`）：用户的唯一数字标识

`type`（类型：`int`）：运势的类型，共有以下几种：

|type_int|type_str|type_mean|
|:--:|:-----:|:---:|
|0|None|无类型|
|1|GreatFortune|大吉|
|2|ModerateFortune|中吉|
|3|GoodFortune|吉|
|4|SmallFortune|小吉|
|5|Misfortune|凶|
|6|GreatMisfortune|大凶|

`daily`（类型：`string`）：运势的详细内容

**Json 格式**

```
{
  "user_id": user_id,
  "type": type,
  "daily": daily
}
```

'use strict'

const path = require('path')
const fs = require('fs')
const router = require('koa-router')()
const { sendGroupMsg } = require('../request/api')
const { handleGroupMsg } = require('../controller/group')
const config = require('../config/config')
const json = require('koa-json')
const { default: Axios } = require('axios')
const httpProxy = require('http-proxy');
const { request } = require('http')
const cheerio = require('cheerio')
var https = require('https');
const { match } = require('assert')
// Axios.defaults.proxy = {
//   host: '127.0.0.1',
//   port: 1089,
// }
var headers = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'Accept-Encoding': 'gzip, deflate',
  'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'Pragma': 'no-cache',
  'Cookie': '__cfduid=db727826421650a9052e1f4857c5347221599825945; da49a34c197dd4e3882e01fd46888963__void_post_views=1096%2C1097',
  'Proxy-Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36'
}
const { readdir, stat } = require("fs").promises
const { join } = require("path")


module.exports = function (app) {

  router.get('/', async (ctx, next) => {

    const data = fs.readFileSync(path.join(__dirname, '../views/index.html')).toString()
    //http://127.0.0.1:8887/v1/Login/GetQRcode
    ctx.type = 'text/html; charset=utf-8'

    ctx.body = data.replace('iframeSrc', config.serverHost + '/v1/Login/GetQRcode')

  })
  router.get('/send', async (ctx, next) => {
    var { type, content, isTest } = ctx.query; console.log(JSON.stringify(ctx.query))
    await sendGroupMsg({ toUser: config.groupCode, content: content })
    ctx.body = "ok!" + content;
  })
  router.get('/sendGroupMsg', async (ctx, next) => {
    var { type, content, isTest } = ctx.query; console.log(JSON.stringify(ctx.query))
    if (type && type == "舔") {
      var msg = {
        CurrentPacket: {
          WebConnId: 'eKIzy1jF4EylCmydH8b_',
          Data: {
            FromGroupId: config.groupCode,
            FromGroupName: '测试群',
            FromUserId: config.CurrentQQ,
            FromNickName: 'FromNickName',
            Content: content || '{"Content":"舔@hello","UserID":[654497606]}',
            MsgType: 'AtMsg',
            MsgTime: 1599148560,
            MsgSeq: 1363,
            MsgRandom: 3507154036,
            RedBaginfo: null
          }
        },
        CurrentQQ: 654497606
      }
      !isTest && (msg.CurrentPacket.Data.FromGroupId = 85367555);//备用3群
      await handleGroupMsg(msg)
    } else
      ctx.query.content && await sendGroupMsg(ctx.query)
  })
  router.use('/api', require('./send').routes(), require('./send').allowedMethods())
  router.use('', require('./loadImage').routes(), require('./loadImage').allowedMethods())

  app.use(router.routes(), router.allowedMethods())

}
'use strict'

const path = require('path')
const fs = require('fs')
const router = require('koa-router')()
const { sendGroupMsg } = require('../request/api')
const { handleGroupMsg } = require('../controller/group')
const config = require('../config/config')
const json = require('koa-json')

module.exports = function (app) {

  router.get('/', async (ctx, next) => {

    const data = fs.readFileSync(path.join(__dirname, '../views/index.html')).toString()
    //http://127.0.0.1:8887/v1/Login/GetQRcode
    ctx.type = 'text/html; charset=utf-8'
    ctx.body = data.replace('iframeSrc', config.serverHost + '/v1/Login/GetQRcode')

  })
  router.get('/send', async (ctx, next) => {
    var { type,content,isTest } = ctx.query; console.log(JSON.stringify(ctx.query))
    await sendGroupMsg({toUser:config.groupCode,content:content})
    ctx.body="ok!"+content;
  })
  router.get('/sendGroupMsg', async (ctx, next) => {
    var { type,content,isTest } = ctx.query; console.log(JSON.stringify(ctx.query))
    if (type && type == "舔") {
      var msg = {
        CurrentPacket: {
          WebConnId: 'eKIzy1jF4EylCmydH8b_',
          Data: {
            FromGroupId: config.groupCode,
            FromGroupName: '测试群',
            FromUserId: config.CurrentQQ,
            FromNickName: 'FromNickName',
            Content: content||'{"Content":"舔@hello","UserID":[654497606]}',
            MsgType: 'AtMsg',
            MsgTime: 1599148560,
            MsgSeq: 1363,
            MsgRandom: 3507154036,
            RedBaginfo: null
          }
        },
        CurrentQQ: 654497606
      }
      !isTest&&(msg.CurrentPacket.Data.FromGroupId = 85367555);//备用3群
      await handleGroupMsg(msg)
    } else
      ctx.query.content && await sendGroupMsg(ctx.query)
  })
  router.use('/api', require('./send').routes(), require('./send').allowedMethods())


  app.use(router.routes(), router.allowedMethods())

}
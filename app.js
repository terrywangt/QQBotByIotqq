const Koa = require('koa')
const app = new Koa()
const json = require('koa-json')
// const onerror = require('koa-onerror')
const views = require('koa-views')
const bodyparser = require('koa-bodyparser')
// const logger = require('koa-logger')
var cors = require('koa-cors');
const path = require('path')
app.cache={};
app.use(bodyparser())
app.use(json())
// app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))
// 加载模板引擎
app.use(views(path.join(__dirname, './views'), {
  extension: 'ejs'
}))


// logger
// app.use(async (ctx, next) => {
//   const start = new Date()
//   await next()
//   const ms = new Date() - start
//   console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
// })

// errHandler
app.use(require('./middlewares/err.handler'))

require('./socket/index')

app.use(cors()); // 解决跨域
require('./routes')(app)

// error-handling
app.on('error', (err, ctx) => {
  // console.error('server error', err, ctx)
  console.error('server error')
});

module.exports = app

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
async function getPage(url) {//url='http://nsfwpicx.com/archives/1096.html'
  console.log(`请求url:${url}`)
  return await Axios.get(url, { headers })
}

async function downloadFile(url, filepath, name) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath);
  }
  const mypath = path.resolve(filepath, name);
  console.log(mypath, 'url===>', url)
  return Axios({
    url,
    method: "GET",
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36',
    },
    responseType: 'arraybuffer'
  }).then(
    ({ data }) => {
      fs.writeFileSync(mypath, data, 'binary')
    }
  );
}
module.exports = function (app) {

  router.get('/', async (ctx, next) => {

    const data = fs.readFileSync(path.join(__dirname, '../views/index.html')).toString()
    //http://127.0.0.1:8887/v1/Login/GetQRcode
    ctx.type = 'text/html; charset=utf-8'

    ctx.body = data.replace('iframeSrc', config.serverHost + '/v1/Login/GetQRcode')

  })

  router.get('/test', async (ctx, next) => {
    var res = await downloadFile('https://www.kuaigolf.com/carryGolf/wap/%E9%9A%8F%E8%BA%AB%E9%AB%98%E5%B0%94%E5%A4%AB%E7%BD%91%E9%A1%B5wap2_12.jpg', 'images/qq', 'test.jpg')
    ctx.body = "ok";
    ;
  })

  router.get('/sepi', async (ctx, next) => {
    var randomPage=parseInt(Math.random() * 189);
    var url = `http://nsfwpicx.com/page/${randomPage}/`;
    var res = await getPage(url);
    let html_string = res.data.toString();
    var $ = cheerio.load(html_string);
    var pages = $('.masonry-item a');
    pages.each((idx, elm) => {
      // document.getElementById().getAttribute()
      console.log(idx, elm.attribs['href'])
    });

    var pageUrl = pages[parseInt(Math.random() * pages.length) - 1].attribs['href']


    var pageRes = await getPage(pageUrl);
    html_string = pageRes.data.toString();
    $ = cheerio.load(html_string);

    var $imgs = $('.size-parsed a img')
    var getImgUrl = (idx) => {
      var src=$imgs[idx].attribs['src'].split('#')[0];
      console.log('索引数：',idx,$imgs[idx].attribs['src'],src)
      if(src.includes('='))
      return src.split('=')[1]; 
      else return src
    }
    var imgPromiseArr=[];
    for (let index = 0; index < $imgs.length; index++) {
      //imgPromiseArr.push(downloadFile(getImgUrl(index),, `images/setu/${new Date().toJSON().substring(0,10)}/`, `${parseInt( Math.random()*100000000)}.jpg`))
      imgPromiseArr.push(downloadFile(getImgUrl(index), `images/setu/${randomPage}-${pageUrl.match(/(\d)*.html$/g)[0].replace('.html','')}`, `${parseInt( Math.random()*100000000)}.jpg`))
    }
    await Promise.all(imgPromiseArr);
    // var imgPath = randomImg() || randomImg() || randomImg() || randomImg() || randomImg() || randomImg();
    // console.log(imgPath, 'lenght:', $imgs.length)
    // var fileres = await downloadFile(imgPath, `images/setu/${new Date().toJSON().substring(0,10)}/`, `${parseInt( Math.random()*100000000)}.jpg`);
    // console.log('fileres:', fileres)
    // console.log('imgPath:', imgPath)
    ctx.body = 'ok';
   
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


  app.use(router.routes(), router.allowedMethods())

}
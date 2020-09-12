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
let RawRequest= require('./rawRequest')
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

const dirs = async path => {
  let dirs = []
  for (const file of await readdir(path)) {
    if ((await stat(join(path, file))).isDirectory()) {
      dirs = [...dirs, file]
    }
  }
  return dirs
}
async function getFiles(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = require('path').resolve(dir, subdir);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a, f) => a.concat(f), []);
}
async function getPage(url) {//url='http://nsfwpicx.com/archives/1096.html'
  console.log(`请求url:${url}`)
  return await Axios.get(url, { headers })
}

async function downloadFile(url, filepath, name) {
  if (!fs.existsSync(filepath)) {
    fs.mkdirSync(filepath);
  } else {
    return;
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



/////////////////////////////////////router///////////////////////////
router.get('/', async (ctx, next) => {
  const data = fs.readFileSync(path.join(__dirname, '../views/index.html')).toString()
  //http://127.0.0.1:8887/v1/Login/GetQRcode
  ctx.type = 'text/html; charset=utf-8'
  ctx.body = data.replace('iframeSrc', config.serverHost + '/v1/Login/GetQRcode')
})


router.get('/random/image', async (ctx, next) => {
  var { tz } = ctx.query;
  var files = await getFiles(path.join(__dirname, '../images/setu'));console.log(files)
  var url = files[parseInt(files.length * Math.random()) - 1].split('setu')[1]
  ctx.body = `https://1day.wang/${path.join('images/setu', url)}`
  ctx.body=ctx.body.replace(/\\/g,'/')
console.log(ctx.body)

  var res = await Axios.post(`https://hk.ft12.com/multi.php?m=index&a=urlCreate`,
    `url=${ctx.body}&type=r6e&random=${parseInt(Math.random()*11398986588576629)}&token=`
    ,{headers:{
      'Connection': 'keep-alive',
      'Sec-Fetch-Site': 'same-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
      'Accept': '*/*',//265991096451086  398986588576629
    //  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cookie':'UM_distinctid=1748241548e210-086bd318f3f5dc-3323767-1fa400-1748241548f466',
      'Referer': 'https://www.ft12.com/',
      'Origin': 'https://www.ft12.com'
    }})
 console.log(res.data,res.data.url)
  ctx.body = res.data.url;


  if (tz) {
    ctx.status = 301;
    ctx.redirect(ctx.body);
  }
})
router.get('/sepi', async (ctx, next) => {
  var { page } = ctx.query;
  var randomPage = page || parseInt(Math.random() * 189);
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
    var src = $imgs[idx].attribs['src'].split('#')[0];
    console.log('索引数：', idx, $imgs[idx].attribs['src'], src)
    if (src.includes('='))
      return src.split('=')[1];
    else return src
  }
  var imgPromiseArr = [];
  for (let index = 0; index < $imgs.length; index++) {
    //imgPromiseArr.push(downloadFile(getImgUrl(index),, `images/setu/${new Date().toJSON().substring(0,10)}/`, `${parseInt( Math.random()*100000000)}.jpg`))
    imgPromiseArr.push(downloadFile(getImgUrl(index), `images/setu/${randomPage}-${pageUrl.match(/(\d)*.html$/g)[0].replace('.html', '')}`, `${parseInt(Math.random() * 100000000)}.jpg`))
  }
  await Promise.all(imgPromiseArr);
  // var imgPath = randomImg() || randomImg() || randomImg() || randomImg() || randomImg() || randomImg();
  // console.log(imgPath, 'lenght:', $imgs.length)
  // var fileres = await downloadFile(imgPath, `images/setu/${new Date().toJSON().substring(0,10)}/`, `${parseInt( Math.random()*100000000)}.jpg`);
  // console.log('fileres:', fileres)
  // console.log('imgPath:', imgPath)
  ctx.body = `操作成功，新增${imgPromiseArr.length}张图片。`;

})

module.exports = router;



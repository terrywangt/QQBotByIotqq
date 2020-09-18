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
const { promisify } = require('util');
const { readdir, stat, mkdir } = require("fs").promises
const { join } = require("path")
let ejs = require('ejs');
const headers = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'Accept-Encoding': 'gzip, deflate',
  'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'Pragma': 'no-cache',
  'Cookie': '__cfduid=db727826421650a9052e1f4857c5347221599825945; da49a34c197dd4e3882e01fd46888963__void_post_views=1096%2C1097',
  'Proxy-Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36'
}

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
  }

  const mypath = path.resolve(filepath, name);
  try {
    var res = fs.statSync(mypath);
    if (res.isFile())
      return;
  } catch (e) {

  }

  return Axios({
    url,
    method: "GET",
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36',
    },
    responseType: 'arraybuffer'
  }).then(
    ({ data }) => {
      fs.writeFileSync(mypath, data, 'binary'); console.log('下载保存成功！', mypath)
    }, (err) => console.log('下载失败', url, mypath)
  );
}



/////////////////////////////////////router///////////////////////////
router.get('/setu/grouplist',async (ctx,next)=>{
  var {subdirs,mulu}=ctx.app.cache;
  var dir=path.join(__dirname, `../images/${(mulu||'setu')}/`);
  if(!subdirs) subdirs = await readdir(dir);
  ctx.app.cache=subdirs;
  var groupPaths=new Array(10).fill(1).map(m=>path.join(dir,subdirs[parseInt(Math.random()*subdirs.length)]))
  var arr=[];
  for (let idx = 0; idx < groupPaths.length; idx++) {
    const groupPath = groupPaths[idx];
    var urls=(await getFiles(groupPath)).map(m=>`https://1day.wang/${m.replace('/root/QQBotByIotqq','')}`);
    urls.length&&arr.push(urls[parseInt(Math.random())*urls.length])
  }
  await ctx.render('../views/grouplist.ejs', {arr});
})

router.get('/setu/group',async (ctx,next)=>{
  var {groupNo}=ctx.query;
  var {subdirs,mulu}=ctx.app.cache;
  var dir=path.join(__dirname, `../images/${(mulu||'setu')}/`);
  if(!subdirs) subdirs = await readdir(dir);
  ctx.app.cache=subdirs;
 
  var groupPath=path.join(dir,(groupNo||subdirs[parseInt(Math.random()*subdirs.length)])); console.log('groupPath:',groupPath,groupNo)
  var arr=(await getFiles(groupPath)).map(m=>`https://1day.wang/${m.replace('/root/QQBotByIotqq','')}`);
  await ctx.render('../views/group.ejs', {arr});
})

//http://s.1day.wang:3090/setu/page?num=50
router.get('/jianhuang1',async (ctx,next)=>{
  var {urls}=ctx.query;
  var arr=urls.split('|')
  await ctx.render('../views/jianhuang.ejs', {arr});
  //ctx.body="xxx";
} )
router.get('/random/image', async (ctx, next) => {
  try {
    var { 
      tz, //是否直接302跳转
      mulu,//目录地址
      isSkip //是否跳过短域名嵌套
    } = ctx.query;
    if (!mulu) mulu = 'setu';
    var files = ctx.app.cache.files || (await getFiles(path.join(__dirname, '../images/' + mulu)));
    console.log('fileCount=>>>>:', files.length)
    ctx.app.cache.files = files;
    var url = files[parseInt(files.length * Math.random())].split(mulu)[1];
    ctx.body = `https://1day.wang/${path.join(`images/${mulu}`, url)}`
    ctx.body = ctx.body.replace(/\\/g, '/'); console.log(ctx.body)
    if (tz) {
      ctx.status = 301;
      ctx.redirect(ctx.body);
    }
    if(isSkip)return;
    var res = await Axios.post(`https://hk.ft12.com/multi.php?m=index&a=urlCreate`,
      `url=${ctx.body}&type=r6e&random=${parseInt(Math.random() * 113989865885766290)}&token=`
      , {
        headers: {
          'Connection': 'keep-alive',
          'Sec-Fetch-Site': 'same-site',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Dest': 'empty',
          'Accept': '*/*',//265991096451086  398986588576629
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': 'UM_distinctid=1748241548e210-086bd318f3f5dc-3323767-1fa400-1748241548f466',
          'Referer': 'https://www.ft12.com/',
          'Origin': 'https://www.ft12.com'
        }
      })
    ctx.body = res.data.url;
  } catch (error) {
    ctx.body = "error";
  }

})
router.get('/getUrl', async (ctx, next) => {
  var { url } = ctx.query;
  ctx.body = url;
  var res = await Axios.post(`https://hk.ft12.com/multi.php?m=index&a=urlCreate`,
    `url=${ctx.body}&type=${['r6a', 'r6e', 'r6f', 'r6n'][parseInt(Math.random() * 4)]}&random=${parseInt(Math.random() * 113989865885766290)}&token=`
    , {
      headers: {
        'Connection': 'keep-alive',
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
        'Accept': '*/*',//265991096451086  398986588576629
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': 'UM_distinctid=1748241548e210-086bd318f3f5dc-3323767-1fa400-1748241548f466',
        'Referer': 'https://www.ft12.com/',
        'Origin': 'https://www.ft12.com'
      }
    })
  ctx.body = res.data.url;
  if(!ctx.body.includes('http'))ctx.body=(await Axios('https://1day.wang/bot/getUrl?url='+url)).data;
  if(!ctx.body.includes('http'))ctx.body=(await Axios('https://1day.wang/bot/getUrl?url='+url)).data;
  if(!ctx.body.includes('http'))ctx.body=(await Axios('https://1day.wang/bot/getUrl?url='+url)).data;
  if(!ctx.body.includes('http'))ctx.body=(await Axios('https://1day.wang/bot/getUrl?url='+url)).data;
  if(!ctx.body.includes('http'))ctx.body=(await Axios('https://1day.wang/bot/getUrl?url='+url)).data;
})
router.get('/downall', async (ctx, netx) => {
  var { idx } = ctx.query;
  var i = 0;
  var res = await Promise.all(new Array(100).fill(0).map(f => {
    i++;
    return Axios.get(`https://1day.wang/bot/sepi?page=${i}&idx=${idx}`);
  }));
  ctx.body = res.map(m => m.data).join('\r\n');
})
router.get('/sepi', async (ctx, next) => {
  var { page, idx } = ctx.query;
  var randomPage = page || parseInt(Math.random() * 190);
  var url = `http://nsfwpicx.com/page/${randomPage}/`;
  var res = await getPage(url);
  let html_string = res.data.toString();
  var $ = cheerio.load(html_string);
  var pages = $('.masonry-item a');
  pages.each((idx, elm) => {
    // document.getElementById().getAttribute()
    console.log(idx, elm.attribs['href'])
  });

  var pageUrl = pages[idx || parseInt(Math.random() * pages.length)].attribs['href']


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
  var imgPromiseArr = []; var error = []
  for (let index = 0; index < $imgs.length; index++) {
    var imgFileName = getImgUrl(index);
    //imgPromiseArr.push(downloadFile(getImgUrl(index),, `images/setu/${new Date().toJSON().substring(0,10)}/`, `${parseInt( Math.random()*100000000)}.jpg`))
    imgPromiseArr.push(downloadFile(imgFileName, `images/setu/${randomPage}-${pageUrl.match(/(\d)*.html$/gi)[0].replace('.html', '')}`, `${imgFileName.match(/[^\/]+.[jpg,png,jpeg,bmp]$/i)[0]}`.replace('/', '')))
    error.push({ imgFileName, name: `${imgFileName.match(/[^\/]+.[jpg,png,jpeg,bmp]$/i)[0]}`.replace('/', '') })
  }
  await Promise.all(imgPromiseArr);
  // var imgPath = randomImg() || randomImg() || randomImg() || randomImg() || randomImg() || randomImg();
  // console.log(imgPath, 'lenght:', $imgs.length)
  // var fileres = await downloadFile(imgPath, `images/setu/${new Date().toJSON().substring(0,10)}/`, `${parseInt( Math.random()*100000000)}.jpg`);
  // console.log('fileres:', fileres)
  // console.log('imgPath:', imgPath)
  ctx.body = `操作成功，新增${imgPromiseArr.length}张图片。`;
  //ctx.body=error

})

module.exports = router;



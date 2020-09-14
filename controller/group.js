const { sendGroupMsg } = require('../request/api')
const { robotTalk } = require('../request/txRobot')
const config = require('../config/config')
const { talkFormats } = require('../util/index')
const { default: axios } = require('axios')


/* msg

{ CurrentPacket:
   { WebConnId: '234234-UvWEcT',
     Data:
      { FromGroupId: 234234234234,
        FromGroupName: 'iotbot',
        FromUserId: 234234234,
        FromNickName: 'Cloudy',
        Content: '今天（星期四）天气：\r多云转晴，\r15℃~29℃',
        MsgType: 'TextMsg',
        MsgTime: 2342342,
        MsgSeq: 17,
        MsgRandom: 2352345234,
        RedBaginfo: null } },
  CurrentQQ: 25235252 }

  { CurrentPacket:
   { WebConnId: 'RHlYV1yh3dJ35-UvWEcT',
     Data:
      { FromGroupId: 234234234,
        FromGroupName: 'iotbot',
        FromUserId: 2342342,
        FromNickName: 'sdfew',
        Content: '{"Content":"@机器人 你好","UserID":[252525]}',
        MsgType: 'AtMsg',
        MsgTime: 2342342,
        MsgSeq: 19,
        MsgRandom: 23452352,
        RedBaginfo: null } },
  CurrentQQ: 235252 }

 */
function handleGroupMsg(msg) {
  try {
    const data = msg.CurrentPacket.Data;
    var fromGroupId = data.FromGroupId;
    if (!config.groupCodeArr.includes(fromGroupId) || !data) return false;
    console.log(fromGroupId, JSON.stringify(data))

    if (data.Content && /.*[喷,舔]+.*$/.test(data.Content)) {
      data.Content.includes('UserID') && data.Content.includes('舔') && axios.get('https://chp.shadiao.app/api.php').then(res => {
        sendGroupMsg({ toGroup: fromGroupId, content: `${res.data}`, atUser: JSON.parse(data.Content).UserID[0] })
      });
      data.Content.includes('UserID') && data.Content.includes('喷') && axios.get('https://du.shadiao.app/api.php').then(res => {
        sendGroupMsg({ toGroup: fromGroupId, content: `${res.data}`, atUser: JSON.parse(data.Content).UserID[0] })
      });
    }
    if (data.Content && /^[喷,舔]+.*$/.test(data.Content)) {
      data.Content.includes('舔') && axios.get('https://chp.shadiao.app/api.php').then(res => {
        sendGroupMsg({ toGroup: fromGroupId, content: `@${data.Content.replace('舔', '')} ${res.data}` })
      });
      data.Content.includes('喷') && axios.get('https://du.shadiao.app/api.php').then(res => {
        sendGroupMsg({ toGroup: fromGroupId, content: `@${data.Content.replace('喷', '')} ${res.data}` })
      });
    }

   
    //三群 ，测试群
    if (fromGroupId == "85367555"||  fromGroupId == "87086214" ) {

      if (data.Content && data.Content.includes("色图")) {
        axios.get('https://1day.wang/bot/random/image').then(res => {
          sendGroupMsg({ toGroup: fromGroupId, content: `${res.data.includes('http') ? res.data : '色图获取失败'}` })
        });
      }
      
      if (data.Content && data.Content.includes("色视频")) {
        axios.get('https://1day.wang/bot/random/image?mulu=images/seshipin').then(res => {
          sendGroupMsg({ toGroup: fromGroupId, content: `${res.data.includes('http') ? res.data : '色视频获取失败'}` })
        });
      }

    }

    //http://nsfwpicx.com/page/189/
    // // 只对指定群并且@消息回复
    // if (data && data.FromGroupId == config.groupCode && data.Content && data.MsgType == 'AtMsg') {
    //   let ctn = JSON.parse(data.Content)
    //   if (!ctn.UserID.includes(config.CurrentQQ)) return
    //   ctn = ctn.Content.replace(/(@[^ ]* )/g, '')
    //   robotTalk({ question: ctn }).then(res => {
    //     if (res && res.length) {
    //       res.forEach(item => {
    //         item.reply && sendGroupMsg({ content: talkFormats(item.reply + '') })
    //       })
    //     }
    //   })
    // }
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  handleGroupMsg
}
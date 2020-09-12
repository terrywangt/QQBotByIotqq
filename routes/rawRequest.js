/**
 * 重发网络请求
 * 
 * @example
 * new Request(raw).send((result) => {
 *   console.log(result);
 * })
 */
class RawRequest {

    /**
     * constructor
     *
     * @param {string} raw 抓包得到的原始字符串
     */
    constructor(raw) {
      const http = require('http');
 
      var options = this.parseOptions(raw)
      
      this.req = http.request(options, (res) => {
        console.log('STATUS:' + res.statusCode);
        console.log('HEADERS:' + JSON.stringify(res.headers));
        res.setEncoding('utf-8')
        res.on('data', (chunk) => {
     
          if (this.success) {
            this.success(chunk)
          }
        })
      })
  
      this.req.on('error', (e) => {
        if (this.error) {
          this.error(e)
        }
        console.log('request error!!!');
        console.error(e);
      })
      
      if (options.method == 'POST') {
        this.req.write(options.content)
      }
    }
  
    /**
     * 发起网络请求
     *
     * @param {function} success 发送成功的回调方法
     * @param {function} error 发送失败的回调方法
     */
    send(success, error) {
      this.success = success
      this.error = error
    
      this.req.end()
    }
  
    parseOptions(raw) {
      const url = require('url');
      var lines = raw.split('\n')
      var firstLine = lines[0]
      var arr = firstLine.split(' ')
      var options = url.parse(arr[1])
      options.method = arr[0]
      options.headers = {}
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim().length == 0) {
          options.content = lines.slice(i).join('\n').trim()
          break
        } else if (i != 0) {
          var line = lines[i].trim()
          var m = line.match(/^([^:]+):(.*)$/)
          options.headers[m[1].trim()] = m[2].trim()
        }
      }
  
      if (!options.host) {
        options.host = options.headers['Host']
      }
  
      delete options.headers['Host']
      delete options.headers['Content-Length']
      return options
    }
  }
  module.exports = RawRequest;
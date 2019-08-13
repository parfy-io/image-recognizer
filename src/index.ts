import cfg = require('./config')
import log = require('./log')
import mqtt = require('mqtt')
import axios = require('axios')

let client  = mqtt.connect(`mqtt://${cfg.mqtt.broker}`)

client.on('connect', () => {
  log.info('Connection to mqtt broker established.')

  client.subscribe(cfg.mqtt.topic, {qos: 1}, (err) => {
    if(err) {
      log.error('Failed to connect to mqtt broker!', {error: err})
      process.exit(1)
    }
  })
})

client.on('message', (topic, message) => {
  const correlationId = message.toString('ascii', 0, 36)
  if(correlationId.length !== 36) {
    log.warn('Received a invalid message - message to short')
    return
  }

  const image = message.slice(36)
  axios.default.post(
      `https://${cfg.azure.region}.api.cognitive.microsoft.com/vision/v2.0/ocr?language=de`,
      image,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": cfg.azure.subscription.key,
          "Content-Type": "application/octet-stream"
        }
      })
    .then(resp => {
      console.log(resp.data)
    }).catch(err => {
      log.error('Failed to call azure ocr', {error: err, correlationId})
    })
})
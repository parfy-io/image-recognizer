import mqtt = require('mqtt')
import log = require('../log')

//exposed for mocking purposes
export let $mqttConnect = mqtt.connect

export interface Callback {
  HandleImage(correlationId: string, clientId : string, image: Buffer)
  HandleError(error : any)
}

export const newMQTTClient = (broker : string, topic : string, username : string = "", password : string = "") => {
  let options = {}
  if(username){
    options = {
      username: username,
      password: password
    }
  }

  return {
    $client: $mqttConnect(`mqtt://${broker}`, options),

    Start(callback : Callback) {
      this.$client.on('connect', () => {
        log.info('Connection to mqtt broker established.')

        this.$client.subscribe(topic, {qos: 1}, (err) => {
          if(err) {
            log.error('Failed to connect to mqtt broker!', {error: err})
            callback.HandleError(err)
          }
        })
      })

      this.$client.on('message', (topic, message) => {
        const topicParts = topic.split('/')
        if(topicParts.length < 3) {
          log.warn('Received a invalid message - invalid topic structure')
          return
        }
        const correlationId = topicParts[topicParts.length - 1]
        const clientId = topicParts[topicParts.length - 2]

        callback.HandleImage(correlationId, clientId, message)
      })
    },

    SendRecognition(textLines : Array<string>, topic : string) {
      this.$client.publish(topic, JSON.stringify({
        lookup: textLines,
      }), {qos: 1})
    },

    SendInfoStatus(code : number, message : string, topic : string) {
      this.sendStatus('info', code, message, topic)
    },
    SendErrorStatus(code : number, message : string , topic : string) {
      this.sendStatus('error', code, message, topic)
    },

    sendStatus(level : string, code : number, message : string, topic : string) {
      this.$client.publish(topic, JSON.stringify({
        level: level,
        source: 'image-recognizer',
        code: code,
        message: message,
        timestamp: new Date().toISOString()
      }), {qos: 1})
    }
  }
}
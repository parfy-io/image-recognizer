import mqtt = require('mqtt')
import log = require('../log')

//exposed for mocking purposes
export let $mqttConnect = mqtt.connect

export interface Callback {
  HandleImage(correlationId: string, image: Buffer)
  HandleError(error : any)
}

export const newMQTTClient = (broker : string, topic : string) => {
  return {
    $client: $mqttConnect(`mqtt://${broker}`),

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
        const correlationId = message.toString('ascii', 0, 36)
        if(correlationId.length !== 36) {
          log.warn('Received a invalid message - message to short')
          return
        }

        const image = message.slice(36)
        callback.HandleImage(correlationId, image)
      })
    }
  }
}
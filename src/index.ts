import cfg = require('./config')
import log = require('./log')
import mqtt = require('./channel/mqtt')
import aws = require('./recognizer/aws');
import azure = require('./recognizer/azure');

let recognizer
if(cfg.azure.subscription.key) {
  log.info('Configure azure recognizer')
  recognizer = azure.newAzureRecognizer(cfg.azure.subscription.key, cfg.azure.region)
} else if (cfg.aws.access.key) {
  log.info('Configure aws recognizer')
  recognizer = aws.newAWSRecognizer(cfg.aws.access.key, cfg.aws.secret.access.key, cfg.aws.region, cfg.aws.confidence.min)
} else{
  log.error('No image recognizer was configured!')
  process.exit(1)
}

let mqttClient = mqtt.newMQTTClient(cfg.mqtt.broker, cfg.mqtt.topic.in)
mqttClient.Start({
  HandleImage: (correlationId, clientId, image) => {
    mqttClient.SendInfoStatus(202, 'Start recognition.', cfg.buildTopic(cfg.mqtt.topic.status, clientId, correlationId))
    
    recognizer.Recognize(correlationId, image)
      .then(lines => {
        log.info("Image was recognized.", {correlationId, lines, clientId})
        mqttClient.SendRecognition(lines, cfg.buildTopic(cfg.mqtt.topic.out, clientId, correlationId))
        mqttClient.SendInfoStatus(200, 'Recognition is done.', cfg.buildTopic(cfg.mqtt.topic.status, clientId, correlationId))
      }).catch(err => {
        log.error("Error while recognizing image.", {error: err, correlationId, clientId})
        mqttClient.SendErrorStatus(500, 'Error while recognizing image.', cfg.buildTopic(cfg.mqtt.topic.status, clientId, correlationId))
    })
  },
  HandleError: () => process.exit(2)
})
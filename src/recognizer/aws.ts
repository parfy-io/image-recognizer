import log = require('../log')
import AWS = require('aws-sdk')
import types = require('./types');
import {Percent} from "aws-sdk/clients/rekognition";

const newAWSRecognizer = (
    accessKey: string,
    secret: string,
    region: string,
    minConfidence: Percent
): types.ImageRecognizer => {
  const awsConfig = {
    credentials: new AWS.Credentials({
      accessKeyId: accessKey,
      secretAccessKey: secret,
    }),
    region: region
  }
  AWS.config.update(awsConfig)

  return {
    $awsConfig: awsConfig,
    $awsRecognizer: new AWS.Rekognition({apiVersion: '2016-06-27'}),

    Recognize(correlationId, image) {
      return new Promise((resolve, reject) => {
        this.$awsRecognizer.detectText({
          Image: {
            Bytes: image
          }
        }, (err, data) => {
          if (err) {
            log.error("Failed to call AWS ocr", {error: err, correlationId})
            reject(err)
            return
          }

          if (!data.TextDetections) {
            reject(new Error("The AWS ocr result contains no text!"))
            return
          }

          const result = data.TextDetections
            .filter(td => td.Type === 'LINE')
            .filter(td => td.DetectedText)
            .filter(td => {
              // @ts-ignore - for type === LINE we will get always a confidence!
              return td.Confidence >= minConfidence
            })
            .map(td => td.DetectedText)

          log.info("Received aws response", {correlationId})

          // @ts-ignore -> at this point i am sure that "result" is a array of string!
          resolve(result)
        })
      })
    }
  }
}

export = {
  newAWSRecognizer
}
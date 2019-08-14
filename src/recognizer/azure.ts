import log = require('../log')
import axios = require('axios')
import types = require('./types')

const newAzureRecognizer = (subscriptionKey : string, region : string) : types.ImageRecognizer => {
  return {
    $client: axios.default,

    Recognize(correlationId, image) {
      return this.$client.post(
          `https://${region}.api.cognitive.microsoft.com/vision/v2.0/ocr?language=de`,
          image,
          {
            headers: {
              "Ocp-Apim-Subscription-Key": subscriptionKey,
              "Content-Type": "application/octet-stream"
            }
          })
      .then(resp => {
        if(!resp.data || !resp.data.regions) {
          throw new Error("The Azure ocr result contains no text!")
        }

        /*
        Example:
        {
          "regions": [{
            "boundingBox": "26,62,289,474",
            "lines": [{
                "boundingBox": "29,76,96,9",
                "words": [{
                    "boundingBox": "29,76,26,9",
                    "text": "Test"
                  },{
                    "boundingBox": "57,78,18,7",
                    "text": "McTest"
                  }]
              }]
          }]
        }
        */

        let result = resp.data.regions.map(region => {
          return region.lines.map(line => {
            return line.words.map(word => word.text).join(' ')
          })
        }).flat(1)

        return result
      }).catch(err => {
        log.error('Failed to call azure ocr', {error: err, correlationId})
        throw err
      })
    }
  }
}

export = {
  newAzureRecognizer
}
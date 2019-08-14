import assert = require('assert')
import aws = require('../../src/recognizer/aws')

describe('AWS recognizer', () => {

  it('configure aws correctly', () => {
    //given
    const accessKey = '<accessKey>'
    const secret = '<secret>'
    const region = '<region>'
    const confidence = 13.12

    //when
    const toTest =  aws.newAWSRecognizer(accessKey, secret, region, confidence)

    //then
    assert.strictEqual(toTest.$awsConfig.credentials.accessKeyId, accessKey)
    assert.strictEqual(toTest.$awsConfig.credentials.secretAccessKey, secret)
    assert.strictEqual(toTest.$awsConfig.region, region)
  })

  describe('Recognize', () => {

    it('calls the right aws function', (done) => {
      //given
      const confidence = 13.12
      const testImage = Buffer.alloc(0)
      const toTest =  aws.newAWSRecognizer('', '', '', confidence)
      toTest.$awsRecognizer = {
        detectText(params, cb){
          assert.deepStrictEqual(params, {
            Image: {
              Bytes: testImage
            }
          })

          cb('someError', null)
        }
      }

      //when
      let result = toTest.Recognize('<correlationId>', testImage)

      //then
      result.then(() => {
        assert.fail("It should be rejected!")
        done()
      }).catch(() => {
        done()
      })
    })

    it('should reject if the response is unexpected', (done) => {
      //given
      const confidence = 13.12
      const testImage = Buffer.alloc(0)
      const toTest =  aws.newAWSRecognizer('', '', '', confidence)
      toTest.$awsRecognizer = {
        detectText(params, cb){
          //simulate missing "TextDetections"
          cb(null, {})
        }
      }

      //when
      let result = toTest.Recognize('<correlationId>', testImage)

      //then
      result.then(() => {
        assert.fail("It should be rejected!")
        done()
      }).catch(() => {
        done()
      })
    })

    it('filter out types !== LINE', (done) => {
      //given
      const confidence = 13.12
      const testImage = Buffer.alloc(0)
      const toTest =  aws.newAWSRecognizer('', '', '', confidence)
      toTest.$awsRecognizer = {
        detectText(params, cb){
          //simulate missing "TextDetections"
          cb(null, {
            TextDetections: [{
              Type: "NON_LINE"
            }]
          })
        }
      }

      //when
      let result = toTest.Recognize('<correlationId>', testImage)

      //then
      result.catch((err) => {
        assert.fail("It should not be rejected! " + err)
      }).then((result) => {
        // @ts-ignore
        assert.strictEqual(result.length, 0)
        done()
      }).catch(done)
    })

    it('filter out one that have no DetectedText', (done) => {
      //given
      const confidence = 13.12
      const testImage = Buffer.alloc(0)
      const toTest =  aws.newAWSRecognizer('', '', '', confidence)
      toTest.$awsRecognizer = {
        detectText(params, cb){
          //simulate missing "TextDetections"
          cb(null, {
            TextDetections: [{
              Type: "LINE"
            }]
          })
        }
      }

      //when
      let result = toTest.Recognize('<correlationId>', testImage)

      //then
      result.catch((err) => {
        assert.fail("It should not be rejected! " + err)
      }).then((result) => {
        // @ts-ignore
        assert.strictEqual(result.length, 0)
        done()
      }).catch(done)
    })

    it('filter out which have not enough confidence', (done) => {
      //given
      const confidence = 13.12
      const testImage = Buffer.alloc(0)
      const toTest =  aws.newAWSRecognizer('', '', '', confidence)
      toTest.$awsRecognizer = {
        detectText(params, cb){
          //simulate missing "TextDetections"
          cb(null, {
            TextDetections: [{
              Type: "LINE",
              DetectedText: "Hello World",
              Confidence: confidence - confidence //not enough
            }]
          })
        }
      }

      //when
      let result = toTest.Recognize('<correlationId>', testImage)

      //then
      result.catch((err) => {
        assert.fail("It should not be rejected! " + err)
      }).then((result) => {
        // @ts-ignore
        assert.strictEqual(result.length, 0)
        done()
      }).catch(done)
    })

    it('returns non out-filtered once', (done) => {
      //given
      const confidence = 13.12
      const testImage = Buffer.alloc(0)
      const toTest =  aws.newAWSRecognizer('', '', '', confidence)
      toTest.$awsRecognizer = {
        detectText(params, cb){
          //simulate missing "TextDetections"
          cb(null, {
            TextDetections: [{
              Type: "LINE",
              DetectedText: "Hello World",
              Confidence: confidence //enough
            }]
          })
        }
      }

      //when
      let result = toTest.Recognize('<correlationId>', testImage)

      //then
      result.catch((err) => {
        assert.fail("It should not be rejected! " + err)
      }).then((result) => {
        // @ts-ignore
        assert.strictEqual(result.length, 1)
        assert.strictEqual(result[0], "Hello World")
        done()
      }).catch(done)
    })

  })

})

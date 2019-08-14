import assert = require('assert')
import azure = require('../../src/recognizer/azure')

describe('Azure recognizer', () => {

  it('configure azure correctly', () => {
    //given
    //when
    const toTest = azure.newAzureRecognizer("", "")

    //then
    assert(toTest.$client)
  })

  describe('Recognize', () => {

    it('should reject if the request cause an error', (done) => {
      //given
      const subscriptionKey = '<subscriptionKey>'
      const region = '<region>'
      const testImage = Buffer.alloc(0)

      const toTest = azure.newAzureRecognizer(subscriptionKey, region)
      toTest.$client = {
        post(url, body, config) {
          assert.strictEqual(url, `https://${region}.api.cognitive.microsoft.com/vision/v2.0/ocr?language=de`)
          assert.strictEqual(body, testImage)
          assert.strictEqual(config.headers["Ocp-Apim-Subscription-Key"], subscriptionKey)
          assert.strictEqual(config.headers["Content-Type"], "application/octet-stream")

          return Promise.reject('someError')
        }
      }

      //when
      let result = toTest.Recognize('<correlationId>', testImage)

      //then
      result.then(() => {
        assert.fail("It should be rejected!")
      }).catch((err) => {
        assert.strictEqual(err, "someError")
        done()
      })
    })

    describe('response error scenarios', () => {
      let examples = [
        {},
        {data: {}},
        {data: {regions: []}},
        {data: {regions: [{}]}},
        {data: {regions: [{lines: []}]}},
        {data: {regions: [{lines: [{}]}]}},
        {data: {regions: [{lines: [{words: []}]}]}}
      ]
      for (let e in examples) {
        const curExample = examples[e]

        it(`should reject if response is invalid #${e}`, (done) => {
          //given
          const subscriptionKey = '<subscriptionKey>'
          const region = '<region>'
          const testImage = Buffer.alloc(0)

          const toTest = azure.newAzureRecognizer(subscriptionKey, region)
          toTest.$client = {
            post(url, body, config) {
              return Promise.resolve(curExample)
            }
          }

          //when
          let result = toTest.Recognize('<correlationId>', testImage)

          //then
          result.then(() => {
            assert.fail("It should be rejected!")
          }).catch((err) => {
            done()
          })
        })
      }
    })

    it(`should resolve complex response`, (done) => {
      //given
      const subscriptionKey = '<subscriptionKey>'
      const region = '<region>'
      const testImage = Buffer.alloc(0)

      const toTest = azure.newAzureRecognizer(subscriptionKey, region)
      toTest.$client = {
        post(url, body, config) {
          return Promise.resolve({
            data: {
              "regions": [{
                "lines": [{
                  "words": [{
                    "text": "Hello"
                  }, {
                    "text": "World"
                  }]
                }, {
                  "words": [{
                    "text": "Hello"
                  }, {
                    "text": "World"
                  }]
                },]
              }, {
                "lines": [{
                  "words": [{
                    "text": "Hello"
                  }, {
                    "text": "World"
                  }]
                }, {
                  "words": [{
                    "text": "Hello"
                  }, {
                    "text": "World"
                  }]
                },]
              }]
            }
          })
        }
      }

      //when
      let result = toTest.Recognize('<correlationId>', testImage)

      //then
      result.catch((err) => {
        assert.fail("It should not be rejected! " + err)
      }).then((lines) => {
        // @ts-ignore
        assert.strictEqual(lines.length, 4)
        assert.strictEqual(lines[0], "Hello World")
        assert.strictEqual(lines[1], "Hello World")
        assert.strictEqual(lines[2], "Hello World")
        assert.strictEqual(lines[3], "Hello World")
        done()
      }).catch(() => done())
    })

  })

})
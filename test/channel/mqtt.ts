import assert = require('assert')
import mqtt = require('../../src/channel/mqtt')

describe('MQTT channel', () => {

  it('configure mqtt correctly', () => {
    //given
    const broker = '<broker>'
    const topic = '<topic>'

    // @ts-ignore
    mqtt.$mqttConnect = (brokerUrl) => {
      assert.strictEqual(brokerUrl, `mqtt://${broker}`)
      return '<mqttClient>'
    }

    //when
    const toTest = mqtt.newMQTTClient(broker, topic)

    //then
    assert.strictEqual('<mqttClient>', toTest.$client)

    // @ts-ignore
    mqtt.$mqttConnect = () => '<mqttClient>'
  })

  describe('Start', () => {

    it('assign the right events', (done) => {
      //given
      const toTest = mqtt.newMQTTClient("", "")
      toTest.$client = {
        firstCall: true,
        // @ts-ignore
        on(event, cb) {
          // @ts-ignore
          if(this.firstCall) {
            assert.strictEqual(event, "connect")
            assert(cb)
          }else{
            assert.strictEqual(event, "message")
            assert(cb)
          }

          // @ts-ignore
          this.firstCall = false
        }
      }
      //when
      toTest.Start({
        HandleImage(correlationId: string, image: Buffer) {},
        HandleError(error: any) {}
      })

      done()
    })

    it('will subscribe the right topic after connection', (done) => {
      //given
      const testTopic = '<topic>'
      const toTest = mqtt.newMQTTClient("", testTopic)
      let subscribeCalled = false
      toTest.$client = {
        // @ts-ignore
        on(event, cb) {
          if(event === 'connect') cb() //call the callback
        },
        // @ts-ignore
        subscribe(topic, opts, cb){
          subscribeCalled = true

          assert.strictEqual(topic, testTopic)
          assert.strictEqual(opts.qos, 1)
          assert(cb)
        }
      }
      //when
      toTest.Start({
        HandleImage(correlationId: string, image: Buffer) {},
        HandleError(error: any) {}
      })

      //then
      assert(subscribeCalled)

      done()
    })

    it('will call the callback on subscription error', (done) => {
      //given
      const toTest = mqtt.newMQTTClient("", "")
      toTest.$client = {
        // @ts-ignore
        on(event, cb) {
          if(event === 'connect') cb() //call the callback
        },
        // @ts-ignore
        subscribe(topic, opts, cb){
          cb('someError') //simulate error
        }
      }
      //when
      let cbCalled = false
      toTest.Start({
        HandleError(error: any) {
          cbCalled = true
          assert.strictEqual(error, 'someError')
        },
        HandleImage(correlationId: string, image: Buffer) {}
      })

      //then
      assert(cbCalled)

      done()
    })

    it('will dont call the callback when no subscription error', (done) => {
      //given
      const toTest = mqtt.newMQTTClient("", "")
      toTest.$client = {
        // @ts-ignore
        on(event, cb) {
          if(event === 'connect') cb() //call the callback
        },
        // @ts-ignore
        subscribe(topic, opts, cb){
          cb() //simulate no error
        }
      }
      //when
      let cbCalled = false
      toTest.Start({
        HandleError(error: any) {
          cbCalled = true
        },
        HandleImage(correlationId: string, image: Buffer) {}
      })

      //then
      assert(!cbCalled)

      done()
    })

    it('will not call the callback on invalid messages', (done) => {
      //given
      const toTest = mqtt.newMQTTClient("", "")
      toTest.$client = {
        // @ts-ignore
        on(event, cb) {
          if(event === 'message'){
            cb("", Buffer.alloc(0)) //call the callback
          }
        }
      }
      //when
      let cbCalled = false
      toTest.Start({
        HandleImage() {
          cbCalled = true
        },
        HandleError(error: any) {}
      })

      //then
      assert(!cbCalled)

      done()
    })

    it('will call the callback on valid messages', (done) => {
      //given
      const testCorrelationId = "eafbd535-01df-403c-909e-aabec87c3c28"
      const testImage = "<image>"
      const toTest = mqtt.newMQTTClient("", "")
      toTest.$client = {
        // @ts-ignore
        on(event, cb) {
          if(event === 'message'){
            //call the callback
            cb("", Buffer.from(`${testCorrelationId}${testImage}`))
          }
        }
      }
      //when
      let cbCalled = false
      toTest.Start({
        HandleImage(correlationId, image) {
          cbCalled = true
          assert.strictEqual(correlationId, testCorrelationId)
          assert.strictEqual(testImage, image.toString())
        },
        HandleError(error: any) {}
      })

      //then
      assert(cbCalled)

      done()
    })

  })

})
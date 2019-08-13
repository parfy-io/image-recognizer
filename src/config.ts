const envParser = require('rainu-env-parser')

//DO NOT USE CAMEL_CASE! IT WILL TRANSFORMED TO lowercase!
const defaults = {
  log: {
    level: 'info'
  },
  mqtt: {
    broker: "localhost:1883",
    client: {
      id: "image-recognizer"
    },
    topic: "recognize/+"
  },
  azure: {
    subscription: {
      key: ''
    },
    region: ''
  }
}

const parseEnv = function() {
  let config =  envParser.parse("CFG_", defaults)

  return config
}

export = {
  ...parseEnv(),
  parseEnv,
}
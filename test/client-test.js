var uuid = require('uuid')
var inspect = require('eyespect').inspector()
var sinon = require('sinon')
var expect = require('chai').expect

var Client = require('../')

describe('Streaming Riak Client', function() {
  var client
  var bucket = 'test_suite_bucket'
  var indexKey = 'test_index'
  var start = '45!2012 01 01 00:00:00'
  var end = '45!2012 01 01 01:01:01'
  var value = {
    id: uuid.v4()
  }
  var key = uuid.v4()


  before(function(done) {
    client = new Client({})
    expect(client).to.have.property('bucketKeyStream')
    expect(client.bucketKeyStream).to.be.a('function')

    expect(client).to.have.property('bucketStream')
    expect(client.bucketStream).to.be.a('function')

    var opts = {
      bucket: bucket,
      value: value,
      indices: {},
      key: key
    }
    opts.indices[indexKey] = start
    var promise = client.saveWithKey(opts)
    promise.then(function() {
      return client.getWithKey(opts)
    }).then(function(reply) {
      expect(reply).to.eql(opts.value)
      done()
    }).fail(function(err) {
      inspect(err, 'before error')
      done(err)
    }).done()
  })

  after(function(done) {
    var opts = {
      key: key,
      value: value
    }
    var promise = client.deleteWithKey(opts)
    promise.then(function() {
      done()
    }).fail(failHandler).done()
  })

  it('should create keystream for bucket correctly', function(done) {
    this.slow(200)
// var bucket = 'installation_ids'
    var keyStream = client.bucketKeyStream(bucket)
    expect(keyStream).to.exist
    var dataSpy = sinon.spy(logKey)
    keyStream.on('data', dataSpy)
    keyStream.on('end', function() {
      expect(dataSpy.callCount).to.be.above(0)
      done()
    })
  })

  it('should stream bucket names', function(done) {
    this.slow('.5s')
    var stream = client.bucketStream()
    expect(stream).to.exist
    var dataSpy = sinon.spy(logKey)
    stream.on('data', dataSpy)
    stream.on('end', function() {
      expect(dataSpy.callCount).to.be.above(0)
      done()
    })
  })

  it('should get key in bucket', function(done) {
    this.slow('.5s')
    var opts = {
      bucket: bucket,
      key: key
    }
    var promise = client.getWithKey(opts)
    promise.then(function(reply) {
      expect(reply).to.eql(value)
      done()
    }).done()
  })

  it('should handle missing key in bucket', function(done) {
    var key = 'testKey'
    this.slow('.5s')
    var opts = {
      bucket: bucket,
      key: key
    }
    var promise = client.getWithKey(opts)
    promise.then(function(reply) {
      expect(reply).to.not.exist
      done()
    }).done()
  })

  it('should get by secondary index query', function(done) {
    this.slow('.5s')
    var start = '!'
    var end = 'z'
    var opts = {
      bucket: bucket,
      start: start,
      indexKey: indexKey,
      end: end
    }
    var stream = client.keyStreamWithQueryRange(opts)
    expect(stream).to.exist
    var dataSpy = sinon.spy(logKey)
    stream.on('data', dataSpy)
    stream.on('end', function() {
      expect(dataSpy.callCount).to.be.above(0)
      done()
    })
  })

  it('should get value stream by secondary index query', function(done) {
    this.slow('.5s')
    var start = '!'
    var end = 'z'
    var opts = {
      bucket: bucket,
      start: start,
      indexKey: indexKey,
      end: end
    }
    var stream = client.valueStreamWithQueryRange(opts)
    expect(stream).to.exist
    var dataSpy = sinon.spy(logKey)
    stream.on('data', dataSpy)
    stream.on('end', function() {
      expect(dataSpy.callCount).to.be.above(0)
      done()
    })
  })

  it('should not get keys when secondary index query does not match', function(done) {
    this.slow('.5s')
    var start = 'z'
    var end = '~'
    var opts = {
      bucket: bucket,
      start: start,
      indexKey: indexKey,
      end: end
    }
    var stream = client.keyStreamWithQueryRange(opts)
    expect(stream).to.exist
    var dataSpy = sinon.spy(logKey)
    stream.on('data', dataSpy)
    stream.on('end', function() {
      expect(dataSpy.callCount).to.equal(0)
      done()
    })
  })

})

function failHandler(err) {
  inspect(err, 'error')
  throw err
}

function logKey(key) {
  expect(key).to.exist
}

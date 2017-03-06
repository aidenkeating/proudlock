var MongoClient = require('mongodb').MongoClient;
var expect = require('chai').expect;
var Lock = require('../proudlock').Lock;

var mongoUrl = 'mongodb://localhost:27017/proudlock';
var testStoreName = 'proudlock_lock_test';
var testStore;
var db;

describe('Lock', function() {
  before(function(done) {
    MongoClient.connect(mongoUrl, function(err, database) {
      expect(err).not.to.exist;
      // Set database to be used in the tests.
      db = database;
      db.createCollection(testStoreName, function(err, collection) {
        testStore = collection;
        collection.ensureIndex({ name: 1 }, { unique: true }, function() {
          return done();
        });
      });
    });
  });

  beforeEach(function(done) {
    db.dropCollection(testStoreName, function(err) {
      expect(err).not.to.exist;
      db.createCollection(testStoreName, function(err, collection) {
        testStore = collection;
        collection.ensureIndex({ name: 1 }, { unique: true }, function() {
          return done();
        });
      });
    });
  });

  it('should acquire lease when none exist', function(done) {
    var lockOne = 'lockOne';
    var clientOne = 'clientOne';
    var lock = new Lock(lockOne, testStore, clientOne, 1000);

    lock.acquire(function(err, lock) {
      expect(err).not.to.exist;
      expect(lock).to.exist;
      return done();
    });
  });

  it('should not acquire lease when another exists', function(done) {
    var lockName = 'lockOne';
    var clientOne = 'clientOne';
    var clientTwo = 'clientTwo';
    var lockOne = new Lock(lockName, testStore, clientOne, 1000);
    var lockTwo = new Lock(lockName, testStore, clientTwo, 1000);

    lockOne.acquire(function(err, lease) {
      if (err) {
        return done(err);
      }
      expect(lease).to.exist;
      lockTwo.acquire(function(err, lease) {
        expect(err).not.to.exist;
        expect(lease).not.to.exist;
        return done();
      });
    });
  });

  it('should not release lease when not owner of lease', function(done) {
    var lockName = 'lockOne';
    var clientOne = 'clientOne';
    var clientTwo = 'clientTwo';
    var lockOne = new Lock(lockName, testStore, clientOne, 1000);
    var lockTwo = new Lock(lockName, testStore, clientTwo, 1000);

    lockOne.acquire(function(err, lease) {
      expect(err).not.to.exist;
      expect(lease).to.exist;
      lockTwo.release(function(err, lease) {
        expect(err).not.to.exist;
        expect(lease).not.to.exist;
        return done();
      });
    });
  });

  it('should release lease when owner of lease', function(done) {
    var lockName = 'lockOne';
    var clientOne = 'clientOne';
    var lockOne = new Lock(lockName, testStore, clientOne, 1000);

    lockOne.acquire(function(err, lease) {
      expect(err).not.to.exist;
      expect(lease).to.exist;
      lockOne.release(function(err, res) {
        expect(err).not.to.exist;
        db.collection(testStoreName).count({}, function(err, res) {
          expect(err).not.to.exist;
          expect(res).to.equal(0);
          return done();
        });
      });
    });
  });

  it('should not release lease when not owner of lease', function(done) {
    var lockName = 'lockOne';
    var clientOne = 'clientOne';
    var clientTwo = 'clientTwo';
    var lockOne = new Lock(lockName, testStore, clientOne, 1000);
    var lockTwo = new Lock(lockName, testStore, clientTwo, 1000);

    lockOne.acquire(function(err, lease) {
      expect(err).not.to.exist;
      expect(lease).to.exist;
      lockTwo.release(function(err, res) {
        expect(res).not.to.exist;
        return done();
      });
    });
  });

  it('should extend lease when owner of lease', function(done) {
    var lockName = 'lockOne';
    var clientOne = 'clientOne';
    var lockOne = new Lock(lockName, testStore, clientOne, 1000);
    lockOne.acquire(function(err, lease) {
      expect(err).not.to.exist;
      expect(lease).to.exist;
      lockOne.extend(1000 ,function(err, lease) {
        expect(err).not.to.exist;
        expect(lease).to.exist;
        return done();
      });
    });
  });

  it('should not extend lease when not owner of lease', function(done) {
    var lockName = 'lockOne';
    var clientOne = 'clientOne';
    var clientTwo = 'clientTwo';
    var lockOne = new Lock(lockName, testStore, clientOne, 1000);
    var lockTwo = new Lock(lockName, testStore, clientTwo, 1000);

    lockOne.acquire(function(err, lease) {
      expect(err).not.to.exist;
      expect(lease).to.exist;
      lockTwo.extend(1000, function(err, lease) {
        expect(err).not.to.exist;
        expect(lease).not.to.exist;
        return done();
      });
    });
  });

  it('should only have lease when not expired', function(done) {
    var lockName = 'lockOne';
    var clientOne = 'clientOne';
    var lockOne = new Lock(lockName, testStore, clientOne, 1000);

    lockOne.acquire(function(err, lease) {
      expect(err).not.to.exist;
      expect(lease).to.exist;
      expect(lockOne.hasLock()).to.be.true;
      lockOne.extend(1000, function(err, lease) {
        expect(err).not.to.exist;
        expect(lease).to.exist;
        setInterval(function() {
          expect(lockOne.hasLock()).to.be.false;
          return done();
        }, 1000);
      });
    });
  });
});
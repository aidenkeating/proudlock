var Lease = require('./lease');
var MONGODB_DUPLICATE_RECORD_CODE = 11000;

/**
 * Construct a new Lock
 * @class Lock
 * @classdesc Acquires and manages leases
 *
 * @param {mongodb.MongoClient} mongoClient the MongoDB client to use
 * @param {string} lockName the name of the lock itself
 * @param {Object} lockOptions
 * @param {number} lockOptions.timeout the timeout of the lock in milliseconds
 */
function Lock(lockName, lockStore, clientName, timeout) {
  // Allow users to override the collection name created by proudlock.
  this.lockName = lockName;
  this.collection = lockStore;
  this.expires = 0;
  this.clientName = clientName;
  this.timeout = timeout;
}

/**
 * Acquire a lock for the collection
 * @param {Function} cb callback function
 */
Lock.prototype.acquire = function(cb) {
  var self = this;

  var now = Date.now();

  var lockQuery = {
    lockName: self.lockName,
    expires: { $lt: now }
  };

  self.collection.findAndRemove(lockQuery, undefined, function(err) {
    if (err) {
      return cb(err);
    }

    var expiryTime = now + self.timeout;
    var newLock = {
      lockName: self.lockName,
      clientName: self.clientName,
      expires: expiryTime,
      inserted: now
    };

    // Try to create the lock.
    self.collection.insert(newLock, function(err, res) {
      if (err) {
        // Check err code for if there's a current valid lock.
        if (err.code === MONGODB_DUPLICATE_RECORD_CODE ) {
          return cb();
        }
        // An actual error occurred.
        return cb(err);
      }

      var op = res.ops[0];
      if (op && op.expires) {
        self.expires = op.expires;
      }
      // Update this locks code
      if (Lease.isValidLeaseObj(op)) {
        return cb(null, Lease.fromObj(op));
      }
      return cb();
    });
  });
};

/**
 * Extend the length of an acquired lock.
 * @param {number} extenstionTime the amount of time to extend the lock in ms.
 * @param {Function} cb callback function, err and truthy value if extension is acquired.
 */
Lock.prototype.extend = function extend(extenstionTime, cb) {
  var self = this;

  var lockQuery = {
    lockName: self.lockName,
    clientName: self.clientName
  };

  var lockUpdate = {
    $set: {
      expires: this.expires + extenstionTime
    }
  };

  this.collection.findAndModify(lockQuery, undefined, lockUpdate, function(err, res) {
    if (Lease.isValidLeaseObj(res.value)) {
      return cb(err, Lease.fromObj(res.value));
    }
    // Only return the value: null or the record.
    return cb(err, null);
  });
};

/**
 * Release an acquired lock early.
 * @param {Function} cb callback function
 */
Lock.prototype.release = function release(cb) {
  // Expire this lock if it exists.
  var lockQuery = {
    clientName: this.clientName,
    lockName: this.lockName
  };
  this.collection.findAndRemove(lockQuery, undefined, function(err, res) {
    if (err) {
      this.expires = 0;
      return cb(err, null);
    }
    if (Lease.isValidLeaseObj(res.value)) {
      return cb(null, Lease.fromObj(res.value));
    }
    return cb();
  });
};

Lock.prototype.hasLock = function hasLock() {
  return Date.now() < this.expires;
};

module.exports = Lock;


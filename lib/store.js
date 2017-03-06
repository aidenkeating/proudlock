var crypto = require('crypto');
var Lock = require('./lock');

var DEFAULT_LOCK_TIMEOUT = 30000;
var DEFAULT_LOCK_STORE_NAME = 'proudlock_store';

function Store(mongoClient, options) {
  if (!mongoClient) {
    throw new Error('Missing parameter: mongoClient');
  }

  var managerOptions = options || {};
  this.mongoClient = mongoClient;
  this.locks = managerOptions.locks || {};
  this.lockStoreName = managerOptions.lockStoreName || DEFAULT_LOCK_STORE_NAME;
  this.lockStore = mongoClient.collection(this.lockStoreName);
  this.lockTimeout = managerOptions.lockTimeout || DEFAULT_LOCK_TIMEOUT;
  this.clientName = managerOptions.clientName || generateUniqueId();
  Store.ensureIndex(this.lockStore, noop());
}

Store.prototype.acquire = function(lockName, cb) {
  var lock = this.findOrCreateLock(lockName);
  return lock.acquire(cb);
};

Store.prototype.release = function(lockName, cb) {
  var lock = this.findOrCreateLock(lockName);
  return lock.release(cb);
};

Store.prototype.extend = function(lockName, extension, cb) {
  var lockExtension = extension || DEFAULT_LOCK_TIMEOUT;
  var lock = this.findOrCreateLock(lockName);
  return lock.extend(lockExtension, cb);
};

Store.prototype.hasLock = function(lockName) {
  var lock = this.findOrCreateLock(lockName);
  return lock.hasLock();
};

Store.prototype.findOrCreateLock = function(lockName) {
  if (this.locks[lockName]) {
    return this.locks[lockName];
  }
  // Lock doesn't exist yet, create a new one.
  var lock = new Lock(lockName, this.lockStore, this.clientName, this.lockTimeout);
  this.locks[lock.name] = lock;
  return lock;
};

Store.ensureIndex = function(collection, cb) {
  collection.ensureIndex({ name: 1 }, { unique: true }, cb);
};

/**
 * Return a sufficiently unique id for a lock
 * @returns {string} a 16 character unique id
 */
function generateUniqueId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Blank operation, similar to lodash.noop
 * @returns {Function} the noop function
 */
function noop() {
  return noop;
}

module.exports = Store;
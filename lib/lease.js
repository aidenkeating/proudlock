function Lease(lockName, clientName, expires, inserted, released) {
  this.lockName = lockName;
  this.clientName = clientName;
  this.expires = expires;
  this.inserted = inserted;
  this.released = released || false;
}

Lease.prototype.getLockName = function() {
  return this.lockName;
};

Lease.prototype.getClientName = function() {
  return this.clientName;
};

Lease.prototype.getExpires = function() {
  return this.expires;
};

Lease.prototype.getInserted = function() {
  return this.inserted;
};

Lease.prototype.isReleased = function() {
  return this.released;
};

Lease.prototype.isExpired = function() {
  if (this.released) {
    return this.released;
  }
  return Date.now() > this.expires;
};

Lease.fromObj = function fromObj(obj) {
  return new Lease(obj.lockName, obj.clientName, obj.expires, obj.inserted, obj.released);
};

Lease.isValidLeaseObj = function isValidLeaseObj(obj) {
  return obj && obj.lockName && obj.clientName && obj.expires && obj.inserted;
};

module.exports = Lease;
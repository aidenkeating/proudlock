var expect = require('chai').expect;
var Lease = require('../lib/lease');

var lockName = 'testLock';
var clientName = 'testClient';
var expires = 11011101111;
var inserted = 11011101110;
var released = true;

describe('Lease', function() {
  it('should create with correct parameters', function(done) {
    var lease = new Lease(lockName, clientName, expires, inserted, released);
    verifyLeaseGetters(lease);
    return done();
  });

  it('should return Lease from Object with correct keys', function(done) {
    var leaseObj = {
      lockName: lockName,
      clientName: clientName,
      expires: expires,
      inserted: inserted,
      released: released
    };
    var lease = Lease.fromObj(leaseObj);
    verifyLeaseGetters(lease);
    return done();
  });

  it('should validate Object with correct keys successfully', function(done) {
    var leaseObj = {
      lockName: lockName,
      clientName: clientName,
      expires: expires,
      inserted: inserted,
      released: released
    };
    expect(Lease.isValidLeaseObj(leaseObj)).to.be.truthy;
    return done();
  });

  it('should not validate Object with incorrect keys successfully', function(done) {
    // No lock name.
    var leaseObj = {
      clientName: clientName,
      expires: expires,
      inserted: inserted,
      released: released
    };
    expect(Lease.isValidLeaseObj(leaseObj)).to.be.falsy;
    return done();
  });
});

function verifyLeaseGetters(lease) {
  expect(lease.getLockName()).to.equal(lockName);
  expect(lease.getClientName()).to.equal(clientName);
  expect(lease.getExpires()).to.equal(expires);
  expect(lease.getInserted()).to.equal(inserted);
  expect(lease.isReleased()).to.equal(released);
}
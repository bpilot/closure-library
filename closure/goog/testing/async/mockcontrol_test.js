// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('goog.testing.async.MockControlTest');
goog.setTestOnly('goog.testing.async.MockControlTest');

goog.require('goog.async.Deferred');
goog.require('goog.testing.MockControl');
goog.require('goog.testing.TestCase');
goog.require('goog.testing.asserts');
goog.require('goog.testing.async.MockControl');
goog.require('goog.testing.jsunit');

var mockControl;
var asyncMockControl;

var mockControl2;
var asyncMockControl2;

function setUp() {
  // TODO(b/25875505): Fix unreported assertions (go/failonunreportedasserts).
  goog.testing.TestCase.getActiveTestCase().failOnUnreportedAsserts = false;

  mockControl = new goog.testing.MockControl();
  asyncMockControl = new goog.testing.async.MockControl(mockControl);

  // We need two of these for the tests where we need to verify our meta-test
  // assertions without verifying our tested assertions.
  mockControl2 = new goog.testing.MockControl();
  asyncMockControl2 = new goog.testing.async.MockControl(mockControl2);
}

function assertVerifyFails() {
  assertThrowsJsUnitException(function() { mockControl.$verifyAll(); });
}

function testCreateCallbackMockFailure() {
  asyncMockControl.createCallbackMock('failingCallbackMock', function() {});
  assertVerifyFails();
}

function testCreateCallbackMockSuccess() {
  var callback = asyncMockControl.createCallbackMock(
      'succeedingCallbackMock', function() {});
  callback();
  mockControl.$verifyAll();
}

function testCreateCallbackMockSuccessWithArg() {
  var callback = asyncMockControl.createCallbackMock(
      'succeedingCallbackMockWithArg',
      asyncMockControl.createCallbackMock(
          'metaCallbackMock', function(val) { assertEquals(10, val); }));
  callback(10);
  mockControl.$verifyAll();
}

function testCreateCallbackMockSuccessWithArgs() {
  var callback = asyncMockControl.createCallbackMock(
      'succeedingCallbackMockWithArgs',
      asyncMockControl.createCallbackMock(
          'metaCallbackMock', function(val1, val2, val3) {
            assertEquals(10, val1);
            assertEquals('foo', val2);
            assertObjectEquals({foo: 'bar'}, val3);
          }));
  callback(10, 'foo', {foo: 'bar'});
  mockControl.$verifyAll();
}

function testAsyncAssertEqualsFailureNeverCalled() {
  asyncMockControl.asyncAssertEquals('never called', 12);
  assertVerifyFails();
}

function testAsyncAssertEqualsFailureNumberOfArgs() {
  assertThrowsJsUnitException(function() {
    asyncMockControl.asyncAssertEquals('wrong number of args', 12)();
  });
}

function testAsyncAssertEqualsFailureOneArg() {
  assertThrowsJsUnitException(function() {
    asyncMockControl.asyncAssertEquals('wrong arg value', 12)(13);
  });
}

function testAsyncAssertEqualsFailureThreeArgs() {
  assertThrowsJsUnitException(function() {
    asyncMockControl.asyncAssertEquals('wrong arg values', 1, 2, 15)(2, 2, 15);
  });
}

function testAsyncAssertEqualsSuccessNoArgs() {
  asyncMockControl.asyncAssertEquals('should be called')();
  mockControl.$verifyAll();
}

function testAsyncAssertEqualsSuccessThreeArgs() {
  asyncMockControl.asyncAssertEquals('should have args', 1, 2, 3)(1, 2, 3);
  mockControl.$verifyAll();
}

function testAssertDeferredErrorFailureNoError() {
  var deferred = new goog.async.Deferred();
  asyncMockControl.assertDeferredError(deferred, function() {});
  assertVerifyFails();
}

function testAssertDeferredErrorSuccess() {
  var deferred = new goog.async.Deferred();
  asyncMockControl.assertDeferredError(
      deferred, function() { deferred.errback(new Error('FAIL')); });
  mockControl.$verifyAll();
}

function testAssertDeferredEqualsFailureActualDeferredNeverResolves() {
  var actual = new goog.async.Deferred();
  asyncMockControl.assertDeferredEquals('doesn\'t resolve', 12, actual);
  assertVerifyFails();
}

function testAssertDeferredEqualsFailureActualDeferredNeverResolvesBoth() {
  var actualDeferred = new goog.async.Deferred();
  var expectedDeferred = new goog.async.Deferred();
  expectedDeferred.callback(12);
  asyncMockControl.assertDeferredEquals(
      'doesn\'t resolve', expectedDeferred, actualDeferred);
  assertVerifyFails();
}

function testAssertDeferredEqualsFailureExpectedDeferredNeverResolves() {
  var expected = new goog.async.Deferred();
  asyncMockControl.assertDeferredEquals('doesn\'t resolve', expected, 12);
  assertVerifyFails();
}

function testAssertDeferredEqualsFailureExpectedDeferredNeverResolvesBoth() {
  var actualDeferred = new goog.async.Deferred();
  var expectedDeferred = new goog.async.Deferred();
  actualDeferred.callback(12);
  asyncMockControl.assertDeferredEquals(
      'doesn\'t resolve', expectedDeferred, actualDeferred);
  assertVerifyFails();
}

function testAssertDeferredEqualsFailureWrongValueActualDeferred() {
  var actual = new goog.async.Deferred();
  asyncMockControl.assertDeferredEquals('doesn\'t resolve', 12, actual);
  asyncMockControl2.assertDeferredError(
      actual, function() { actual.callback(13); });
  mockControl2.$verifyAll();
}

function testAssertDeferredEqualsFailureWrongValueExpectedDeferred() {
  var expected = new goog.async.Deferred();
  asyncMockControl.assertDeferredEquals('doesn\'t resolve', expected, 12);
  asyncMockControl2.assertDeferredError(
      expected, function() { expected.callback(13); });
  mockControl2.$verifyAll();
}

function testAssertDeferredEqualsFailureWongValueBothDeferred() {
  var actualDeferred = new goog.async.Deferred();
  var expectedDeferred = new goog.async.Deferred();
  asyncMockControl.assertDeferredEquals(
      'different values', expectedDeferred, actualDeferred);
  expectedDeferred.callback(12);
  asyncMockControl2.assertDeferredError(
      actualDeferred, function() { actualDeferred.callback(13); });
  assertVerifyFails();
  mockControl2.$verifyAll();
}

function testAssertDeferredEqualsFailureNeitherDeferredEverResolves() {
  var actualDeferred = new goog.async.Deferred();
  var expectedDeferred = new goog.async.Deferred();
  asyncMockControl.assertDeferredEquals(
      'doesn\'t resolve', expectedDeferred, actualDeferred);
  assertVerifyFails();
}

function testAssertDeferredEqualsSuccessActualDeferred() {
  var actual = new goog.async.Deferred();
  asyncMockControl.assertDeferredEquals('should succeed', 12, actual);
  actual.callback(12);
  mockControl.$verifyAll();
}

function testAssertDeferredEqualsSuccessExpectedDeferred() {
  var expected = new goog.async.Deferred();
  asyncMockControl.assertDeferredEquals('should succeed', expected, 12);
  expected.callback(12);
  mockControl.$verifyAll();
}

function testAssertDeferredEqualsSuccessBothDeferred() {
  var actualDeferred = new goog.async.Deferred();
  var expectedDeferred = new goog.async.Deferred();
  asyncMockControl.assertDeferredEquals(
      'should succeed', expectedDeferred, actualDeferred);
  expectedDeferred.callback(12);
  actualDeferred.callback(12);
  mockControl.$verifyAll();
}

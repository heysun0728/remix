'use strict'
var remixLib = require('remix-lib')
var BreakpointManager = remixLib.code.BreakpointManager

function testDebugging (t, debugManager, contract) {
  debugManager.traceManager.getLength((error, traceLength) => {
    if (error) return t.end(error)
    console.log(traceLength)
  })

      // stack
  debugManager.traceManager.getStackAt(4, (error, callstack) => {
    if (error) return t.end(error)
    t.equal(JSON.stringify(callstack), JSON.stringify([ '0x0000000000000000000000000000000000000000000000000000000000000000' ]))
  })

  debugManager.extractStateAt(10, (error, state) => {
    if (error) return t.end(error)
    debugManager.decodeStateAt(10, state, (error, decodedState) => {
      if (error) return t.end(error)
      t.equal(decodedState['test'].value, '0')
      t.equal(decodedState['test'].type, 'uint256')
      t.equal(decodedState['randnum'].type, 'uint256')
    })
  })

    // break point
  var sourceMappingDecoder = new remixLib.SourceMappingDecoder()
  var breakPointManager = new BreakpointManager(debugManager, (rawLocation) => {
    return sourceMappingDecoder.convertOffsetToLineColumn(rawLocation, sourceMappingDecoder.getLinebreakPositions(contract))
  })

  breakPointManager.add({fileName: 'test.sol', row: 5})

  breakPointManager.event.register('breakpointHit', function (sourceLocation, step) {
    console.log('breakpointHit')
    t.equal(step, 13)
  })

  breakPointManager.jumpNextBreakpoint(0, true)
  breakPointManager.event.register('noBreakpointHit', function () {
    t.end('noBreakpointHit')
    console.log('noBreakpointHit')
  })
  t.end()
}

module.exports = {
  testDebugging: testDebugging
}

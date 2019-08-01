'use strict'
var tape = require('tape')
var remixLib = require('remix-lib')
var compilerInput = remixLib.helpers.compiler.compilerInput
var vmCall = require('./vmCall')
var Debugger = require('../src/Ethdebugger')
var compiler = require('solc')
var fs = require('fs')

function readFile (filepath) {
  return fs.readFileSync(filepath).toString()
}

function test (contractFilePath, contractName, testerFilePath) {
  var tester = require(testerFilePath)
  var contract = readFile(contractFilePath)
  tape('debug contract with new opcodes', function (t) {
    var privateKey = Buffer.from('dae9801649ba2d95a21e688b56f77905e5667c44ce868ec83f82e838712a2c7a', 'hex')
    var vm = vmCall.initVM(t, privateKey)
    var output = compiler.compile(compilerInput(contract))
    output = JSON.parse(output)
    console.log(output)

    // setting vm
    var web3VM = new remixLib.vm.Web3VMProvider()
    web3VM.setVM(vm)

    vmCall.sendTx(vm, {nonce: 0, privateKey: privateKey}, null, 0, output.contracts['test.sol'][contractName].evm.bytecode.object, (error, txHash) => {
      if (error) {
        t.end(error)
      } else {
        web3VM.eth.getTransaction(txHash, (error, tx) => {
          if (error) {
            t.end(error)
          } else {
            var debugManager = new Debugger({
              compilationResult: function () {
                return output
              }
            })
            debugManager.addProvider('web3vmprovider', web3VM)
            debugManager.switchProvider('web3vmprovider')

            debugManager.callTree.event.register('callTreeReady', () => {
              tester.testDebugging(t, debugManager, contract)
            })

            debugManager.debug(tx)
          }
        })
      }
    })
  })
}

// run test
// argument: contract file path, contract name, tester file path
test('./testLityFile/RandNumberExample.sol', 'RandNumberExample', './testLityFile/RandNumberExampleTester.js')

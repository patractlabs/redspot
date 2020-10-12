# Delegator Smart Contract

The delegator smart contract is our showcase for executing other smart contracts on-chain.

It consists in total of 4 different smart contract:

- Delegator (root): Delegates calls either to the Adder or Subber smart contract
- Adder: Increases a value in the Accumulator smart contract
- Subber: Decreases a value in the Accumulator smart contract
- Accumulator: Owns a simple `i32` value that can be incremented or decremented

In order to test this bundle of smart contracts you need to do the following:

1. Compile all dependencies of the Delegator smart contract using the `./build-all.sh` script.
   As usual you will receive their respective Wasm blobs in their respective `target` folders.
1. Go to the delegator directory (root of the example) and run `cargo contract generate-metadata`
   in order to generate the ABI file for the Delegator smart contract.
   Note: You won't need an ABI file for the other smart contracts since we won't operate on them
   using the Polkadot UI.
1. Put the Wasm blobs of Accumulator, Adder, Subber and the Delegator on the chain via `put_code` command.
   While doing so note down their respective code hashes that you can inspect by extracting this information
   out from the signalling events upon putting the code on the chain.
1. Instantiate the Delegator smart contract given all of the code hashes and a starting value.
   The Delegator smart contract will take over the work of instantiating the other smart contracts for you.
1. Now you are able to run the operations provided by the Delegator smart contract.
   Namely `delegate` to delegate the call to either the Adder or the Subber to either increase or decrease
   the value stored in the Accumulator smart contract respectively and `switch` to switch the currently
   delegated-to smart contract.
   The initial delegated-to smart contract is the Adder.

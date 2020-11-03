import { patract } from "redspot";
import BN from "bn.js";
import { Contract } from "@redspot/patract";

const {
  disconnect,
  getContractFactory,
  getRandomSigner,
  getSigners,
  getAbi,
} = patract!;

async function setup() {
  const one = new BN("10000000000");
  const signers = await getSigners();
  const Alice = signers[0];
  const sender = await getRandomSigner(Alice, one.muln(10));
  const contractFactory = await getContractFactory("erc20", sender);
  const contract = await contractFactory.deploy("new", "1000", {
    value: 20002000000,
  });
  const abi = getAbi("erc20");

  return { sender, contractFactory, contract, abi };
}

async function run() {
  const { contract, sender } = await setup();
  const receiver = await getRandomSigner();

  const result = await contract.approve(receiver.address, 7, {
    gasLimit: "100000000000",
  });

  console.log(result);
}

run().catch((err) => {
  console.log(err);
});

import BN from "bn.js";
import { patract } from "redspot";
import { expect } from "chai";

const {
  disconnect,
  getContractFactory,
  getRandomSigner,
  getSigners,
  getAbi,
} = patract!;

describe("ERC20", () => {
  after(() => {
    return disconnect();
  });

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
    const receiver = await getRandomSigner();

    return { sender, contractFactory, contract, abi, receiver, Alice, one };
  }

  it("Assigns initial balance", async () => {
    const { contract, sender } = await setup();
    const result = await contract.query.balanceOf(sender.pair.address);
    expect(result?.output?.toString()).to.equal("1000");
  });

  it("Transfer adds amount to destination account", async () => {
    const { contract, sender, receiver } = await setup();

    await contract.tx.transfer(receiver.pair.address, 7);

    const result = await contract.query.balanceOf(receiver.pair.address);

    expect(result.output.toNumber()).to.equal(7);
  });

  it("Transfer emits event", async () => {
    const { contract, sender, receiver } = await setup();

    const result = await contract.tx.transfer(receiver.pair.address, 7);

    const event = result?.events?.find((e) => e.name === "Transfer");

    const [from, to, value] = event?.args as any;

    expect(from.unwrap().toString()).to.equal(sender.pair.address);
    expect(to.unwrap().toString()).to.equal(receiver.pair.address);
    expect(value.toNumber()).to.equal(7);
  });

  it("Can not transfer above the amount", async () => {
    const { contract, receiver } = await setup();

    const result = await contract.tx.transfer(receiver.pair.address, 1007);

    const event = result?.events?.find((e) => e.name === "Transfer");

    expect(event).to.be.undefined;
  });

  it("Can not transfer from empty account", async () => {
    const { contract, Alice, one, sender } = await setup();

    const emptyAccount = await getRandomSigner(Alice, one.muln(2));

    const result = await contract.tx.transfer(sender.pair.address, 7, {
      signer: emptyAccount,
    });

    const event = result?.events?.find((e) => e.name === "Transfer");

    expect(event).to.be.undefined;
  });
});

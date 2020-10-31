import { patract } from "redspot";
import BN from "bn.js";
import { Contract } from "@redspot/patract";

jest.setTimeout(60000);

const {
  disconnect,
  getContractFactory,
  getRandomSigner,
  getSigners,
  getAbi,
} = patract!;

describe("ERC20", () => {
  afterAll(() => {
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

    return { sender, contractFactory, contract, abi };
  }

  it("Assigns initial balance", async () => {
    const { contract, sender } = await setup();
    const result = await contract.balanceOf(sender.pair.address);
    expect(result.output.toNumber()).toBe(1000);
  });

  it("Transfer adds amount to destination account", async () => {
    const { contract, sender } = await setup();
    const receiver = await getRandomSigner();

    await contract.transfer(receiver.pair.address, 7);

    const result = await contract.balanceOf(receiver.pair.address);

    expect(result.output.toNumber()).toBe(7);
  });

  it.only("Transfer emits event", async () => {
    const { contract, sender } = await setup();
    const receiver = await getRandomSigner();

    const result = await contract.transfer(receiver.pair.address, 7);

    console.log(result);
  });

  // it('Can not transfer above the amount', async () => {
  //   await expect(token.transfer(walletTo.address, 1007)).to.be.reverted;
  // });
  // it('Can not transfer from empty account', async () => {
  //   const tokenFromOtherWallet = token.connect(walletTo);
  //   await expect(tokenFromOtherWallet.transfer(wallet.address, 1))
  //     .to.be.reverted;
  // });
  // it('Calls totalSupply on BasicToken contract', async () => {
  //   await token.totalSupply();
  //   expect('totalSupply').to.be.calledOnContract(token);
  // });
  // it('Calls balanceOf with sender address on BasicToken contract', async () => {
  //   await token.balanceOf(wallet.address);
  //   expect('balanceOf').to.be.calledOnContractWith(token, [wallet.address]);
  // });
});

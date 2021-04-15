# Redspot

---

Redspot is named after Jupiter's Great Red Spot, which is also the largest DOT in the solar system. Redspot's target project is [Truffle](https://github.com/trufflesuite/truffle) in Truffle Suite. Redspot is a development environment, testing framework and asset pipeline for `pallet-contracts`. Redspot is trying to let the development of ink! be projectized and simplify the testing and interacting with contracts.

We think Redspot needs to be a flexible system for the reason that `pallet-contracts` would be integrated to any substrate chain with some partial modification. Thus we decide using [hardhat](https://github.com/nomiclabs/hardhat) as Redspot core architecture for it has an outstanding design to allow developer using plugins to add new features.

Therefore, we establish our project on the hardhat core framework and modify it a lot to suit substrate under MIT licence. In future, Redspot would build more features based on this forked hardhat core.

This project is used for contracts developer, if developers want to deploy and test on a blockchain, we advice developer to use "jupiter" blockchain, which is a open testnet for substrate pallet-contracts. Better than that, jupiter also provide a develop type node, that could very easily for testing contracts.

Please refer to this for more information: https://github.com/patractlabs/jupiter

Riot group for disscusion: https://app.element.io/#/room/#PatractLabsDev:matrix.org

_NOTICE!_
*redpot has an old version repo using for MVP(Minimum Viable Product), but now is archived and is not maintained any more. Refer to this repo [redspot-v0.1](https://github.com/patractlabs/redspot-v0.1)*


## Documentation

https://patractlabs.github.io/substrate-contracts-book/en/redspot/introduction/

## License

This project is forked from [hardhat](https://github.com/nomiclabs/hardhat), and just base on the `hardhat-core` part then modify it under MIT license. (not include Hardhat Network, "sample-project/" and others which is under NOMIC LABS DEVELOPER LICENSE AGREEMENT and Unlicense, more details refer to [hardhat LICENSE](https://github.com/nomiclabs/hardhat/blob/master/packages/hardhat-core/LICENSE))

And Redspot would also be distributed under MIT license.

## Thanks

[hardhat](https://github.com/nomiclabs/hardhat) - Hardhat is a development environment to compile, deploy, test, and debug your Ethereum software. Get Solidity stack traces & console.log.

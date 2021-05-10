# @redspot/decimals

Balance decimals plugin.

## What

Thist plugin allows you to use `1 DOT`, `1 UNIT` etc.

## Installation

Install dependency from NPM:
```shell
yarn add @redspot/decimals
```

And add the following statement to your `redspot.config.ts`:

```shell
import '@redspot/decimals'
```

## Usage

1. `DOT` is the default tokenDecimals of chain.
2. `UNIT` is the smallest unit of value.

Use for gasLimit:

```typescript
  const contract = await contractFactory.deployed('new', '10000', {
    gasLimit: '1 DOT',
    value: '10000'
  });
```

Transfer:

```typescript
  import { network } from 'redspot';

  const { api } = network;

  async function run() {
    await api.isReady;

    api.tx.balances.transfer(address, '1 DOT')
  }
```
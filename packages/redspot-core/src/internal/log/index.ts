import { Signale } from "signale";

const log = new Signale({
  config: {
    displayLabel: false,
    displayBadge: false,
  },
});

export default log;

require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.3",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    rinkeby: {
      allowUnlimitedContractSize: true,
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_URL}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    hardhat: {
      allowUnlimitedContractSize: true
    },
  },
};

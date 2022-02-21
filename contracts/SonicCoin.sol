// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SonicCoin is ERC20 {
    address public admin;
    constructor() ERC20("Sonic Coin", "SC"){
        _mint(msg.sender, 100000 * 10 ** 18);
        admin = msg.sender;
    }

    function mint(address to, uint amount) external {
        require(msg.sender == admin, "Only Admin");
        _mint(to, amount);
    }
}
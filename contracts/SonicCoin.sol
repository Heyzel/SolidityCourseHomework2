// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

//@title A Crypto for the standard ERC20 about Sonic The Hedgehog
//@author Heyzel J. Moncada
//@dev all functions are tested using hardhat

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SonicCoin is ERC20, Ownable {
    using SafeMath for uint256;

    constructor() ERC20("Sonic Coin", "SC"){
        _mint(msg.sender, 100000 * 10 ** 18);
    }

    function mint(address to, uint amount) external {
        require(msg.sender == owner(), "Only Admin");
        _mint(to, amount);
    }

}
// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SonicCoin is ERC20, Ownable {
    using SafeMath for uint256;

    mapping(address => uint256) balances;

    mapping(address => mapping (address => uint256)) allowed;

    constructor() ERC20("Sonic Coin", "SC"){
        _mint(msg.sender, 100000 * 10 ** 18);
    }

    function mint(address to, uint amount) external {
        require(msg.sender == owner(), "Only Admin");
        _mint(to, amount);
    }

    function allowance(address owner, address delegate) public override view returns (uint) {
        return allowed[owner][delegate];
    }

    function transferFrom(address owner, address buyer, uint256 numTokens) public override returns (bool) {
        require(numTokens <= balances[owner]);
        require(numTokens <= allowed[owner][msg.sender]);

        balances[owner] = balances[owner].sub(numTokens);
        allowed[owner][msg.sender] = allowed[owner][msg.sender].sub(numTokens);
        balances[buyer] = balances[buyer].add(numTokens);
        emit Transfer(owner, buyer, numTokens);
        return true;
    }
}
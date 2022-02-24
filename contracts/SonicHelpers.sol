// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

//@title An auxiliary contract for utils for SonicToken.sol and PixelSonicToke.sol
//@author Heyzel J. Moncada
//@dev all functions are tested using hardhat

contract SonicHelpers is Ownable {

    string public uriPrefix;
    string public uriSuffix;
    string public hiddenMetadataUri;

    bool public paused = false;
    bool public start = false;
    bool public revealed = false;

    mapping(address => bool) public whitelistMint;
    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isMinter;

    modifier onlyAdmin(){
        require(isAdmin[msg.sender], "Only admin!");
        _;
    }
    modifier onlyMinter(){
        require(isMinter[msg.sender], "Only Minter!");
        _;
    }

    modifier isStarted(){
        require(start || whitelistMint[msg.sender], "Sales have not started yet");
        _;
    }

    function setMinter(address _minter, bool _state) external onlyAdmin {
        isMinter[_minter] = _state;
    }

    function setAdmin(address _admin, bool _state) external onlyOwner {
        isAdmin[_admin] = _state;
    }

    function setWhitelist(address _addr, bool _state) external onlyAdmin {
        whitelistMint[_addr] = _state;
    }

    function setRevealed(bool _state) public onlyAdmin {
        revealed = _state;
    }

    function setHiddenMetadataUri(string memory _hiddenMetadataUri) public onlyAdmin {
        hiddenMetadataUri = _hiddenMetadataUri;
    }

    function setUriPrefix(string memory _uriPrefix) public onlyAdmin {
        uriPrefix = _uriPrefix;
    }

    function setUriSuffix(string memory _uriSuffix) public onlyAdmin {
        uriSuffix = _uriSuffix;
    }

    function setPaused(bool _state) public onlyAdmin {
        paused = _state;
    }

    function startSales() public onlyAdmin {
        start = true;
    }

    function checkAdmin(address addr) public view returns(bool){
        return isAdmin[addr];
    }

    function checkMinter(address addr) public view returns(bool){
        return isMinter[addr];
    }

    function checkWhitelist(address addr) public view returns(bool){
        return whitelistMint[addr];
    }

}
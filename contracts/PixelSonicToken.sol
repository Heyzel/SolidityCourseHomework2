// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PixelSonicToken is ERC1155, Ownable {
    using SafeMath for uint256;
    using Strings for uint256;

    string public name;
    string public symbol;

    string public uriPrefix = "https://gateway.pinata.cloud/ipfs/QmWpg9Ls6SxqvfkJ6ZnqMwHU4j4TNPoHokLfL4u9JGVX33/";
    string public uriSuffix = ".json";
    string public hiddenMetadataUri;

    uint256 public cost = 0.01 ether;
    uint256 public maxSupply = 12;
    uint256 public quantity = 10;
    
    uint256 public maxMintAmountPerTx = 2;
    uint256 public maxMintQuantityPerTx = 5;

    bool public paused = true; // this is the started state as well
    bool public revealed = false;

    mapping(address => bool) private whitelistMint;
    mapping(address => bool) private isAdmin;
    mapping(address => bool) private isMinter;

    mapping(uint256 => mapping(address => uint256)) private balances;
    mapping(uint => uint) public quantityById;

    constructor() ERC1155("") {
        name = "PixelSonicVerse";
        symbol = "PSV";
        setHiddenMetadataUri("https://gateway.pinata.cloud/ipfs/QmWpg9Ls6SxqvfkJ6ZnqMwHU4j4TNPoHokLfL4u9JGVX33/pixel-default-image.json");
    }

    modifier onlyAdmin(){
        require(isAdmin[msg.sender], "Only admin!");
        _;
    }

    modifier onlyMinter(){
        require(isMinter[msg.sender], "Only Minter!");
        _;
    }

    function mint(address _to, uint _id, uint _amount) external payable onlyOwner {
         require(!paused, "The contract is paused!");
         require(_id > 0 && _id <= maxSupply, "Invalid mint id!");
         require(_amount > 0 && _amount <= maxMintQuantityPerTx, "Invalid mint quantity!");
         require(quantityById[_id].add(_amount) < quantity, "Sorry, max quantity exceeded!");
         require(msg.value >= cost * _amount, "Insufficient funds!");
        _mint(_to, _id, _amount, "");
        balances[_id][_to] = balances[_id][_to].add(_amount);
        quantityById[_id] = quantityById[_id].add(_amount);
    }

    function mintBatch(address _to, uint[] memory _ids, uint[] memory _amounts) external payable onlyOwner {
        require(!paused, "The contract is paused!");
        require(_ids.length == _amounts.length, "Sizes do not match");
        require(_ids.length <= maxMintAmountPerTx, "Invalid mint amount!");
        for(uint i = 0; i < _ids.length; i++){
            require(_ids[i] > 0 && _ids[i] <= maxSupply, "Invalid mint id!");
        }
        uint totalQuantity;
        for(uint i = 0; i < _amounts.length; i++){
            require(quantityById[_ids[i]].add(_amounts[i]) < quantity, "Sorry, max quantity exceeded!");
            require(_amounts[i] <= maxMintQuantityPerTx, "Invalid mint quantity!");
            totalQuantity.add(_amounts[i]);
        }
        require(msg.value >= cost * totalQuantity, "Insufficient funds!");
        _mintBatch(_to, _ids, _amounts, "");
        for(uint i = 0; i < _ids.length; i++){
            balances[_ids[i]][_to] = balances[_ids[i]][_to].add(_amounts[i]);
            quantityById[_ids[i]] = quantityById[_ids[i]].add(_amounts[i]);
        }
    }

    function burn(uint _id, uint _amount) external {
        require(!paused, "The contract is paused!");
        require(_id > 0 && _id <= maxSupply, "Invalid mint id!");
        require(_amount > 0, "Invalid mint amount!");
        require(balances[_id][msg.sender] >= _amount, "Not enough tokens to burn");
        balances[_id][msg.sender] = balances[_id][msg.sender].sub(_amount);
        quantityById[_id] = quantityById[_id].sub(_amount);
        _burn(msg.sender, _id, _amount);
    }

    function burnBatch(uint[] memory _ids, uint[] memory _amounts) external {
        require(!paused, "The contract is paused!");
        require(_ids.length == _amounts.length, "Sizes do not match");
        for(uint i = 0; i < _ids.length; i++){
            require(_ids[i] > 0 && _ids[i] <= maxSupply, "Invalid mint id!");
        }
        for(uint i = 0; i < _amounts.length; i++){
            require(balances[_ids[i]][msg.sender] >= _amounts[i], "Sorry, not enough tokens");
        }
        for(uint i = 0; i < _ids.length; i++){
            balances[_ids[i]][msg.sender] = balances[_ids[i]][msg.sender].sub(_amounts[i]);
            quantityById[_ids[i]] = quantityById[_ids[i]].sub(_amounts[i]);
        }
        _burnBatch(msg.sender, _ids, _amounts);
    }

    function uri(uint _id) public override view returns (string memory) {
        require(exist(_id), "Token does not exist");

        if(revealed){
            return hiddenMetadataUri;
        }

        string memory currentBaseUri = uriPrefix;
        return bytes(currentBaseUri).length > 0
                ? string(abi.encodePacked(currentBaseUri, _id.toString(), uriSuffix))
                : "";

    }

    function withdraw() public onlyOwner {
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }

    function exist(uint _id) public view returns(bool) {
        return quantityById[_id] != 0;
    }

    function setRevealed(bool _state) public onlyOwner {
        revealed = _state;
    }

    function setHiddenMetadataUri(string memory _hiddenMetadataUri) public onlyOwner {
        hiddenMetadataUri = _hiddenMetadataUri;
    }

    function setUriPrefix(string memory _uriPrefix) public onlyOwner { // https://gateway.pinata.cloud/ipfs/QmWpg9Ls6SxqvfkJ6ZnqMwHU4j4TNPoHokLfL4u9JGVX33/
        uriPrefix = _uriPrefix;
    }

    function setUriSuffix(string memory _uriSuffix) public onlyOwner {
        uriSuffix = _uriSuffix;
    }

    function setPaused(bool _state) public onlyOwner {
        paused = _state;
    }

    function setMinter(address _minter, bool _state) external onlyOwner {
        isMinter[_minter] = _state;
    }

    function setAdmin(address _admin, bool _state) external onlyOwner {
        isAdmin[_admin] = _state;
    }

    function setWhitelist(address _addr, bool _state) external onlyAdmin {
        whitelistMint[_addr] = _state;
    }

}
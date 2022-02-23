// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./SonicCoin.sol";
import "./SonicHelpers.sol";

contract PixelSonicToken is ERC1155, Ownable, SonicHelpers {
    using SafeMath for uint256;
    using Strings for uint256;

    event TokenMinted(address _owner, uint _id, uint _amount);
    event TokensMinted(address _owner, uint[] _ids, uint[] _amount);
    event TokenBurned(address _exOwner, uint _id, uint _amount);
    event TokensBurned(address _exOwner, uint[] _ids, uint[] _amount);

    string public name;
    string public symbol;
    SonicCoin public SC;

    uint256 public cost = 0.01 ether;
    uint256 public costSC = 10; // one token costs 10 SonicCoins
    uint256 public maxSupply = 12;
    uint256 public quantity = 10;
    
    uint256 public maxMintAmountPerTx = 2;
    uint256 public maxMintQuantityPerTx = 5;

    mapping(uint256 => mapping(address => uint256)) private balances;
    mapping(uint => uint) public quantityById;

    constructor() ERC1155("") {
        isAdmin[msg.sender] = true;
        name = "PixelSonicVerse";
        symbol = "PSV";
        SC = new SonicCoin();
        SC.transferOwnership(msg.sender);
        setHiddenMetadataUri("https://gateway.pinata.cloud/ipfs/QmWpg9Ls6SxqvfkJ6ZnqMwHU4j4TNPoHokLfL4u9JGVX33/pixel-default-image.json");
        setUriPrefix("https://gateway.pinata.cloud/ipfs/QmWpg9Ls6SxqvfkJ6ZnqMwHU4j4TNPoHokLfL4u9JGVX33/");
        setUriSuffix(".json");
    }

    modifier isNotPaused(){
        require(!paused || isAdmin[msg.sender], "The contract is paused!");
        _;
    }

    modifier validationsForMint(uint _id, uint _amount){
        require(_amount > 0 && _amount <= maxMintQuantityPerTx, "Invalid mint quantity!");
        require(quantityById[_id].add(_amount) <= quantity, "Sorry, max quantity exceeded!");
        _;
    }

    modifier validationsForBatch(uint[] memory _ids, uint[] memory _amounts){
        require(_ids.length == _amounts.length, "Sizes do not match");
        uint aux = 0;
        for(uint i = 0; i < _ids.length; i++){
            require(_ids[i] > 0 && _ids[i] <= maxSupply, "Invalid id!");
            
            // This prevent that the user mint the same id for exceed the quantity,
            // so this way the _ids array must be from smallest to largest, i.e.,
            // _ids = [1,2,3,4].
            //  Prevent calls like _ids = [1, 1, 1, 1], _amounts = [2, 2, 2, 2]
            require(aux < _ids[i], "Repeated id!"); 
            aux = _ids[i];
        }
        _;
    }

    modifier validationsForId(uint _id){
        require(_id > 0 && _id <= maxSupply, "Invalid id!");
        _;
    }

    function mint(address _to, uint _id, uint _amount) 
    external 
    payable 
    isNotPaused 
    isStarted
    validationsForId(_id) 
    validationsForMint(_id, _amount) {
        require(msg.value >= cost * _amount, "Insufficient funds!");
        _mint(_to, _id, _amount, "");
        balances[_id][_to] = balances[_id][_to].add(_amount);
        quantityById[_id] = quantityById[_id].add(_amount);
        emit TokenMinted(_to, _id, _amount);
    }

    function mintBatch(address _to, uint[] memory _ids, uint[] memory _amounts) 
    external 
    payable 
    isNotPaused 
    isStarted
    validationsForBatch(_ids, _amounts) {
        require(_ids.length <= maxMintAmountPerTx, "Max mint amount per transaction exceeded");
        uint totalQuantity;
        for(uint i = 0; i < _amounts.length; i++){
            require(quantityById[_ids[i]].add(_amounts[i]) < quantity, "Sorry, max quantity exceeded!");
            require(_amounts[i] <= maxMintQuantityPerTx, "Invalid mint quantity!");
            totalQuantity = totalQuantity.add(_amounts[i]);
        }
        require(msg.value >= (cost * totalQuantity), "Insufficient funds!");
        _mintBatch(_to, _ids, _amounts, "");
        for(uint i = 0; i < _ids.length; i++){
            balances[_ids[i]][_to] = balances[_ids[i]][_to].add(_amounts[i]);
            quantityById[_ids[i]] = quantityById[_ids[i]].add(_amounts[i]);
        }
        emit TokensMinted(_to, _ids, _amounts);
    }

    function mintWithSonicCoin(address _to, uint _id, uint _amount) 
    external 
    isNotPaused 
    isStarted
    validationsForId(_id) 
    validationsForMint(_id, _amount) {
        uint256 allowance = SC.allowance(msg.sender, address(this));
        require(allowance >= _amount*(costSC), "You don't approve enough tokens.");
        SC.transferFrom(msg.sender, address(this), _amount*(costSC));
        _mint(_to, _id, _amount,"");
        balances[_id][_to] = balances[_id][_to].add(_amount);
        quantityById[_id] = quantityById[_id].add(_amount);
        emit TokenMinted(_to, _id, _amount);
    }

    function mintBatchWithSC(address _to, uint[] memory _ids, uint[] memory _amounts) 
    external 
    isNotPaused 
    isStarted
    validationsForBatch(_ids, _amounts) {
        require(_ids.length <= maxMintAmountPerTx, "Max mint amount per transaction exceeded");
        uint totalQuantity;
        for(uint i = 0; i < _amounts.length; i++){
            require(quantityById[_ids[i]].add(_amounts[i]) < quantity, "Sorry, max quantity exceeded!");
            require(_amounts[i] <= maxMintQuantityPerTx, "Invalid mint quantity!");
            totalQuantity = totalQuantity.add(_amounts[i]);
        }
        uint256 allowance = SC.allowance(msg.sender, address(this));
        require(allowance >= totalQuantity*(costSC), "Check the token allowance");
        _mintBatch(_to, _ids, _amounts, "");
        for(uint i = 0; i < _ids.length; i++){
            balances[_ids[i]][_to] = balances[_ids[i]][_to].add(_amounts[i]);
            quantityById[_ids[i]] = quantityById[_ids[i]].add(_amounts[i]);
        }
        emit TokensMinted(_to, _ids, _amounts);
    }

    function mintByMinter(address _to, uint _id, uint _amount) 
    external
    onlyMinter
    validationsForId(_id) 
    validationsForMint(_id, _amount) {
        _mint(_to, _id, _amount, "");
        balances[_id][_to] = balances[_id][_to].add(_amount);
        quantityById[_id] = quantityById[_id].add(_amount);
        emit TokenMinted(_to, _id, _amount);
    }

    function mintBatchByMinter(address _to, uint[] memory _ids, uint[] memory _amounts)
    external 
    onlyMinter
    validationsForBatch(_ids, _amounts){
        require(_ids.length <= maxMintAmountPerTx, "Max mint amount per transaction exceeded");
        for(uint i = 0; i < _amounts.length; i++){
            require(_amounts[i] <= maxMintQuantityPerTx, "Invalid mint quantity!");
            require(quantityById[_ids[i]].add(_amounts[i]) < quantity, "Sorry, max quantity exceeded!");
        }
        _mintBatch(_to, _ids, _amounts, "");
        for(uint i = 0; i < _ids.length; i++){
            balances[_ids[i]][_to] = balances[_ids[i]][_to].add(_amounts[i]);
            quantityById[_ids[i]] = quantityById[_ids[i]].add(_amounts[i]);
        }
        emit TokensMinted(_to, _ids, _amounts);
    }

    function burn(uint _id, uint _amount) 
    external 
    isNotPaused 
    validationsForId(_id) {
        require(_amount > 0, "Invalid burn amount!");
        require(balances[_id][msg.sender] >= _amount, "Not enough tokens to burn");
        balances[_id][msg.sender] = balances[_id][msg.sender].sub(_amount);
        quantityById[_id] = quantityById[_id].sub(_amount);
        _burn(msg.sender, _id, _amount);
        emit TokenBurned(msg.sender, _id, _amount);
    }

    function burnBatch(uint[] memory _ids, uint[] memory _amounts) 
    external 
    isNotPaused 
    validationsForBatch(_ids, _amounts) {
        for(uint i = 0; i < _amounts.length; i++){
            require(_amounts[i] > 0, "Invalid burn amount!");
            require(balances[_ids[i]][msg.sender] >= _amounts[i], "Sorry, not enough tokens");
        }
        for(uint i = 0; i < _ids.length; i++){
            balances[_ids[i]][msg.sender] = balances[_ids[i]][msg.sender].sub(_amounts[i]);
            quantityById[_ids[i]] = quantityById[_ids[i]].sub(_amounts[i]);
        }
        _burnBatch(msg.sender, _ids, _amounts);
        emit TokensBurned(msg.sender, _ids, _amounts);
    }

    function uri(uint _id) public override view returns (string memory) {
        require(exist(_id), "Token does not exist");

        if(!revealed){
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

    function getQuantityById(uint _id) public view returns(uint) {
        // this functions returns how many exist of that id
        return quantityById[_id];
    }

    function getBalances(uint _id, address _addr) public view returns(uint) {
        return balances[_id][_addr];
    }

}
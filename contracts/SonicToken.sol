// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SonicToken is ERC721, Ownable {
  using Strings for uint256;
  using Counters for Counters.Counter;

  Counters.Counter private _tokenIds;

  string public uriPrefix = "https://gateway.pinata.cloud/ipfs/QmbvdTFKw19w7NTURNhCneQoVkxjcWTz5KDnUdd1vZPrRG";
  string public uriSuffix = ".json";
  string public hiddenMetadataUri;
  
  uint256 public cost = 0.01 ether;
  uint256 public maxSupply = 12;
  uint256 public maxMintAmountPerTx = 2;

  bool public paused = true; // this is the started state as well
  bool public revealed = false;

  mapping(address => bool) private whitelistMint;
  mapping(address => bool) private isAdmin;
  mapping(address => bool) private isMinter;

  constructor() ERC721("SonicVerse", "SV") {
    setHiddenMetadataUri("https://gateway.pinata.cloud/ipfs/QmbvdTFKw19w7NTURNhCneQoVkxjcWTz5KDnUdd1vZPrRG/default-image.json");
  }

  modifier mintCompliance(uint256 _mintAmount) {
    require(_mintAmount > 0 && _mintAmount <= maxMintAmountPerTx, "Invalid mint amount!");
    require(_tokenIds.current() + _mintAmount <= maxSupply, "Max supply exceeded!");
    _;
  }

  modifier onlyAdmin(){
    require(isAdmin[msg.sender], "Only admin!");
    _;
  }

  modifier onlyMinter(){
    require(isMinter[msg.sender], "Only Minter!");
    _;
  }

  function totalSupply() public view returns (uint256) {
    return _tokenIds.current();
  }

  function mint(uint256 _mintAmount) public payable mintCompliance(_mintAmount) {
    require(!paused, "The contract is paused!");
    if(msg.value >= cost * _mintAmount){
      revert();
    }
      _mintLoop(msg.sender, _mintAmount);
  }

  function mintByMinter(uint256 _mintAmount) public mintCompliance(_mintAmount) onlyMinter {
    require(!paused, "The contract is paused!");
    _mintLoop(msg.sender, _mintAmount);
  }
  
  function mintForAddress(uint256 _mintAmount, address _receiver) public mintCompliance(_mintAmount) onlyAdmin {
    _mintLoop(_receiver, _mintAmount);
  }

  function walletOfOwner(address _owner) 
  public 
  view 
  returns (uint256[] memory) {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory ownedTokenIds = new uint256[](ownerTokenCount);
    uint256 currentTokenId = 1;
    uint256 ownedTokenIndex = 0;

    while (ownedTokenIndex < ownerTokenCount && currentTokenId <= maxSupply) {
      address currentTokenOwner = ownerOf(currentTokenId);

      if (currentTokenOwner == _owner) {
        ownedTokenIds[ownedTokenIndex] = currentTokenId;

        ownedTokenIndex++;
      }

      currentTokenId++;
    }

    return ownedTokenIds;
  }

  function balanceOfContract() public view onlyOwner returns(uint){
    return address(this).balance;
  }

  function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
    require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");

    if (revealed == false) {
      return hiddenMetadataUri;
    }

    string memory currentBaseURI = uriPrefix;
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, _tokenId.toString(), uriSuffix))
        : "";
  }

  function withdraw() public onlyOwner {
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
  }

  function setRevealed(bool _state) public onlyAdmin {
    revealed = _state;
  }

  function setHiddenMetadataUri(string memory _hiddenMetadataUri) public onlyAdmin {
    hiddenMetadataUri = _hiddenMetadataUri;
  }

  function setUriPrefix(string memory _uriPrefix) public onlyAdmin { // https://gateway.pinata.cloud/ipfs/QmbvdTFKw19w7NTURNhCneQoVkxjcWTz5KDnUdd1vZPrRG/
    uriPrefix = _uriPrefix;
  }

  function setUriSuffix(string memory _uriSuffix) public onlyAdmin {
    uriSuffix = _uriSuffix;
  }

  function setPaused(bool _state) public onlyAdmin {
    paused = _state;
  }

  function _mintLoop(address _receiver, uint256 _mintAmount) internal {
    for (uint256 i = 0; i < _mintAmount; i++) {
      _tokenIds.increment();
      _safeMint(_receiver, _tokenIds.current());
    }
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
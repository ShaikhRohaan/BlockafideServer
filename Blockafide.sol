// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Blockafide is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct Nft {
        uint256 tokenId;
        address owner;
        uint256 price;
        string tokenURI;
        bool isForSale;
    }

    mapping(uint256 => Nft) private _nfts;

    event NftMinted(uint256 tokenId, address owner, uint256 price, string tokenURI);
    event NftListed(uint256 tokenId, uint256 price);
    event NftSold(uint256 tokenId, address buyer, uint256 price);
    event NftDelisted(uint256 tokenId);

    constructor() ERC721("Blockafide", "FIDE") {}

    function mintNFT(address recipient, string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);

        Nft memory nft = Nft(newItemId, recipient, 0, tokenURI, false);
        _nfts[newItemId] = nft;

        emit NftMinted(newItemId, recipient, 0, tokenURI);

        return newItemId;
    }

    function listNFT(uint256 tokenId, uint256 price) public {
        require(_exists(tokenId), "Token ID does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can list the NFT for sale");

        _nfts[tokenId].price = price;
        _nfts[tokenId].isForSale = true;

        emit NftListed(tokenId, price);
    }

    function buyNFT(uint256 tokenId) public payable {
        require(_exists(tokenId), "Token ID does not exist");
        require(_nfts[tokenId].isForSale, "NFT is not for sale");
        require(msg.value >= _nfts[tokenId].price, "Insufficient funds");

        address seller = ownerOf(tokenId);
        safeTransferFrom(seller, msg.sender, tokenId);

        _nfts[tokenId].owner = msg.sender;
        _nfts[tokenId].isForSale = false;

        if (msg.value > _nfts[tokenId].price) {
            payable(seller).transfer(msg.value - _nfts[tokenId].price);
        }

        emit NftSold(tokenId, msg.sender, msg.value);
    }

    function delistNFT(uint256 tokenId) public {
        require(_exists(tokenId), "Token ID does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only owner can delist the NFT");

        _nfts[tokenId].price = 0;
        _nfts[tokenId].isForSale = false;

        emit NftDelisted(tokenId);
    }

    function getNFT(uint256 tokenId) public view returns (Nft memory) {
        require(_exists(tokenId), "Token ID does not exist");

        return _nfts[tokenId];
    }


function getMyNFTs(address walletAddress) public view returns (Nft[] memory) {
    uint256 count = 0;
    for (uint256 i = 1; i <= _tokenIds.current(); i++) {
        if (_nfts[i].owner == walletAddress) {
            count++;
        }
    }

    Nft[] memory nfts = new Nft[](count);
    uint256 index = 0;
    for (uint256 i = 1; i <= _tokenIds.current(); i++) {
        if (_nfts[i].owner == walletAddress) {
            nfts[index] = _nfts[i];
            index++;
        }
    }

    return nfts;
}

function getAllNFTs() public view returns (Nft[] memory) {
    Nft[] memory nfts = new Nft[](_tokenIds.current());

    for (uint256 i = 1; i <= _tokenIds.current(); i++) {
        nfts[i - 1] = _nfts[i];
    }

    return nfts;
}


function withdraw() public {
    require(msg.sender == owner(), "Only the contract owner can withdraw funds");
    payable(msg.sender).transfer(address(this).balance);
}

function owner() public view returns (address) {
    return owner();
}

function _setTokenURI(uint256 tokenId, string memory tokenURI) internal virtual {
    require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
    _nfts[tokenId].tokenURI = tokenURI;
}
}
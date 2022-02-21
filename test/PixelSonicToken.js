const {expect} = require('chai');
const { ethers } = require('hardhat');

describe('PixelSonicToken contract', () => {
    let App, app, owner

    beforeEach(async () => {
        App = await ethers.getContractFactory('PixelSonicToken');
        app = await App.deploy();
        [owner, user, user2] = await ethers.getSigners();
    });

    describe('Deployment', () => {
        it('Should set the right owner', async () => {
            expect(await app.owner()).to.equal(owner.address);
        });

        it('Should set the right owner in SonicCoin contract', async () => {
            expect(await app.owner().SC.admin).to.equal(owner.address);
        });
    });
});
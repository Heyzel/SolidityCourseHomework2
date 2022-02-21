const {expect} = require('chai');
const { network, ethers, upgrades } = require('hardhat');

describe('SonicToken contract', () => {
    let App, app, owner

    beforeEach(async () => {
        App = await ethers.getContractFactory('SonicToken');
        app = await App.deploy();
        [owner, user, user2] = await ethers.getSigners();
    });

    describe('Deployment', () => {
        it('Should set the right owner', async () => {
            expect(await app.owner()).to.equal(owner.address);
        });
    });
});
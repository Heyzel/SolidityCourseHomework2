const {expect} = require('chai');
const { ethers } = require('hardhat');

describe('PixelSonicToken contract', () => {
    let App, app, owner

    beforeEach(async () => {
        App = await ethers.getContractFactory('PixelSonicToken');
        app = await App.deploy();
        SC = await ethers.getContractFactory('SonicCoin');
        sc = await SC.attach(app.SC());
        [owner, user, user2, admin, admin2] = await ethers.getSigners();
    });

    describe('Deployment', () => {
        it('Should set the right owner', async () => {
            expect(await app.owner()).to.equal(owner.address);
        });

        it('Should set the right owner in SonicCoin contract', async () => {
            expect(await sc.owner()).to.equal(owner.address);
        });
    });

    describe('Tests for modifiers', () => {

        describe('IsNotPaused: fail if paused but not for admins', () =>{
            //  IsNotPaused: Should fail if the contract is paused but do not fail if who call is admin
            beforeEach(async () => {
                await app.connect(owner).setAdmin(admin.address, true);
            });
            // if who call is Admin should pass in
            // the first modifier but fail in the next one

            it('For mint', async () => {
                await expect(app.connect(user).mint(user.address, 3, 2)).to.be.revertedWith("The contract is paused!");
                await expect(app.connect(admin).mint(admin.address, 0, 2)).to.be.revertedWith("Invalid id!");
            });

            it('For mintBatch', async () => {
                await expect(app.connect(user).mintBatch(user.address, [1,2], [2,2])).to.be.revertedWith("The contract is paused!");
                await expect(app.connect(admin).mintBatch(admin.address, [0,1], [2,2])).to.be.revertedWith("Invalid id!");
            });

            it('For mintWithSonicCoin', async () => {
                await expect(app.connect(user).mintWithSonicCoin(user.address, 3, 2)).to.be.revertedWith("The contract is paused!");
                await expect(app.connect(admin).mintWithSonicCoin(admin.address, 0, 2)).to.be.revertedWith("Invalid id!");
            });

            it('For mintBatchWithSC', async () => {
                await expect(app.connect(user).mintBatchWithSC(user.address, [1,2], [2,2])).to.be.revertedWith("The contract is paused!");
                await expect(app.connect(admin).mintBatchWithSC(admin.address, [0,1], [2,2])).to.be.revertedWith("Invalid id!");
            });

            it('For burn', async () => {
                await expect(app.connect(user).burn(3, 2)).to.be.revertedWith("The contract is paused!");
                await expect(app.connect(admin).burn(0, 2)).to.be.revertedWith("Invalid id!");
            });

            it('For burnBatch', async () => {
                await expect(app.connect(user).burnBatch([1,2], [2,2])).to.be.revertedWith("The contract is paused!");
                await expect(app.connect(admin).burnBatch([0,1], [2,2])).to.be.revertedWith("Invalid id!");
            });

        });

        describe('validationsForMint: Should fail if the amount is 0')
    });
});
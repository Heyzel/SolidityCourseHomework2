const {expect} = require('chai');
const { ethers } = require('hardhat');

describe('SonicHelpers contract', () => {
    let App, app, owner

    beforeEach(async () => {
        App = await ethers.getContractFactory('SonicToken');
        app = await App.deploy();
        [owner, user, user2, minter, admin] = await ethers.getSigners();
    });

    describe('Deployment', () => {
        it('Should set the right owner', async () => {
            expect(await app.owner()).to.equal(owner.address);
        });
    });

    describe('Tests for functions', () => {
        describe('For setMinter', () => {
            it('Should fail if who call this function is not an admin', async () => {
                await expect(app.connect(user).setMinter(user.address, true)).to.be.revertedWith("Only admin!");
            });

            it('Should work if who call this function is an admin', async () => {
                await app.connect(owner).setAdmin(admin.address, true);
                await app.connect(admin).setMinter(minter.address, true);
                expect(await app.connect(admin).checkMinter(minter.address)).to.equal(true);
            });
        });

        describe('For setAdmin', () => {
            it('Should fail if who call this function is not the owner', async () => {
                await expect(app.connect(user).setAdmin(user.address, true)).to.be.revertedWith("Ownable: caller is not the owner");
            });

            it('Should work if who calls this funcion is the owner', async () => {
                await app.connect(owner).setAdmin(admin.address, true);
                expect(await app.connect(owner).checkAdmin(admin.address)).to.equal(true);
            });
        });

        describe('For setWhitelist', () => {
            it('Should fail if who call this function is an admin', async () => {
                await expect(app.connect(user).setWhitelist(user.address, true)).to.be.revertedWith("Only admin!");
            });

            it('Should work if who calls this funcion is an admin', async () => {
                await app.connect(owner).setAdmin(admin.address, true);
                await app.connect(admin).setWhitelist(user.address, true);
                expect(await app.connect(owner).checkWhitelist(user.address)).to.equal(true);
            });
        });

        it('For setRevealed', async () => {
            await app.connect(owner).setAdmin(admin.address, true);
            let oldState = await app.connect(owner).revealed();
            await app.connect(admin).setRevealed(!oldState);
            let newState = await app.connect(owner).revealed();
            expect(newState).to.equal(!oldState);
        });

        it('For setHiddenMetadataUri', async () => {
            await app.connect(owner).setAdmin(admin.address, true);
            await app.connect(admin).setHiddenMetadataUri('New uri');
            let newState = await app.connect(owner).hiddenMetadataUri();
            expect(newState).to.equal('New uri');
        });

        it('For setUriPrefix', async () => {
            await app.connect(owner).setAdmin(admin.address, true);
            await app.connect(admin).setUriPrefix('New uri prefix');
            let newState = await app.connect(owner).uriPrefix();
            expect(newState).to.equal('New uri prefix');
        });

        it('For setUriSuffix', async () => {
            await app.connect(owner).setAdmin(admin.address, true);
            await app.connect(admin).setUriSuffix('New uri suffix');
            let newState = await app.connect(owner).uriSuffix();
            expect(newState).to.equal('New uri suffix');
        });

        it('For setPaused', async () => {
            await app.connect(owner).setAdmin(admin.address, true);
            let oldState = await app.connect(owner).paused();
            await app.connect(admin).setPaused(!oldState);
            let newState = await app.connect(owner).paused();
            expect(newState).to.equal(!oldState);
        });

        it('For startSales', async () => {
            await app.connect(owner).setAdmin(admin.address, true);
            let oldState = await app.connect(owner).start();
            expect(oldState).to.equal(false);
            await app.connect(admin).startSales();
            let newState = await app.connect(owner).start();
            expect(newState).to.equal(true);
        })
    });
});
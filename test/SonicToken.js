const {expect} = require('chai');
const { network, ethers, upgrades } = require('hardhat');

describe('SonicToken contract', () => {
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

    describe('Tests for modifiers', () => {
        describe('isNotPaused: fail if paused but not for admins', () => {
            //  IsNotPaused: Should fail if the contract is paused but do not fail if who call is admin
            beforeEach(async () => {
                await app.connect(owner).setAdmin(admin.address, true);
                await app.connect(owner).setPaused(true);
            });

            it('For mint', async () => {
                await expect(app.connect(user).mint(2)).to.be.revertedWith("The contract is paused!");
                await expect(app.connect(admin).mint(2)).to.be.revertedWith("Sales have not started yet");
            });
        });

        describe('mintCompliance: fail if amount is 0 or greater than 2', () => {
            //  Should fail if want mint more than maxSupply as well
            it('amount is 0 or greater than 2', async () => {
                await app.connect(owner).startSales();
                await expect(app.connect(user).mint(0, {value: ethers.utils.parseEther("0.02")})).to.be.revertedWith("Invalid mint amount!");
                await expect(app.connect(user).mint(3, {value: ethers.utils.parseEther("0.02")})).to.be.revertedWith("Invalid mint amount!");
                await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")});
                await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")});
                await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")});
                await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")});
                await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")});
                await app.connect(user).mint(1, {value: ethers.utils.parseEther("0.02")});
                await expect(app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")})).to.be.revertedWith("Max supply exceeded!");
            });
        });
    });

    describe('Tests for functions', () => {
        it('Test for mint with user in whitelist', async () => {
            await app.connect(owner).setWhitelist(user2.address, true);
            expect(app.connect(user2).mint(2, {value: ethers.utils.parseEther("0.01")})).to.revertedWith("Insufficient funds!");
            const expectedBalance = ['1', '2'];
            expect(await app.connect(user2).mint(2, {value: ethers.utils.parseEther("0.02")}))
            .to.emit(app, 'TokenMinted').withArgs(user2.address, 1)
            .to.emit(app, 'TokenMinted').withArgs(user2.address, 2);
            const receivedBalance = await app.connect(user2).walletOfOwner(user2.address);
            expect(receivedBalance[0].toString()).to.equal(expectedBalance[0]);
            expect(receivedBalance[1].toString()).to.equal(expectedBalance[1]);
        })

        it('Test for mint', async () => {
            await app.connect(owner).startSales();
            expect(app.connect(user).mint(2, {value: ethers.utils.parseEther("0.01")})).to.revertedWith("Insufficient funds!");
            const expectedBalance = ['1', '2'];
            expect(await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")}))
            .to.emit(app, 'TokenMinted').withArgs(user.address, 1)
            .to.emit(app, 'TokenMinted').withArgs(user.address, 2);
            const receivedBalance = await app.connect(user).walletOfOwner(user.address);
            expect(receivedBalance[0].toString()).to.equal(expectedBalance[0]);
            expect(receivedBalance[1].toString()).to.equal(expectedBalance[1]);
        });

        it('Test for mintByMinter', async () => {
            await app.connect(owner).startSales();
            await app.connect(owner).setMinter(minter.address, true);
            const expectedBalance = ['1', '2'];
            expect(await app.connect(minter).mintByMinter(2))
            .to.emit(app, 'TokenMinted').withArgs(minter.address, 1)
            .to.emit(app, 'TokenMinted').withArgs(minter.address, 2);
            const receivedBalance = await app.connect(minter).walletOfOwner(minter.address);
            expect(receivedBalance[0].toString()).to.equal(expectedBalance[0]);
            expect(receivedBalance[1].toString()).to.equal(expectedBalance[1]);
        });

        it('Test for mintForAddress', async () => {
            await app.connect(owner).startSales();
            await app.connect(owner).setAdmin(admin.address, true);
            const expectedBalance = ['1', '2'];
            expect(await app.connect(admin).mintForAddress(2, user.address))
            .to.emit(app, 'TokenMinted').withArgs(user.address, 1)
            .to.emit(app, 'TokenMinted').withArgs(user.address, 2);
            const receivedBalance = await app.connect(admin).walletOfOwner(user.address);
            expect(receivedBalance[0].toString()).to.equal(expectedBalance[0]);
            expect(receivedBalance[1].toString()).to.equal(expectedBalance[1]);
        });

        it('Test for burn', async () => {
            await app.connect(owner).startSales();
            await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")});
            let expectedBalance = ['1', '2'];
            let receivedBalance = await app.connect(user).walletOfOwner(user.address);
            expect(receivedBalance[0].toString()).to.equal(expectedBalance[0]);
            expect(receivedBalance[1].toString()).to.equal(expectedBalance[1]);
            await app.connect(user2).mint(1, {value: ethers.utils.parseEther("0.01")});
            receivedBalance = await app.connect(user2).walletOfOwner(user2.address);
            expect(receivedBalance[0].toString()).to.equal('3');
            await expect(app.connect(user).burn(3)).to.be.revertedWith("This token is not yours!");
            await expect(app.connect(user).burn(4)).to.be.revertedWith("That token does not exist");
            expect(await app.connect(user).burn(1)).to.emit(app, 'TokenBurned').withArgs(user.address, 1);
            receivedBalance = await app.connect(user).walletOfOwner(user.address);
            expect(receivedBalance[0].toString()).to.equal(expectedBalance[1]);
        });

        describe('Test for tokenURI', () => {
            it('Should fail if the token consult does not exist', async () => {
                await expect(app.connect(user).tokenURI(1)).to.be.revertedWith("ERC721Metadata: URI query for nonexistent token");
            });

            it('Should return de hidden json if the tokens are not revealed', async () => {
                await app.connect(owner).setPaused(false);
                await app.connect(owner).startSales();
                await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")});
                const uri = await app.connect(user).tokenURI(1);
                expect(uri).to.equal(await app.hiddenMetadataUri());
            });

            it('Should return the json of the token if the tokens are not revealed', async () => {
                await app.connect(owner).setPaused(false);
                await app.connect(owner).startSales();
                await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")});
                await app.connect(owner).setRevealed(true);
                const uri = await app.connect(user).tokenURI(1);
                const expectedUri = (await app.uriPrefix()) + '1' + (await app.uriSuffix());
                expect(uri).to.equal(expectedUri);
            });
        });

        it('for withdraw', async () => {
            await app.connect(owner).startSales();
            let balance = await ethers.provider.getBalance(app.address);
            expect(balance.toString()).to.equal('0');
            await app.connect(user).mint(2, {value: ethers.utils.parseEther("0.02")});
            balance = await ethers.provider.getBalance(app.address);
            expect(balance.toString()).to.equal('20000000000000000');
            await app.connect(owner).withdraw();
            balance = await ethers.provider.getBalance(app.address);
            expect(balance.toString()).to.equal('0');
        });
    });
});
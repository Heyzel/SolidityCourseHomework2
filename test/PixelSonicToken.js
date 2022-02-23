const {expect} = require('chai');
const { ethers } = require('hardhat');

describe('PixelSonicToken contract', () => {
    let App, app, owner

    beforeEach(async () => {
        App = await ethers.getContractFactory('PixelSonicToken');
        app = await App.deploy();
        SC = await ethers.getContractFactory('SonicCoin');
        sc = await SC.attach(app.SC());
        [owner, user, user2, admin, minter] = await ethers.getSigners();
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
                await app.connect(owner).startSales();
                await app.connect(owner).setPaused(true);
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

        describe('isStarted: Should fail if the drop is not started and try mint', () => {
                // and should pass if the drop already start or the user is in the whitelist
            beforeEach(async () => {
                await app.connect(owner).setPaused(false);
                await app.connect(owner).setWhitelist(user2.address, true);
            });

            it('For mint', async () => {
                await expect(app.connect(user).mint(user.address, 3, 2)).to.be.revertedWith("Sales have not started yet");
                await expect(app.connect(user2).mint(user2.address, 0, 2)).to.be.revertedWith("Invalid id!");
                await app.connect(owner).startSales();
                await expect(app.connect(user).mint(user.address, 0, 2)).to.be.revertedWith("Invalid id!");
            });

            it('For mintBatch', async () => {
                await expect(app.connect(user).mintBatch(user.address, [1,2], [2,2])).to.be.revertedWith("Sales have not started yet");
                await expect(app.connect(user2).mintBatch(user2.address, [0,1], [2,2])).to.be.revertedWith("Invalid id!");
                await app.connect(owner).startSales();
                await expect(app.connect(user).mintBatch(user.address, [0,1], [2,2])).to.be.revertedWith("Invalid id!");
            });

            it('For mintWithSonicCoin', async () => {
                await expect(app.connect(user).mintWithSonicCoin(user.address, 3, 2)).to.be.revertedWith("Sales have not started yet");
                await expect(app.connect(user2).mintWithSonicCoin(user2.address, 0, 2)).to.be.revertedWith("Invalid id!");
                await app.connect(owner).startSales();
                await expect(app.connect(user).mintWithSonicCoin(user.address, 0, 2)).to.be.revertedWith("Invalid id!");
            });

            it('For mintBatchWithSC', async () => {
                await expect(app.connect(user).mintBatchWithSC(user.address, [1,2], [2,2])).to.be.revertedWith("Sales have not started yet");
                await expect(app.connect(user2).mintBatchWithSC(user2.address, [0,1], [2,2])).to.be.revertedWith("Invalid id!");
                await app.connect(owner).startSales();
                await expect(app.connect(user).mintBatchWithSC(user.address, [0,1], [2,2])).to.be.revertedWith("Invalid id!");
            });
        })

        describe('validationsForId: Should fail if the id is 0 or greater than 12', () => {
            beforeEach(async () => {
                await app.connect(owner).setPaused(false);
                await app.connect(owner).startSales();
            });

            it('For mint', async () => {
                await expect(app.connect(user).mint(user.address, 0, 2)).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).mint(user.address, 13, 2)).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).mint(user.address, 1, 333)).to.be.revertedWith("Invalid mint quantity!");
            });

            it('For mintWithSonicCoin', async () => {
                await expect(app.connect(user).mintWithSonicCoin(user.address, 0, 2)).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).mintWithSonicCoin(user.address, 13, 2)).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).mintWithSonicCoin(user.address, 1, 333)).to.be.revertedWith("Invalid mint quantity!");
            });

            it('For burn', async () => {
                await expect(app.connect(user).burn(0, 2)).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).burn(13, 2)).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).burn(1, 0)).to.be.revertedWith("Invalid burn amount!");
            });
        });

        describe('validationsForMint: Should fail if the amount is 0 or grater than 5 or exceeds the total number of tokens', () => {
            beforeEach(async () => {
                await app.connect(owner).setPaused(false);
                await app.connect(owner).startSales();
            });

            it('For mint', async () => {
                await expect(app.connect(user).mint(user.address, 1, 0)).to.be.revertedWith("Invalid mint quantity!");
                await expect(app.connect(user).mint(user.address, 1, 6)).to.be.revertedWith("Invalid mint quantity!");
                await app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.05")});
                await app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.05")});
                await expect(app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.05")})).to.be.revertedWith("Sorry, max quantity exceeded!");
            });

            it('For mintWithSonicCoin', async () => {
                await expect(app.connect(user).mintWithSonicCoin(user.address, 1, 0)).to.be.revertedWith("Invalid mint quantity!");
                await expect(app.connect(user).mintWithSonicCoin(user.address, 1, 6)).to.be.revertedWith("Invalid mint quantity!");
                await app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.05")});
                await app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.05")});
                await expect(app.connect(user).mintWithSonicCoin(user.address, 1, 5)).to.be.revertedWith("Sorry, max quantity exceeded!");
            });
        });

        describe('validationsForBatch: Should fail if one id is 0 or greater than 12 or the size of arrays mismatch', () => {
                // or fail if the user pass the same id 2 times in a row, they should pass be from smallest to largest
            beforeEach(async () => {
                await app.connect(owner).setPaused(false);
                await app.connect(owner).startSales();
            });

            it('For mintBatch', async () => {
                await expect(app.connect(user).mintBatch(user.address, [0,1], [2,2])).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).mintBatch(user.address, [1,13], [2,2])).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).mintBatch(user.address, [1,1], [2,2])).to.be.revertedWith("Repeated id!");
                await expect(app.connect(user).mintBatch(user.address, [2,1], [2,2])).to.be.revertedWith("Repeated id!"); // this is reverted because the correct way is [1, 2] not [2, 1]
                await expect(app.connect(user).mintBatch(user.address, [1,2], [2,2,2])).to.be.revertedWith("Sizes do not match");
                await expect(app.connect(user).mintBatch(user.address, [1,2,3], [2,2,2])).to.be.revertedWith("Max mint amount per transaction exceeded");
            });

            it('For mintBatchWithSC', async () => {
                await expect(app.connect(user).mintBatchWithSC(user.address, [0,1], [2,2])).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).mintBatchWithSC(user.address, [1,13], [2,2])).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).mintBatchWithSC(user.address, [1,1], [2,2])).to.be.revertedWith("Repeated id!");
                await expect(app.connect(user).mintBatchWithSC(user.address, [2,1], [2,2])).to.be.revertedWith("Repeated id!"); // this is reverted because the correct way is [1, 2] not [2, 1]
                await expect(app.connect(user).mintBatchWithSC(user.address, [1,2], [2,2,2])).to.be.revertedWith("Sizes do not match");
                await expect(app.connect(user).mintBatchWithSC(user.address, [1,2,3], [2,2,2])).to.be.revertedWith("Max mint amount per transaction exceeded");
            });

            it('For burnBatch', async () => {
                await expect(app.connect(user).burnBatch([0,1], [2,2])).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).burnBatch([1,13], [2,2])).to.be.revertedWith("Invalid id!");
                await expect(app.connect(user).burnBatch([1,1], [2,2])).to.be.revertedWith("Repeated id!");
                await expect(app.connect(user).burnBatch([2,1], [2,2])).to.be.revertedWith("Repeated id!"); // this is reverted because the correct way is [1, 2] not [2, 1]
                await expect(app.connect(user).burnBatch([1,2], [2,2,2])).to.be.revertedWith("Sizes do not match");
                await expect(app.connect(user).burnBatch([1], [2])).to.be.revertedWith("Sorry, not enough tokens");
            });
        });
    });

    describe('Tests for functions', () => {
        beforeEach(async () => {
            await app.connect(owner).setPaused(false);
            await app.connect(owner).startSales();
        });

        describe('Tests for mint', () => {
            it('Should fail if the amount is insufficient', async () => {
                await expect(app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.04")})).to.be.revertedWith("Insufficient funds!");
            });

            it('In other case should work fine', async () => {
                expect(await app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.05")})).to.emit(app, 'TokenMinted').withArgs(user.address, 1, 5);
                expect(await app.connect(user).getQuantityById(1)).to.equal(5);
                expect(await app.connect(user).getBalances(1, user.address)).to.equal(5);
            })
        });

        describe('Tests for mintBatch', () => {
            it('Should fail if exceed the mint amount per transaction (2)', async () => {
                await expect(app.connect(user).mintBatch(user.address, [1,2,3], [2,2,2])).to.be.revertedWith("Max mint amount per transaction exceeded");
            });

            it('Should fail if exceed the mint quantity per transaction (5)', async () => {
                await expect(app.connect(user).mintBatch(user.address, [1,2], [6,1])).to.be.revertedWith("Invalid mint quantity!");
            });

            it('Should fail if exceed the total of tokens availables', async () => { 
                await app.connect(user).mint(user.address, 1, 4, {value: ethers.utils.parseEther("0.04")});
                await app.connect(user).mint(user.address, 1, 4, {value: ethers.utils.parseEther("0.04")});
                await expect(app.connect(user).mintBatch(user.address, [1,2], [4,1])).to.be.revertedWith("Sorry, max quantity exceeded!");
            });

            it('Should fail if the amount is insufficient', async () => {
                await expect(app.connect(user).mintBatch(user.address, [1,2], [3,3], {value: ethers.utils.parseEther("0.04")})).to.be.revertedWith("Insufficient funds!");
            });

            it('In other case should work fine', async () => {
                expect(await app.connect(user).mintBatch(user.address, [1,2], [3,3], {value: ethers.utils.parseEther("0.06")})).to.emit(app, 'TokensMinted').withArgs(user.address, [1,2], [3,3]);
                expect(await app.connect(user).getQuantityById(1)).to.equal(3);
                expect(await app.connect(user).getBalances(1, user.address)).to.equal(3);
                expect(await app.connect(user).getQuantityById(2)).to.equal(3);
                expect(await app.connect(user).getBalances(2, user.address)).to.equal(3);
            });
        });

        it('Tests for mintWithSonicCoin', async () => {
            await sc.connect(owner).mint(user.address, 100);
            await sc.connect(user).approve(app.address, 20);
            await expect(app.connect(user).mintWithSonicCoin(user.address, 1, 3)).to.be.revertedWith("You don't approve enough tokens.");
            expect(await app.connect(user).mintWithSonicCoin(user.address, 1, 2)).to.emit(app, 'TokenMinted').withArgs(user.address, 1, 2);
            expect(await app.connect(user).getQuantityById(1)).to.equal(2);
            expect(await app.connect(user).getBalances(1, user.address)).to.equal(2);
        });

        it('Tests for mintBatchWithSC', async () => {
            await sc.connect(owner).mint(user.address, 300);
            await sc.connect(user).approve(app.address, 80);
            await expect(app.connect(user).mintBatchWithSC(user.address, [1, 2, 3], [3, 3, 3])).to.be.revertedWith("Max mint amount per transaction exceeded");
            await expect(app.connect(user).mintBatchWithSC(user.address, [1,2], [6, 1])).to.be.revertedWith("Invalid mint quantity!");
            expect(await app.connect(user).mintBatchWithSC(user.address, [1,2], [4, 4])).to.emit(app, 'TokensMinted').withArgs(user.address, [1,2], [4,4]);
            expect(await app.connect(user).getQuantityById(1)).to.equal(4);
            expect(await app.connect(user).getBalances(1, user.address)).to.equal(4);
            expect(await app.connect(user).getQuantityById(2)).to.equal(4);
            expect(await app.connect(user).getBalances(2, user.address)).to.equal(4);
            await sc.connect(user).approve(app.address, 60);
            await app.connect(user).mintBatchWithSC(user.address, [1, 2], [3, 3]);
            expect(await app.connect(user).getQuantityById(1)).to.equal(7);
            expect(await app.connect(user).getBalances(1, user.address)).to.equal(7);
            expect(await app.connect(user).getQuantityById(2)).to.equal(7);
            expect(await app.connect(user).getBalances(2, user.address)).to.equal(7);
            await sc.connect(user).approve(app.address, 100);
            await expect(app.connect(user).mintBatchWithSC(user.address, [1, 2], [5, 5])).to.be.revertedWith("Sorry, max quantity exceeded!");
        });

        describe('Tests for burn', () => {
            it('Should fail if the amount to burn is 0', async () => {
                await expect(app.connect(user).burn(1, 0)).to.be.revertedWith("Invalid burn amount!");
            });

            it('Should fail if the user wants to burn more tokens than he has', async () => {
                await app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.05")});
                await expect(app.connect(user).burn(1, 6)).to.be.revertedWith("Not enough tokens to burn");
            });

            it('In other case should work fine', async () => {
                await app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.05")});
                expect(await app.connect(user).getQuantityById(1)).to.equal(5);
                expect(await app.connect(user).getBalances(1, user.address)).to.equal(5);
                expect(await app.connect(user).burn(1, 5)).to.emit(app, 'TokenBurned').withArgs(user.address, 1, 5);
                expect(await app.connect(user).getQuantityById(1)).to.equal(0);
                expect(await app.connect(user).getBalances(1, user.address)).to.equal(0);
            });
        });

        describe('Tests for burnBatch', () => {
            it('Should fail if the amount to burn of one token is 0', async () => {
                await expect(app.connect(user).burnBatch([1,2], [0,1])).to.be.revertedWith("Invalid burn amount!");
            });

            it('Should fail if the user wants to burn more tokens than he has', async () => {
                await app.connect(user).mintBatch(user.address, [1,2], [3,3], {value: ethers.utils.parseEther("0.06")});
                await expect(app.connect(user).burnBatch([1,2], [4,3])).to.be.revertedWith( "Sorry, not enough tokens");
            });

            it('In other case should work fine', async () => {
                await app.connect(user).mintBatch(user.address, [1,2], [3,3], {value: ethers.utils.parseEther("0.06")});
                expect(await app.connect(user).burnBatch([1,2], [2,2])).to.emit(app, 'TokensBurned').withArgs(user.address, [1,2], [2,2]);
                expect(await app.connect(user).getQuantityById(1)).to.equal(1);
                expect(await app.connect(user).getBalances(1, user.address)).to.equal(1);
                expect(await app.connect(user).getQuantityById(2)).to.equal(1);
                expect(await app.connect(user).getBalances(2, user.address)).to.equal(1);
            })
        });

        describe('Tests for uri', () => {
            it('Should fail if the token consult does not exist', async () => {
                await expect(app.connect(user).uri(1)).to.be.revertedWith("Token does not exist");
            });

            it('Should return de hidden json if the tokens are not revealed', async () => {
                await app.connect(owner).setPaused(false);
                await app.connect(owner).startSales();
                await app.connect(user).mint(user.address, 1, 4, {value: ethers.utils.parseEther("0.04")});
                const uri = await app.connect(user).uri(1);
                expect(uri).to.equal(await app.hiddenMetadataUri());
            });

            it('Should return the json of the token if the tokens are not revealed', async () => {
                await app.connect(owner).setPaused(false);
                await app.connect(owner).startSales();
                await app.connect(user).mint(user.address, 1, 4, {value: ethers.utils.parseEther("0.04")});
                await app.connect(owner).setRevealed(true);
                const uri = await app.connect(user).uri(1);
                const expectedUri = (await app.uriPrefix()) + '1' + (await app.uriSuffix());
                expect(uri).to.equal(expectedUri);
            });
        });

        describe('Tests for withdraw', () => {
            it('Should have 0 in the balance after a withdraw', async () => {
                await app.connect(owner).startSales();
                let balance = await ethers.provider.getBalance(app.address);
                expect(balance.toString()).to.equal('0');
                await app.connect(user).mint(user.address, 1, 5, {value: ethers.utils.parseEther("0.05")});
                balance = await ethers.provider.getBalance(app.address);
                expect(balance.toString()).to.equal('50000000000000000');
                await app.connect(owner).withdraw();
                balance = await ethers.provider.getBalance(app.address);
                expect(balance.toString()).to.equal('0');
            })
        })
    });

    describe('Tests for Minter Role functions', () => {
        beforeEach(async () => {
            await app.connect(owner).setMinter(minter.address, true);
        });

        describe('Tests modifiers in Minter Role functions', () => {
           describe('For validationsForId', () => {
               it('Should fail if the id is 0 or greater than 12', async () => {
                    await expect(app.connect(minter).mintByMinter(minter.address, 0, 2)).to.be.revertedWith("Invalid id!");
                    await expect(app.connect(minter).mintByMinter(minter.address, 13, 2)).to.be.revertedWith("Invalid id!");
               });
           });

           describe('For validationsForMint', () => {
               it('Should fail if the amount is 0 or grater than 5 or exceeds the total number of tokens', async () => {
                    await expect(app.connect(minter).mintByMinter(minter.address, 1, 0)).to.be.revertedWith("Invalid mint quantity!");
                    await expect(app.connect(minter).mintByMinter(minter.address, 1, 6)).to.be.revertedWith("Invalid mint quantity!");
               });

               it('Should fail if exceed the total tokens availables', async () => {
                    await app.connect(minter).mintByMinter(minter.address, 1, 5);
                    await app.connect(minter).mintByMinter(minter.address, 1, 5);
                    await expect(app.connect(minter).mintByMinter(minter.address, 1, 5)).to.be.revertedWith("Sorry, max quantity exceeded!");
               });
           });

           describe('For validationsForBatch', () => {
               it('Should fail if one id is 0 or greater than 12 or the size of arrays mismatch', async () => {
                    await expect(app.connect(minter).mintBatchByMinter(minter.address, [0,1], [2,2])).to.be.revertedWith("Invalid id!");
                    await expect(app.connect(minter).mintBatchByMinter(minter.address, [1,13], [2,2])).to.be.revertedWith("Invalid id!");
                    await expect(app.connect(minter).mintBatchByMinter(minter.address, [1,2], [2,2,2])).to.be.revertedWith("Sizes do not match");
               });

               it('Should fail if the user pass the same id 2 times in a row', async () => {
                    await expect(app.connect(minter).mintBatchByMinter(minter.address, [1,1], [2,2])).to.be.revertedWith("Repeated id!");
               });
           });

        });

        describe('Tests the functions works correctly', () => {
            it('For mintByMinter', async () => {
                expect(await app.connect(minter).mintByMinter(minter.address, 1, 5)).to.emit(app, 'TokenMinted').withArgs(minter.address, 1, 5);
                expect(await app.connect(minter).getQuantityById(1)).to.equal(5);
                expect(await app.connect(minter).getBalances(1, minter.address)).to.equal(5);
            });

            it('For mintBatchByMinter', async () => {
                await expect(app.connect(minter).mintBatchByMinter(minter.address, [1,2,3], [3,3,3])).to.be.revertedWith("Max mint amount per transaction exceeded");
                await app.connect(minter).mintByMinter(minter.address, 1, 3);
                await app.connect(minter).mintByMinter(minter.address, 1, 3);
                await expect(app.connect(minter).mintBatchByMinter(minter.address, [1,2], [5,3])).to.be.revertedWith("Sorry, max quantity exceeded!");
                await expect(app.connect(minter).mintBatchByMinter(minter.address, [1,2], [6,3])).to.be.revertedWith("Invalid mint quantity!");
                expect(await app.connect(minter).mintBatchByMinter(minter.address, [1,2], [3,3])).to.emit(app, 'TokensMinted').withArgs(minter.address, [1,2], [3,3]);
                expect(await app.connect(minter).getQuantityById(1)).to.equal(9);
                expect(await app.connect(minter).getBalances(1, minter.address)).to.equal(9);
                expect(await app.connect(minter).getQuantityById(2)).to.equal(3);
                expect(await app.connect(minter).getBalances(2, minter.address)).to.equal(3);
            });
        });
    });
    
});
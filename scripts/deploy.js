async function main() {
    [deployer] = await ethers.getSigners();
    PSV = await ethers.getContractFactory('PixelSonicToken');
    psv = await PSV.deploy();
    SC = await ethers.getContractFactory('SonicCoin');
    sc = await SC.attach(psv.SC());
    SV = await ethers.getContractFactory('SonicToken');
    sv = await SV.deploy();
    console.log(`Address of the deployer ${deployer.address}`);
}

main().then(() => process.exit(0)).catch(error => {
    console.error(error);
    process.exit(1);
});
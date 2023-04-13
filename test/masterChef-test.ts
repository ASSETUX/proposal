import { ethers } from "hardhat";
import { readFile } from "fs/promises";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TokenListingProposal, MasterChefProposal, ERC20 } from "../typechain-types";
import { BigNumber } from "ethers";
import { expect } from "chai";
import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";

const USDC_ADDRESS =  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" 

async function getAbi(path: string) {
  const data = await readFile(path, "utf8");
  const abi = new ethers.utils.Interface(JSON.parse(data));
  return abi;
}

async function getContract(pathToAbi: string, deployedAddress: string) {
  const abi = await getAbi(pathToAbi);
  const prov = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  return new ethers.Contract(deployedAddress, abi, prov);
}

describe("MasterChefProposal", function () {
  let USDC: ERC20;
  let signers: SignerWithAddress[];
  let Chef: MasterChefProposal;
  let Proposal: TokenListingProposal;

  before(async () => {
    signers = await ethers.getSigners();
    USDC = await ethers.getContractAt("ERC20", USDC_ADDRESS);

    const usdc = await getContract("./test/ABI/USDC.json", USDC_ADDRESS);
    const usdcOwner = await usdc.owner();

    await impersonateAccount(usdcOwner);
    const impersonatedSignerUSDC = await ethers.getSigner(usdcOwner);
    const toMint = BigNumber.from(10).pow(6).mul(300000);
    let tx = {
      to: impersonatedSignerUSDC.address,
      value: ethers.utils.parseEther("100"),
    };
    signers[1].sendTransaction(tx)

    await usdc.connect(impersonatedSignerUSDC).updateMasterMinter(usdcOwner);
    await usdc.connect(impersonatedSignerUSDC).configureMinter(usdcOwner, ethers.constants.MaxUint256);
    console.log("USDC balance before: %s", await usdc.balanceOf(signers[0].address));
    await usdc.connect(impersonatedSignerUSDC).mint(signers[0].address, toMint);
    console.log("USDC balance after: %s", await usdc.balanceOf(signers[0].address));
  });

  it("Deploy MasterChefProposal", async () => {
    const MasterChef = await ethers.getContractFactory("MasterChefProposal");
    const chef = await MasterChef.deploy();
    await chef.deployed();
    expect(chef.address).to.not.eq(ethers.constants.AddressZero);
    Chef = chef as MasterChefProposal;
    console.log("MasterChefProposal address: %s", chef.address);
  });

  it("Deploy new TokenListingProposal", async () => {
    const incentiveTokenAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const incentiveTokenAmount = 100000000;
    const destributionPeriod = 100000;
    const proposalDeadline = 100000;
    const adminAddress = await signers[1].address;

    await USDC.transfer(Chef.address, ethers.utils.parseUnits("1000", 6));

    const proposalAddress = await Chef.callStatic.deployProposal(
      incentiveTokenAddress,
      incentiveTokenAmount,
      destributionPeriod,
      proposalDeadline,
      adminAddress
    )
 
    Proposal = await ethers.getContractAt("TokenListingProposal", proposalAddress);
  });

  it("Stake on TokenListingProposal", async () => {
    const _amountToStake = 1000000000;
    const _lockPeriod = 100000;

    await Proposal.stakeOnProposal(
      _amountToStake,
      _lockPeriod
    )
  });

  it("Claim rewards from TokenListingProposal", async () => {
    await ethers.provider.send("evm_increaseTime", [3600 * 24 * 5]);

    await Proposal.claimRewards();
  });
});



# 🗳️ Assetux Proposal Contracts

This repository contains two interlinked smart contracts: `ProposalFactory.sol` and `Proposal.sol`. Together, they form a lightweight, modular governance/proposal system that allows a designated owner to create, approve, or reject proposals and broadcast key decisions.

---

## 📦 Contracts Structure

```
contracts/
├── Proposal.sol         # Handles single proposal logic
└── ProposalFactory.sol  # Deploys and manages multiple Proposal instances
```

---

## 🔍 Overview

* **Core Idea**: Allow creation and tracking of individual governance proposals with status management.
* **Primary Use Case**: Backend-controlled decision execution in Web3 ecosystems.
* **Key Features**:

  * Decentralized deployment of proposal contracts
  * Owner-controlled acceptance or rejection
  * Status tracking (Pending, Accepted, Rejected)
  * Reason storage for decision transparency

---

## 🧱 Dependencies

* [OpenZeppelin Ownable](https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable) (for access control)

Install with:

```bash
npm install @openzeppelin/contracts
```

---

## 🔗 Contract Interactions

### 1. `ProposalFactory.sol`

* Deployed first.
* Creates new `Proposal` contracts with predefined titles.
* Stores addresses of all deployed proposals.

### 2. `Proposal.sol`

* Deployed via `ProposalFactory`.
* Manages the lifecycle and status of a single proposal.
* Can only be updated by the `owner`.

---

## 🧠 Contract Details

### `ProposalFactory.sol`

```solidity
contract ProposalFactory is Ownable {
    address[] public proposals;

    function createProposal(string memory _title) public onlyOwner returns (address) {
        Proposal proposal = new Proposal(_title, msg.sender);
        proposals.push(address(proposal));
        return address(proposal);
    }

    function getProposals() public view returns (address[] memory) {
        return proposals;
    }
}
```

#### Key Functions

| Function           | Access      | Description                             |
| ------------------ | ----------- | --------------------------------------- |
| `createProposal()` | Only Owner  | Deploys a new `Proposal` contract       |
| `getProposals()`   | Public View | Returns all deployed proposal addresses |

---

### `Proposal.sol`

```solidity
contract Proposal is Ownable {
    enum Status { Pending, Accepted, Rejected }

    string public title;
    Status public status;
    string public reason;

    constructor(string memory _title, address _owner) {
        title = _title;
        _transferOwnership(_owner);
        status = Status.Pending;
    }

    function accept(string memory _reason) public onlyOwner {
        status = Status.Accepted;
        reason = _reason;
    }

    function reject(string memory _reason) public onlyOwner {
        status = Status.Rejected;
        reason = _reason;
    }

    function getProposalDetails() public view returns (string memory, Status, string memory) {
        return (title, status, reason);
    }
}
```

#### Key Functions

| Function               | Access      | Description                                |
| ---------------------- | ----------- | ------------------------------------------ |
| `accept(reason)`       | Only Owner  | Marks proposal as accepted                 |
| `reject(reason)`       | Only Owner  | Marks proposal as rejected                 |
| `getProposalDetails()` | Public View | Returns title, status, and decision reason |

---

## 🔄 Deployment Example (Hardhat)

```bash
npm install @openzeppelin/contracts
```

```js
const ProposalFactory = await ethers.getContractFactory("ProposalFactory");
const factory = await ProposalFactory.deploy();
await factory.deployed();

const tx = await factory.createProposal("Enable new liquidity pool");
const receipt = await tx.wait();
```

---

## ✅ Example Use Cases

* Internal decision tracking on-chain
* Governance decisions for DAO submodules
* Proposal history log for backend review
* Token-based voting systems (extendable)

---

## 🔐 Security Notes

* Only the `owner` (typically a backend service) can approve/reject proposals.
* Consider using multisig or time locks for production governance.

---

## 📜 License

MIT — free to fork, modify, and use for public or commercial purposes.

---

Let me know if you’d like this converted into a voting-based DAO-compatible version!

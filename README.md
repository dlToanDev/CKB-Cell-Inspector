# 🔍 CKB Cell Inspector

An open-source, developer-focused educational transaction explorer and state visualizer for the **Nervos CKB (Common Knowledge Base)** ecosystem.

Designed specifically for developers transitioning from **Cardano (eUTXO)**, **Ethereum (Account Model)**, or **Bitcoin (UTXO)** into Nervos CKB. CKB Cell Inspector makes the fundamental concepts of the **Cell Model**, **First-Class State**, **Two-Phase Script Verification (Lock vs Type)**, and **Capacity as State Rent** intuitive and tangible.

---

## ⚡ Key Highlights

- **Interactive State Transition Graph**: Visualizes transaction execution as **Consumed Input Cells → Transaction → Created Live Output Cells** powered by React Flow.
- **Input Cell Resolution**: Traverses referenced outpoints (`tx_hash` # `index`) to reconstruct the exact consumed cells (capacities, owner locks, data) and accurately derives the miner fee.
- **Cellbase Awareness**: Detects and explains consensus-defined null outpoints (`0x000...000:0xffffffff`) and newly minted block rewards.
- **Script Inspector & Registry**: Identifies standard CKB system scripts (SECP256K1/blake160 single-sig, SECP256K1 multisig, Nervos DAO, Type ID, Omnilock, AnyoneCanPay, xUDT, Spore) and explains the structural roles of `code_hash`, `hash_type`, and `args`.
- **Occupied Capacity (State Rent) Calculator**: Automatically computes the exact byte size and minimum CKB required to store a cell on-chain (`8 bytes capacity + data length + script sizes`).
- **Developer-Grade UI**: Dark theme dashboard with Nervos teal accents, real-time input format validation, quick 1-click testnet examples, copy-to-clipboard controls, and zero wallet or private key requirements.
- **Integrated Educational Mode**: Contextual side-by-side comparisons of the CKB Cell Model vs Ethereum Account Model and Bitcoin UTXO, with links to official Nervos RFCs and docs.

---

## 🏗️ Architecture Overview

```
                      +---------------------------------------+
                      |       Next.js 16 (App Router)         |
                      |          TypeScript + Tailwind        |
                      +-------------------+-------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
          +----------v-----------+                  +----------v-----------+
          |  Frontend UI (React) |                  | /api/rpc (Proxy API) |
          | - React Flow Graph   |                  | - CORS & Cloudflare  |
          | - Cell Inspector     |                  |   header handling    |
          | - Script Inspector   |                  | - Rate-limit shield  |
          | - Educational Guide  |                  +----------+-----------+
          +----------+-----------+                             |
                     |                                         |
                     +--------------------+--------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
          +----------v-----------+                  +----------v-----------+
          |   CKB Testnet RPC    |                  |  CKB Mainnet / Local |
          |  testnet.ckb.dev/rpc |                  |  Node (127.0.0.1)    |
          +----------------------+                  +----------------------+
```

### Module Breakdown

| Path | Purpose |
|---|---|
| `src/types/ckb.ts` | Strongly-typed CKB domain models, RPC payloads, normalized inspector structures, and script metadata. |
| `src/services/ckbRpc.ts` | JSON-RPC client with configurable endpoints, browser proxy routing, SSR fallback, and timeout guards. |
| `src/services/txParser.ts` | Normalization engine: parallel input resolution with concurrency limiting, cellbase detection, fee computation, and cycle parsing. |
| `src/lib/formatters.ts` | Safe `BigInt` capacity formatting (`Shannons` to `CKB`), occupied capacity calculator, ASCII/UTF-8 data decoder, and tx hash validator. |
| `src/lib/knownScripts.ts` | Verified registry of Nervos Testnet and Mainnet system scripts (SECP256k1, DAO, Omnilock, xUDT, ACP, Type ID). |
| `src/components/CellVisualizer.tsx` | Interactive React Flow transaction graph with animated edges and node selection. |
| `src/components/CellInspector.tsx` | Deep-dive tabbed inspector for input and output cells (outpoint, capacity, scripts, data). |
| `src/components/ScriptInspectorModal.tsx` | Modal explaining Lock vs Type scripts, hash_type mechanics (`type` vs `data`), and CKB-VM RISC-V execution. |
| `src/components/EducationalGuide.tsx` | Comprehensive educational module covering the Cell Model, Economics, CKB-VM, and official Nervos RFC links. |

---

## 🧪 Verified Testnet Sample Transactions

The application comes pre-loaded with verified live transactions on **CKB Testnet (Pudge)** (`https://testnet.ckb.dev/rpc`):

| Type | Transaction Hash | Description |
|---|---|---|
| **Standard Transfer** | `0x70a97a4634d7c615e342e9479144784a30ea5ccbb579bf223af42d418f80cc7d` | Standard CKB transfer consuming 1 cell and generating 3 output cells. Demonstrates capacity conservation and fee subtraction. |
| **Multi-IO Cell Activity** | `0xb600f410267ad6daa90afda3845bb1dcefaeddc1352cceaaa818df92390996a5` | Multiple inputs and outputs demonstrating parallel cell consumption and distribution. |
| **Cellbase Mint** | `0x920e3e1dabd3f32e3c6964ad8dd8f05335a3461b2f76855910eafb5d268e4cd5` | Block reward minting transaction with consensus null input (`0x000...000:0xffffffff`) and miner reward payout. |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20+ (tested on Node v22)
- **Package Manager**: `pnpm` (recommended), `npm`, or `yarn`

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/ckb-cell-inspector.git
cd ckb-cell-inspector

# Install dependencies using pnpm
pnpm install
```

### 2. Configure Environment (Optional)

Copy `.env.example` to `.env.local` if you wish to override the default CKB Testnet RPC endpoint:

```bash
cp .env.example .env.local
```

Default variables:
```ini
NEXT_PUBLIC_CKB_RPC_URL=https://testnet.ckb.dev/rpc
NEXT_PUBLIC_CKB_NETWORK=testnet
```

### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
pnpm build
pnpm start
```

---

## 🧪 Running Tests

The test suite is built with [Vitest](https://vitest.dev/) and covers hash validation, capacity math, occupied byte calculations, cellbase handling, RPC response normalization, and script identification.

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Test Coverage Highlights

- `src/__tests__/txValidation.test.ts`:
  - Validates 64-character and 66-character (`0x`) hashes
  - Rejects non-hex characters, invalid lengths, and empty strings
  - Verifies uppercase/lowercase normalization
- `src/__tests__/capacity.test.ts`:
  - 100,000,000 Shannons to 1.00 CKB conversion
  - Safe BigInt calculations without floating-point drift
  - CKB RFC compliant occupied capacity formula (`8 + data_bytes + script_bytes`)
  - ASCII/UTF-8 data extraction and 128-bit LE UDT amount parsing
- `src/__tests__/txParser.test.ts`:
  - Normalization of raw `get_transaction` RPC responses
  - Parallel input resolution and fee calculation (`Input - Output`)
  - Cellbase null outpoint detection (`tx_hash: 0x000...000`, `index: 0xffffffff`)
  - Unavailable / pruned previous transaction graceful fallback
- `src/__tests__/knownScripts.test.ts`:
  - Detection of SECP256K1 Blake160, Nervos DAO, and Omnilock scripts
  - Structural Lock vs Type script role verification

---

## 🔒 Security & Reliability

- **Testnet Default**: Pre-configured to CKB Testnet (Pudge) to safeguard developer workflows.
- **Zero Key Exposure**: Never asks for private keys, seed phrases, or wallet signatures.
- **Input Sanitization**: Strict 32-byte hex validation before dispatching RPC queries.
- **CORS & Rate-Limit Shield**: Server-side Next.js `/api/rpc` proxy with timeout management (15s abort controller) to ensure browser security compliance and avoid rate limits.
- **Transparent Data**: Never fabricates or hallucinates state or balance claims from arbitrary custom cell data.

---

## ⚠️ Known Limitations

1. **Light/Pruned Node History**: If an input cell references a transaction that has been pruned from the connected RPC node, the inspector marks the input as `unavailable` rather than hallucinating state.
2. **Custom Script Disassembly**: For proprietary or non-standard scripts not in the verified registry, the inspector displays raw fields (`code_hash`, `hash_type`, `args`) and cautions the user that arbitrary RISC-V bytecode cannot be decompiled without contract artifacts.
3. **Mempool Pending Inputs**: For uncommitted transactions in the mempool, cycles and block height are shown as pending until inclusion.

---

## 🛣️ Future Roadmap

- [ ] **Spore Protocol NFT Viewer**: On-chain media preview directly rendered from Spore Cell data.
- [ ] **Interactive RISC-V VM Step Debugger**: Visualize execution cycles instruction-by-instruction.
- [ ] **Address Outpoint Explorer**: Enter a CKB address to view all live cells and lock scripts owned by it.
- [ ] **Offline Transaction Builder Preview**: Import unsigned transaction JSON or witness envelopes to inspect state effects before signing.

---

## 🔗 Integration with CKBuilders Learning Repository

If you maintain a `ckb-builder-track` or CKBuilders learning repository, you can link this project cleanly as your hands-on project artifact.

### Recommended Markdown Snippet for Your CKBuilders Repo:

Add the following entry to your `README.md` or weekly log in `ckb-builder-track`:

```markdown
### 🛠️ Featured Project: CKB Cell Inspector

- **Repository**: [ckb-cell-inspector](https://github.com/your-username/ckb-cell-inspector)
- **Live Demo**: `http://localhost:3000` (or your deployed URL)
- **Focus Area**: CKB Cell Model, First-Class State, Two-Phase Script Verification, Occupied Capacity
- **Description**: An interactive developer explorer built with Next.js, TypeScript, React Flow, and CKB RPC. Visualizes transaction state transitions (Input Cells Consumed -> Transaction -> Output Cells Created), resolves previous outpoints, calculates state rent, and explains Lock Scripts vs Type Scripts.
```

---

## 📜 License

MIT License. Open-source and built for the **Nervos CKB & CKBuilders Community**.

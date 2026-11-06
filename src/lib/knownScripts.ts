import { Script, KnownScriptInfo } from "@/types/ckb";

/**
 * Registry of well-known CKB scripts on Testnet (Pudge) and Mainnet (Mirana).
 * Provides educational context and structural role explanation.
 */

interface ScriptDefinition {
  codeHash: string;
  name: string;
  category: "lock" | "type" | "dual";
  description: string;
  typicalArgs: string;
  docUrl: string;
  isOfficialSystem: boolean;
}

const KNOWN_SCRIPTS: ScriptDefinition[] = [
  // 1. SECP256K1 Blake160 (Single Sig)
  {
    codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    name: "SECP256K1 / Blake160 (Default Lock)",
    category: "lock",
    description:
      "The standard single-signature lock script for Nervos CKB. Validates an ECDSA signature using SECP256K1 and blake160 (20-byte hash of the public key).",
    typicalArgs: "20 bytes (Blake160 pubkey hash, e.g. 0x70dd44...)",
    docUrl: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0024-ckb-system-script-list/0024-ckb-system-script-list.md#secp256k1-blake160-sighash-all",
    isOfficialSystem: true,
  },
  // 2. SECP256K1 Multisig
  {
    codeHash: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
    name: "SECP256K1 / Multisig Lock",
    category: "lock",
    description:
      "Threshold multi-signature lock script. Requires M-of-N authorized signatures to unlock and spend the cell.",
    typicalArgs: "20 bytes (Multisig script configuration hash: require_first_n, threshold, pubkey hashes)",
    docUrl: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0024-ckb-system-script-list/0024-ckb-system-script-list.md#secp256k1-blake160-multisig-all",
    isOfficialSystem: true,
  },
  // 3. Nervos DAO
  {
    codeHash: "0x82979d4913582d4c2370b4fb94216978402c228894fefb43102b9d4411ea92ce",
    name: "Nervos DAO Type Script",
    category: "type",
    description:
      "System type script for the Nervos DAO. Guards cell state transitions across 2-step deposit and withdraw phases to compensate holders for secondary issuance (state rent) dilution.",
    typicalArgs: "Empty (0x)",
    docUrl: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md",
    isOfficialSystem: true,
  },
  // 4. Type ID
  {
    codeHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
    name: "Type ID (Singleton Contract Script)",
    category: "type",
    description:
      "Consensus-enforced singleton type script. Guarantees that at most one cell with this Type ID can exist, enabling upgradable smart contracts without changing the contract's identifier.",
    typicalArgs: "32 bytes (Hash of first input outpoint combined with output index)",
    docUrl: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0022-transaction-structure/0022-transaction-structure.md#type-id",
    isOfficialSystem: true,
  },
  // 5. Omnilock (Testnet & Mainnet)
  {
    codeHash: "0xf329edf95e266c034d61f59a35f4003087251e26b176ea7e27a8dfb1a32ff706",
    name: "Omnilock (Testnet)",
    category: "lock",
    description:
      "Universal interoperable lock script. Supports native cryptographic signatures from Ethereum (keccak256), Bitcoin, Passkey/WebAuthn, and Nostr.",
    typicalArgs: "Flag byte + 20-byte pubkey hash + optional RC rule flags",
    docUrl: "https://github.com/cryptape/omnilock",
    isOfficialSystem: false,
  },
  {
    codeHash: "0xa96e40dadd95ed3e379c1f729f8337723f01fa233e50c46f504f10534729165d",
    name: "Omnilock (Mainnet)",
    category: "lock",
    description:
      "Universal interoperable lock script. Supports native cryptographic signatures from Ethereum (keccak256), Bitcoin, Passkey/WebAuthn, and Nostr.",
    typicalArgs: "Flag byte + 20-byte pubkey hash + optional RC rule flags",
    docUrl: "https://github.com/cryptape/omnilock",
    isOfficialSystem: false,
  },
  // 6. Anyone-Can-Pay (ACP)
  {
    codeHash: "0x341e4d385a508bcc12e42d363e6c9c9b863886a47380001429d950ac560e1696",
    name: "Anyone-Can-Pay Lock (Testnet)",
    category: "lock",
    description:
      "Lock script that allows third parties to transfer CKB or UDT tokens into this cell without the owner's signature, while preventing unauthorized balance reduction.",
    typicalArgs: "Pubkey hash + optional minimal CKB / UDT amount bounds",
    docUrl: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0026-anyone-can-pay/0026-anyone-can-pay.md",
    isOfficialSystem: false,
  },
  {
    codeHash: "0xd369597ff47f29fbc0d47d2e3775737044311061d36383a65a6f85112614a5a5",
    name: "Anyone-Can-Pay Lock (Mainnet)",
    category: "lock",
    description:
      "Lock script that allows third parties to transfer CKB or UDT tokens into this cell without the owner's signature, while preventing unauthorized balance reduction.",
    typicalArgs: "Pubkey hash + optional minimal CKB / UDT amount bounds",
    docUrl: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0026-anyone-can-pay/0026-anyone-can-pay.md",
    isOfficialSystem: false,
  },
  // 7. xUDT (Extensible User Defined Token)
  {
    codeHash: "0x50fbea2d32b37213683ec40e321e7d68707b7773663a6358830113f37b669149",
    name: "xUDT Type Script",
    category: "type",
    description:
      "Standard extensible fungible token script on CKB. Enforces conservation of token supply (sum of input amounts >= sum of output amounts, unless owner script authorises minting).",
    typicalArgs: "Owner lock script hash (32 bytes) + optional extension script flags",
    docUrl: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0052-extensible-udt/0052-extensible-udt.md",
    isOfficialSystem: false,
  },
  {
    codeHash: "0x1142755dd57b32960b688f192d77f9d5a01ff2851a75c53df955ab8bd031de8c",
    name: "sUDT (Simple UDT) Type Script",
    category: "type",
    description:
      "Classic Simple UDT specification. Stores a 128-bit little-endian token balance in the first 16 bytes of the cell's data and enforces balance conservation.",
    typicalArgs: "Owner lock script hash (32 bytes)",
    docUrl: "https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0025-simple-udt/0025-simple-udt.md",
    isOfficialSystem: false,
  },
  // 8. Spore Protocol (NFT / Digital Objects)
  {
    codeHash: "0x4c2b60e6e73c6ed1eb3605c5a454f762f026a7cc520f9191d8e6a5eead4f8ee9",
    name: "Spore Protocol Type Script",
    category: "type",
    description:
      "Spore is an on-chain digital ownership protocol where NFT media data is directly stored inside the cell's capacity, with zero external dependencies.",
    typicalArgs: "Cluster ID or Spore unique identifier",
    docUrl: "https://docs.spore.pro",
    isOfficialSystem: false,
  },
];

/**
 * Identify a script by its code_hash.
 */
export function identifyKnownScript(script: Script | null | undefined): KnownScriptInfo | null {
  if (!script || !script.code_hash) return null;

  const normalizedHash = script.code_hash.toLowerCase();
  const match = KNOWN_SCRIPTS.find((s) => s.codeHash.toLowerCase() === normalizedHash);

  if (!match) return null;

  return {
    name: match.name,
    category: match.category,
    description: match.description,
    typicalArgs: match.typicalArgs,
    docUrl: match.docUrl,
    isOfficialSystem: match.isOfficialSystem,
  };
}

/**
 * Structural educational explanations for Script positions:
 * Lock Script vs Type Script.
 */
export const SCRIPT_ROLE_EXPLANATIONS = {
  lock: {
    title: "Lock Script (Ownership & Spending Authentication)",
    summary:
      "The Lock Script determines WHO has permission to consume (spend or destroy) this Cell.",
    executionRule:
      "Executed only when the Cell is being SPENT (as an input in a transaction). If a Cell is only being created (output), its Lock Script does NOT run.",
    securityNote:
      "Every Cell MUST have a Lock Script. Without a Lock Script, the cell could never be spent or anyone could spend it.",
    analogy:
      "Like a physical padlock on a safety deposit box. The owner holds the key (signature) to open it.",
  },
  type: {
    title: "Type Script (State Transition & Smart Contract Logic)",
    summary:
      "The Type Script determines WHAT rules govern how this Cell is created, modified, or destroyed.",
    executionRule:
      "Executed during BOTH cell creation (in outputs) and cell consumption (in inputs). Both the old state (inputs) and new state (outputs) are verified together.",
    securityNote:
      "Type Scripts are OPTIONAL. Cells without a Type Script are pure capacity (CKB storage) cells that only follow Lock rules.",
    analogy:
      "Like a contract or constitution. It ensures token balances aren't created out of thin air and state transitions are valid.",
  },
  hashType: {
    type: "hash_type = 'type': Matches the Code Cell by its Type Script hash (Type ID). This allows the code to be upgraded without changing callers.",
    data: "hash_type = 'data': Matches the Code Cell by the Blake2b hash of its raw binary data (CKB v2019 VM rules).",
    data1: "hash_type = 'data1': Matches the Code Cell by data hash using CKB v2021 VM rules.",
    data2: "hash_type = 'data2': Matches the Code Cell by data hash using CKB v2023 VM rules.",
  },
};

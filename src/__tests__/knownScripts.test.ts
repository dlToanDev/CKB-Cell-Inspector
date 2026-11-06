import { describe, it, expect } from "vitest";
import { identifyKnownScript, SCRIPT_ROLE_EXPLANATIONS } from "@/lib/knownScripts";
import { Script } from "@/types/ckb";

describe("Known CKB Scripts Registry & Identification", () => {
  it("identifies SECP256k1/blake160 default lock script", () => {
    const lock: Script = {
      code_hash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0x70dd447182cb7e9f78f10e231376130700209a32",
    };

    const info = identifyKnownScript(lock);
    expect(info).not.toBeNull();
    expect(info?.name).toContain("SECP256K1 / Blake160");
    expect(info?.category).toBe("lock");
    expect(info?.isOfficialSystem).toBe(true);
  });

  it("identifies Nervos DAO type script", () => {
    const daoType: Script = {
      code_hash: "0x82979d4913582d4c2370b4fb94216978402c228894fefb43102b9d4411ea92ce",
      hash_type: "type",
      args: "0x",
    };

    const info = identifyKnownScript(daoType);
    expect(info).not.toBeNull();
    expect(info?.name).toContain("Nervos DAO");
    expect(info?.category).toBe("type");
    expect(info?.isOfficialSystem).toBe(true);
  });

  it("identifies Omnilock lock script", () => {
    const omnilock: Script = {
      code_hash: "0xf329edf95e266c034d61f59a35f4003087251e26b176ea7e27a8dfb1a32ff706",
      hash_type: "type",
      args: "0x0011223344",
    };

    const info = identifyKnownScript(omnilock);
    expect(info).not.toBeNull();
    expect(info?.name).toContain("Omnilock");
    expect(info?.category).toBe("lock");
  });

  it("returns null for unknown custom script without crashing", () => {
    const customScript: Script = {
      code_hash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      hash_type: "type",
      args: "0x1234",
    };

    const info = identifyKnownScript(customScript);
    expect(info).toBeNull();
  });

  it("provides clear structural educational explanations for Lock vs Type", () => {
    expect(SCRIPT_ROLE_EXPLANATIONS.lock.title).toContain("Lock Script");
    expect(SCRIPT_ROLE_EXPLANATIONS.lock.executionRule).toContain("SPENT");
    expect(SCRIPT_ROLE_EXPLANATIONS.type.title).toContain("Type Script");
    expect(SCRIPT_ROLE_EXPLANATIONS.type.executionRule).toContain("BOTH");
  });
});

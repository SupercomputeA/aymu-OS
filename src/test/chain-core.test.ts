import { describe, expect, it } from "vitest";
import { base, baseSepolia, mainnet } from "wagmi/chains";

import {
  ERC6551_ACCOUNT_IMPLEMENTATION,
  ERC6551_REGISTRY,
  IMMERSION_CHAIN_ID,
  IMMERSION_TOKEN_CONTRACT,
  derivePassport,
  emptyPassport,
  immersionAccount,
} from "@/lib/immersion";

import {
  PRESENCE_EVENT,
  PRESENCE_EVENT_UID,
  PRESENCE_MOMENT,
  PRESENCE_MOMENT_UID,
  PRESENCE_RESOLVER_ADDRESS,
  ZERO_BYTES32,
  computeSchemaUID,
  easAddress,
  encodePresenceEvent,
  encodePresenceMoment,
  schemaByKey,
  schemaRegistryAddress,
} from "@/lib/eas";

import {
  PERMISSION,
  ROLE_COUNT,
  ROLES,
  coveredPermissions,
  grantedPermissions,
  hasPermission,
  permissionLabel,
  rolesByGroup,
} from "@/lib/roles";

import {
  ARAGON_DAO_ADDRESS,
  CHAINS,
  DEFAULT_CHAIN_ID,
  EAS_ADDRESSES,
  EAS_EIP712_PROXY_ADDRESSES,
  GOVERNANCE_LINKS,
  ORG_ENS_NAME,
  SCHEMA_REGISTRY_ADDRESSES,
} from "@/lib/supercompute";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

describe("chain core — ERC-6551 Immersion NFT", () => {
  it("anchors to the canonical verified registry + implementation", () => {
    expect(ERC6551_REGISTRY).toBe(
      "0x000000006551c19487814612e58FE06813775758",
    );
    expect(ERC6551_ACCOUNT_IMPLEMENTATION).toBe(
      "0x41C8f39463A868d3A88af00cd0fe7102F30E44eC",
    );
  });

  it("anchors the Immersion collection to Base Sepolia (84532), not mainnet", () => {
    expect(IMMERSION_CHAIN_ID).toBe(baseSepolia.id);
    expect(IMMERSION_CHAIN_ID).toBe(84532);
    expect(IMMERSION_TOKEN_CONTRACT).toBe(
      "0x4416023Cd7fb88f435f8788227092037C8871066",
    );
  });

  it("derives a deterministic, well-formed token-bound account", () => {
    const a = immersionAccount(IMMERSION_TOKEN_CONTRACT, 1n);
    const b = immersionAccount(IMMERSION_TOKEN_CONTRACT, 1n);
    const c = immersionAccount(IMMERSION_TOKEN_CONTRACT, 2n);
    expect(a).toMatch(ADDRESS_RE);
    expect(a).toBe(b); // deterministic
    expect(a).not.toBe(c); // tokenId matters
  });

  it("derives a different TBA per chain", () => {
    const sepolia = immersionAccount(IMMERSION_TOKEN_CONTRACT, 1n, 84532);
    const base = immersionAccount(IMMERSION_TOKEN_CONTRACT, 1n, 8453);
    expect(sepolia).not.toBe(base);
  });

  it("returns an honest empty passport — nothing minted, nothing invented", () => {
    const p = emptyPassport();
    expect(p.minted).toBe(false);
    expect(p.tokenContract).toBeNull();
    expect(p.tokenId).toBeNull();
    expect(p.account).toBeNull();
    expect(p.roles).toEqual([]);
    expect(p.registry).toBe(ERC6551_REGISTRY);
    expect(p.chainId).toBe(84532);
    expect(p.chainName).toBe("Base Sepolia");
  });

  it("derives a passport with the TBA account and minted: false", () => {
    const p = derivePassport({ tokenContract: IMMERSION_TOKEN_CONTRACT, tokenId: 7n });
    expect(p.account).toBe(immersionAccount(IMMERSION_TOKEN_CONTRACT, 7n));
    expect(p.minted).toBe(false);
    expect(p.chainName).toBe("Base Sepolia");
    expect(p.tokenId).toBe(7n);
  });
});

describe("chain core — EAS Presence schemas", () => {
  it("reproduces the two canon Presence schema UIDs from schema + resolver", () => {
    // computeSchemaUID(schema, resolver, revocable) must equal the on-chain UID.
    expect(computeSchemaUID(PRESENCE_EVENT.schema, PRESENCE_RESOLVER_ADDRESS, true)).toBe(
      PRESENCE_EVENT_UID,
    );
    expect(computeSchemaUID(PRESENCE_MOMENT.schema, PRESENCE_RESOLVER_ADDRESS, true)).toBe(
      PRESENCE_MOMENT_UID,
    );
  });

  it("marks both Presence schemas canon and both revocable", () => {
    expect(PRESENCE_EVENT.canon).toBe(true);
    expect(PRESENCE_MOMENT.canon).toBe(true);
    expect(PRESENCE_EVENT.revocable).toBe(true);
    expect(PRESENCE_MOMENT.revocable).toBe(true);
  });

  it("resolves EAS + SchemaRegistry addresses per chain", () => {
    expect(easAddress(mainnet.id)).toBe(
      "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587",
    );
    expect(easAddress(baseSepolia.id)).toBe(
      "0x4200000000000000000000000000000000000021",
    );
    expect(schemaRegistryAddress(mainnet.id)).toBe(
      "0xA7b39296258348C78294F95B872b282326A97BDF",
    );
  });

  it("throws on an unknown schema key instead of inventing one", () => {
    expect(() => schemaByKey("nope")).toThrow(/Unknown schema key/);
    expect(schemaByKey("PresenceEvent")).toBe(PRESENCE_EVENT);
    expect(schemaByKey("PresenceMoment")).toBe(PRESENCE_MOMENT);
  });

  it("encodes canon Presence payloads to ABI hex", () => {
    const event = encodePresenceEvent({
      eventId: ZERO_BYTES32,
      eventName: "Immersive test",
      timestamp: 1700000000n,
      location: "Base Sepolia",
      secretHash: ZERO_BYTES32,
    });
    expect(event).toMatch(/^0x[0-9a-f]+$/);

    const moment = encodePresenceMoment({
      mediaCid: "bafy…",
      mediaType: "image/png",
      capturedAt: 1700000001n,
      caption: "captured",
    });
    expect(moment).toMatch(/^0x[0-9a-f]+$/);
  });
});

describe("chain core — the 15-role matrix", () => {
  it("holds 15 roles: 14 designations + the charter holder", () => {
    expect(ROLES).toHaveLength(15);
    expect(ROLE_COUNT).toBe(15);
    expect(rolesByGroup("core")).toHaveLength(7);
    expect(rolesByGroup("operations")).toHaveLength(8);
  });

  it("grants the founder every permission, and only founder can revoke", () => {
    expect(hasPermission(["founder"], "MEMBER_REVOKE")).toBe(true);
    expect(hasPermission(["founder"], "GOV_EXECUTE")).toBe(true);
    expect(hasPermission(["member"], "MEMBER_REVOKE")).toBe(false);
    expect(hasPermission(["member"], "GOV_VOTE")).toBe(true);
  });

  it("is a local predicate, not an on-chain enforcement claim", () => {
    // The matrix is documented as PROPOSED — the permission set is a bitfield
    // union, deterministic and side-effect free.
    expect(grantedPermissions(["member"])).toContain("GOV_VIEW");
    expect(grantedPermissions(["member"])).not.toContain("MEMBER_REVOKE");
    expect(permissionLabel("GOV_VIEW")).toBe("Gov View");
  });

  it("covers all 30 capability bits across the role set", () => {
    expect(Object.keys(PERMISSION)).toHaveLength(30);
    expect(coveredPermissions()).toHaveLength(30);
  });
});

describe("chain core — Supercompute protocol constants", () => {
  it("defaults to Base Sepolia and carries three chains", () => {
    expect(DEFAULT_CHAIN_ID).toBe(84532);
    expect(CHAINS.map((c) => c.id)).toEqual([
      baseSepolia.id,
      base.id,
      mainnet.id,
    ]);
  });

  it("pins the Aragon DAO and its governance surfaces", () => {
    expect(ARAGON_DAO_ADDRESS).toBe(
      "0xCBeD3a57Dd010818ec9249162ce622a33F99C18C",
    );
    expect(GOVERNANCE_LINKS.aragon).toContain(ARAGON_DAO_ADDRESS);
    expect(GOVERNANCE_LINKS.basescanDao).toContain(ARAGON_DAO_ADDRESS);
  });

  it("keeps EAS / SchemaRegistry / EIP-712 proxy per-chain, not shared", () => {
    expect(EAS_ADDRESSES[mainnet.id]).toBe(
      "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587",
    );
    expect(SCHEMA_REGISTRY_ADDRESSES[mainnet.id]).toBe(
      "0xA7b39296258348C78294F95B872b282326A97BDF",
    );
    expect(EAS_EIP712_PROXY_ADDRESSES[base.id]).not.toBe(
      EAS_EIP712_PROXY_ADDRESSES[baseSepolia.id],
    );
  });

  it("names the organisation ENS", () => {
    expect(ORG_ENS_NAME).toBe("supercompute.eth");
  });
});

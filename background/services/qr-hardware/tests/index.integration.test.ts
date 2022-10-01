/**
 * @jest-environment node
 */
import "fake-indexeddb/auto"
import { ETHSignature } from "@keystonehq/bc-ur-registry-eth"
import QRHardwareService, { SyncedDevice } from ".."
import { QRHardwareDatabase } from "../db"
import { normalizeEVMAddress } from "../../../lib/utils"
import { ETH } from "../../../constants"
import { EIP1559TransactionRequest } from "../../../networks"

describe("Preference Service Integration", () => {
  let qrHardwareService: QRHardwareService

  const qrWallet = {
    ur: {
      type: "crypto-hdkey",
      cbor: "a50358210281b5013023c66b5e9a827cb52df85ddb260fdad144bd6fe4b2b6afbaf1b7865d0458200537b987733d367c32cd2f8f6eee9c512f09976a67feb153d55ce1198d61acbb06d90130a20186182cf5183cf500f5021a2fb6d7d1081a33333931096d416972476170202d2074657374",
    },
    addresses: [
      ["m/44'/60'/0'/0/0", "0xBa2902E4E5DAC2acd6Fc87EB310755405CE0b748"],
      ["m/44'/60'/0'/0/1", "0x8773e99fe7f87358de8262c3d78a642fe4b392cd"],
    ],
  }

  beforeEach(async () => {
    qrHardwareService = await QRHardwareService.create()
    await qrHardwareService.startService()
  })

  describe("syncQRKeyring", () => {
    describe("when hd key", () => {
      let emitSpy: jest.SpyInstance
      let syncedDevice: SyncedDevice
      beforeEach(async () => {
        emitSpy = jest.spyOn(qrHardwareService.emitter, "emit")
        syncedDevice = await qrHardwareService.syncQRKeyring(qrWallet.ur)
      })
      it("saves hd key", async () => {
        const db = new QRHardwareDatabase()
        const num = await db
          .table("qrHardware")
          .where("cbor")
          .equals(qrWallet.ur.cbor)
          .count()

        expect(num).toEqual(1)
      })
      it("emits synced event", async () => {
        expect(emitSpy).toHaveBeenCalledTimes(1)
        expect(emitSpy).toHaveBeenCalledWith("synced", syncedDevice)
      })
      describe("when sync keyring already exist", () => {
        beforeEach(async () => {
          emitSpy.mockReset()
          await qrHardwareService.syncQRKeyring(qrWallet.ur)
        })
        it("should not save another keyring for the same cbor", async () => {
          const db = new QRHardwareDatabase()
          const num = await db
            .table("qrHardware")
            .where("cbor")
            .equals(qrWallet.ur.cbor)
            .count()

          expect(num).toEqual(1)
        })
        it("emits synced event", async () => {
          expect(emitSpy).toHaveBeenCalledTimes(1)
          expect(emitSpy).toHaveBeenCalledWith("synced", syncedDevice)
        })
      })
    })

    describe("when account", () => {
      describe("when sync keyring already exist", () => {})
    })
  })

  describe("deriveAddress", () => {
    let emitSpy: jest.SpyInstance
    const path = qrWallet.addresses[1][0]
    beforeEach(async () => {
      emitSpy = jest.spyOn(qrHardwareService.emitter, "emit")
      await qrHardwareService.syncQRKeyring(qrWallet.ur)
      await qrHardwareService.deriveAddress({
        type: "qr-hardware",
        deviceID: qrWallet.addresses[0][1],
        path,
      })
    })

    it("emits address event", () => {
      expect(emitSpy).toHaveBeenCalledWith("address", {
        id: normalizeEVMAddress(qrWallet.addresses[0][1]),
        derivationPath: path,
        address: normalizeEVMAddress(qrWallet.addresses[1][1]),
      })
    })
  })

  describe("saveAddress", () => {
    // emit event
  })

  describe("signTransaction", () => {
    const txRequest: EIP1559TransactionRequest & { nonce: number } = {
      from: "0x0",
      nonce: 0,
      type: 2,
      input: "0x",
      value: 0n,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      gasLimit: 0n,
      chainID: "0",
      network: {
        name: "none",
        chainID: "0",
        baseAsset: ETH,
        family: "EVM",
        coingeckoPlatformID: "ethereum",
      },
    }

    let signedTx
    beforeEach(async () => {
      await qrHardwareService.syncQRKeyring(qrWallet.ur)
    })

    it("returns signature", async () => {
      const r =
        "d4f0a7bcd95bba1fbb1051885054730e3f47064288575aacc102fbbf6a9a14da"
      const s =
        "00fe1a7ecafe1a7ecafe1a7ecafe1a7ecafe1a7ecafe1a7ecafe1a7ecafe1a7e"
      qrHardwareService.emitter.on("requestSignature", ({ id }) => {
        const rlpSignatureData = Buffer.from(`${r}${s}13`, "hex")
        // r,v,s
        const ethSignature = new ETHSignature(
          rlpSignatureData,
          Buffer.from(id),
          "note..."
        )

        const ur = ethSignature.toUR()

        qrHardwareService.emitter.emit("signedTransaction", {
          id,
          ur: {
            type: ur.type,
            cbor: ur.cbor.toString("hex"),
          },
        })
      })
      signedTx = await qrHardwareService.signTransaction(txRequest, {
        deviceID: qrWallet.addresses[0][1],
        path: qrWallet.addresses[0][0],
        type: "qr-hardware",
      })

      expect(signedTx).toMatchObject({
        r: `0x${r}`,
        s: `0x${s}`,
        v: 0,
      })
    })

    describe("on cancel", () => {})
  })

  describe("signTypedTransaction", () => {})

  describe("signMessage", () => {})
})
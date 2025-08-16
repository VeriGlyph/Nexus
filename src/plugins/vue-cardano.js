import { Buffer } from "buffer";
import {
  Address,
  AssetName,
  AuxiliaryDataHash,
  BigNum,
  CoinSelectionStrategyCIP2,
  DataCost,
  ExUnitPrices,
  Int,
  LinearFee,
  MultiAsset,
  NativeScript,
  NativeScripts,
  ScriptHash,
  Transaction,
  TransactionBuilder,
  TransactionBuilderConfigBuilder,
  TransactionOutputBuilder,
  TransactionUnspentOutput,
  TransactionUnspentOutputs,
  TransactionWitnessSet,
  UnitInterval,
  Value,
  Vkeywitnesses,
} from "@emurgo/cardano-serialization-lib-asmjs";
import axios from "axios";

const defaultOptions = {
  retries: 10,
  frequency: 200,
};

const Koios = {
  defaultParameters: {
    linearFee: {
      minFeeA: "44",
      minFeeB: "155381",
    },
    minUtxo: "1000000",
    poolDeposit: "500000000",
    keyDeposit: "2000000",
    maxValSize: 5000,
    maxTxSize: 16384,
    costPerWord: "4310",
  },
  getApiBaseUrl() {
    const network = process.env.VUE_APP_CARDANO_NETWORK;
    return `https://${
      network === "mainnet" ? "api" : network
    }.koios.rest/api/v1`;
  },
  async getTip() {
    let response;
    try {
      response = await axios.get(`${this.getApiBaseUrl()}/tip`, {
        headers: {
          authorization: `Bearer ${process.env.VUE_APP_KOIOS_API_KEY}`,
        },
      });
    } catch (e) {
      console.error("Could not query blockchain tip from Koios:", e);
      return false;
    }

    return response.data[0];
  },
  async getParameters(epoch) {
    if (epoch === undefined) {
      const tip = await this.getTip();
      if (!tip) {
        console.log(
          "Could not fetch tip from Koios. Returning default parameters."
        );
        return this.defaultParameters;
      }
      epoch = tip.epoch_no;
    }

    let response;
    try {
      response = await axios.get(
        `${this.getApiBaseUrl()}/epoch_params?_epoch_no=${epoch}`,
        {
          headers: {
            authorization: `Bearer ${process.env.VUE_APP_KOIOS_API_KEY}`,
          },
        }
      );
    } catch (e) {
      console.log(
        "Could not fetch parameters from Koios. Returning default parameters."
      );
      return this.defaultParameters;
    }

    const params = response.data[0];

    if (!params.min_fee_a) {
      return this.defaultParameters;
    }

    return {
      linearFee: {
        minFeeA: params.min_fee_a,
        minFeeB: params.min_fee_b,
      },
      minUtxo: params.min_utxo_value,
      poolDeposit: params.pool_deposit,
      keyDeposit: params.key_deposit,
      maxValSize: params.max_val_size,
      maxTxSize: params.max_tx_size,
      costPerWord: params.coins_per_utxo_size,
    };
  },
};

export default {
  install(Vue, options) {
    let userOptions = { ...defaultOptions, ...options };

    Vue.mixin({
      data() {
        return {
          cardano: {
            status: "init",
            retries: userOptions.retries,
            pollingFrequency: userOptions.frequency,
            found: false,
            Wallets: [],
            Wallet: null,
            ActiveWallet: false,
            stake_key: null,
            change_address: null,
            protocol_parameters: null,
            lovelace_format: {
              minimumIntegerDigits: 1,
              maximumFractionDigits: 6,
              minimumFractionDigits: 0,
            },
          },
        };
      },
      methods: {
        formatAda(value) {
          let the_number = Number(value);
          return (
            the_number.toLocaleString(undefined, this.cardano.lovelace_format) +
            ` ₳`
          );
        },
        toAda(lovelace) {
          if (typeof lovelace === "bigint") {
            return lovelace / 1000000n;
          }
          return lovelace / 1000000;
        },
        toLovelace(Ada) {
          if (typeof Ada === "bigint") {
            return Ada * 1000000n;
          }
          return Ada * 1000000;
        },
        toUint8Array(hexString) {
          return Uint8Array.from(Buffer.from(hexString, "hex"));
        },
        fromHex(string) {
          return Buffer.from(string, "hex");
        },
        toHex(bytes) {
          return Buffer.from(bytes).toString("hex");
        },
        toAscii(bytes) {
          return Buffer.from(bytes).toString("ascii");
        },
        fromAscii(string) {
          return Buffer.from(string, "ascii");
        },
        checkForCardano() {
          let loop = setInterval(async () => {
            if (this.cardano.retries <= 0) {
              if (this.cardano.found) {
                this.cardano.status = "found";
              } else {
                this.cardano.status = "notfound";
              }
              clearInterval(loop);
              await this.getParameters();
              return;
            }

            if (window.cardano !== undefined) {
              this.cardano.found = true;
              this.checkWallets();
            }

            this.cardano.retries--;
          }, this.cardano.pollingFrequency);
        },
        checkWallets() {
          if (window.cardano === undefined) {
            return;
          }

          Object.keys(window.cardano).forEach((name) => {
            if (window.cardano[name] === undefined || name === "typhon") {
              return;
            }

            const wallet = window.cardano[name];

            if (wallet.name === undefined || wallet.icon === undefined) {
              return;
            }

            if (wallet.name.toLowerCase() !== name.toLowerCase()) {
              return;
            }

            if (
              wallet.experimental &&
              wallet.experimental.vespr_compat === true
            ) {
              return;
            }

            if (wallet.name.includes("via VESPR")) {
              return;
            }

            if (!this.cardano.Wallets.includes(wallet)) {
              this.cardano.Wallets.push(wallet);
            }
          });
        },
        /**
         * @param _utxo TransactionUnspentOutputs
         * @param need Object
         *
         * @return array<TransactionUnspentOutput>
         */
        findInputs(_utxo, need) {
          console.log(_utxo, _utxo.len());
          const segregated = {
            lovelaceOnly: [],
            withTokens: [],
          };

          for (let i = 0; i < _utxo.len(); i++) {
            const utxo = _utxo.get(i);
            if (utxo.output().amount().multiasset() === undefined) {
              segregated.lovelaceOnly.push(utxo);
            } else {
              segregated.withTokens.push(utxo);
            }
          }

          // Sort the lovelace-only UTxO by amount
          segregated.lovelaceOnly.sort((a, b) => {
            const a_lovelace = Number(a.output().amount().coin().to_str());
            const b_lovelace = Number(b.output().amount().coin().to_str());
            if (a_lovelace > b_lovelace) {
              return -1;
            } else if (a_lovelace < b_lovelace) {
              return 1;
            }
            return 0;
          });

          const inputs = [];
          let input_lovelace = 0;
          // let input_tokens = {};
          if (need.lovelace && need.assets === null) {
            // We only need lovelace!
            while (segregated.lovelaceOnly.length) {
              console.log(input_lovelace, need.lovelace);
              if (input_lovelace > need.lovelace) {
                break;
              }
              const to_use = segregated.lovelaceOnly.pop();
              const hash = to_use.input().transaction_id().to_hex();
              const index = to_use.input().index().toString();
              const lovelace = Number(to_use.output().amount().coin().to_str());
              inputs.push(to_use);
              input_lovelace += lovelace;
              console.log(`Using: ${hash}#${index} with ${lovelace} Lovelace`);
            }
          }

          return inputs;

          // console.log(inputs, input_lovelace, need.lovelace);
        },
        async connect(wallet) {
          wallet.loading = true;
          try {
            this.cardano.ActiveWallet = wallet;
            this.cardano.Wallet = await wallet.enable();
            this.cardano.status = "connected";
            this.cardano.stake_key = await this.getStakeKey();
            this.$emit("connected");
            wallet.loading = false;
            this.$forceUpdate();
          } catch (e) {
            wallet.loading = false;
            this.$forceUpdate();
            console.error("Connection Error:", e);
            throw e;
          }
        },
        async getWalletNetwork() {
          return await this.cardano.Wallet.getNetworkId();
        },
        async checkNetwork(network_id) {
          const wallet_network = await this.cardano.Wallet.getNetworkId();
          console.log(
            `Wallet Network ID: ${wallet_network}`,
            typeof wallet_network
          );
          return wallet_network === network_id;
        },
        changeWallet() {
          this.cardano.ActiveWallet = false;
          this.cardano.Wallet = null;
          this.cardano.status = "found";
          this.cardano.stake_key = null;
          this.cardano.change_address = null;
        },
        async getChangeAddress() {
          try {
            const usedAddresses = await this.cardano.Wallet.getUsedAddresses();
            const addressHex = this.fromHex(usedAddresses[0]);
            if (!addressHex) {
              return false;
            }
            return Address.from_bytes(addressHex);
          } catch (e) {
            console.log("Change Address Error:", e);
            return false;
          }
        },
        async checkBalance(asset) {
          try {
            const balance = Value.from_hex(
              await this.cardano.Wallet.getBalance()
            );

            if (asset) {
              const policy = ScriptHash.from_bytes(
                this.fromHex(asset.policy_id)
              );
              const asset_name = AssetName.new(this.fromHex(asset.asset_id));
              if (balance.multiasset() === undefined) {
                return 0;
              } else {
                return balance
                  .multiasset()
                  .get_asset(policy, asset_name)
                  .to_str();
              }
            } else {
              return balance.coin().to_str();
            }
          } catch (e) {
            console.error("Get Balance Error:", e);
          }
        },
        async getTokens(policy_id) {
          try {
            const assets_held = [];

            const balance = Value.from_hex(
              await this.cardano.Wallet.getBalance()
            );

            if (balance.multiasset() === undefined) {
              return [];
            }

            const ScriptHash = ScriptHash.from_bytes(this.fromHex(policy_id));

            const assets = balance.multiasset().get(ScriptHash);

            if (!assets || assets.len() === 0) {
              return [];
            }

            for (let i = 0; i < assets.keys().len(); i++) {
              const Asset = assets.keys().get(i);
              const AssetName = this.toAscii(Asset.name());
              const asset = {
                name: AssetName,
                policy_id: policy_id,
                asset_id: this.toHex(Asset.name()),
                assetId: policy_id + this.toHex(Asset.name()),
              };
              assets_held.push(asset);
            }

            return assets_held;
          } catch (e) {
            console.error("Get Tokens Error:", e);
          }
        },
        async getStakeCbor() {
          const rewardAddresses =
            await this.cardano.Wallet.getRewardAddresses();
          return rewardAddresses[0];
        },
        async getStakeKey() {
          const stakeAddressCbor = await this.getStakeCbor();
          const stakeAddress = Address.from_bytes(
            this.toUint8Array(stakeAddressCbor)
          );
          return stakeAddress.to_bech32();
        },
        async signData(payload) {
          const stakeAddressCbor = await this.getStakeCbor();
          return await this.cardano.Wallet.signData(stakeAddressCbor, payload);
        },
        async getParameters() {
          if (this.cardano.protocol_parameters === null) {
            this.cardano.protocol_parameters = await Koios.getParameters();
          }

          return this.cardano.protocol_parameters;
        },
        async getUTxO(pagination) {
          const UTxO = TransactionUnspentOutputs.new();
          const walletUTxO = await this.cardano.Wallet.getUtxos(
            undefined,
            pagination
          );
          walletUTxO.map((utxo) => {
            UTxO.add(TransactionUnspentOutput.from_bytes(this.fromHex(utxo)));
          });
          return UTxO;
        },
        async prepareTransaction() {
          const protocolParameters = await this.getParameters();
          const txBuilderConfig = TransactionBuilderConfigBuilder.new()
            .fee_algo(
              LinearFee.new(
                BigNum.from_str(
                  protocolParameters.linearFee.minFeeA.toString()
                ),
                BigNum.from_str(protocolParameters.linearFee.minFeeB.toString())
              )
            )
            .coins_per_utxo_byte(
              BigNum.from_str(protocolParameters.costPerWord.toString())
            )
            .pool_deposit(
              BigNum.from_str(protocolParameters.poolDeposit.toString())
            )
            .key_deposit(
              BigNum.from_str(protocolParameters.keyDeposit.toString())
            )
            .max_value_size(protocolParameters.maxValSize)
            .max_tx_size(protocolParameters.maxTxSize)
            .ex_unit_prices(
              ExUnitPrices.new(
                UnitInterval.new(BigNum.from_str("1"), BigNum.from_str("1")),
                UnitInterval.new(BigNum.from_str("1"), BigNum.from_str("1"))
              )
            )
            .build();

          return TransactionBuilder.new(txBuilderConfig);
        },
        async makeTransaction(recipients, metadata, ttl, dataHash) {
          const changeAddress = await this.getChangeAddress();

          const inputs = TransactionUnspentOutputs.new();
          (await this.cardano.Wallet.getUtxos()).map((utxo) =>
            inputs.add(TransactionUnspentOutput.from_bytes(this.fromHex(utxo)))
          );

          const txBuilder = await this.prepareTransaction();
          const protocolParameters = await this.getParameters();

          let minting = 0;
          let MintAssets = [];
          let MintingPolicies = [];

          recipients.forEach((recipient) => {
            console.log(recipient);

            const lovelace = recipient.lovelace;
            const ReceiveAddress = Address.from_bech32(recipient.address);

            let output;

            if (
              recipient.mintedAssets !== undefined &&
              recipient.mintedAssets.length
            ) {
              recipient.mintedAssets.forEach((asset) => {
                minting++;

                if (!MintingPolicies.includes(asset.policyScript)) {
                  MintingPolicies.push(asset.policyScript);
                }

                MintAssets.push(asset);
              });
              return;
            }

            if (recipient.assets !== undefined && recipient.assets.length > 0) {
              const multiasset = MultiAsset.new();
              recipient.assets.forEach((entry) => {
                const scriptHash = ScriptHash.from_hex(entry.policy);
                const assetName = AssetName.new(this.fromAscii(entry.asset));
                const quantity = BigNum.from_str(entry.quantity.toString());
                multiasset.set_asset(scriptHash, assetName, quantity);
              });
              if (lovelace > 0) {
                output = TransactionOutputBuilder.new()
                  .with_address(ReceiveAddress)
                  .next()
                  .with_coin_and_asset(
                    BigNum.from_str(lovelace.toString()),
                    multiasset
                  )
                  .build();
              } else {
                output = TransactionOutputBuilder.new()
                  .with_address(ReceiveAddress)
                  .next()
                  .with_asset_and_min_required_coin_by_utxo_cost(
                    multiasset,
                    DataCost.new_coins_per_byte(
                      BigNum.from_str(protocolParameters.costPerWord.toString())
                    )
                  )
                  .build();
              }
            } else {
              output = TransactionOutputBuilder.new()
                .with_address(ReceiveAddress)
                .next()
                .with_coin(BigNum.from_str(lovelace.toString()))
                .build();
            }

            try {
              txBuilder.add_output(output);
            } catch (e) {
              console.error("Adding Output Error:", e);
            }
          });

          const NativeScripts = NativeScripts.new();

          if (minting) {
            let assetsDict = {};

            MintingPolicies.forEach((scriptHash) => {
              NativeScripts.add(
                NativeScript.from_bytes(this.fromHex(scriptHash))
              );
            });

            MintAssets.forEach((entry) => {
              if (assetsDict[entry.assetName] === undefined) {
                assetsDict[entry.assetName] = {
                  quantity: 0,
                  policyId: entry.policyId,
                  scriptHash: entry.policyScript,
                };
              }
              assetsDict[entry.assetName].quantity =
                assetsDict[entry.assetName].quantity + parseInt(entry.quantity);
            });

            Object.entries(assetsDict).map(([name, asset]) => {
              try {
                let assetQty;

                if (asset.quantity < 0) {
                  assetQty = Int.new_negative(
                    BigNum.from_str((asset.quantity * -1).toString())
                  );
                } else {
                  assetQty = Int.new(
                    BigNum.from_str(asset.quantity.toString())
                  );
                }

                txBuilder.add_mint_asset(
                  NativeScript.from_bytes(this.fromHex(asset.scriptHash)),
                  AssetName.new(Buffer.from(name)),
                  assetQty
                );
              } catch (e) {
                this.doError("Error attempting to add a new minted asset!");
                console.error(
                  "Error attempting to add a minted asset!",
                  e,
                  asset,
                  name
                );
              }
            });
          }

          if (metadata) {
            Object.entries(metadata).map(([MetadataLabel, Metadata]) => {
              txBuilder.add_json_metadatum(
                BigNum.from_str(MetadataLabel),
                JSON.stringify(Metadata)
              );
            });
          }

          if (ttl) {
            txBuilder.set_ttl(parseInt(ttl));
          }

          try {
            txBuilder.add_inputs_from(
              inputs,
              CoinSelectionStrategyCIP2.LargestFirstMultiAsset
            );
            (await txBuilder).add_change_if_needed(changeAddress);
          } catch (e) {
            console.error("Adding Inputs Error:", e);
            return;
          }

          let txBuilt;
          try {
            txBuilt = await txBuilder.build();
          } catch (e) {
            console.error("Building Transaction Error:", e);
            return;
          }

          if (dataHash) {
            const auxDataHash = AuxiliaryDataHash.from_bytes(
              this.fromHex(dataHash)
            );
            txBuilt.set_auxiliary_data_hash(auxDataHash);
          }

          const witnessSet = TransactionWitnessSet.new();

          if (minting) {
            witnessSet.set_native_scripts(NativeScripts);
          }

          const tx = Transaction.new(txBuilt, witnessSet);

          return this.toHex(tx.to_bytes());
        },
        async getCollateral() {
          const collateral =
            await this.cardano.Wallet.experimental.getCollateral();
          console.log(collateral);
        },
        async submitTransaction(tx, witnesses) {
          try {
            // const witnesses = TransactionWitnessSet.from_bytes(this.fromHex(witnesses));

            const transaction = Transaction.from_bytes(this.fromHex(tx));
            const txWitnesses = transaction.witness_set();
            const txVkeys = txWitnesses.vkeys();
            const txScripts = txWitnesses.native_scripts();
            const totalVkeys = Vkeywitnesses.new();
            const totalScripts = NativeScripts.new();

            for (let witness of witnesses) {
              const addWitnesses = TransactionWitnessSet.from_bytes(
                this.fromHex(witness)
              );
              const addVkeys = addWitnesses.vkeys();
              if (addVkeys) {
                for (let i = 0; i < addVkeys.len(); i++) {
                  totalVkeys.add(addVkeys.get(i));
                }
              }
            }

            if (txVkeys) {
              for (let i = 0; i < txVkeys.len(); i++) {
                totalVkeys.add(txVkeys.get(i));
              }
            }

            if (txScripts) {
              for (let i = 0; i < txScripts.len(); i++) {
                totalScripts.add(txScripts.get(i));
              }
            }

            const totalWitnesses = TransactionWitnessSet.new();
            totalWitnesses.set_vkeys(totalVkeys);
            totalWitnesses.set_native_scripts(totalScripts);

            const signedTx = await Transaction.new(
              transaction.body(),
              totalWitnesses
            );

            try {
              return await this.cardano.Wallet.submitTx(
                this.toHex(signedTx.to_bytes())
              );
            } catch (e) {
              console.log("Error Submitting Transaction:", e);
            }
          } catch (e) {
            console.error("Submit Transaction Error:", e);
          }
        },
        async signTransaction(hex) {
          try {
            const witnesses = await this.cardano.Wallet.signTx(hex, true);
            return {
              tx: hex,
              witnesses: witnesses,
            };
          } catch (e) {
            console.log("User declined to sign the transaction?", e);
            return false;
          }
        },
      },
    });
  },
};

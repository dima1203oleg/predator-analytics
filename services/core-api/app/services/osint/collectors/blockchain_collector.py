"""Blockchain Collector — Аналіз крипто-адрес.

Джерела: Blockchain.info, Etherscan, Blockchair (публічні API).
Класифікація: GREY.
"""
import os

import httpx

from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class BlockchainCollector(BaseCollector):
    name = "blockchain"
    display_name = "Blockchain Explorer (BTC/ETH/USDT)"
    classification = Classification.GREY
    description = "Аналіз крипто-адрес, кластеризація гаманців, зв'язки з біржами"
    supported_entities = [EntityType.CRYPTO_WALLET]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        address = query.identifier

        # Визначення мережі за форматом адреси
        is_btc = address.startswith(("1", "3", "bc1"))
        is_eth = address.startswith("0x") and len(address) == 42

        if is_btc:
            await self._collect_btc(address, fragments, query)
        elif is_eth:
            await self._collect_eth(address, fragments, query)
        else:
            fragments.append(DataFragment(
                category="blockchain",
                source_name="Blockchain Analyzer",
                classification=Classification.GREY,
                data={"error": "Невідомий формат адреси", "address": address},
                confidence=0.0,
            ))

        return fragments

    async def _collect_btc(self, address: str, fragments: list[DataFragment], query: DossierQuery) -> None:
        """Збір даних BTC через Blockchain.info API."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(f"https://blockchain.info/rawaddr/{address}?limit=10")
                if resp.status_code == 200:
                    data = resp.json()
                    txs = data.get("txs", [])
                    tx_records = []
                    links = []

                    for tx in txs[:10]:
                        inputs = [i.get("prev_out", {}).get("addr", "unknown") for i in tx.get("inputs", [])]
                        outputs = [o.get("addr", "unknown") for o in tx.get("out", [])]
                        tx_records.append({
                            "hash": tx.get("hash"),
                            "time": tx.get("time"),
                            "inputs": inputs[:3],
                            "outputs": outputs[:3],
                            "value_btc": tx.get("result", 0) / 1e8,
                        })
                        # Зв'язки з іншими адресами
                        for out_addr in outputs[:3]:
                            if out_addr != address and out_addr != "unknown":
                                links.append({
                                    "source_id": address,
                                    "target_id": out_addr,
                                    "target_name": f"BTC: {out_addr[:12]}...",
                                    "relation_type": "CRYPTO_TRANSFER",
                                    "risk": "MEDIUM",
                                })

                    fragments.append(DataFragment(
                        category="blockchain_btc",
                        source_name="Blockchain.info (BTC)",
                        classification=Classification.GREY,
                        data={
                            "address": address,
                            "balance_btc": data.get("final_balance", 0) / 1e8,
                            "total_received_btc": data.get("total_received", 0) / 1e8,
                            "total_sent_btc": data.get("total_sent", 0) / 1e8,
                            "n_tx": data.get("n_tx", 0),
                        },
                        raw_records=tx_records,
                        discovered_links=links,
                        confidence=1.0,
                    ))
        except Exception as e:
            self._logger.warning(f"BTC API помилка: {e}")

    async def _collect_eth(self, address: str, fragments: list[DataFragment], query: DossierQuery) -> None:
        """Збір даних ETH через Etherscan API."""
        api_key = os.getenv("ETHERSCAN_API_KEY", "")
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                # Баланс
                resp = await client.get(
                    "https://api.etherscan.io/api",
                    params={
                        "module": "account", "action": "balance",
                        "address": address, "tag": "latest", "apikey": api_key,
                    },
                )
                balance_wei = 0
                if resp.status_code == 200:
                    data = resp.json()
                    balance_wei = int(data.get("result", 0))

                # Останні транзакції
                resp2 = await client.get(
                    "https://api.etherscan.io/api",
                    params={
                        "module": "account", "action": "txlist",
                        "address": address, "startblock": 0, "endblock": 99999999,
                        "page": 1, "offset": 10, "sort": "desc", "apikey": api_key,
                    },
                )
                tx_records = []
                links = []
                if resp2.status_code == 200:
                    txs = resp2.json().get("result", [])
                    if isinstance(txs, list):
                        for tx in txs[:10]:
                            tx_records.append({
                                "hash": tx.get("hash"),
                                "from": tx.get("from"),
                                "to": tx.get("to"),
                                "value_eth": int(tx.get("value", 0)) / 1e18,
                                "timestamp": tx.get("timeStamp"),
                            })
                            to_addr = tx.get("to", "")
                            if to_addr and to_addr.lower() != address.lower():
                                links.append({
                                    "source_id": address,
                                    "target_id": to_addr,
                                    "target_name": f"ETH: {to_addr[:12]}...",
                                    "relation_type": "CRYPTO_TRANSFER",
                                    "risk": "MEDIUM",
                                })

                fragments.append(DataFragment(
                    category="blockchain_eth",
                    source_name="Etherscan (ETH)",
                    classification=Classification.GREY,
                    data={
                        "address": address,
                        "balance_eth": balance_wei / 1e18,
                        "total_transactions": len(tx_records),
                    },
                    raw_records=tx_records,
                    discovered_links=links,
                    confidence=1.0 if api_key else 0.7,
                ))
        except Exception as e:
            self._logger.warning(f"ETH API помилка: {e}")

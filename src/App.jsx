import React, { useState, useEffect } from "react";
import { BrowserProvider, Contract, Interface } from "ethers";

// ABI complète
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "string[]",
        "name": "_participants",
        "type": "string[]"
      },
      {
        "internalType": "uint256",
        "name": "_numWinners",
        "type": "uint256"
      }
    ],
    "name": "createAndDraw",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "lotteryId",
        "type": "uint256"
      }
    ],
    "name": "LotteryCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_lotteryId",
        "type": "uint256"
      }
    ],
    "name": "getParticipants",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_lotteryId",
        "type": "uint256"
      }
    ],
    "name": "getWinners",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "lotteries",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "numWinners",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "drawn",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lotteryCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const contractAddress = "0xeC84d636C89f1FaDfB144A4213BABdBdbA9416e2";

export default function App() {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const [participantsStr, setParticipantsStr] = useState("");
  const [numWinners, setNumWinners] = useState("");
  const [lotteryResult, setLotteryResult] = useState(null);

  const [searchLotteryId, setSearchLotteryId] = useState("");
  const [searchedLottery, setSearchedLottery] = useState(null);

  useEffect(() => {
    async function init() {
      if (window.ethereum) {
        try {
          const prov = new BrowserProvider(window.ethereum);
          setProvider(prov);
          const accs = await prov.send("eth_requestAccounts", []);
          setAccounts(accs);
          const signer = await prov.getSigner();
          const cont = new Contract(contractAddress, contractABI, signer);
          setContract(cont);
        } catch (err) {
          alert("Erreur lors de la connexion à MetaMask : " + err.message);
        }
      } else {
        alert("MetaMask non détecté");
      }
    }
    init();
  }, []);

  async function handleDraw() {
    if (!contract) return alert("Contrat non connecté");
    if (!participantsStr.trim()) return alert("Liste participants vide");
    if (!numWinners || isNaN(numWinners) || parseInt(numWinners) < 1)
      return alert("Nombre de gagnants invalide");

    try {
      const participantsArray = participantsStr
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const tx = await contract.createAndDraw(
        participantsArray,
        BigInt(parseInt(numWinners))
      );
      const receipt = await tx.wait();

      // Récupérer l'ID de la loterie depuis l'événement LotteryCreated
      let lotteryId = null;
      let winners = [];

      if (receipt && receipt.logs && receipt.logs.length > 0) {
        // Décoder les logs pour trouver l'événement LotteryCreated
        const iface = new Interface(contractABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed && parsed.name === "LotteryCreated") {
              lotteryId = parsed.args[0].toString();
              break;
            }
          } catch (e) {
            // Log non reconnu, continuer
          }
        }
      }

      // Si l'ID n'est pas trouvé, utiliser lotteryCount
      if (!lotteryId) {
        lotteryId = (await contract.lotteryCount()).toString();
      }

      // Récupérer les gagnants et participants
      if (lotteryId) {
        winners = await contract.getWinners(BigInt(lotteryId));
      }

      setLotteryResult({
        lotteryId,
        participants: participantsArray,
        winners: Array.from(winners),
      });
      alert(
        `Tirage effectué, ID loterie : ${lotteryId}, Gagnants : ${Array.from(winners).join(", ")}`
      );
    } catch (err) {
      alert("Erreur lors du tirage : " + err.message);
    }
  }

  const handleSearch = async () => {
    if (!contract) return alert("Contrat non connecté");
    if (!searchLotteryId || isNaN(searchLotteryId))
      return alert("ID loterie invalide");

    try {
      const id = BigInt(parseInt(searchLotteryId));
      const participants = await contract.getParticipants(id);
      const winners = await contract.getWinners(id);
      setSearchedLottery({
        id: searchLotteryId,
        participants: Array.from(participants),
        winners: Array.from(winners),
      });
    } catch (err) {
      alert("Erreur lors de la récupération : " + err.message);
      setSearchedLottery(null);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>zkTDraw Onchain </h1>

      <p>
        <b>Connected Wallet :</b> {accounts[0] || "Aucun"}
      </p>

      <div>
        <label>Who is playing? (coma separated):</label>
        <br />
        <textarea
          rows={4}
          style={{ width: "100%" }}
          value={participantsStr}
          onChange={(e) => setParticipantsStr(e.target.value)}
          placeholder="ex: eric, paul, jules, 0xabc123..."
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <label>How many winner? :</label>
        <br />
        <input
          type="number"
          min="1"
          value={numWinners}
          onChange={(e) => setNumWinners(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <button
        onClick={handleDraw}
        style={{ marginTop: 15, padding: "10px", width: "100%" }}
      >
        Launch now!
      </button>

      {lotteryResult && (
        <div style={{ marginTop: 20, padding: 10, border: "1px solid #ccc" }}>
          <h3>Drawing result #{lotteryResult.lotteryId}</h3>
          <p>
            <b>Player list:</b> {lotteryResult.participants.join(", ")}
          </p>
          <p>
            <b>Winner.s:</b>{" "}
            {lotteryResult.winners.length > 0
              ? lotteryResult.winners.join(", ")
              : "Aucun gagnant"}
          </p>
        </div>
      )}

      <hr style={{ margin: "30px 0" }} />

      <div>
        <label>Check a draw ID :</label>
        <br />
        <input
          type="number"
          min="0"
          value={searchLotteryId}
          onChange={(e) => setSearchLotteryId(e.target.value)}
          style={{ width: "100%" }}
          placeholder="Ex: 1"
        />
        <button
          onClick={handleSearch}
          style={{ marginTop: 10, padding: "10px", width: "100%" }}
        >
          Check
        </button>

        {searchedLottery && (
          <div style={{ marginTop: 20, border: "1px solid #aaa", padding: 10 }}>
            <h3>Draw #{searchedLottery.id}</h3>
            <p>
              <b>Players:</b> {searchedLottery.participants.join(", ")}
            </p>
            <p>
              <b>Winners:</b> {searchedLottery.winners.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";
import { showThrottleMessage } from "@ethersproject/providers";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [newMessage, setNewMessage] = useState("");
  /*
   * All state property to store all waves
   */
  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = "0xe26b45eed122F461C4bD02722a84e6DfA407e60c";
  const contractABI = abi;

  const handleOnChange = (event) => {
    setNewMessage(event.target.value);
  };

  const checkIfWalletIsConnected = async () => {
    try {
      //First make sure we have access to window.ethereum
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have Metamask");
      } else {
        console.log("We have the ethereum object");
      }

      //Check if you are authorised to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorised account: ", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorised account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  //Connecting wallet through this
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get Metamask");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object not found!!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(()=>{

    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          adress: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        }
      ]);
    };

    if(window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if(wavePortalContract){
        wavePortalContract.off("NewWave", onNewWave)
      }
    }

  }, [])

  const wave = async (e) => {
    try {
      e.preventDefault();
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total no. of waves: ", count.toNumber());

        //Execute actual wave from your smart contract

        const waveTxn = await wavePortalContract.wave(newMessage, {gasLimit: 300000});
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined---", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total no. of waves: ", count.toNumber());

        setNewMessage("");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="mainBg">
      <div className="mainContainer">
        <div className="dataContainer">
          <div className="header">👋 Hey there!</div>

          <div className="bio">
            I am VENMUS, the only rapper in this world who can build his own
            website and works on WEB3 while hte other lazy lads are just
            thinking.
          </div>

          <form
            onSubmit={wave}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "20vh",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            <textarea
              type="text"
              placeholder="Start Typing"
              onChange={handleOnChange}
              style={{
                width: "100%",
                height: "10vh",
                border: "none",
                outline: "none",
                padding: "5px",
                background: "#DFF6FF",
                borderRadius: "5px",
              }}
            ></textarea>
            <button
              type="submit"
              className="waveAtMe"
              style={{ width: "100%", height: "5vh" }}
            >
              Wave at me
            </button>
          </form>

          {/* If therse is no current account then render this button */}
          {!currentAccount && (
            <button className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
          {allWaves.map((wave, index) => {
            return (
              <div
                key={index}
                style={{
                  backgroundColor: "#4FBDBA",
                  marginTop: "16px",
                  padding: "8px",
                }}
              >
                <div>Address: {wave.address}</div>
                <div>Message: {wave.message}</div>
                <div>Time: {wave.timestamp.toString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

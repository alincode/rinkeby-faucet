const Web3 = require('web3');
const html = require('nanohtml');
const csjs = require('csjs-inject');
const morphdom = require('morphdom');

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  alert('initial failed');
}

const ABI = require('./abi.json');
const DEFAULT_ADDRESS = '0x614acceb5e02950be0ff771a4729228e5fa99aaf';
const contractAddress = localStorage.constract || DEFAULT_ADDRESS;
const myContract = new web3.eth.Contract(ABI, contractAddress);

const css = csjs `
  .box {
    margin: 10px;
  }
  .input {
    margin-top: 10px;
    margin-right: 10px;
    width: 500px;
    font-size: 20px;
  }
  .button {
    margin-top: 10px;
    margin-right: 10px;
    font-size: 20px;
    width: 180px;
    background-color: #4CAF50;
    color: white;
  }
  .result {
    padding: 10px;
    font-size: 40px;
    color: red;
  }
  img {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px;
    width: 150px;
  }
`

// ===== DOM element =====

const resultElement = html `<div></div>`
const inputName = html `<input class=${css.input} type="text" placeholder="input your name"/>`;
const inputAmount = html `<input class=${css.input} type="number" placeholder="input ether amount"/>`;

// ===== utils =====
function getNetworkName(networkId) {
  if (networkId == 1) return "Main";
  else if (networkId == 3) return "Ropsten";
  else if (networkId == 42) return "Kovan";
  else if (networkId == 4) return "Rinkeby";
  else return "";
}

// ===== listening smart contract event =====

// Generate filter options
const options = {
  // filter: {
  //   _from: process.env.WALLET_FROM,
  //   _to: process.env.WALLET_TO,
  //   _value: process.env.AMOUNT
  // },
  fromBlock: 'latest'
}

myContract.events.UserDonate(options, async (error, event) => {
  if (error) {
    console.log(error)
    return
  }
  console.log('UserDonate: ', event.returnValues);
  return
})

myContract.events.UserWithdrawal(options, async (error, event) => {
  if (error) {
    console.log(error)
    return
  }
  console.log('UserWithdrawal: ', event.returnValues);
  return
})

// ===== Click Event =====

function donate(event) {
  let account = web3.eth.defaultAccount;
  console.log('account: ', account);
  myContract.methods.donate().send({
    from: account,
    value: web3.utils.toWei("5", "ether")
  }, (err, data) => {
    if (err) return console.error(err);
    console.log('>>> donate ok.');
  });
}

function withdrawal(event) {
  let account = web3.eth.defaultAccount;
  myContract.methods.withdrawal().send({
    from: account
  }, (err, data) => {
    if (err) return console.error(err);
    console.log('>>> withdrawal ok.');
  });
}

// ===== Preload =====

function start() {
  console.log('=== start ===');
  getNetworkId({});
}

function getNetworkId(result) {
  console.log('>>> 1');
  web3.eth.net.getId(function (err, networkId) {
    if (networkId != 4) {
      alert('It only support Rinkeby network!');
    }
    result.networkId = networkId;
    getAccounts(result);
  });
}

function getAccounts(result) {
  console.log('>>> 2');
  web3.eth.getAccounts(function (err, addresses) {
    if (!addresses[0]) alert('please install or login your metamask.');
    const address = addresses[0];
    web3.eth.defaultAccount = address;
    result.account = address;
    getBalance(result);
  });
}

function getBalance(result) {
  console.log('>>> 3');
  myContract.methods.getBalance().call((err, data) => {
    if (err) return console.error(err);
    if (data != "0") {
      const ether = web3.utils.fromWei(data, "ether");
      const newElement = html `<div class="${css.result}">${ether} Ether in the faucent service.</div>`
      morphdom(resultElement, newElement);
    }
    render(result);
  })
}

function render(result) {
  console.log('>>> result:', result);
  document.body.appendChild(html `
  <div class=${css.box} id="app">
    <h2>This Ether faucet is running on the ${getNetworkName(result.networkId)} network.</h2>
    <div>This faucet drips 0.5 Ether every 24 hours. you can apply withdrawal ether.</div>
    Your account is： ${result.account}<br>
    <button class=${css.button} onclick=${withdrawal}>Withdrawal 0.5 Eth</button>
    <button class=${css.button} onclick=${donate}>Donate 5 Eth</button>
    ${resultElement}
    <a href="https://${getNetworkName(result.networkId)}.etherscan.io/address/${contractAddress}">etherscan</a>
  </div>
 `)
}

if (typeof web3 !== 'undefined') start();
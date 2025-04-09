import { blockchain, createBlock } from './block.js';
import { fetchStats } from './api.js';

window.onload = () => {
  fetchStats();
  createBlock(1);
};

document.getElementById('addBlock').addEventListener('click', () => {
  const lastBlock = blockchain[blockchain.length - 1];
  const prevHash = lastBlock ? lastBlock.querySelector('.hash').value : '0';
  createBlock(blockchain.length + 1, prevHash);
});

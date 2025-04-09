import { logEvent, updateStats } from './api.js';
import { showAlert } from './ui.js';

export let blockchain = [];

export function createBlock(index, prevHash = "0") {
  const block = document.createElement('div');
  block.className = 'block';
  block.innerHTML = `
    <label>Block: <input type="number" value="${index}" readonly></label>
    <label>Nonce: <input class="nonce" type="number" value="0"></label>
    <label>Data: <textarea class="data"></textarea></label>
    <label>Prev: <input class="prev" type="text" value="${prevHash}" readonly></label>
    <label>Hash: <input class="hash" type="text" readonly></label>
    <button class="mine-btn">Mine</button>
    <button class="remove-btn">Remove</button>
  `;
  document.getElementById('blockchain-container').appendChild(block);

  const inputs = block.querySelectorAll('.nonce, .data');
  inputs.forEach(input => input.addEventListener('input', () => validateBlock(block)));

  const mineButton = block.querySelector('.mine-btn');
  mineButton.addEventListener('click', () => mineBlock(block));

  const removeButton = block.querySelector('.remove-btn');
  removeButton.addEventListener('click', () => removeBlock(block));

  blockchain.push(block);
  block.classList.remove('invalid', 'valid');

  logEvent("New block added to chain (UI only)");
  updateStats("add");
}

export function hashBlock(prev, data, nonce) {
  return CryptoJS.SHA256(prev + data + nonce).toString();
}

function mineBlock(block) {
  const blockIndex = blockchain.indexOf(block);

  if (blockIndex > 0) {
    const prevBlock = blockchain[blockIndex - 1];
    const prevHash = prevBlock.querySelector('.hash').value.trim();
    const expectedHash = hashBlock(
      prevBlock.querySelector('.prev').value,
      prevBlock.querySelector('.data').value,
      prevBlock.querySelector('.nonce').value
    );

    if (!prevHash || prevHash !== expectedHash) {
      showAlert("You must mine the previous block correctly first.", "error");
      return;
    }
  }

  const nonceInput = block.querySelector('.nonce');
  const data = block.querySelector('.data').value;
  const prev = block.querySelector('.prev').value;
  const hashInput = block.querySelector('.hash');

  let nonce = 0;
  let hash = '';
  while (!hash.startsWith('0000')) {
    hash = hashBlock(prev, data, nonce);
    nonce++;
  }
  nonce--;
  nonceInput.value = nonce;
  hashInput.value = hash;

  const nextBlock = blockchain[blockchain.indexOf(block) + 1];
  if (nextBlock) {
    nextBlock.querySelector('.prev').value = hash;
    validateBlock(nextBlock);
  }

  validateBlock(block);
  if (block.dataset.lastHash === hash) {
    showAlert(`Block ${blockIndex + 1} already mined with the same data.`, "warning");
    return;
  }

  block.dataset.mined = "true";
  block.dataset.lastHash = hash;
  logEvent(`Block ${blockIndex + 1} mined`);
  updateStats("mine");
}

function validateBlock(block) {
  const nonce = block.querySelector('.nonce').value;
  const data = block.querySelector('.data').value;
  const prev = block.querySelector('.prev').value;
  const hashField = block.querySelector('.hash');
  const currentHash = hashField.value.trim();
  const calculatedHash = hashBlock(prev, data, nonce);

  block.classList.remove('invalid', 'valid');

  if (currentHash && currentHash !== calculatedHash) {
    block.classList.add('invalid');
  } else if (currentHash && currentHash === calculatedHash) {
    block.classList.add('valid');
  }
}

function removeBlock(block) {
  const blockIndex = blockchain.indexOf(block);

  if (blockIndex === -1) {
    showAlert("Block not found in the blockchain.", "error");
    return;
  }

  // Remove the block from the DOM and blockchain array
  block.remove();
  blockchain.splice(blockIndex, 1);

  // Reindex subsequent blocks
  for (let i = blockIndex; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const prevBlock = blockchain[i - 1];

    currentBlock.querySelector('input[type="number"]').value = i + 1; // Update block index
    currentBlock.querySelector('.prev').value = prevBlock
      ? prevBlock.querySelector('.hash').value
      : '0'; // Update previous hash

    validateBlock(currentBlock); // Revalidate the block
  }

  logEvent(`Block ${blockIndex + 1} removed`);
  updateStats("remove");
}

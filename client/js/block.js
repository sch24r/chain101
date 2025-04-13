import { logEvent, updateStats } from './api.js';
import { showAlert } from './ui.js';

export let blockchain = [];

// Add this function to cache DOM references and avoid repetitive queries
function getBlockElements(block) {
  // Only create the cache once per block
  if (!block._elements) {
    block._elements = {
      nonceInput: block.querySelector('.nonce'),
      dataInput: block.querySelector('.data'),
      prevInput: block.querySelector('.prev'),
      hashInput: block.querySelector('.hash'),
      minedCountSpan: block.querySelector('.mined-count span'),
      blockNumber: block.querySelector('input[type="number"]')
    };
  }
  return block._elements;
}

function validateBlockInput(data, nonce) {
  if (typeof data !== 'string') {
    return false;
  }

  if (isNaN(parseInt(nonce))) {
    return false;
  }
  
  return true;
}

export function setBlockValidity(block, isValid) {
  if (isValid) {
    block.classList.add('valid');
    block.classList.remove('invalid');
  } else {
    block.classList.add('invalid');
    block.classList.remove('valid');
  }
}

// Create a new block and add it to the DOM
export function createBlock(index, prevHash = "0") {
  const block = document.createElement('div');
  block.className = 'block block-adding';
  // No validity classes added here - block starts neutral
  
  block.innerHTML = `
    <label>Block: <input id="block-${index}" name="block-${index}" type="number" value="${index}" readonly></label>
    <label>Nonce: <input id="nonce-${index}" name="nonce-${index}" class="nonce" type="number" value="0"></label>
    <label>Data: <textarea id="data-${index}" name="data-${index}" class="data"></textarea></label>
    <label>Prev: <input id="prev-${index}" name="prev-${index}" class="prev" type="text" value="${prevHash}" readonly></label>
    <label>Hash: <input id="hash-${index}" name="hash-${index}" class="hash" type="text" readonly></label>
    <p class="mined-count">Mined count: <span>0</span></p>
    <button class="mine-btn btn-transition hover-zoom">Mine</button>
    <button class="remove-btn btn-transition hover-zoom">Remove</button>
  `;
  
  // Initialize dataset properties
  block.dataset.minedCount = "0";
  
  // Add the block to the DOM immediately
  document.getElementById('blockchain-container').appendChild(block);
  
  // Optional: Remove the animation class after it completes
  setTimeout(() => {
    block.classList.remove('block-adding');
  }, 500); // Match this to the animation duration

  // Add event listeners
  const inputs = block.querySelectorAll('.nonce, .data');
  const dataInput = block.querySelector('.data');
  const nonceInput = block.querySelector('.nonce');
  const prevInput = block.querySelector('.prev');

  inputs.forEach(input => {
    input.addEventListener('input', () => {
      if (block.dataset.mined === "true") {
        const dataValue = dataInput.value;
        const nonceValue = nonceInput.value;
        const prevValue = prevInput.value;
        const lastMinedHash = block.dataset.lastHash;
        
        if (lastMinedHash !== hashBlock(prevValue, dataValue, nonceValue)) {
          block.dataset.mined = "false";
          setBlockValidity(block, false);
        }
      }
      validateBlock(block);
    });
  });

  const mineButton = block.querySelector('.mine-btn');
  mineButton.addEventListener('click', () => mineBlock(block));

  const removeButton = block.querySelector('.remove-btn');
  removeButton.addEventListener('click', () => removeBlock(block));

  blockchain.push(block);
  
  // Blocks start in neutral state regardless of chain validity

  logEvent("New block added to chain (UI only)");
  updateStats("add");
  
  return block;
}

// Hash a block's data
export function hashBlock(prev, data, nonce) {
  return CryptoJS.SHA256(prev + data + nonce).toString();
}

// Validate a block and update its validity status
export function validateBlock(block) {
  // Check if the previous block is invalid first
  const blockIndex = blockchain.indexOf(block);
  let prevBlockInvalid = false;
  let prevBlockHash = "";
  
  if (blockIndex > 0) {
    const prevBlock = blockchain[blockIndex - 1];
    const prevBlockHashInput = prevBlock.querySelector('.hash');
    prevBlockHash = prevBlockHashInput.value.trim();
    
    prevBlockInvalid = prevBlock.classList.contains('invalid');
    
    // Ensure prev hash matches the previous block's current hash
    const prevInput = block.querySelector('.prev');
    const currentPrevValue = prevInput.value;
    if (prevBlockHash && currentPrevValue !== prevBlockHash) {
      prevInput.value = prevBlockHash;
      prevBlockInvalid = prevBlock.classList.contains('invalid');
    }
  }
  
  // Cache all DOM elements at the beginning
  const elements = getBlockElements(block);
  const nonceInput = elements.nonceInput;
  const dataInput = elements.dataInput;
  const prevInput = elements.prevInput;
  const hashField = elements.hashInput;

  const nonce = nonceInput.value;
  const data = dataInput.value;
  const prev = prevInput.value;
  const currentHash = hashField.value.trim();
  const calculatedHash = hashBlock(prev, data, nonce);

  // Only remove classes if actively validating
  // This prevents wiping out the restored invalid state from the server
  if (!block.classList.contains('server-restored')) {
    block.classList.remove('invalid', 'valid');
  } else {
    // Remove the server-restored flag since now actively validating
    block.classList.remove('server-restored');
  }

  // Unmined blocks (no hash) should always be neutral
  if (!currentHash) {
    block.classList.remove('invalid', 'valid');
    return false;
  }

  // Check if data or nonce was changed after mining
  if (block.dataset.mined === "true" && block.dataset.lastHash !== calculatedHash) {
    block.dataset.mined = "false";
    setBlockValidity(block, false);
    block.dataset.wasModified = "true";
  }

  // Block has a hash, determine if it's valid or invalid
  let isValid = false;
  
  if (currentHash !== calculatedHash || prevBlockInvalid) {
    // Invalid if hash doesn't match OR prev block is invalid
    setBlockValidity(block, false);
  } else {
    // Valid only if hash matches AND prev block is valid (or this is first block)
    setBlockValidity(block, true);
    isValid = true;
  }

  // Propagate changes to the next block
  const nextBlock = blockchain[blockIndex + 1];
  if (nextBlock) {
    const nextHashInput = nextBlock.querySelector('.hash');
    const nextBlockHash = nextHashInput.value.trim();
    
    // Propagate changes to next block if it has a hash
    if (nextBlockHash) {
      // If this block is invalid, mark next block as invalid too
      if (block.classList.contains('invalid')) {
        setBlockValidity(nextBlock, false);
      }
      // Always validate the next block to ensure chain integrity
      validateBlock(nextBlock);
    }
  }

  return isValid;
}

// Mine a block by finding a valid hash
export function mineBlock(block) {
  const blockIndex = blockchain.indexOf(block);
  
  // Use the cached elements
  const elements = getBlockElements(block);
  const data = elements.dataInput.value;
  const prev = elements.prevInput.value;
  const nonceInput = elements.nonceInput;
  const hashInput = elements.hashInput;
  
  // Check blockchain integrity before continuing with mining
  for (let i = 0; i < blockIndex; i++) {
    const prevBlock = blockchain[i];
    
    // Cache DOM elements to use in all validation checks
    const prevBlockElements = getBlockElements(prevBlock);
    const prevBlockData = prevBlockElements.dataInput.value;
    const prevBlockNonce = prevBlockElements.nonceInput.value;
    const prevBlockPrev = prevBlockElements.prevInput.value;
    const prevBlockHash = prevBlockElements.hashInput.value;
    
    // Calculate hash once for validation
    const calculatedPrevHash = hashBlock(prevBlockPrev, prevBlockData, prevBlockNonce);
    
    // Combined validation check with a single error message
    if (prevBlock.classList.contains('invalid') || 
        prevBlockHash !== calculatedPrevHash ||
        (i > 0 && prevBlockPrev !== blockchain[i-1].querySelector('.hash').value)) {
      
      showAlert(`Cannot mine Block ${blockIndex + 1} because Block ${i + 1} is invalid. Fix and mine previous blocks first.`, "error");
      return;
    }
  }
  
  // Only run these if blockchain integrity is confirmed
  const currentHash = hashBlock(prev, data, nonceInput.value);
  
  // Check if block is already mined with the same data, or has a valid hash
  if ((block.dataset.mined === "true" && 
       data === block.dataset.minedData && 
       parseInt(nonceInput.value) === parseInt(block.dataset.minedNonce || "0")) || 
      (hashInput.value && hashInput.value === currentHash && hashInput.value.startsWith('0000'))) {
    
    showAlert(`Block ${blockIndex + 1} already mined with the same data.`, "warning");
    return;
  }

  // Update prev hash if needed (keeping only this part, removing the redundant check)
  if (blockIndex > 0) {
    const prevBlock = blockchain[blockIndex - 1];
    const prevHash = prevBlock.querySelector('.hash').value.trim();
    elements.prevInput.value = prevHash;
  }

  // Mining logic remains the same
  let nonce = 0;
  let hash = '';

  function mineChunk() {
    const start = performance.now();
    const maxChunkTime = 50; // ms

    while (performance.now() - start < maxChunkTime) {
      hash = hashBlock(prev, data, nonce);
      if (hash.startsWith('0000')) {
        finishMining();
        return;
      }
      nonce++;
      if (nonce > 1000000) {
        showAlert("Mining taking too long, try different data.", "error");
        return;
      }
    }
    
    // Schedule next chunk
    setTimeout(mineChunk, 0);
  }

  function finishMining() {
    nonceInput.value = nonce;
    hashInput.value = hash;

    // Once successfully mined, clear the invalid state and wasModified flag
    setBlockValidity(block, true);
    block.dataset.wasModified = "false";

    // Update mined state, lastHash, and increment mined count
    block.dataset.mined = "true";
    block.dataset.lastHash = hash;
    // Store the original mined data and nonce to prevent remining with same data
    block.dataset.minedData = data;
    block.dataset.minedNonce = nonce.toString();

    // Increment the mined count for this block
    const currentCount = parseInt(block.dataset.minedCount || "0");
    const newCount = currentCount + 1;
    block.dataset.minedCount = newCount.toString();
    elements.minedCountSpan.textContent = newCount;

    // Update global mined count
    updateStats("mine");
    
    // Update the next block's prev hash ONLY NOW, after successful mining
    const nextBlock = blockchain[blockIndex + 1];
    if (nextBlock) {
      nextBlock.querySelector('.prev').value = hash;
      validateBlock(nextBlock);
    }
    
    logEvent(`Block ${blockIndex + 1} mined`);
  }

  mineChunk();
}

// Remove a block from the blockchain
export function removeBlock(block) {
  const blockIndex = blockchain.indexOf(block);

  if (blockIndex === -1) {
    showAlert("Block not found in the blockchain.", "error");
    return;
  }

  // Clean up event listeners before removing
  const inputs = block.querySelectorAll('.nonce, .data');
  inputs.forEach(input => {
    // Clone node to remove listeners
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
  });
  
  // Remove button listeners
  const mineButton = block.querySelector('.mine-btn');
  const removeButton = block.querySelector('.remove-btn');
  if (mineButton) {
    const newMineButton = mineButton.cloneNode(true);
    mineButton.parentNode.replaceChild(newMineButton, mineButton);
  }
  if (removeButton) {
    const newRemoveButton = removeButton.cloneNode(true);
    removeButton.parentNode.replaceChild(newRemoveButton, removeButton);
  }

  // Add removing animation class
  block.classList.add('block-removing');

  // Decrease the global mined count by the block's mined count
  const minedCount = parseInt(block.dataset.minedCount || "0");
  if (minedCount > 0) {
    updateStats("unmine", minedCount);
  }

  // Wait for animation to complete before actually removing
  setTimeout(() => {
    // Remove the block from the DOM and blockchain array
    block.remove();
    blockchain.splice(blockIndex, 1);

    // Reindex subsequent blocks
    for (let i = blockIndex; i < blockchain.length; i++) {
      const currentBlock = blockchain[i];
      const prevBlock = blockchain[i - 1];
      
      // Cache DOM elements to reduce DOM queries
      const blockNumberInput = currentBlock.querySelector('input[type="number"]');
      const prevHashInput = currentBlock.querySelector('.prev');
      const prevBlockHash = prevBlock ? prevBlock.querySelector('.hash').value : '0';
      
      blockNumberInput.value = i + 1;
      prevHashInput.value = prevBlockHash;

      validateBlock(currentBlock);
    }

    logEvent(`Block ${blockIndex + 1} removed`);
    updateStats("remove");
  }, 500);
}

// Add this new function to block.js
export function serializeBlock(block) {
  // Use getBlockElements internally (without exposing it to main.js)
  const elements = getBlockElements(block);
  
  return {
    index: parseInt(elements.blockNumber.value),
    prevHash: elements.prevInput.value,
    data: elements.dataInput.value,
    hash: elements.hashInput.value,
    nonce: parseInt(elements.nonceInput.value),
    mined: block.dataset.mined === "true",
    lastHash: block.dataset.lastHash || "",
    minedCount: parseInt(block.dataset.minedCount || "0"),
    isValid: !block.classList.contains('invalid'),
    wasModified: block.dataset.wasModified === "true",
    minedData: block.dataset.minedData || "",
    minedNonce: block.dataset.minedNonce || ""
  };
}

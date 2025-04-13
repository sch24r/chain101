import { blockchain, createBlock, validateBlock, mineBlock, removeBlock, hashBlock, setBlockValidity, serializeBlock } from './block.js';
import { fetchStats, fetchBlocks, saveBlocks, logEvent, updateStats, fetchSessionID } from './api.js';

window.onload = async () => {
    document.getElementById('blockCount').textContent = "0";
    document.getElementById('mineCount').textContent = "0";
    
    // Fetch stats without updating them yet
    const blocks = await fetchBlocks();
    const sessionID = await fetchSessionID();

    if (blocks.length > 0) {
        logEvent(`Session ${sessionID} restored: Blocks loaded from the server.`);
        
        // Create blocks without updating stats
        blocks.forEach(block => {
            restoreBlock(block).classList.add('server-restored');
        });
        

        for (let i = 0; i < blockchain.length; i++) {
            validateBlock(blockchain[i]);
        }

        fetchStats();
    } else {
        createBlock(1);
    }
};

document.getElementById('addBlock').addEventListener('click', () => {
    const lastBlock = blockchain[blockchain.length - 1];
    const prevHash = lastBlock ? lastBlock.querySelector('.hash').value : '0';

    createBlock(blockchain.length + 1, prevHash);
});

document.getElementById('removeAll').addEventListener('click', () => {

    if (confirm("Are you sure you want to remove all blocks? This action cannot be undone.")) {
        // Remove all blocks from the DOM and blockchain array
        const blockchainContainer = document.getElementById('blockchain-container');
        blockchainContainer.innerHTML = "";
        blockchain.length = 0;

        document.getElementById('blockCount').textContent = "0";
        document.getElementById('mineCount').textContent = "0";

        logEvent("All blocks removed from the blockchain.");
        updateStats("reset");
    }
});

function serializeBlockchain() {
  return blockchain.map(block => serializeBlock(block));
}

window.addEventListener('unload', () => {
  const blocks = serializeBlockchain();
  const blob = new Blob([JSON.stringify(blocks)], {type: 'application/json'});
  navigator.sendBeacon('/api/blocks', blob);
});

function restoreBlock(blockData) {
    const block = document.createElement('div');
    block.className = 'block';
    
    // Initialize block with neutral state - don't add any classes yet
    block.innerHTML = `
        <label>Block: <input id="block-${blockData.index}" name="block-${blockData.index}" type="number" value="${blockData.index}" readonly></label>
        <label>Nonce: <input id="nonce-${blockData.index}" name="nonce-${blockData.index}" class="nonce" type="number" value="${blockData.nonce}"></label>
        <label>Data: <textarea id="data-${blockData.index}" name="data-${blockData.index}" class="data">${blockData.data}</textarea></label>
        <label>Prev: <input id="prev-${blockData.index}" name="prev-${blockData.index}" class="prev" type="text" value="${blockData.prevHash}" readonly></label>
        <label>Hash: <input id="hash-${blockData.index}" name="hash-${blockData.index}" class="hash" type="text" value="${blockData.hash}" readonly></label>
        <p class="mined-count">Mined count: <span>${blockData.minedCount || 0}</span></p>
        <button class="mine-btn btn-transition hover-zoom">Mine</button>
        <button class="remove-btn btn-transition hover-zoom">Remove</button>
    `;
    
    // Simplified dataset assignments with default values
    block.dataset.mined = String(Boolean(blockData.mined));
    block.dataset.lastHash = blockData.lastHash || "";
    block.dataset.wasModified = String(Boolean(blockData.wasModified));
    block.dataset.minedCount = (blockData.minedCount || 0).toString();
    block.dataset.minedData = blockData.minedData || "";
    block.dataset.minedNonce = (blockData.minedNonce || "0").toString();
    
    document.getElementById('blockchain-container').appendChild(block);

    const inputs = block.querySelectorAll('.nonce, .data');
    const dataInput = block.querySelector('.data');
    const nonceInput = block.querySelector('.nonce');
    const prevInput = block.querySelector('.prev');

    inputs.forEach(input => input.addEventListener('input', () => {
        // When data changes in a block, it may affect all subsequent blocks
        if (block.dataset.mined === "true") {
            const dataValue = dataInput.value;
            const nonceValue = nonceInput.value;
            const prevValue = prevInput.value;
            const lastMinedHash = block.dataset.lastHash;
            
            // Check if hash no longer matches stored hash
            if (lastMinedHash !== hashBlock(prevValue, dataValue, nonceValue)) {
                block.dataset.mined = "false";
                block.dataset.wasModified = "true";
            }
        }
        validateBlock(block);
    }));

    const mineButton = block.querySelector('.mine-btn');
    mineButton.addEventListener('click', () => mineBlock(block));

    const removeButton = block.querySelector('.remove-btn');
    removeButton.addEventListener('click', () => removeBlock(block));

    blockchain.push(block);
    
    return block;
}

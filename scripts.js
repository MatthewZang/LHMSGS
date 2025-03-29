function showPaymentModal() {
    document.getElementById('modalOverlay').style.display = 'block';
    document.getElementById('paymentModal').style.display = 'block';
}

function hidePaymentModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('paymentModal').style.display = 'none';
}

document.getElementById('paymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Here you would normally process the payment with a payment gateway
    alert('Payment successful! You can now play UNO.');
    hidePaymentModal();
    
    // Show the play button and hide purchase button
    const gameCard = e.target.closest('.game-card');
    gameCard.querySelector('.purchase-btn').style.display = 'none';
    gameCard.querySelector('.play-btn').style.display = 'block';
    
    // Store purchase in localStorage
    localStorage.setItem('unoPurchased', 'true');
});

// Check if game is already purchased on page load
window.addEventListener('load', function() {
    if (localStorage.getItem('unoPurchased') === 'true') {
        const purchaseBtn = document.querySelector('.purchase-btn');
        const playBtn = document.querySelector('.play-btn');
        if (purchaseBtn && playBtn) {
            purchaseBtn.style.display = 'none';
            playBtn.style.display = 'block';
        }
    }
}); 
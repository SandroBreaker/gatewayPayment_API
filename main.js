document.addEventListener('DOMContentLoaded', () => {
    // --- Configurações ---
    const apiToken = "wsxiP0Dydmf2TWqjOn1iZk9CfqwxdZBg8w5eQVaTLDWHnTjyvuGAqPBkAiGU";
    const endpoint = "https://api.invictuspay.app.br/api";
    
    // --- Referências do DOM ---
    const offerHashInput = document.getElementById('offerHashInput');
    const fetchProductsButton = document.getElementById('fetchProductsButton');
    const pixCheckoutForm = document.getElementById('pixCheckoutForm');
    const requestPixButton = document.getElementById('requestPixButton');
    const loadingSpinnerPix = document.getElementById('loadingSpinnerPix');
    const resultsContainer = document.getElementById('resultsContainer');

    // Elementos do Modal
    const pixModal = document.getElementById('pixModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const copyPixButton = document.getElementById('copyPixButton');
    const copyButtonText = document.getElementById('copyButtonText');
    const modalAmount = document.getElementById('modalAmount');
    const modalHash = document.getElementById('modalHash');
    const pixCodeTextarea = document.getElementById('pixCodeTextarea');
    const qrCodeImage = document.getElementById('qrCodeImage');
    const qrCodeContainer = document.getElementById('qrCodeContainer');

    // --- Lógica do Modal (Atualizada para CSS Nativo) ---

    const openModal = () => {
        // Adiciona a classe que controla a visibilidade e a transição no CSS
        pixModal.classList.add('is-visible');
    };

    const closeModal = () => {
        pixModal.classList.remove('is-visible');
    };

    const showPixModal = (data) => {
        const amountBRL = (data.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const pixCode = data.pix.pix_qr_code;
        const qrBase64 = data.pix.qr_code_base64;
        
        modalAmount.textContent = amountBRL;
        modalHash.textContent = `ID Transação: ${data.hash}`;
        pixCodeTextarea.value = pixCode;
        
        // Reset do botão de cópia
        copyButtonText.textContent = "COPIAR CÓDIGO";
        copyPixButton.classList.remove('btn-success');
        copyPixButton.classList.add('btn-primary');

        if (qrBase64) {
            qrCodeImage.src = `data:image/png;base64,${qrBase64}`;
            qrCodeContainer.style.display = 'block';
        } else {
            qrCodeImage.src = '';
            qrCodeContainer.style.display = 'none';
        }

        openModal();
    };

    const copyPixCode = async () => {
        pixCodeTextarea.select();
        pixCodeTextarea.setSelectionRange(0, 99999); 
        
        try {
            await navigator.clipboard.writeText(pixCodeTextarea.value);
            
            // Feedback Visual
            copyButtonText.textContent = "Copiado! ✅";
            copyPixButton.classList.remove('btn-primary');
            copyPixButton.classList.add('btn-success');
            
            setTimeout(() => {
                copyButtonText.textContent = "COPIAR CÓDIGO";
                copyPixButton.classList.add('btn-primary');
                copyPixButton.classList.remove('btn-success');
            }, 2500);

        } catch (err) {
            document.execCommand('copy'); // Fallback
            copyButtonText.textContent = "Copiado (Fallback)";
        }
    };

    // Listeners do Modal
    closeModalButton.addEventListener('click', closeModal);
    copyPixButton.addEventListener('click', copyPixCode);
    pixModal.addEventListener('click', (e) => {
        if (e.target === pixModal) closeModal(); // Fecha ao clicar fora
    });

    // --- Lógica de API ---

    const executeApiCall = async (method, path, payload = null, button, spinner) => {
        button.disabled = true;
        if(spinner) spinner.classList.add('active');
        
        resultsContainer.textContent = `🔄 Processando ${method} ${path}...`;
        resultsContainer.style.color = '#60a5fa'; // Azul claro

        const apiUrl = `${endpoint}${path}?api_token=${apiToken}`;
        let response = null;

        try {
            const config = {
                method: method,
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: payload ? JSON.stringify(payload) : null
            };

            // Tentativa simples (sem retries complexos para simplificar o exemplo nativo)
            response = await fetch(apiUrl, config);
            
            if (!response) throw new Error("Sem resposta do servidor.");
            
            const data = await response.json();

            if (response.ok) {
                resultsContainer.style.color = '#4ade80'; // Verde sucesso
                resultsContainer.textContent = JSON.stringify(data, null, 2);
                
                if (path.includes('/transactions') && data.payment_method === 'pix' && data.pix?.pix_qr_code) {
                     showPixModal(data); 
                }
            } else {
                resultsContainer.style.color = '#f87171'; // Vermelho erro
                resultsContainer.textContent = JSON.stringify({ erro: response.status, details: data }, null, 2);
            }

        } catch (error) {
            resultsContainer.style.color = '#f87171';
            resultsContainer.textContent = `ERRO: ${error.message}`;
        } finally {
            if(spinner) spinner.classList.remove('active');
            button.disabled = false;
        }
    };

    // --- Event Handlers ---

    fetchProductsButton.addEventListener('click', (e) => {
        e.preventDefault();
        executeApiCall('GET', '/public/v1/products', null, fetchProductsButton, null);
    });

    pixCheckoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const offerHash = offerHashInput.value.trim();
        if (!offerHash) return;
        
        const formData = new FormData(pixCheckoutForm);
        const customerData = {};
        for (const [key, value] of formData.entries()) {
            if (key !== 'offer_hash') customerData[key] = value;
        }
        
        const pixPayload = {
            "amount": 2000,
            "offer_hash": offerHash, 
            "payment_method": "pix", 
            "customer": customerData,
            "cart": [{
                "product_hash": offerHash,
                "title": "Produto de Teste (API)",
                "price": 2000,
                "quantity": 1,
                "operation_type": 1, 
                "tangible": false
            }],
            "installments": 1,
            "expire_in_days": 1,
            "transaction_origin": "api"
        };

        executeApiCall('POST', '/public/v1/transactions', pixPayload, requestPixButton, loadingSpinnerPix);
    });
});

// Connect to the Socket.IO server
const socket = io();

// Wacht tot de DOM volledig is geladen
document.addEventListener('DOMContentLoaded', function() {
    // Verwijzingen naar de DOM-elementen
    const addOrderBtn = document.getElementById('add-order');
    const clearAllBtn = document.getElementById('clear-all');
    const orderList = document.getElementById('order-list');
    const nameInput = document.getElementById('name');
    const editColleaguesBtn = document.getElementById('edit-colleagues');
    const saveColleaguesBtn = document.getElementById('save-colleagues');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const colleaguesEditor = document.getElementById('colleagues-editor');
    const colleaguesList = document.getElementById('colleagues-list');
    
    // Huidige staat van de applicatie
    let colleagues = [];
    
    // Maak een datalist voor de autocomplete functionaliteit
    const dataList = document.createElement('datalist');
    dataList.id = 'colleagues-datalist';
    nameInput.setAttribute('list', dataList.id);
    document.body.appendChild(dataList);
    
    // Update de datalist met de huidige collega's
    function updateColleaguesDatalist() {
        dataList.innerHTML = '';
        colleagues.forEach(colleague => {
            const option = document.createElement('option');
            option.value = colleague;
            dataList.appendChild(option);
        });
    }
    
    // Laad de lijst met collega's in de editor
    function loadColleaguesInEditor() {
        colleaguesList.value = colleagues.join('\n');
    }
    
    // Sla de lijst met collega's op
    function saveColleagues() {
        const newColleagues = colleaguesList.value
            .split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);
            
        const uniqueColleagues = [...new Set(newColleagues)]; // Verwijder dubbele namen
        socket.emit('updateColleagues', uniqueColleagues);
        toggleColleaguesEditor(false);
    }
    
    // Toon/verberg de editor voor collega's
    function toggleColleaguesEditor(show) {
        colleaguesEditor.style.display = show ? 'block' : 'none';
        editColleaguesBtn.style.display = show ? 'none' : 'block';
        if (show) {
            loadColleaguesInEditor();
            colleaguesList.focus();
        }
    }
    
    // Event listeners voor het bewerken van collega's
    editColleaguesBtn.addEventListener('click', () => toggleColleaguesEditor(true));
    saveColleaguesBtn.addEventListener('click', saveColleagues);
    cancelEditBtn.addEventListener('click', () => toggleColleaguesEditor(false));
    
    // Sla de lijst met collega's op wanneer de gebruiker op Enter drukt in het tekstgebied
    colleaguesList.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            saveColleagues();
        }
    });
    
    // Initialiseer de datalist
    updateColleaguesDatalist();
    
    // Luister naar server events
    socket.on('initialState', (data) => {
        // Update de bestaande bestellingen
        orderList.innerHTML = '';
        data.orders.forEach(order => addOrderToDOM(order));
        
        // Update de lijst met collega's
        colleagues = data.colleagues;
        updateColleaguesDatalist();
    });
    
    // Luister naar nieuwe bestellingen
    socket.on('orderAdded', (order) => {
        addOrderToDOM(order);
    });
    
    // Luister naar verwijderde bestellingen
    socket.on('orderDeleted', (orderId) => {
        const orderToRemove = document.querySelector(`.order-item[data-id="${orderId}"]`);
        if (orderToRemove) {
            orderToRemove.remove();
        }
    });
    
    // Luister naar het wissen van alle bestellingen
    socket.on('allOrdersCleared', () => {
        orderList.innerHTML = '';
    });
    
    // Luister naar updates van de collega's lijst
    socket.on('colleaguesUpdated', (updatedColleagues) => {
        colleagues = updatedColleagues;
        updateColleaguesDatalist();
    });
    
    // Voeg een nieuwe bestelling toe
    addOrderBtn.addEventListener('click', addOrder);
    
    // Voeg ook een event listener toe voor de Enter-toets in het naamveld
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addOrder();
        }
    });
    
    // Wis alle bestellingen
    clearAllBtn.addEventListener('click', clearAllOrders);
    
    // Voeg event listeners toe aan de koffie-opties
    document.querySelectorAll('.coffee-option input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            document.getElementById('drink').value = this.value;
        });
    });
    
    function addOrder() {
        // Haal de waarden op uit het formulier
        const nameInput = document.getElementById('name');
        const name = nameInput.value.trim() || 'Anoniem';
        const drink = document.querySelector('input[name="drink"]:checked').value;
        
        // Maak een nieuw bestellingsobject
        const order = {
            id: Date.now(), // Uniek ID voor elke bestelling
            name: name,
            drink: drink,
            timestamp: new Date().toISOString()
        };
        
        // Stuur de bestelling naar de server
        socket.emit('addOrder', order);
        
        // Maak het formulier leeg en zet focus op het naamveld
        nameInput.value = '';
        nameInput.focus();
        document.getElementById('name').focus();
    }
    
    function addOrderToDOM(order) {
        // Maak een nieuw bestellingselement aan
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.setAttribute('data-id', order.id);
        
        // Voeg de bestellingsinformatie toe
        orderItem.innerHTML = `
            <div class="order-info">
                <strong>${order.name}</strong> - ${order.drink}
            </div>
            <div class="order-actions">
                <button class="delete-btn" onclick="deleteOrder(${order.id})">
                    <i class="material-icons">delete</i>
                </button>
            </div>
        `;
        
        // Voeg de bestelling toe aan de lijst
        orderList.prepend(orderItem);
    }
    
    // Functie om een bestelling te verwijderen
    window.deleteOrder = function(id) {
        if (confirm('Weet je zeker dat je deze bestelling wilt verwijderen?')) {
            // Stuur een verzoek naar de server om de bestelling te verwijderen
            socket.emit('deleteOrder', id);
        }
    };
    
    function clearAllOrders() {
        if (confirm('Weet je zeker dat je alle bestellingen wilt verwijderen?')) {
            // Stuur een verzoek naar de server om alle bestellingen te wissen
            socket.emit('clearAllOrders');
        }
    }
    
    // Functie om een bestelling toe te voegen aan de DOM
    function addOrderToDOM(order) {
        // Controleer of de bestelling al bestaat in de DOM
        const existingOrder = document.querySelector(`.order-item[data-id="${order.id}"]`);
        if (existingOrder) return;
        
        // Maak een nieuw bestellingselement aan
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.setAttribute('data-id', order.id);
        
        // Formatteer de tijd
        const time = new Date(order.timestamp).toLocaleTimeString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Voeg de bestellingsinformatie toe
        orderItem.innerHTML = `
            <div class="order-info">
                <strong>${order.name}</strong> - ${order.drink}
                <span class="order-time">${time}</span>
            </div>
            <div class="order-actions">
                <button class="delete-btn" onclick="deleteOrder(${order.id})">
                    <i class="material-icons">delete</i>
                </button>
            </div>
        `;
        
        // Voeg de bestelling toe aan de lijst
        orderList.prepend(orderItem);
    }
});

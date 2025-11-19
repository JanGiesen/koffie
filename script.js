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
    
    // Laad de lijst met collega's
    let colleagues = JSON.parse(localStorage.getItem('colleagues')) || [];
    
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
            
        colleagues = [...new Set(newColleagues)]; // Verwijder dubbele namen
        localStorage.setItem('colleagues', JSON.stringify(colleagues));
        updateColleaguesDatalist();
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
    
    // Laad opgeslagen bestellingen als de pagina laadt
    loadOrders();
    
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
            drink: drink
        };
        
        // Voeg de bestelling toe aan de lijst
        addOrderToDOM(order);
        
        // Sla de bestellingen op
        saveOrder(order);
        
        // Maak het formulier leeg en zet focus op het naamveld
        nameInput.value = '';
        nameInput.focus();
        document.getElementById('sugar').value = '';
        document.getElementById('milk').value = '';
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
            // Verwijder uit de DOM
            const orderToRemove = document.querySelector(`.order-item[data-id="${id}"]`);
            if (orderToRemove) {
                orderToRemove.remove();
            }
            
            // Verwijder uit de lokale opslag
            removeOrderFromStorage(id);
        }
    };
    
    function clearAllOrders() {
        if (confirm('Weet je zeker dat je alle bestellingen wilt verwijderen?')) {
            // Wis de lijst in de DOM
            orderList.innerHTML = '';
            
            // Wis de lokale opslag
            localStorage.removeItem('coffeeOrders');
        }
    }
    
    // Functies voor lokale opslag
    function saveOrder(order) {
        let orders = getOrders();
        orders.push(order);
        localStorage.setItem('coffeeOrders', JSON.stringify(orders));
    }
    
    function getOrders() {
        return JSON.parse(localStorage.getItem('coffeeOrders')) || [];
    }
    
    function loadOrders() {
        const orders = getOrders();
        orders.forEach(order => addOrderToDOM(order));
    }
    
    function removeOrderFromStorage(id) {
        let orders = getOrders();
        orders = orders.filter(order => order.id !== id);
        localStorage.setItem('coffeeOrders', JSON.stringify(orders));
    }
});

// ====================================================================
// !!! SECURITY WARNING !!!
// Key is hardcoded for simplicity. Ensure your Baserow token permissions 
// are set to "Read/Update" ONLY on the Orders table.
// ====================================================================

const BASEROW_API_KEY = "TXYNusXB6dycZSNPDBiMg19RfnnXM5zn"; // <-- YOUR API KEY
const BASEROW_TABLE_ID = "714403"; // <-- YOUR TABLE ID
const BASEROW_HOST_URL = "https://api.baserow.io"; 

const ORDERS_ENDPOINT = `${BASEROW_HOST_URL}/api/database/rows/table/${BASEROW_TABLE_ID}/?user_field_names=true`;

let allOrders = []; // Stores all fetched orders for local filtering

const ordersBody = document.getElementById('orders-body');
const loadingMsg = document.getElementById('loading-msg');
const errorMsg = document.getElementById('error-msg');
const refreshBtn = document.getElementById('refreshBtn');
const statusFilter = document.getElementById('statusFilter');
const searchBar = document.getElementById('searchBar');

// Helper function to fetch data
async function fetchOrders() {
    loadingMsg.textContent = "Loading orders from Baserow...";
    errorMsg.classList.add('hidden');
    
    try {
        const response = await fetch(ORDERS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${BASEROW_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allOrders = data.results; // Store all orders
        filterAndRenderOrders(); // Render based on current filters
    } catch (error) {
        console.error("Fetch Error:", error);
        errorMsg.classList.remove('hidden');
        errorMsg.textContent = `Error: Failed to load data. ${error.message}`;
    } finally {
        loadingMsg.textContent = "";
    }
}

// Function to filter and render the stored orders
function filterAndRenderOrders() {
    const selectedStatus = statusFilter.value;
    const searchTerm = searchBar.value.toLowerCase();

    let filteredOrders = allOrders.filter(order => {
        const statusMatch = !selectedStatus || (order.Status && order.Status.value === selectedStatus);
        
        const searchMatch = !searchTerm || 
            (order['Order ID'] && order['Order ID'].toLowerCase().includes(searchTerm)) ||
            (order['Customer Phone'] && order['Customer Phone'].toLowerCase().includes(searchTerm)) ||
            (order['Data Recipient Number'] && order['Data Recipient Number'].toLowerCase().includes(searchTerm));
        
        return statusMatch && searchMatch;
    });
    
    // Clear the current table content
    ordersBody.innerHTML = '';
    if (filteredOrders.length === 0) {
        ordersBody.innerHTML = '<tr><td colspan="7">No orders match the current criteria.</td></tr>';
        return;
    }

    filteredOrders.forEach(order => {
        const row = ordersBody.insertRow();
        const currentStatusValue = order.Status ? order.Status.value : 'Unknown';
        
        const isPending = currentStatusValue === 'Pending';
        
        // Use a simple button for the "Mark Completed" action
        const actionButton = isPending 
            ? `<button class="btn-complete" data-row-id="${order.id}">Mark Delivered</button>`
            : `<button class="btn-complete" disabled>Delivered/Failed</button>`;

        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order['Order ID']}</td>
            <td>${order['Data Recipient Number'] || 'N/A'}</td>
            <td>${order['Data Plan'] || 'N/A'}</td>
            <td>GH₵ ${order.Amount || '0.00'}</td>
            <td><span class="status-${currentStatusValue}">${currentStatusValue}</span></td>
            <td>
                ${actionButton}
            </td>
        `;
    });
}


// New function to update status to Delivered (Completed)
async function markCompleted(rowId) {
    const updateUrl = `${BASEROW_HOST_URL}/api/database/rows/table/${BASEROW_TABLE_ID}/${rowId}/?user_field_names=true`;
    
    // Check if the user really wants to do this
    if (!confirm(`Are you sure you want to mark Order ${rowId} as Delivered?`)) {
        return;
    }

    try {
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${BASEROW_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "Status": "Delivered" // Use the option value
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Baserow Update Error Details:", errorData);
            throw new Error(`HTTP error! Status: ${response.status}. Details: ${JSON.stringify(errorData)}`);
        }

        alert(`Order ${rowId} status successfully updated to Delivered.`);
        fetchOrders(); // Re-fetch and refresh table
    } catch (error) {
        console.error("Mark Completed Error:", error);
        alert(`Failed to update status for order ${rowId}. Check console for details.`);
    }
}


// Event Listeners for Controls
refreshBtn.addEventListener('click', fetchOrders);
statusFilter.addEventListener('change', filterAndRenderOrders);
searchBar.addEventListener('input', filterAndRenderOrders);


// Event Listener for the action buttons inside the table body
ordersBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-complete')) {
        const rowId = e.target.dataset.rowId;
        markCompleted(rowId);
    }
});


// Initialize the dashboard
fetchOrders();
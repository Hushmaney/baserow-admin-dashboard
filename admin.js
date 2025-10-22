// ====================================================================
// !!! SECURITY WARNING !!!
// NEVER hardcode your API key in a client-side application unless 
// you ONLY use it for read access or if the key is restricted. 
// For this simple admin dashboard, we are hardcoding the key for simplicity.
// Ensure your Baserow token permissions are set to "Read/Update" ONLY on the Orders table.
// ====================================================================

const BASEROW_API_KEY = "TXYNusXB6dycZSNPDBiMg19RfnnXM5zn"; // <-- VERIFIED KEY
const BASEROW_TABLE_ID = "714403"; // <-- VERIFIED TABLE ID
const BASEROW_HOST_URL = "https://api.baserow.io"; 

const ORDERS_ENDPOINT = `${BASEROW_HOST_URL}/api/database/rows/table/${BASEROW_TABLE_ID}/?user_field_names=true`;

const ordersBody = document.getElementById('orders-body');
const loadingMsg = document.getElementById('loading-msg');
const errorMsg = document.getElementById('error-msg');
const refreshBtn = document.getElementById('refreshBtn');

// Helper function to fetch data
async function fetchOrders() {
    loadingMsg.textContent = "Loading orders from Baserow...";
    errorMsg.classList.add('hidden');
    ordersBody.innerHTML = '';
    
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
        renderOrders(data.results);
    } catch (error) {
        console.error("Fetch Error:", error);
        errorMsg.classList.remove('hidden');
        errorMsg.textContent = `Error: Failed to load data. ${error.message}`;
    } finally {
        loadingMsg.textContent = "";
    }
}

// Helper function to render data in the table
function renderOrders(orders) {
    if (orders.length === 0) {
        ordersBody.innerHTML = '<tr><td colspan="7">No orders found.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = ordersBody.insertRow();
        const currentStatusValue = order.Status ? order.Status.value : 'Unknown';
        
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order['Order ID']}</td>
            <td>${order['Data Recipient Number'] || 'N/A'}</td>
            <td>${order['Data Plan'] || 'N/A'}</td>
            <td>GH₵ ${order.Amount || '0.00'}</td>
            <td><span class="status-${currentStatusValue}">${currentStatusValue}</span></td>
            <td>
                <select class="status-select" data-row-id="${order.id}">
                    <option value="">Update Status...</option>
                    <option value="Initiated" ${currentStatusValue === 'Initiated' ? 'selected' : ''}>Initiated</option>
                    <option value="Pending" ${currentStatusValue === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Delivered" ${currentStatusValue === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="Failed" ${currentStatusValue === 'Failed' ? 'selected' : ''}>Failed</option>
                </select>
            </td>
        `;
    });
}

// Helper function to update status
async function updateStatus(rowId, newStatusValue) {
    const updateUrl = `${BASEROW_HOST_URL}/api/database/rows/table/${BASEROW_TABLE_ID}/${rowId}/?user_field_names=true`;
    
    try {
        const response = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${BASEROW_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "Status": newStatusValue // Baserow accepts the option value (e.g., 'Delivered')
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Baserow Update Error Details:", errorData);
            throw new Error(`HTTP error! Status: ${response.status}. Details: ${JSON.stringify(errorData)}`);
        }

        alert(`Order ${rowId} status successfully updated to ${newStatusValue}`);
        fetchOrders(); // Refresh table
    } catch (error) {
        console.error("Update Error:", error);
        alert(`Failed to update status for order ${rowId}. Check console for details.`);
    }
}

// Event Listeners
ordersBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select')) {
        const select = e.target;
        const rowId = select.dataset.rowId;
        const newStatusValue = select.value;
        
        if (newStatusValue) {
            updateStatus(rowId, newStatusValue);
        }
    }
});

refreshBtn.addEventListener('click', fetchOrders);

// Initialize the dashboard
fetchOrders();
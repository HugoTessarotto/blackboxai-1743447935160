// Constants
const PRODUCTS_KEY = 'inventory_products';
const SALES_KEY = 'inventory_sales';
const SETTINGS_KEY = 'inventory_settings';

// Initialize default settings if none exist
function initSettings() {
    if (!localStorage.getItem(SETTINGS_KEY)) {
        const defaultSettings = {
            currency: 'R$',
            lowStockThreshold: 10,
            taxRate: 0.1
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    }
}

// Product Management Functions
function saveProduct(product) {
    const products = getProducts();
    if (product.id) {
        // Update existing product
        const index = products.findIndex(p => p.id === product.id);
        if (index !== -1) {
            products[index] = product;
        }
    } else {
        // Add new product
        product.id = Date.now().toString();
        products.push(product);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return product;
}

function getProducts() {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
}

function deleteProduct(productId) {
    const products = getProducts().filter(p => p.id !== productId);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

// Sales Management Functions
function recordSale(sale) {
    const sales = getSales();
    sale.id = Date.now().toString();
    sale.date = new Date().toISOString();
    sales.push(sale);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
    
    // Update product stock
    sale.items.forEach(item => {
        const products = getProducts();
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.stock -= item.quantity;
            saveProduct(product);
        }
    });
    
    return sale;
}

function getSales() {
    return JSON.parse(localStorage.getItem(SALES_KEY)) || [];
}

// Dashboard Functions
function updateDashboard() {
    const products = getProducts();
    const sales = getSales();
    const settings = getSettings();
    
    // Calculate total sales
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    document.getElementById('total-sales').textContent = 
        `${settings.currency} ${totalSales.toFixed(2)}`;
    
    // Count products
    document.getElementById('total-products').textContent = products.length;
    
    // Count low stock items
    const lowStockCount = products.filter(p => p.stock < settings.lowStockThreshold).length;
    document.getElementById('low-stock').textContent = lowStockCount;
    
    // Display recent sales
    const recentSalesTable = document.getElementById('recent-sales');
    if (recentSalesTable) {
        recentSalesTable.innerHTML = sales.slice(-5).reverse().map(sale => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">${new Date(sale.date).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap">${sale.customer || 'Cliente não informado'}</td>
                <td class="px-6 py-4 whitespace-nowrap">${sale.items.length} itens</td>
                <td class="px-6 py-4 whitespace-nowrap">${settings.currency} ${sale.total.toFixed(2)}</td>
            </tr>
        `).join('');
    }
}

// Settings Functions
function getSettings() {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
}

function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initSettings();
    
    // Initialize dashboard if on dashboard page
    if (document.getElementById('total-sales')) {
        updateDashboard();
    }
    
    // Initialize products page if on products page
    if (document.getElementById('products-table')) {
        // Load and display products
        const products = getProducts();
        const productsTable = document.getElementById('products-table');
        
        productsTable.innerHTML = products.map(product => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-image w-24 rounded">` : 'Sem imagem'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${product.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${product.category}</td>
                <td class="px-6 py-4 whitespace-nowrap">R$ ${product.price.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap ${product.stock < getSettings().lowStockThreshold ? 'text-red-500 font-bold' : ''}">
                    ${product.stock}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="editProduct('${product.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProductConfirm('${product.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Set up product form event listeners
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const product = {
                    id: document.getElementById('product-id').value,
                    name: document.getElementById('product-name').value,
                    category: document.getElementById('product-category').value,
                    price: parseFloat(document.getElementById('product-price').value),
                    stock: parseInt(document.getElementById('product-stock').value),
                    image: document.getElementById('product-image').value
                };
                saveProduct(product);
                window.location.reload();
            });
        }
        
        // Set up add product button
        const addProductBtn = document.getElementById('add-product-btn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', function() {
                document.getElementById('form-title').textContent = 'Adicionar Novo Produto';
                document.getElementById('product-form').reset();
                document.getElementById('product-id').value = '';
                document.getElementById('product-form-container').classList.remove('hidden');
            });
        }
        
        // Set up cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                document.getElementById('product-form-container').classList.add('hidden');
            });
        }
    }
});

// Global functions for product management
function editProduct(productId) {
    const product = getProducts().find(p => p.id === productId);
    if (product) {
        document.getElementById('form-title').textContent = 'Editar Produto';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-image').value = product.image || '';
        document.getElementById('product-form-container').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteProductConfirm(productId) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        deleteProduct(productId);
        window.location.reload();
    }
}